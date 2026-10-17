"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  ImagePlus,
  Loader2,
  Mic,
  MessageCircle,
  Navigation,
  RefreshCw,
  Send,
  ShieldCheck,
  Square,
  Trash2,
  X,
} from "lucide-react";
import type { LatLng } from "@/components/public/LocationPicker";
import { normalizeWhatsappNumber } from "@/lib/phone";
import { AgentReport, AgentTerminal } from "@/components/public/AgentTerminal";
import { Chip, IssueTimelineView, severityTone } from "@/components/public/IssueTimelineView";
import { MAX_UPLOAD_BYTES, downscaleImage, uploadErrorMessage } from "@/lib/clientImage";

// Leaflet needs the browser, so the map is loaded on the client only.
const LocationPicker = dynamic(() => import("@/components/public/LocationPicker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-2xl bg-slate-100" />,
});

type Lang = "en" | "hi";

const T = {
  en: {
    title: "Report a problem",
    intro: "Three quick steps. You will get a complaint number and a link to follow progress.",
    stepPhoto: "Photo of the problem",
    stepDetails: "Tell us more",
    stepWhere: "Where is it?",
    camera: "Take a photo",
    gallery: "Choose from gallery",
    change: "Change photo",
    remove: "Remove",
    describe: "What is the problem?",
    optional: "optional",
    describePh: "For example: big pothole near the school gate",
    voice: "Or record a voice note",
    record: "Record",
    stop: "Stop",
    recording: "Recording…",
    removeVoice: "Remove voice note",
    useMine: "Use my current location",
    locating: "Finding you…",
    tapMap: "or tap the map to mark the exact spot",
    chosen: "Location chosen",
    landmark: "Nearby landmark",
    landmarkPh: "For example: opposite the post office",
    submit: "Send report",
    sending: "Analysing your photo…",
    sendingNote: "This usually takes 10 to 20 seconds. Please keep this page open.",
    needPhoto: "Please add a photo first.",
    needLoc: "Please mark the location on the map.",
    done: "Complaint registered",
    ticket: "Your complaint number",
    copy: "Copy",
    copied: "Copied",
    suggested: "Suggested team",
    suggestedNote: "Staff will confirm the team before anything is promised. Keep the link to follow progress.",
    similar: "A similar problem was already reported nearby. Yours is registered separately and staff will link them if it is the same.",
    heard: "Voice note, as we understood it",
    track: "Track this complaint",
    whatsapp: "Get updates on WhatsApp",
    another: "Report another problem",
    privacy: "Your photo and location are used only to handle this complaint. No account is needed.",
    needsReview: "A person will review this report.",
    stepUpdates: "Updates on WhatsApp",
    waLabel: "Your WhatsApp number",
    waPh: "98765 43210",
    waTitle: "Optional. You can skip this.",
    waDisclaimer:
      "You do not need to give a number to report a problem or to track it. If you add one, it is used only to send updates about this complaint, it is stored encrypted, and it is never shown on the public map or to other people.",
    waHow: "WhatsApp only lets us message you after you have messaged us, so after reporting you will tap one button to switch the updates on.",
    waBad: "That number does not look right. Check it, or leave it empty: it is optional.",
    whatsappOn: "Switch on WhatsApp updates",
    updatesTo: "Updates number",
    updatesNote: "Tap \"Switch on WhatsApp updates\" below and send the message once, so WhatsApp lets us write to you.",
  },
  hi: {
    title: "समस्या दर्ज करें",
    intro: "तीन आसान चरण। आपको शिकायत नंबर और प्रगति देखने का लिंक मिलेगा।",
    stepPhoto: "समस्या की फ़ोटो",
    stepDetails: "थोड़ा और बताएं",
    stepWhere: "यह कहाँ है?",
    camera: "फ़ोटो खींचें",
    gallery: "गैलरी से चुनें",
    change: "फ़ोटो बदलें",
    remove: "हटाएं",
    describe: "समस्या क्या है?",
    optional: "वैकल्पिक",
    describePh: "जैसे: स्कूल के गेट के पास बड़ा गड्ढा",
    voice: "या वॉइस नोट रिकॉर्ड करें",
    record: "रिकॉर्ड करें",
    stop: "रोकें",
    recording: "रिकॉर्डिंग चल रही है…",
    removeVoice: "वॉइस नोट हटाएं",
    useMine: "मेरी वर्तमान लोकेशन इस्तेमाल करें",
    locating: "लोकेशन खोज रहे हैं…",
    tapMap: "या सही जगह चुनने के लिए नक्शे पर टैप करें",
    chosen: "लोकेशन चुनी गई",
    landmark: "पास की पहचान",
    landmarkPh: "जैसे: डाकघर के सामने",
    submit: "रिपोर्ट भेजें",
    sending: "आपकी फ़ोटो की जाँच हो रही है…",
    sendingNote: "इसमें आमतौर पर 10 से 20 सेकंड लगते हैं। कृपया यह पेज खुला रखें।",
    needPhoto: "कृपया पहले फ़ोटो जोड़ें।",
    needLoc: "कृपया नक्शे पर लोकेशन चुनें।",
    done: "शिकायत दर्ज हो गई",
    ticket: "आपका शिकायत नंबर",
    copy: "कॉपी करें",
    copied: "कॉपी हो गया",
    suggested: "सुझाई गई टीम",
    suggestedNote: "कुछ भी वादा करने से पहले स्टाफ टीम की पुष्टि करेगा। प्रगति देखने के लिए लिंक रखें।",
    similar: "आस-पास इसी तरह की समस्या पहले से दर्ज है। आपकी शिकायत अलग दर्ज है, और एक जैसी होने पर स्टाफ उन्हें जोड़ेगा।",
    heard: "वॉइस नोट, जैसा हमने समझा",
    track: "इस शिकायत की स्थिति देखें",
    whatsapp: "WhatsApp पर अपडेट पाएं",
    another: "एक और समस्या दर्ज करें",
    privacy: "आपकी फ़ोटो और लोकेशन का उपयोग केवल इस शिकायत के लिए होता है। खाता ज़रूरी नहीं है।",
    needsReview: "कोई व्यक्ति इस रिपोर्ट की समीक्षा करेगा।",
    stepUpdates: "WhatsApp पर अपडेट",
    waLabel: "आपका WhatsApp नंबर",
    waPh: "98765 43210",
    waTitle: "वैकल्पिक। आप इसे छोड़ सकते हैं।",
    waDisclaimer:
      "समस्या दर्ज करने या उसकी स्थिति देखने के लिए नंबर देना ज़रूरी नहीं है। अगर आप नंबर देते हैं, तो उसका उपयोग केवल इस शिकायत के अपडेट भेजने के लिए होगा, वह एन्क्रिप्टेड रखा जाएगा, और सार्वजनिक नक्शे पर या किसी और को कभी नहीं दिखेगा।",
    waHow: "WhatsApp तभी हमें आपको संदेश भेजने देता है जब आप पहले हमें संदेश भेज चुके हों, इसलिए रिपोर्ट के बाद अपडेट चालू करने के लिए एक बटन दबाएं।",
    waBad: "यह नंबर सही नहीं लगता। जाँच लें, या खाली छोड़ दें: यह वैकल्पिक है।",
    whatsappOn: "WhatsApp अपडेट चालू करें",
    updatesTo: "अपडेट का नंबर",
    updatesNote: "नीचे \"WhatsApp अपडेट चालू करें\" दबाकर एक बार संदेश भेजें, ताकि WhatsApp हमें आपको लिखने दे।",
  },
} as const;

