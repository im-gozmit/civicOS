"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLng } from "@/components/public/LocationPicker";

// Leaflet needs the browser, so the map is loaded on the client only.
const LocationPicker = dynamic(() => import("@/components/public/LocationPicker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded bg-zinc-100" />,
});

type Lang = "en" | "hi";

const T = {
  en: {
    title: "Report a problem",
    intro: "Take a photo, mark the place on the map, and send. We will give you a complaint number.",
    photo: "1. Photo of the problem",
    takePhoto: "Take or choose a photo",
    describe: "2. What is the problem? (optional)",
    describePh: "For example: big pothole near the school gate",
    voice: "Or record a voice note (optional)",
    record: "Start recording",
    stop: "Stop",
    removeVoice: "Remove voice note",
    where: "3. Where is it?",
    useMine: "Use my current location",
    tapMap: "Or tap the map to mark the exact spot.",
    chosen: "Location chosen",
    landmark: "Nearby landmark (optional)",
    submit: "Send report",
    sending: "Analysing your photo. This takes about 10 seconds…",
    needPhoto: "Please add a photo.",
    needLoc: "Please mark the location on the map.",
    done: "Complaint registered",
    ticket: "Your complaint number",
    suggested: "Suggested team",
    suggestedNote: "Staff will confirm the team. Keep the link below to follow progress.",
    heard: "Voice note, as we understood it",
    track: "Track this complaint",
    whatsapp: "Get updates on WhatsApp",
    another: "Report another problem",
    notCivic: "We could not see a public civic problem in that photo",
    tryAgain: "Please try again with a clear photo.",
    privacy: "Your photo and location are used only to handle this complaint. No account is needed.",
  },
  hi: {
    title: "समस्या दर्ज करें",
    intro: "फ़ोटो लें, नक्शे पर जगह चुनें और भेजें। हम आपको शिकायत नंबर देंगे।",
    photo: "1. समस्या की फ़ोटो",
    takePhoto: "फ़ोटो लें या चुनें",
    describe: "2. समस्या क्या है? (वैकल्पिक)",
    describePh: "जैसे: स्कूल के गेट के पास बड़ा गड्ढा",
    voice: "या वॉइस नोट रिकॉर्ड करें (वैकल्पिक)",
    record: "रिकॉर्डिंग शुरू करें",
    stop: "रोकें",
    removeVoice: "वॉइस नोट हटाएं",
    where: "3. यह कहाँ है?",
    useMine: "मेरी वर्तमान लोकेशन इस्तेमाल करें",
    tapMap: "या सही जगह चुनने के लिए नक्शे पर टैप करें।",
    chosen: "लोकेशन चुनी गई",
    landmark: "पास की पहचान (वैकल्पिक)",
    submit: "रिपोर्ट भेजें",
    sending: "आपकी फ़ोटो की जाँच हो रही है। लगभग 10 सेकंड लगेंगे…",
    needPhoto: "कृपया फ़ोटो जोड़ें।",
    needLoc: "कृपया नक्शे पर लोकेशन चुनें।",
    done: "शिकायत दर्ज हो गई",
    ticket: "आपका शिकायत नंबर",
    suggested: "सुझाई गई टीम",
    suggestedNote: "स्टाफ टीम की पुष्टि करेगा। प्रगति देखने के लिए नीचे का लिंक रखें।",
    heard: "वॉइस नोट, जैसा हमने समझा",
    track: "इस शिकायत की स्थिति देखें",
    whatsapp: "WhatsApp पर अपडेट पाएं",
    another: "एक और समस्या दर्ज करें",
    notCivic: "इस फ़ोटो में कोई सार्वजनिक समस्या नहीं दिखी",
    tryAgain: "कृपया साफ़ फ़ोटो के साथ फिर कोशिश करें।",
    privacy: "आपकी फ़ोटो और लोकेशन का उपयोग केवल इस शिकायत के लिए होता है। खाता ज़रूरी नहीं है।",
  },
} as const;

interface Success {
  ticketId: string;
  trackingUrl: string;
  summary: string;
  category: string;
  suggestedTeam: string;
  voiceHeard?: string | null;
  whatsappLink: string | null;
}

/** Shrinks big phone photos in the browser so the upload is small and fast on slow networks. */
async function downscale(file: File, maxSide = 1600): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file; // the server still validates whatever we send
  }
}

