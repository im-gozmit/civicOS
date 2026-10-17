import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { processReport } from "@/lib/reportPipeline";
import { CATEGORY_LABEL } from "@/lib/complaints";
import { trackUrl } from "@/lib/links";
import { maskNumber, normalizeWhatsappNumber } from "@/lib/phone";
import { allow, clientIp } from "@/lib/rateLimit";
import { saveAudioUpload, saveImageUpload } from "@/lib/uploads";

// Public website report. Same pipeline as WhatsApp; no account needed.

function num(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!(await allow(`report:${ip}`, 5, 60 * 60 * 1000)) || !(await allow("report:global", 300, 24 * 60 * 60 * 1000))) {
    return NextResponse.json({ ok: false, error: "Too many reports from this connection. Please try again later." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "Invalid form data." }, { status: 400 });

  const photo = form.get("photo");
  if (!(photo instanceof File)) return NextResponse.json({ ok: false, error: "Please add a photo of the problem." }, { status: 400 });

  const latitude = num(form.get("latitude"));
  const longitude = num(form.get("longitude"));
  // Rough bounding box of India; anything else is almost certainly a mistake or abuse.
  if (latitude === null || longitude === null || latitude < 6 || latitude > 38 || longitude < 68 || longitude > 98) {
    return NextResponse.json({ ok: false, error: "Please choose the location of the problem on the map." }, { status: 400 });
  }

  const description = (typeof form.get("description") === "string" ? (form.get("description") as string) : "").trim().slice(0, 500);
  const landmark = (typeof form.get("landmark") === "string" ? (form.get("landmark") as string) : "").trim().slice(0, 120);
  const caption = [description, landmark ? `Landmark: ${landmark}` : ""].filter(Boolean).join(" ");

  // Optional: a WhatsApp number to send updates to. Leaving it empty is always fine.
  const phone = normalizeWhatsappNumber(form.get("whatsapp"));
  if (phone.kind === "invalid") {
    return NextResponse.json({ ok: false, error: "That WhatsApp number does not look right. Check it, or leave it empty: it is optional." }, { status: 400 });
  }

  const img = await saveImageUpload(photo);
  if (!img.ok) return NextResponse.json({ ok: false, error: img.error }, { status: 400 });

  const audioFiles: string[] = [];
  const voice = form.get("voice");
  if (voice instanceof File && voice.size > 0) {
    const aud = await saveAudioUpload(voice);
    if (!aud.ok) return NextResponse.json({ ok: false, error: aud.error }, { status: 400 });
    audioFiles.push(aud.file);
  }

  const result = await processReport({
    source: "web",
    senderKey: `web:${randomUUID()}`,
    senderPhone: phone.kind === "ok" ? phone.digits : "", // encrypted before it is stored (see repo.ts)
    caption,
    mediaFiles: [img.file],
    audioFiles,
    latitude,
    longitude,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: result.code,
        error:
          result.code === "NOT_CIVIC"
            ? "We could not see a public civic problem in that photo, so no complaint was registered."
            : "That photo is too unclear to use. Please take a clearer photo of the problem.",
        seen: result.seen,
      },
      { status: 422 },
    );
  }

  const c = result.complaint;
  const bot = (process.env.WHATSAPP_BOT_NUMBER || "").replace(/\D/g, "");
  return NextResponse.json({
    ok: true,
    ticketId: c.ticketId,
    trackingUrl: trackUrl(c),
    category: CATEGORY_LABEL[c.category],
    summary: c.summary,
    severity: c.severity,
    suggestedTeam: c.queue,
    needsHumanReview: c.needsHumanReview,
    voiceHeard: c.voice ? c.voice.english : null,
    similarNearby: (c.duplicateCandidates?.length ?? 0) > 0,
    updatesNumber: phone.kind === "ok" ? maskNumber(phone.digits) : null,
    whatsappLink: bot ? `https://wa.me/${bot}?text=${encodeURIComponent(`TRACK ${c.ticketId} ${c.trackingToken}`)}` : null,
  });
}