interface Success {
  ticketId: string;
  trackingUrl: string;
  summary: string;
  category: string;
  severity?: string | null;
  updatesNumber?: string | null;
  suggestedTeam: string;
  voiceHeard?: string | null;
  similarNearby?: boolean;
  needsHumanReview?: boolean;
  whatsappLink: string | null;
}

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
        done ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
      }`}
    >
      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : n}
    </span>
  );
}

function StepCard({ n, done, title, optional, children }: { n: number; done: boolean; title: string; optional?: string; children: React.ReactNode }) {
  return (
    <section className="card card-pad">
      <div className="mb-4 flex items-center gap-3">
        <StepBadge n={n} done={done} />
        <h2 className="text-lg font-bold text-slate-900">
          {title}
          {optional ? <span className="ml-2 text-sm font-medium text-slate-400">{optional}</span> : null}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function ReportForm() {
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [landmark, setLandmark] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loc, setLoc] = useState<LatLng | null>(null);
  const [flyTo, setFlyTo] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [voice, setVoice] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  // True for a moment after the server answers, so the agent terminal can tick every line before the result shows.
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<string | null>(null);
  const [done, setDone] = useState<Success | null>(null);
  const [copied, setCopied] = useState(false);
  const [reportedAt, setReportedAt] = useState<string>("");
  const recorder = useRef<MediaRecorder | null>(null);

  function choosePhoto(file: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
    setError(null);
  }

  function setVoiceBlob(blob: Blob | null) {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    setVoice(blob);
    setVoiceUrl(blob ? URL.createObjectURL(blob) : null);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        setLoc(here);
        setFlyTo(here);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError(lang === "en" ? "Could not read your location. Tap the map instead." : "लोकेशन नहीं मिली। नक्शे पर टैप करें।");
      },
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
    if (normalizeWhatsappNumber(whatsapp).kind === "invalid") return setError(t.waBad);
    setBusy(true);
    try {
      const body = new FormData();
      const small = await downscaleImage(photo);
      if (small.size > MAX_UPLOAD_BYTES) {
        setError(uploadErrorMessage(413));
        return;
      }
      body.set("photo", small);
      body.set("description", description);
      body.set("landmark", landmark);
      if (whatsapp.trim()) body.set("whatsapp", whatsapp.trim());
      body.set("latitude", String(loc.lat));
      body.set("longitude", String(loc.lng));
      if (voice) body.set("voice", new File([voice], "voice", { type: voice.type }));
      const res = await fetch("/api/v1/reports", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as (Success & { ok?: boolean; error?: string; seen?: string }) | null;
      if (res.ok && data?.ok) {
        setFinishing(true);
        await new Promise((r) => setTimeout(r, 1100));
        setReportedAt(new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }));
        setDone(data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(uploadErrorMessage(res.status, data?.error));
        if (data?.seen) setSeen(data.seen);
      }
    } catch {
      setError("Network problem. Please try again.");
    } finally {
      setBusy(false);
      setFinishing(false);
    }
  }

  async function copyTicket() {
    if (!done) return;
    try {
      await navigator.clipboard.writeText(done.ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available: the number is shown on screen anyway */
    }
  }

  const langToggle = (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-sm" role="group" aria-label="Language">
      {(["en", "hi"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${lang === l ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          {l === "en" ? "English" : "हिन्दी"}
        </button>
      ))}
    </div>
  );

  /* ------------------------------------------------------------------ success */
  if (done) {
    const severity = done.severity ? done.severity.charAt(0) + done.severity.slice(1).toLowerCase() : null;
    const en = lang === "en";
    return (
      <div className="space-y-6">
        <div className="mx-auto flex max-w-5xl animate-rise flex-wrap items-center gap-3 rounded-xl border-2 border-slate-900 bg-emerald-100 px-4 py-3 shadow-[3px_3px_0_0_var(--ink)]">
          <span className="animate-pop flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-extrabold leading-tight text-slate-900">{t.done}</p>
            <p className="text-sm text-slate-700">{en ? "Keep your complaint number. It is also your tracking reference." : "अपना शिकायत नंबर सुरक्षित रखें। यही आपका ट्रैकिंग नंबर है।"}</p>
          </div>
          <p role="status" className="text-xs font-semibold text-emerald-900">
            {copied ? t.copied : ""}
          </p>
        </div>

        <IssueTimelineView
          chips={
            <>
              <Chip tone="ink">
                {done.ticketId}
                <button type="button" onClick={copyTicket} className="-mr-1 rounded p-0.5 text-white/80 hover:bg-white/20 hover:text-white" aria-label={t.copy}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </Chip>
              <Chip>{en ? "Agent classified" : "एजेंट वर्गीकृत"}</Chip>
              {severity ? <Chip tone={severityTone(done.severity)}>{"●"} {severity}</Chip> : null}
            </>
          }
          title={severity ? (en ? `${done.category} reported, ${severity} priority` : `${done.category} दर्ज, ${severity} प्राथमिकता`) : en ? `${done.category} reported` : `${done.category} दर्ज`}
          description={done.summary}
          media={
            preview ? (
              <figure>
                <figcaption className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{en ? "Reported" : "रिपोर्ट की गई"}</figcaption>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt={en ? "The photo you sent" : "आपकी भेजी हुई फ़ोटो"} className="max-h-60 w-full max-w-xs rounded-xl border-2 border-slate-900 object-cover shadow-[4px_4px_0_0_var(--ink)]" />
              </figure>
            ) : null
          }
          timeline={[
            { title: en ? "Citizen reported" : "नागरिक ने रिपोर्ट किया", meta: reportedAt, state: "done" },
            { title: en ? `Agents classified and suggested ${done.suggestedTeam}` : `एजेंटों ने वर्गीकृत किया और ${done.suggestedTeam} सुझाया`, meta: reportedAt, state: "done" },
            { title: en ? "Staff verify the team" : "स्टाफ टीम की पुष्टि करेगा", note: en ? "Nothing is promised until a person has checked it." : "किसी व्यक्ति के जाँचने तक कोई वादा नहीं किया जाता।", state: "pending" },
          ]}
          facts={[
            { label: en ? "Issue ID" : "शिकायत नंबर", value: <span className="font-mono">{done.ticketId}</span> },
            { label: en ? "Category" : "श्रेणी", value: done.category },
            { label: en ? "Suggested team" : "सुझाई गई टीम", value: done.suggestedTeam, note: t.suggestedNote },
            { label: en ? "Status" : "स्थिति", value: en ? "Registered, awaiting staff review" : "दर्ज, स्टाफ समीक्षा बाकी" },
            ...(loc ? [{ label: en ? "Location" : "लोकेशन", value: <span className="font-mono">{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</span> }] : []),
            { label: en ? "Similar reports nearby" : "आस-पास मिलती रिपोर्ट", value: done.similarNearby ? (en ? "Yes, staff will link them if it is the same" : "हाँ, एक जैसी होने पर स्टाफ जोड़ेगा") : en ? "None yet" : "अभी नहीं" },
            ...(done.updatesNumber ? [{ label: t.updatesTo, value: <span className="font-mono">{done.updatesNumber}</span>, note: t.updatesNote }] : []),
            ...(done.voiceHeard ? [{ label: t.heard, value: done.voiceHeard }] : []),
            ...(done.needsHumanReview ? [{ label: en ? "Review" : "समीक्षा", value: t.needsReview }] : []),
          ]}
          aside={
            <div className="grid gap-2 pt-2">
              <a href={done.trackingUrl} className="btn btn-primary w-full py-3">
                {t.track}
              </a>
              {done.whatsappLink ? (
                <a href={done.whatsappLink} className="btn btn-whatsapp w-full py-3">
                  <MessageCircle className="h-5 w-5" /> {done.updatesNumber ? t.whatsappOn : t.whatsapp}
                </a>
              ) : null}
              <button type="button" className="btn btn-ghost w-full" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4" /> {t.another}
              </button>
            </div>
          }
        >
          <AgentReport lang={lang} result={done} />
        </IssueTimelineView>
      </div>
    );
  }

  /* ------------------------------------------------------------- agents working */
  if (busy) return <AgentTerminal lang={lang} hasVoice={!!voice} finishing={finishing} />;

  /* --------------------------------------------------------------------- form */
  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5" noValidate>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{t.title}</h1>
          <p className="mt-2 max-w-md text-slate-600">{t.intro}</p>
        </div>
        {langToggle}
      </div>

      {/* Step 1: photo */}
      <StepCard n={1} done={!!photo} title={t.stepPhoto}>
        {preview ? (
          <div className="relative overflow-hidden rounded-2xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your photo of the problem" className="max-h-80 w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
              <label className="btn btn-secondary btn-sm cursor-pointer">
                <ImagePlus className="h-4 w-4" /> {t.change}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)} />
              </label>
              <button type="button" onClick={() => choosePhoto(null)} className="btn btn-sm bg-white/90 text-rose-700 hover:bg-white">
                <Trash2 className="h-4 w-4" /> {t.remove}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {/* "capture" opens the camera directly; without it the phone offers the gallery. */}
            <label className="group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/50 px-4 py-8 text-center transition hover:border-teal-500 hover:bg-teal-50">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-sm transition group-hover:scale-105">
                <Camera className="h-6 w-6" />
              </span>
              <span className="font-semibold text-teal-900">{t.camera}</span>
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)} />
            </label>
            <label className="group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-8 text-center transition hover:border-slate-400 hover:bg-slate-50">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-hover:scale-105">
                <ImagePlus className="h-6 w-6" />
              </span>
              <span className="font-semibold text-slate-800">{t.gallery}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)} />
            </label>
          </div>
        )}
      </StepCard>

      {/* Step 2: details */}
      <StepCard n={2} done={description.trim().length > 0 || !!voice} title={t.stepDetails} optional={t.optional}>
        <label htmlFor="desc" className="label">
          {t.describe}
        </label>
        <textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t.describePh}
          className="field resize-y"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600">{t.voice}</span>
          {!recording ? (
            <button type="button" onClick={startRecording} className="btn btn-secondary btn-sm">
              <Mic className="h-4 w-4" /> {t.record}
            </button>
          ) : (
            <button type="button" onClick={() => recorder.current?.stop()} className="btn btn-sm bg-rose-600 text-white hover:bg-rose-700">
              <Square className="h-3.5 w-3.5 fill-current" /> {t.stop}
            </button>
          )}
          {recording ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-rose-700" role="status">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" /> {t.recording}
            </span>
          ) : null}
        </div>
        {voice && voiceUrl ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
            <audio controls src={voiceUrl} className="h-10 min-w-0 flex-1" />
            <button type="button" onClick={() => setVoiceBlob(null)} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-rose-700" aria-label={t.removeVoice}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </StepCard>

      {/* Step 3: location */}
      <StepCard n={3} done={!!loc} title={t.stepWhere}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={useMyLocation} disabled={locating} className="btn btn-secondary">
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 text-teal-600" />}
            {locating ? t.locating : t.useMine}
          </button>
          <span className="text-sm text-slate-500">{t.tapMap}</span>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <LocationPicker value={loc} onChange={setLoc} flyTo={flyTo} />
        </div>
        {loc ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
            <Check className="h-4 w-4" /> {t.chosen}: <span className="font-mono">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</span>
          </p>
        ) : null}
        <div className="mt-4">
          <label htmlFor="landmark" className="label">
            {t.landmark} <span className="font-normal text-slate-400">({t.optional})</span>
          </label>
          <input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} maxLength={120} placeholder={t.landmarkPh} className="field" />
        </div>
      </StepCard>

      <StepCard n={4} done={normalizeWhatsappNumber(whatsapp).kind === "ok"} title={t.stepUpdates} optional={t.optional}>
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border-2 border-slate-900 bg-teal-50 p-3.5 text-sm text-slate-800">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
            <div>
              <p className="font-bold text-slate-900">{t.waTitle}</p>
              <p className="mt-1 leading-relaxed">{t.waDisclaimer}</p>
            </div>
          </div>
          <div>
            <label htmlFor="whatsapp" className="label">
              {t.waLabel} <span className="font-normal text-slate-400">({t.optional})</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border-2 border-r-0 border-slate-300 bg-slate-100 px-3 font-mono text-sm font-bold text-slate-600">+91</span>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder={t.waPh}
                className="field rounded-l-none"
              />
            </div>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">{t.waHow}</p>
        </div>
      </StepCard>

      {error ? (
        <div role="alert" className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">{error}</p>
            {seen ? <p className="mt-1 text-rose-800/80">{seen}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-20 z-10 md:static">
        <div className="card p-3 shadow-pop">
          <button disabled={busy} className="btn btn-primary w-full py-3.5 text-base">
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> {t.sending}
              </>
            ) : (
              <>
                <Send className="h-5 w-5" /> {t.submit}
              </>
            )}
          </button>
          <p className="mt-2 px-1 text-center text-xs text-slate-500">{busy ? t.sendingNote : t.privacy}</p>
        </div>
      </div>
    </form>
  );
}
