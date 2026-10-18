import Link from "next/link";
import { ArrowRight, BadgeCheck, EyeOff, Handshake } from "lucide-react";

// Two illustrated sections of the home page: the kinds of problems you can report, and the three promises
// (a person decides, privacy, honesty). The pictures are inline SVG so they stay sharp, cost no extra downloads,
// and animate with CSS only (the global reduced-motion rule stops the movement for people who prefer that).

const INK = "#1a1713";

/* ------------------------------------------------------------------------------------------ problem scenes */

function PotholeScene() {
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="240" height="150" fill="#fed7aa" />
      <circle cx="42" cy="38" r="17" fill="#fb923c" />
      <path d="M0 96h240v54H0z" fill="#44403c" />
      <path d="M0 96h240" stroke={INK} strokeWidth="3" />
      <path d="M0 128h240" stroke="#fde68a" strokeWidth="4" strokeDasharray="22 16" />
      <ellipse cx="116" cy="114" rx="48" ry="15" fill={INK} />
      <ellipse cx="116" cy="111" rx="39" ry="9" fill="#0f0d0a" />
      <path d="M66 110l-14-8M168 110l17-9M108 99l-4-10M130 100l6-9" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <g className="scene-wobble" style={{ transformOrigin: "204px 126px" }}>
        <path d="M194 126l10-42 10 42z" fill="#f97316" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M197 110h14M199 98h10" stroke="#fff" strokeWidth="3.5" />
        <rect x="188" y="126" width="32" height="7" rx="2" fill={INK} />
      </g>
    </svg>
  );
}

function GarbageScene() {
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="240" height="150" fill="#d9f99d" />
      <rect y="118" width="240" height="32" fill="#a3e635" />
      <path d="M0 118h240" stroke={INK} strokeWidth="3" />
      <circle cx="198" cy="34" r="14" fill="#fde047" />
      <path d="M90 56h60l-7 66h-46z" fill="#4d7c0f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M108 68v46M120 68v46M132 68v46" stroke="#365314" strokeWidth="3.5" strokeLinecap="round" />
      <g className="scene-lid" style={{ transformOrigin: "88px 56px" }}>
        <rect x="84" y="46" width="72" height="11" rx="4" fill="#84cc16" stroke={INK} strokeWidth="3" />
        <rect x="112" y="38" width="16" height="9" rx="3" fill="#84cc16" stroke={INK} strokeWidth="3" />
      </g>
      <circle cx="64" cy="122" r="10" fill="#fbbf24" stroke={INK} strokeWidth="2.5" />
      <rect x="164" y="108" width="22" height="15" rx="3" fill="#f87171" stroke={INK} strokeWidth="2.5" transform="rotate(-16 175 115)" />
      <path d="M40 130l11-9 9 11z" fill="#e5e7eb" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <g className="scene-float" fill={INK}>
        <circle cx="168" cy="70" r="2.5" />
        <circle cx="176" cy="62" r="2.5" />
      </g>
    </svg>
  );
}

