"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

type Lang = "en" | "hi";

interface AgentLine {
  name: string;
  working: { en: string; hi: string };
  skipped?: { en: string; hi: string };
}

/** The agents, in the order the report goes through them. The text describes what each one does. */
export function agentLines(hasVoice: boolean): (AgentLine & { skip: boolean })[] {
  const lines: AgentLine[] = [
    { name: "Vision Agent", working: { en: "Reading the photo, detecting the problem", hi: "फ़ोटो पढ़ रहा है, समस्या पहचान रहा है" } },
    {
      name: "Speech Agent",
      working: { en: "Transcribing the voice note, detecting language", hi: "वॉइस नोट लिख रहा है, भाषा पहचान रहा है" },
      skipped: { en: "No voice note, skipped", hi: "वॉइस नोट नहीं है, छोड़ा गया" },
    },
    { name: "Severity Agent", working: { en: "Estimating urgency and public risk", hi: "तात्कालिकता और जोखिम आँक रहा है" } },
    { name: "Routing Agent", working: { en: "Suggesting the responsible team", hi: "ज़िम्मेदार टीम सुझा रहा है" } },
    { name: "Duplicate Agent", working: { en: "Checking for existing reports at this spot", hi: "इस जगह पहले की रिपोर्ट देख रहा है" } },
    { name: "Summary Agent", working: { en: "Drafting the structured complaint", hi: "शिकायत का सार तैयार कर रहा है" } },
  ];
  return lines.map((l) => ({ ...l, skip: l.name === "Speech Agent" && !hasVoice }));
}

/**
 * The agents working through a report, shown like a terminal. While the real request is running the lines
 * advance one by one and the last one keeps working; when the answer arrives (finishing) every line is ticked.
 */
export function AgentTerminal({ lang, hasVoice, finishing }: { lang: Lang; hasVoice: boolean; finishing: boolean }) {
  const lines = agentLines(hasVoice);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // The form was far taller than this panel, so bring the panel into view.
    window.scrollTo({ top: 0, behavior: "smooth" });
    const id = setInterval(() => setTick((n) => n + 1), 1700);
    return () => clearInterval(id);
  }, []);

  // The line currently working. It stops on the last line until the server answers.
  const active = finishing ? lines.length : Math.min(tick, lines.length - 1);

  return (
    <div className="mx-auto max-w-2xl" role="status" aria-live="polite">
      <p className="eyebrow">{lang === "en" ? "Agents at work" : "एजेंट काम पर"}</p>
      <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">{lang === "en" ? "Your report is being processed" : "आपकी रिपोर्ट की जाँच हो रही है"}</h2>
      <p className="mt-2 text-slate-600">
        {lang === "en" ? "Each agent handles one job. This usually takes 10 to 20 seconds, please keep this page open." : "हर एजेंट एक काम करता है। इसमें आमतौर पर 10 से 20 सेकंड लगते हैं, कृपया यह पेज खुला रखें।"}
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border-2 border-slate-900 bg-[#0b0f14] shadow-[6px_6px_0_0_rgb(207_61_15/0.9)]">
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="ml-2 font-mono text-xs text-slate-400">sudhaar --analyze</span>
        </div>
        <ul className="space-y-2.5 p-5 font-mono text-[13px] leading-snug sm:text-sm">
          {lines.map((l, i) => {
            const done = i < active;
            const running = i === active;
            const text = l.skip && l.skipped ? l.skipped[lang] : l.working[lang];
            return (
              <li key={l.name} className={`flex items-start gap-3 transition-opacity duration-500 ${i > active ? "opacity-30" : "opacity-100"}`}>
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                  {done ? <Check className="h-4 w-4 text-emerald-400" strokeWidth={3} /> : running ? <span className="text-orange-400">&rsaquo;</span> : <span className="text-slate-600">&middot;</span>}
                </span>
                <span className={running ? "text-orange-300" : done ? "text-slate-300" : "text-slate-500"}>
                  <span className={`font-bold ${running ? "text-orange-200" : done ? "text-white" : ""}`}>{l.name}</span> &mdash; {text}
                  {running ? <span className="ml-0.5 inline-block animate-pulse">&hellip;</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="h-1 bg-white/10" aria-hidden>
          <div
            className="h-full bg-gradient-to-r from-amber-300 via-orange-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${Math.round(((finishing ? lines.length : Math.min(active + 0.5, lines.length)) / lines.length) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** What each agent concluded, shown on the success screen from the real result. */
export function AgentReport({
  lang,
  result,
}: {
  lang: Lang;
  result: { category: string; severity?: string | null; summary: string; suggestedTeam: string; voiceHeard?: string | null; similarNearby?: boolean; needsHumanReview?: boolean };
}) {
  const en = lang === "en";
  const severity = result.severity ? result.severity.charAt(0) + result.severity.slice(1).toLowerCase() : null;
  const rows: { name: string; text: string }[] = [
    { name: "Vision Agent", text: en ? `Found: ${result.category}` : `पहचाना: ${result.category}` },
    { name: "Speech Agent", text: result.voiceHeard ? (en ? `Heard: "${result.voiceHeard}"` : `सुना: "${result.voiceHeard}"`) : en ? "No voice note" : "वॉइस नोट नहीं था" },
    { name: "Severity Agent", text: severity ? (en ? `Urgency looks ${severity.toLowerCase()}` : `तात्कालिकता: ${severity}`) : en ? "Not rated" : "आँकलन नहीं" },
    { name: "Routing Agent", text: en ? `Suggested team: ${result.suggestedTeam}` : `सुझाई गई टीम: ${result.suggestedTeam}` },
    { name: "Duplicate Agent", text: result.similarNearby ? (en ? "A similar report exists nearby" : "आस-पास मिलती-जुलती रिपोर्ट है") : en ? "No similar report nearby" : "आस-पास कोई मिलती रिपोर्ट नहीं" },
    { name: "Summary Agent", text: result.summary },
  ];
  return (
    <div className="overflow-hidden rounded-xl border-2 border-slate-900 bg-[#0b0f14] text-slate-200 shadow-[4px_4px_0_0_var(--ink)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span className="font-mono text-xs text-slate-400">{en ? "what each agent did" : "हर एजेंट ने क्या किया"}</span>
      </div>
      <ul className="space-y-2.5 p-5 font-mono text-[13px] leading-snug">
        {rows.map((r) => (
          <li key={r.name} className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" strokeWidth={3} />
            <span>
              <span className="font-bold text-white">{r.name}</span> <span className="text-slate-500">&mdash;</span> {r.text}
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t border-white/10 px-5 py-3 font-mono text-[11px] text-slate-500">
        {en
          ? `${result.needsHumanReview ? "Flagged for a person to review. " : ""}Agents only suggest. Staff confirm the team before anything is promised.`
          : `${result.needsHumanReview ? "किसी व्यक्ति की समीक्षा के लिए चिह्नित। " : ""}एजेंट केवल सुझाव देते हैं। कुछ भी वादा करने से पहले स्टाफ टीम की पुष्टि करता है।`}
      </p>
    </div>
  );
}