export function ReportForm() {
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [landmark, setLandmark] = useState("");
  const [loc, setLoc] = useState<LatLng | null>(null);
  const [flyTo, setFlyTo] = useState<LatLng | null>(null);
  const [voice, setVoice] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<string | null>(null);
  const [done, setDone] = useState<Success | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  function choosePhoto(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  function setVoiceBlob(blob: Blob | null) {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    setVoice(blob);
    setVoiceUrl(blob ? URL.createObjectURL(blob) : null);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        setLoc(here);
        setFlyTo(here);
      },
      () => setError(lang === "en" ? "Could not read your location. Tap the map instead." : "लोकेशन नहीं मिली। नक्शे पर टैप करें।"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        setVoiceBlob(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
        setRecording(false);
      };
      rec.start();
      recorder.current = rec;
      setRecording(true);
    } catch {
      setError(lang === "en" ? "Microphone not available." : "माइक्रोफ़ोन उपलब्ध नहीं है।");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSeen(null);
    if (!photo) return setError(t.needPhoto);
    if (!loc) return setError(t.needLoc);
    setBusy(true);
    try {
      const body = new FormData();
      body.set("photo", await downscale(photo));
      body.set("description", description);
      body.set("landmark", landmark);
      body.set("latitude", String(loc.lat));
      body.set("longitude", String(loc.lng));
      if (voice) body.set("voice", new File([voice], "voice", { type: voice.type }));
      const res = await fetch("/api/v1/reports", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as (Success & { ok?: boolean; error?: string; seen?: string }) | null;
      if (res.ok && data?.ok) setDone(data);
      else {
        setError(data?.error ?? "Something went wrong. Please try again.");
        if (data?.seen) setSeen(data.seen);
      }
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const langToggle = (
    <div className="flex gap-1 text-sm" role="group" aria-label="Language">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full border px-3 py-1 ${lang === l ? "bg-teal-700 text-white" : "bg-white text-zinc-700"}`}
        >
          {l === "en" ? "English" : "हिन्दी"}
        </button>
      ))}
    </div>
  );

  if (done) {
    return (
      <div className="space-y-4">
        {langToggle}
        <div className="rounded border border-teal-300 bg-teal-50 p-4">
          <h2 className="text-lg font-semibold">✅ {t.done}</h2>
          <p className="mt-2 text-sm text-zinc-600">{t.ticket}</p>
          <p className="font-mono text-2xl">{done.ticketId}</p>
          <p className="mt-3 text-sm">{done.summary}</p>
          {done.voiceHeard ? (
            <p className="mt-2 text-sm text-zinc-600">
              {t.heard}: {done.voiceHeard}
            </p>
          ) : null}
          <p className="mt-3 text-sm">
            <strong>{t.suggested}:</strong> {done.suggestedTeam}
          </p>
          <p className="text-xs text-zinc-600">{t.suggestedNote}</p>
        </div>
        <a href={done.trackingUrl} className="block rounded bg-teal-700 px-4 py-3 text-center font-medium text-white">
          {t.track}
        </a>
        {done.whatsappLink ? (
          <a href={done.whatsappLink} className="block rounded border border-teal-700 px-4 py-3 text-center font-medium text-teal-800">
            {t.whatsapp}
          </a>
        ) : null}
        <button className="text-sm text-teal-800 underline" onClick={() => window.location.reload()}>
          {t.another}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {langToggle}
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t.intro}</p>
      </div>

      <section className="space-y-2">
        <h2 className="font-medium">{t.photo}</h2>
        <label className="block cursor-pointer rounded border-2 border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-600">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)}
          />
          {t.takePhoto}
        </label>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-h-60 w-full rounded object-contain" />
        ) : null}
      </section>

      <section className="space-y-2">
        <label htmlFor="desc" className="font-medium">
          {t.describe}
        </label>
        <textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t.describePh}
          className="w-full rounded border border-zinc-300 px-3 py-2"
        />
        <p className="text-sm text-zinc-600">{t.voice}</p>
        <div className="flex flex-wrap items-center gap-2">
          {!recording ? (
            <button type="button" onClick={startRecording} className="rounded border border-zinc-300 px-3 py-2 text-sm">
              🎙️ {t.record}
            </button>
          ) : (
            <button type="button" onClick={() => recorder.current?.stop()} className="rounded bg-red-700 px-3 py-2 text-sm text-white">
              ⏹ {t.stop}
            </button>
          )}
          {voice && voiceUrl ? (
            <>
              <audio controls src={voiceUrl} className="h-9" />
              <button type="button" onClick={() => setVoiceBlob(null)} className="text-sm text-zinc-600 underline">
                {t.removeVoice}
              </button>
            </>
          ) : null}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-medium">{t.where}</h2>
        <button type="button" onClick={useMyLocation} className="rounded border border-teal-700 px-3 py-2 text-sm text-teal-800">
          📍 {t.useMine}
        </button>
        <p className="text-sm text-zinc-600">{t.tapMap}</p>
        <LocationPicker value={loc} onChange={setLoc} flyTo={flyTo} />
        {loc ? (
          <p className="text-xs text-zinc-600">
            {t.chosen}: {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
          </p>
        ) : null}
        <label className="block text-sm">
          <span className="text-zinc-600">{t.landmark}</span>
          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            maxLength={120}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>
      </section>

      {error ? (
        <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <p>{error}</p>
          {seen ? <p className="mt-1 text-xs">{seen}</p> : null}
        </div>
      ) : null}

      <button disabled={busy} className="w-full rounded bg-teal-700 px-4 py-3 text-lg font-medium text-white disabled:opacity-60">
        {busy ? t.sending : t.submit}
      </button>
      <p className="text-xs text-zinc-500">{t.privacy}</p>
    </form>
  );
}