function DrainScene() {
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="240" height="150" fill="#a5f3fc" />
      <path d="M0 70h240v80H0z" fill="#64748b" />
      <path d="M0 70h240" stroke={INK} strokeWidth="3" />
      <rect x="70" y="84" width="100" height="42" rx="8" fill="#1e293b" stroke={INK} strokeWidth="3" />
      <path d="M90 92v26M108 92v26M126 92v26M144 92v26M158 92v26" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
      <g className="scene-flow">
        <path d="M-40 116q20-13 40 0t40 0 40 0 40 0 40 0 40 0 40 0V150H-40z" fill="#22d3ee" fillOpacity=".9" stroke="#0891b2" strokeWidth="2" />
      </g>
      <g fill="#fff" fillOpacity=".85">
        <circle className="scene-float" cx="96" cy="108" r="3" />
        <circle className="scene-float" cx="146" cy="112" r="2.5" style={{ animationDelay: "-1s" }} />
      </g>
      <path d="M22 40q14-14 28 0" stroke="#0e7490" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M176 34q14-14 28 0" stroke="#0e7490" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function LeakScene() {
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="240" height="150" fill="#bae6fd" />
      <rect y="124" width="240" height="26" fill="#7dd3fc" />
      <rect x="-4" y="38" width="248" height="28" fill="#94a3b8" stroke={INK} strokeWidth="3" />
      <rect x="40" y="33" width="13" height="38" rx="3" fill="#64748b" stroke={INK} strokeWidth="3" />
      <rect x="186" y="33" width="13" height="38" rx="3" fill="#64748b" stroke={INK} strokeWidth="3" />
      <path d="M112 66l8 6 8-6" stroke={INK} strokeWidth="3" fill="#cbd5e1" strokeLinejoin="round" />
      <path d="M120 74q-3 16-16 30M122 74q1 18 14 32" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round" />
      {[0, 0.55, 1.1].map((d, i) => (
        <path key={i} className="scene-drop" d="M120 78q-6 10 0 15q6-5 0-15z" fill="#0284c7" style={{ animationDelay: `${d}s`, transform: `translateX(${[-14, 4, 16][i]}px)` }} />
      ))}
      <ellipse className="scene-ripple" cx="120" cy="132" rx="46" ry="8" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
    </svg>
  );
}

function LampScene() {
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="lamp-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" stopOpacity=".95" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="240" height="150" fill="#312e81" />
      <g fill="#fef9c3">
        <circle cx="30" cy="26" r="1.8" />
        <circle cx="70" cy="48" r="1.5" />
        <circle cx="194" cy="24" r="1.8" />
        <circle cx="214" cy="56" r="1.4" />
        <circle cx="104" cy="20" r="1.4" />
      </g>
      <circle cx="40" cy="60" r="14" fill="#e0e7ff" />
      <circle cx="46" cy="55" r="12" fill="#312e81" />
      <rect y="128" width="240" height="22" fill="#1e1b4b" />
      <path className="scene-beam" d="M148 66L98 130h104z" fill="url(#lamp-beam)" />
      <rect x="164" y="64" width="8" height="66" fill="#0f0d0a" />
      <path d="M168 66q-26-2-36 12" stroke="#0f0d0a" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M118 74h26l-4 11h-18z" fill="#0f0d0a" />
      <circle className="scene-bulb" cx="131" cy="88" r="7" fill="#fde047" />
    </svg>
  );
}

interface Kind {
  title: string;
  title_hi: string;
  example: string;
  Scene: () => React.ReactElement;
  /** The coloured panel behind the picture and the card's hover shadow. */
  hover: string;
  span: string;
}

const KINDS: Kind[] = [
  { title: "Potholes and damaged roads", title_hi: "गड्ढे और टूटी सड़कें", example: "Big pothole near the school gate", Scene: PotholeScene, hover: "hover:shadow-[8px_10px_0_0_#ea580c]", span: "lg:col-span-2" },
  { title: "Garbage and overflowing bins", title_hi: "कचरा और भरे हुए डिब्बे", example: "Garbage pile beside the market", Scene: GarbageScene, hover: "hover:shadow-[8px_10px_0_0_#65a30d]", span: "lg:col-span-2" },
  { title: "Blocked or overflowing drains", title_hi: "बंद या उफनती नालियाँ", example: "Drain overflowing on the main road", Scene: DrainScene, hover: "hover:shadow-[8px_10px_0_0_#0891b2]", span: "lg:col-span-2" },
  { title: "Water leaks and supply issues", title_hi: "पानी का रिसाव और आपूर्ति", example: "Pipe leaking for three days", Scene: LeakScene, hover: "hover:shadow-[8px_10px_0_0_#0284c7]", span: "lg:col-span-3" },
  { title: "Broken street lights", title_hi: "खराब स्ट्रीट लाइट", example: "Whole lane is dark at night", Scene: LampScene, hover: "hover:shadow-[8px_10px_0_0_#4338ca]", span: "lg:col-span-3" },
];

