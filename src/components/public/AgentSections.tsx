import { BadgeCheck, Camera, Copy, Eye, FileText, Gauge, Mic, Route, ShieldAlert, ShieldCheck, Sparkles, UserCheck, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// The "End to end" journey and the agent crew on the home page. The agents are the project's main idea,
// so each one gets a face, a colour and a sample of what it actually says. Pure CSS animation, no client code.

const INK = "#1a1713";

/* ----------------------------------------------------------------------------------------------- journey */

type Actor = "citizen" | "agents" | "staff" | "both";

const ACTOR: Record<Actor, { label: string; chip: string; disc: string }> = {
  citizen: { label: "Citizen", chip: "bg-sky-100 text-sky-800", disc: "bg-sky-300" },
  agents: { label: "Agents", chip: "bg-orange-100 text-orange-800", disc: "bg-orange-400" },
  staff: { label: "Staff", chip: "bg-emerald-100 text-emerald-800", disc: "bg-emerald-400" },
  both: { label: "Agents + person", chip: "bg-violet-100 text-violet-800", disc: "bg-violet-400" },
};

const STEPS: Array<{ Icon: LucideIcon; actor: Actor; title: string; text: string }> = [
  { Icon: Camera, actor: "citizen", title: "Report", text: "Photo, voice note and location, on WhatsApp or the website." },
  { Icon: Sparkles, actor: "agents", title: "Understand", text: "Agents read the photo, hear the voice, rate the urgency." },
  { Icon: UserCheck, actor: "both", title: "Verify", text: "Agents suggest the team; staff confirm it before you are told." },
  { Icon: Wrench, actor: "staff", title: "Fix", text: "Staff resolve it and upload an after-repair photo as proof." },
  { Icon: ShieldCheck, actor: "both", title: "Close the loop", text: "Agents check the repair; a person closes it, and you are told." },
];

export function Journey() {
  return (
    <section id="how" className="container-page scroll-mt-24 py-12" aria-labelledby="how-title">
      <p className="eyebrow">End to end</p>
      <h2 id="how-title" className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] text-slate-900 sm:text-5xl">
        Citizen <span className="text-teal-600">&rarr;</span> Agents <span className="text-teal-600">&rarr;</span> Staff <span className="text-teal-600">&rarr;</span>{" "}
        <span className="italic text-teal-600">Verified.</span>
      </h2>

      <div className="relative mt-12">
        {/* the road the report travels along (wide screens) */}
        <div className="pointer-events-none absolute left-[10%] right-[10%] top-8 hidden h-1 lg:block" aria-hidden>
          <div className="journey-road h-full w-full rounded-full" />
          <span className="journey-dot absolute -top-2 h-5 w-5 rounded-full border-2 border-slate-900 bg-orange-500" />
        </div>

        <ol className="relative grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ Icon, actor, title, text }, i) => {
            const a = ACTOR[actor];
            return (
              <li key={title} className="group relative flex flex-col items-center text-center">
                <div className="relative">
                  <span
                    className={`flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-900 shadow-[3px_3px_0_0_var(--ink)] transition duration-300 group-hover:-translate-y-1.5 group-hover:rotate-[-6deg] ${a.disc}`}
                  >
                    <Icon className="h-7 w-7 text-slate-900" strokeWidth={2.2} />
                  </span>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-[var(--paper)] font-mono text-[11px] font-black text-slate-900">
                    {i + 1}
                  </span>
                </div>
                <span className={`mt-4 rounded-full border-2 border-slate-900 px-3 py-0.5 font-mono text-[11px] font-black uppercase tracking-wider ${a.chip}`}>{a.label}</span>
                <h3 className="mt-3 font-display text-xl font-extrabold text-slate-900">{title}</h3>
                <p className="mt-1 max-w-[16rem] text-sm leading-relaxed text-slate-600">{text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------------------------- agents */

/** One robot face per agent: a different head, different eyes and a different mouth, all drawn in the same bold outline. */
function Face({ kind, c }: { kind: string; c: string }) {
  const o = { stroke: INK, strokeWidth: 3.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (kind) {
    case "Vision": // round head, one big camera-lens eye
      return (
        <g>
          <path d="M36 10V3" {...o} />
          <circle className="agent-antenna" cx="36" cy="3.5" r="3.5" fill={c} {...o} />
          <circle cx="36" cy="40" r="26" fill={c} {...o} />
          <circle cx="36" cy="38" r="15" fill="#fff" {...o} />
          <circle className="agent-eyes" cx="36" cy="38" r="8" fill={INK} />
          <circle cx="33" cy="35" r="2.6" fill="#fff" />
          <path d="M28 59h16" {...o} />
        </g>
      );
    case "Speech": // headphones, equaliser-bar mouth
      return (
        <g>
          <path d="M12 38a24 24 0 0 1 48 0" fill="none" {...o} strokeWidth={5} />
          <rect x="5" y="32" width="10" height="20" rx="5" fill={INK} />
          <rect x="57" y="32" width="10" height="20" rx="5" fill={INK} />
          <rect x="14" y="16" width="44" height="44" rx="12" fill={c} {...o} />
          <g className="agent-eyes" fill={INK}><circle cx="28" cy="33" r="4" /><circle cx="44" cy="33" r="4" /></g>
          <g {...o} strokeWidth={4}>
            <path d="M24 50v4M30 46v12M36 49v6M42 44v14M48 50v4" />
          </g>
        </g>
      );
    case "Severity": // angular visor head with angry slanted eyes and a gauge needle
      return (
        <g>
          <path d="M36 12V4" {...o} />
          <path className="agent-antenna" d="M30 6l6-5 6 5z" fill={c} {...o} />
          <path d="M16 16h40l10 12v22l-8 10H14L6 50V28z" fill={c} {...o} />
          <path d="M14 30l16 5v7l-16-3zM58 30l-16 5v7l16-3z" fill="#fff" {...o} strokeWidth={3} />
          <g className="agent-eyes" fill={INK}><circle cx="26" cy="37" r="2.6" /><circle cx="46" cy="37" r="2.6" /></g>
          <path d="M26 54h20M30 50v8M36 50v8M42 50v8" {...o} strokeWidth={3} />
        </g>
      );
    case "Routing": // diamond head, arrow eyes, zig-zag mouth
      return (
        <g>
          <path d="M36 4l-5 8h10z" fill={c} {...o} strokeWidth={3} />
          <path d="M36 10L66 38 36 66 6 38z" fill={c} {...o} />
          <g className="agent-eyes" fill="none" {...o} strokeWidth={4.5}><path d="M22 34l8 4-8 4M50 34l-8 4 8 4" /></g>
          <path d="M26 52l5-4 5 4 5-4 5 4" fill="none" {...o} strokeWidth={3} />
        </g>
      );
    case "Duplicate": // wide head with two pairs of eyes, a twin
      return (
        <g>
          <rect x="6" y="18" width="60" height="40" rx="10" fill={c} {...o} />
          <rect x="12" y="10" width="48" height="10" rx="4" fill="#fff" {...o} strokeWidth={3} />
          <g className="agent-eyes" fill="#fff" {...o} strokeWidth={3}><circle cx="22" cy="34" r="7" /><circle cx="36" cy="34" r="7" /><circle cx="50" cy="34" r="7" /></g>
          <g className="agent-eyes" fill={INK}><circle cx="22" cy="34" r="3" /><circle cx="36" cy="34" r="3" /><circle cx="50" cy="34" r="3" /></g>
          <path d="M24 49h24" {...o} strokeWidth={3} />
        </g>
      );
    case "Summary": // tall paper-like head, eyes are text lines
      return (
        <g>
          <path d="M36 9V3" {...o} />
          <circle className="agent-antenna" cx="36" cy="3.5" r="3.5" fill={c} {...o} />
          <path d="M16 10h30l12 12v38a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" fill={c} {...o} />
          <path d="M46 10v12h12" fill="#fff" {...o} strokeWidth={3} />
          <g className="agent-eyes" fill={INK}><rect x="20" y="30" width="9" height="5" rx="2.5" /><rect x="38" y="30" width="9" height="5" rx="2.5" /></g>
          <path d="M22 46h24M22 54h14" {...o} strokeWidth={3} />
        </g>
      );
    case "Safety": // shield head with a scanning visor
      return (
        <g>
          <path d="M36 6L62 14v22c0 16-11 26-26 31C21 62 10 52 10 36V14z" fill={c} {...o} />
          <rect x="16" y="28" width="40" height="14" rx="7" fill={INK} />
          <rect className="agent-scan" x="20" y="31" width="6" height="8" rx="3" fill="#fff" />
          <path d="M28 54h16" {...o} strokeWidth={3} />
        </g>
      );
    default: // Verification: round head, happy tick eyes and a smile
      return (
        <g>
          <path d="M36 12V4" {...o} />
          <circle className="agent-antenna" cx="36" cy="4" r="4" fill={c} {...o} strokeWidth={3} />
          <rect x="8" y="12" width="56" height="52" rx="26" fill={c} {...o} />
          <g className="agent-eyes" fill="none" {...o} strokeWidth={4.5}><path d="M20 36q5-9 10 0M42 36q5-9 10 0" /></g>
          <path d="M26 48q10 10 20 0" fill="none" {...o} strokeWidth={4} />
          <circle cx="18" cy="46" r="3.5" fill="#fff" opacity=".6" /><circle cx="54" cy="46" r="3.5" fill="#fff" opacity=".6" />
        </g>
      );
  }
}

function Bot({ name, color, Icon }: { name: string; color: string; Icon: LucideIcon }) {
  return (
    <div className="agent-bot relative h-[4.5rem] w-[4.5rem] shrink-0">
      <svg viewBox="0 0 72 72" className="h-full w-full overflow-visible" aria-hidden>
        <Face kind={name} c={color} />
      </svg>
      <span className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 bg-white">
        <Icon className="h-4 w-4 text-slate-900" strokeWidth={2.4} />
      </span>
    </div>
  );
}

const AGENTS: Array<{ Icon: LucideIcon; name: string; color: string; job: string; says: string }> = [
  { Icon: Eye, name: "Vision", color: "#fb923c", job: "Reads the problem from one photo and rejects pictures that are not civic issues.", says: "Pothole, ~40 cm wide, near a school gate." },
  { Icon: Mic, name: "Speech", color: "#38bdf8", job: "Transcribes voice notes in Hindi and English and translates them for staff.", says: "“गड्ढा बहुत गहरा है” → “The pothole is very deep.”" },
  { Icon: Gauge, name: "Severity", color: "#f87171", job: "Rates urgency from low to critical, with the reason in plain words.", says: "High: next to a school, children walk here." },
  { Icon: Route, name: "Routing", color: "#a78bfa", job: "Suggests which team should handle it. Staff confirm before you are told.", says: "Suggest: Roads & Potholes team." },
  { Icon: Copy, name: "Duplicate", color: "#2dd4bf", job: "Spots repeat reports of the same problem so staff can link them.", says: "Looks like CIV-000214, 30 m away." },
  { Icon: FileText, name: "Summary", color: "#facc15", job: "Writes one clear line and notes hazards, so staff read a line, not a story.", says: "Deep pothole, school gate, vehicles swerving." },
  { Icon: ShieldAlert, name: "Safety", color: "#4ade80", job: "Treats captions and photo text as data, never as instructions, and flags anything doubtful.", says: "Caption tried to give me orders. Ignored." },
  { Icon: BadgeCheck, name: "Verification", color: "#f472b6", job: "Gives an opinion on whether the after-repair photo shows a fix. Staff decide.", says: "Surface looks repaired. Over to a person." },
];

export function AgentCrew() {
  return (
    <section id="agents" className="scroll-mt-24 py-6" aria-labelledby="agents-title">
      <div className="container-page">
        <div className="agent-panel relative overflow-hidden rounded-3xl border-2 border-slate-900 bg-[#1a1713] px-5 py-12 shadow-[8px_8px_0_0_rgb(207_61_15/0.9)] sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute inset-0 agent-grid" aria-hidden />

          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-orange-300/60 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">
              <span className="agent-live h-2 w-2 rounded-full bg-orange-400" /> Meet the crew
            </p>
            <h2 id="agents-title" className="mt-4 max-w-4xl text-4xl font-black leading-[1.05] text-white sm:text-5xl">
              Not one prompt. <span className="italic text-orange-400">Eight agents, one team.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-300">
              Each agent owns one civic job, shows its work, and can be upgraded on its own. They only suggest. A person always decides.
            </p>

            <dl className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {[
                ["8", "specialist agents"],
                ["1", "person decides"],
                ["0", "auto-dispatches"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-xl border-2 border-stone-600 bg-white/5 px-4 py-3">
                  <dt className="font-display text-3xl font-black text-orange-400">{n}</dt>
                  <dd className="mt-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-stone-300">{l}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {AGENTS.map(({ Icon, name, color, job, says }, i) => (
                <li
                  key={name}
                  className="agent-card group flex flex-col rounded-2xl border-2 border-slate-900 bg-[var(--paper)] p-5 transition duration-300 hover:-translate-y-2 hover:rotate-[-1deg]"
                  style={{ "--agent": color, animationDelay: `${i * -0.7}s` } as React.CSSProperties}
                >
                  <div className="flex items-center gap-4">
                    <Bot name={name} color={color} Icon={Icon} />
                    <div>
                      <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Agent {String(i + 1).padStart(2, "0")}</p>
                      <h3 className="font-display text-xl font-extrabold leading-tight text-slate-900">{name}</h3>
                      <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-emerald-700">
                        <span className="agent-live h-1.5 w-1.5 rounded-full bg-emerald-500" /> on duty
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">{job}</p>
                  <p className="mt-auto pt-4">
                    <span className="block rounded-lg border-2 border-slate-900 bg-slate-900 px-3 py-2 font-mono text-[11.5px] leading-snug text-emerald-300">
                      <span className="text-stone-400">&gt; </span>
                      {says}
                      <span className="agent-caret ml-0.5 inline-block h-3 w-1.5 translate-y-0.5 bg-emerald-300" />
                    </span>
                  </p>
                </li>
              ))}
            </ul>

            <p className="mt-8 flex flex-wrap items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-stone-300">
              <span className="rounded-full bg-orange-400 px-3 py-1 text-slate-900">Agents suggest</span>
              <span aria-hidden>&rarr;</span>
              <span className="rounded-full bg-emerald-400 px-3 py-1 text-slate-900">A person decides</span>
              <span aria-hidden>&rarr;</span>
              <span className="rounded-full bg-sky-300 px-3 py-1 text-slate-900">You are told</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