export function WhatYouCanReport() {
  return (
    <section className="container-page py-12" aria-labelledby="what-title">
      <p className="eyebrow">What you can report</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="what-title" className="text-4xl font-black leading-[1.05] text-slate-900 sm:text-5xl">
            Everyday problems <span className="italic text-teal-600">on your street.</span>
          </h2>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-slate-600">
            If it affects your lane, your light or your tap, it belongs here. Pick the one that looks like yours, or just send a photo and the agents will work out the rest.
          </p>
        </div>
        <Link href="/report" className="btn btn-primary">
          Report a problem <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ul className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {KINDS.map(({ title, title_hi, example, Scene, hover, span }) => (
          <li key={title} className={span}>
            <Link
              href="/report"
              className={`group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-900 bg-[var(--paper)] shadow-[4px_4px_0_0_var(--ink)] transition duration-300 hover:-translate-y-1.5 ${hover}`}
            >
              <div className={`relative h-40 overflow-hidden border-b-2 border-slate-900 transition duration-500 group-hover:saturate-125 sm:h-44 ${span === "lg:col-span-3" ? "lg:h-64" : ""}`}>
                <div className="h-full w-full transition duration-500 group-hover:scale-105">
                  <Scene />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-xl font-extrabold leading-tight text-slate-900">{title}</h3>
                <p lang="hi" className="mt-0.5 font-[family-name:var(--font-deva)] text-sm font-semibold text-slate-500">
                  {title_hi}
                </p>
                <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm italic text-slate-600">&ldquo;{example}&rdquo;</p>
                <span className="mt-4 inline-flex items-center gap-1.5 pt-1 text-sm font-bold text-teal-700">
                  Report this
                  <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1.5" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ promises */

function DecidesArt() {
  return (
    <svg viewBox="0 0 240 130" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="240" height="130" fill="#ffe2d6" />
      <g transform="translate(26 30)">
        <rect x="0" y="14" width="56" height="50" rx="12" fill="#fff" stroke={INK} strokeWidth="3" />
        <circle cx="19" cy="38" r="6" fill={INK} />
        <circle cx="37" cy="38" r="6" fill={INK} />
        <path d="M18 54q10 7 20 0" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M28 14V3" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        <circle className="scene-bulb" cx="28" cy="2" r="5" fill="#f97316" stroke={INK} strokeWidth="2" />
      </g>
      <g stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="2 8">
        <path d="M94 62h40" className="scene-dash" />
      </g>
      <path d="M130 54l12 8-12 8" stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(150 22)">
        <circle cx="30" cy="22" r="17" fill="#fcd34d" stroke={INK} strokeWidth="3" />
        <path d="M0 80q4-34 30-34t30 34z" fill="#0f766e" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <g className="scene-pop">
          <circle cx="56" cy="48" r="15" fill="#16a34a" stroke={INK} strokeWidth="3" />
          <path d="M48 48l6 6 10-12" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
}

function PrivateArt() {
  return (
    <svg viewBox="0 0 240 130" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="240" height="130" fill="#e0f2fe" />
      <g stroke="#bae6fd" strokeWidth="2">
        <path d="M0 30h240M0 65h240M0 100h240M40 0v130M95 0v130M150 0v130M205 0v130" />
      </g>
      <path d="M-10 118q70-60 130-30t140-50" stroke="#7dd3fc" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle className="scene-ripple" cx="120" cy="68" r="44" fill="#38bdf8" fillOpacity=".22" stroke="#0284c7" strokeWidth="3" strokeDasharray="7 7" />
      <g transform="translate(104 34)">
        <path d="M16 0C7 0 0 7 0 16c0 12 16 30 16 30s16-18 16-30C32 7 25 0 16 0z" fill="#ef4444" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="16" cy="16" r="6" fill="#fff" />
      </g>
      <g transform="translate(186 12)">
        <rect x="0" y="12" width="34" height="28" rx="6" fill="#fcd34d" stroke={INK} strokeWidth="3" />
        <path d="M7 12V8a10 10 0 0 1 20 0v4" stroke={INK} strokeWidth="3" fill="none" />
        <circle cx="17" cy="26" r="3.5" fill={INK} />
      </g>
      <g transform="translate(16 76)">
        <rect width="46" height="34" rx="6" fill="#cbd5e1" stroke={INK} strokeWidth="3" />
        <path d="M6 28l12-12 8 8 6-6 8 10z" fill="#94a3b8" />
        <path d="M-4 38L50-4" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function HonestArt() {
  return (
    <svg viewBox="0 0 240 130" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="240" height="130" fill="#fef3c7" />
      <g fill="#fde68a" stroke={INK} strokeWidth="2.5">
        <rect x="18" y="74" width="54" height="40" rx="5" />
        <rect x="170" y="80" width="54" height="34" rx="5" />
      </g>
      <g fill={INK}>
        <rect x="26" y="84" width="10" height="8" />
        <rect x="42" y="84" width="10" height="8" />
        <rect x="178" y="88" width="10" height="8" />
        <rect x="196" y="88" width="10" height="8" />
      </g>
      <g className="scene-stamp" style={{ transformOrigin: "120px 62px" }}>
        <g transform="rotate(-9 120 62)">
          <rect x="52" y="34" width="136" height="56" rx="8" fill="none" stroke="#b91c1c" strokeWidth="5" />
          <rect x="59" y="41" width="122" height="42" rx="4" fill="none" stroke="#b91c1c" strokeWidth="2" />
          <text x="120" y="73" textAnchor="middle" fontFamily="ui-monospace, Menlo, monospace" fontWeight="900" fontSize="30" letterSpacing="6" fill="#b91c1c">
            DEMO
          </text>
        </g>
      </g>
    </svg>
  );
}

const PROMISES = [
  {
    Art: DecidesArt,
    Icon: BadgeCheck,
    tone: "bg-teal-50 text-teal-700",
    title: "A person always decides",
    hi: "फ़ैसला हमेशा इंसान का",
    text: "The agents only suggest. Staff check the team and decide when something is fixed.",
    chips: ["Agents suggest", "Staff decide"],
  },
  {
    Art: PrivateArt,
    Icon: EyeOff,
    tone: "bg-sky-100 text-sky-700",
    title: "Private by design",
    hi: "निजता पहले",
    text: "Photos and contact details stay private. The public map shows only approximate spots.",
    chips: ["Approximate map", "Encrypted numbers"],
  },
  {
    Art: HonestArt,
    Icon: Handshake,
    tone: "bg-amber-100 text-amber-800",
    title: "Honest about what it is",
    hi: "जो है, वही बताते हैं",
    text: "A demo service. The teams are demo queues, not official departments.",
    chips: ["Demo queues", "Not official"],
  },
] as const;

export function Promises() {
  return (
    <section className="container-page py-12" aria-labelledby="trust-title">
      <p className="eyebrow">Our promises</p>
      <h2 id="trust-title" className="mt-3 text-4xl font-black leading-[1.05] text-slate-900 sm:text-5xl">
        Built to be <span className="italic text-teal-600">trusted.</span>
      </h2>
      <ul className="mt-9 grid gap-5 md:grid-cols-3">
        {PROMISES.map(({ Art, Icon, tone, title, hi, text, chips }, i) => (
          <li
            key={title}
            className={`group overflow-hidden rounded-2xl border-2 border-slate-900 bg-[var(--paper)] shadow-[4px_4px_0_0_var(--ink)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[8px_10px_0_0_rgb(207_61_15/0.9)] ${i === 1 ? "md:mt-6" : i === 2 ? "md:mt-12" : ""}`}
          >
            <div className="h-36 overflow-hidden border-b-2 border-slate-900">
              <div className="h-full w-full transition duration-500 group-hover:scale-105">
                <Art />
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-xl font-extrabold leading-tight text-slate-900">{title}</h3>
                  <p lang="hi" className="font-[family-name:var(--font-deva)] text-sm font-semibold text-slate-500">
                    {hi}
                  </p>
                </div>
              </div>
              <p className="mt-3 leading-relaxed text-slate-600">{text}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <li key={c} className="rounded-full border-2 border-slate-900 bg-white px-3 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
