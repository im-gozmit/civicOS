import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Camera,
  CheckCheck,
  Construction,
  Droplets,
  EyeOff,
  Languages,
  Lightbulb,
  Lock,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Trash2,
  UserCheck,
  Waves,
} from "lucide-react";
import { BadgeCheck, Copy, Eye, FileText, Gauge, Mic, Route, ShieldAlert } from "lucide-react";
import { IssueMap } from "@/components/public/IssueMap";
import { BuildathonBanner } from "@/components/public/Prayagraj";
import { AzadStatue } from "@/components/public/AzadStatue";

function WhatsAppGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** Small card in the hero: the whole WhatsApp flow in three steps. The steps light up one after another. */
function SixtySecondCard({ href }: { href: string | null }) {
  const steps = [
    { Icon: Camera, label: "Click an image" },
    { Icon: Send, label: "Send on WhatsApp" },
    { Icon: BadgeCheck, label: "Complaint registered" },
  ];
  const body = (
    <>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[2px_2px_0_0_var(--ink)] ring-2 ring-slate-900">
          <WhatsAppGlyph className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-extrabold leading-tight">Complaint in under 60 seconds</p>
          <p className="hero-card-sub text-xs text-white/70">No app. No sign-up.</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-md bg-amber-300 px-2 py-1 font-mono text-xs font-black text-slate-900">
          <Timer className="h-3.5 w-3.5" /> 60s
        </span>
      </div>
      <ol className="mt-3 flex items-stretch gap-1.5 text-xs font-semibold sm:text-sm">
        {steps.map(({ Icon, label }, i) => (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="wa-step flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2 py-2" style={{ animationDelay: `${i * 1.6}s` }}>
              <Icon className="h-4 w-4 shrink-0 text-amber-300" />
              <span className="leading-tight">{label}</span>
            </span>
            {i < steps.length - 1 ? <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden /> : null}
          </li>
        ))}
      </ol>
    </>
  );
  const cls =
    "hero-card mt-6 block max-w-xl rounded-xl border border-white/30 bg-black/35 p-4 text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-amber-300";
  return href ? (
    <a href={href} className={cls} aria-label="Start a complaint on WhatsApp. Click an image, send it on WhatsApp, and your complaint is registered in under 60 seconds.">
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function Home() {
  const bot = (process.env.WHATSAPP_BOT_NUMBER || "").replace(/\D/g, "");
  const wa = bot ? `https://wa.me/${bot}?text=${encodeURIComponent("Hi")}` : null;

  return (
    <>
      {/* ---------- Hero: sunset over the river, with the Azad statue ---------- */}
      <section className="hero relative -mt-16 overflow-hidden bg-slate-950 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-bg.webp"
          alt=""
          width={1672}
          height={941}
          fetchPriority="high"
          className="hero-bg absolute inset-0 h-full w-full object-cover object-[70%_62%]"
        />
        {/* Dark wash on the text side so the headline stays readable, and a light one at the top for the header. */}
        <div className="hero-wash absolute inset-0 bg-black/30 bg-gradient-to-r from-black/70 via-black/30 to-transparent" aria-hidden />
        <div className="hero-wash absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" aria-hidden />
        <div className="hero-wash absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />

        <div className="container-page relative grid min-h-[36rem] items-end gap-10 pt-24 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="animate-rise self-start pb-14 lg:pb-20">
            <h1 className="hero-h1 text-4xl font-black leading-[1.02] text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.35)] sm:text-5xl lg:text-6xl">
              Spotted a civic problem?
              <span className="hero-accent mt-2 block italic text-orange-500">
                Report it in a{" "}
                <span className="relative inline-block not-italic">
                  minute
                  <svg className="hero-underline absolute -bottom-2 left-0 h-3 w-full text-amber-400" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
                    <path d="M0 6 Q 12 0 25 5 T 50 5 T 75 5 T 100 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
                .
              </span>
            </h1>
            <p className="hero-sub mt-7 max-w-xl text-lg leading-relaxed text-white/90 [text-shadow:0_1px_12px_rgb(0_0_0/0.5)]">
              Send a photo on WhatsApp and get your complaint number in under 60 seconds. AI suggests the right team, staff check it,
              and you get updates until it is fixed. No app, no sign-up.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {wa ? (
                <a href={wa} className="btn btn-whatsapp px-7 py-4 text-lg">
                  <MessageCircle className="h-6 w-6" /> Report on WhatsApp <span className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-xs text-white">60s</span>
                </a>
              ) : null}
              <Link href="/report" className={wa ? "btn btn-secondary px-6 py-4 text-base" : "btn btn-primary px-7 py-4 text-lg"}>
                <Camera className="h-5 w-5" /> {wa ? "Use the website instead" : "Report a problem"}
              </Link>
            </div>

            <SixtySecondCard href={wa} />

            <ul className="hero-trust mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
              <li className="flex items-center gap-2"><CheckCheck className="h-4 w-4 text-amber-300" /> Free, no sign-up</li>
              <li className="flex items-center gap-2"><Languages className="h-4 w-4 text-amber-300" /> English and हिन्दी</li>
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-amber-300" /> Private by design</li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[28rem] self-end pb-0 lg:mx-0 lg:justify-self-end">
            <AzadStatue />
            <div className="mt-10 md:absolute md:bottom-6 md:right-[-3rem] md:mt-0 md:w-[260px] md:origin-bottom-right md:scale-[0.68]">
              <PhoneMock />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Where it was built ---------- */}
      <BuildathonBanner />

      {/* ---------- Ticker ---------- */}
      <div className="overflow-hidden border-y-2 border-slate-900 bg-slate-900 py-3 text-slate-50" aria-hidden>
        <div className="ticker flex w-max gap-10 font-mono text-sm font-bold uppercase tracking-[0.2em]">
          {[0, 1].map((n) => (
            <div key={n} className="flex shrink-0 gap-10">
              {["Potholes", "Garbage", "Drains", "Water leaks", "Street lights", "Report", "Track", "Resolve"].map((t) => (
                <span key={t + n} className="flex items-center gap-10">
                  {t} <span className="text-teal-400">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Live heatmap of reported problems (the only place the map appears) ---------- */}
      <section id="map" className="container-page scroll-mt-24 py-10" aria-labelledby="map-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Live from the community</p>
            <h2 id="map-title" className="mt-1 text-3xl font-black text-slate-900">Where Prayagraj is reporting problems</h2>
            <p className="mt-2 max-w-xl text-slate-600">Brighter patches mean more reports close together. Switch to pins to see each report and whether it is being handled.</p>
          </div>
          <Link href="/report" className="btn btn-primary">
            <Camera className="h-4 w-4" /> Report a problem
          </Link>
        </div>
        <IssueMap />
      </section>

      {/* ---------- How it works: end to end ---------- */}
      <section id="how" className="container-page scroll-mt-24 py-12" aria-labelledby="how-title">
        <p className="eyebrow">End to end</p>
        <h2 id="how-title" className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] text-slate-900 sm:text-5xl">
          Citizen <span className="text-teal-600">&rarr;</span> Agents <span className="text-teal-600">&rarr;</span> Staff <span className="text-teal-600">&rarr;</span>{" "}
          <span className="italic text-teal-600">Verified.</span>
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { Icon: Camera, text: "Citizen uploads photo, voice, location" },
            { Icon: Sparkles, text: "Agents understand and classify the issue" },
            { Icon: UserCheck, text: "Agents suggest the team, staff verify it" },
            { Icon: Bell, text: "Staff resolve it and upload proof" },
            { Icon: ShieldCheck, text: "Agents check the repair, a person closes the loop" },
          ].map(({ Icon, text }, i) => (
            <li
              key={text}
              className="group relative rounded-xl border-2 border-slate-900 bg-[var(--paper)] p-5 shadow-[4px_4px_0_0_var(--ink)] transition duration-300 hover:-translate-y-1 hover:shadow-[6px_8px_0_0_rgb(207_61_15/0.9)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-black text-teal-600">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 transition group-hover:bg-teal-600 group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-5 text-base font-medium leading-snug text-slate-800">{text}</p>
              {i < 4 ? <ArrowRight className="absolute -right-3.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full bg-slate-900 p-0.5 text-white lg:block" aria-hidden /> : null}
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- The agent workforce ---------- */}
      <section id="agents" className="container-page scroll-mt-24 py-12" aria-labelledby="agents-title">
        <p className="eyebrow">Sudhaar</p>
        <h2 id="agents-title" className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] text-slate-900 sm:text-5xl">
          Not one prompt. <span className="italic text-teal-600">A coordinated agent workforce.</span>
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          Each agent owns one civic job, explains what it saw, and can be upgraded on its own. They only suggest. A person always decides.
        </p>

        <ul className="mt-10 grid overflow-hidden rounded-xl border-2 border-slate-900 bg-slate-900 shadow-[6px_6px_0_0_var(--ink)] sm:grid-cols-2 lg:grid-cols-4 [&>li]:border-slate-900 gap-0.5">
          {[
            { Icon: Eye, name: "Vision Agent", text: "Understands the problem from a single photo and rejects pictures that are not civic issues." },
            { Icon: Mic, name: "Speech Agent", text: "Transcribes voice notes in Hindi and English, and translates them for staff." },
            { Icon: Gauge, name: "Severity Agent", text: "Rates urgency from low to critical, with the reason in plain words." },
            { Icon: Route, name: "Routing Agent", text: "Suggests which team should handle it. Staff confirm before you are told." },
            { Icon: Copy, name: "Duplicate Agent", text: "Spots repeat reports of the same problem so staff can link them." },
            { Icon: FileText, name: "Summary Agent", text: "Writes a short, clear summary and notes hazards, so staff read one line, not a story." },
            { Icon: ShieldAlert, name: "Safety Agent", text: "Treats captions and photo text as data, never as instructions, and flags anything doubtful." },
            { Icon: BadgeCheck, name: "Verification Agent", text: "Gives an opinion on whether the after-repair photo shows a fix. Staff decide." },
          ].map(({ Icon, name, text }) => (
            <li key={name} className="group relative bg-[var(--paper)] p-5 transition duration-300 hover:bg-teal-50">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-sm font-bold text-teal-700">{name}</p>
                <Icon className="h-4 w-4 text-slate-400 transition duration-300 group-hover:scale-125 group-hover:text-teal-600" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- What you can report ---------- */}
      <section className="container-page py-10" aria-labelledby="what-title">
        <p className="eyebrow">What you can report</p>
        <h2 id="what-title" className="mt-1 text-3xl font-bold text-slate-900">Everyday problems on your street</h2>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { Icon: Construction, label: "Potholes and damaged roads", tone: "bg-orange-50 text-orange-600" },
            { Icon: Trash2, label: "Garbage and overflowing bins", tone: "bg-lime-50 text-lime-700" },
            { Icon: Waves, label: "Blocked or overflowing drains", tone: "bg-cyan-50 text-cyan-700" },
            { Icon: Droplets, label: "Water leaks and supply issues", tone: "bg-sky-50 text-sky-600" },
            { Icon: Lightbulb, label: "Broken street lights", tone: "bg-amber-50 text-amber-600" },
          ].map(({ Icon, label, tone }) => (
            <li key={label}>
              <Link href="/report" className="card group flex h-full flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-pop">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-snug text-slate-800">{label}</span>
                <ArrowRight className="mt-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Trust ---------- */}
      <section className="container-page py-10" aria-labelledby="trust-title">
        <div className="card overflow-hidden">
          <div className="grid gap-px bg-slate-200/70 md:grid-cols-3">
            {[
              { Icon: ShieldCheck, title: "A person always decides", text: "The AI only suggests. Staff check the team and decide when something is fixed." },
              { Icon: EyeOff, title: "Private by design", text: "Photos and contact details stay private. The public map shows only approximate spots." },
              { Icon: CheckCheck, title: "Honest about what it is", text: "A demo service. The teams are demo queues, not official departments." },
            ].map(({ Icon, title, text }) => (
              <div key={title} className="bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 id={title === "A person always decides" ? "trust-title" : undefined} className="mt-4 text-lg font-bold text-slate-900">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Final call to action ---------- */}
      <section className="container-page py-10">
        <div className="relative overflow-hidden rounded-2xl border-2 border-slate-900 bg-slate-900 px-6 py-14 shadow-[8px_8px_0_0_rgb(207_61_15/0.9)] text-center sm:px-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border-[18px] border-teal-600/60" />
          <h2 className="relative text-4xl font-black text-white sm:text-5xl">See something? <span className="italic text-teal-400">Say something.</span></h2>
          <p className="relative mx-auto mt-3 max-w-lg text-slate-300">It takes about a minute, and every report is tracked until someone fixes it.</p>
          <div className="relative mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/report" className="btn bg-white px-6 py-3.5 text-base text-slate-900 hover:bg-slate-100">
              <Camera className="h-5 w-5" /> Report a problem
            </Link>
            <Link href="/track" className="btn border border-white/25 px-6 py-3.5 text-base text-white hover:bg-white/10">
              Track a complaint
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/** A pure-CSS phone showing the WhatsApp conversation, so visitors see what to expect. */
function PhoneMock() {
  return (
    <div className="relative mx-auto w-full max-w-[260px] rotate-2 md:max-w-none animate-rise [animation-delay:120ms]" aria-hidden>
      <span className="absolute -left-6 top-10 z-10 -rotate-6 rounded-md border-2 border-slate-900 bg-amber-300 px-3 py-1.5 font-mono text-xs font-black uppercase tracking-widest text-slate-900 shadow-[3px_3px_0_0_var(--ink)]">
        Ticket in seconds
      </span>
      <div className="rounded-[2.4rem] border-[7px] border-slate-900 bg-slate-900 shadow-[10px_10px_0_0_rgb(207_61_15/0.9)]">
        <div className="overflow-hidden rounded-[1.9rem] bg-[#efeae2]">
          <div className="flex items-center gap-2.5 bg-[#075e54] px-4 py-3 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sudhaar-icon.png" alt="" width={32} height={32} className="h-8 w-8 rounded-full bg-white object-cover" />
            <div className="leading-tight">
              <p className="text-sm font-semibold">Sudhaar</p>
              <p className="text-[11px] text-emerald-100">online</p>
            </div>
          </div>

          <div className="space-y-2 p-3 text-[13px] leading-snug">
            <div className="ml-auto w-[78%] rounded-xl rounded-tr-sm bg-[#d9fdd3] p-1.5 shadow-sm">
              <div className="flex h-16 items-center justify-center rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 text-white/80">
                <Construction className="h-9 w-9" />
              </div>
              <p className="px-1.5 pb-0.5 pt-1.5 text-slate-800">Big pothole near the school gate</p>
            </div>
            <div className="w-[88%] rounded-xl rounded-tl-sm bg-white p-3 shadow-sm">
              <p className="font-semibold text-slate-900">✅ Complaint registered</p>
              <p className="mt-0.5 font-mono text-[13px] font-bold text-teal-700">CIV-004217</p>
              <p className="mt-1.5 text-slate-600">Road damage &middot; High</p>
              <p className="text-slate-600">Suggested: Roads &amp; Public Works</p>
              <p className="mt-1.5 text-[12px] text-slate-500">Staff will confirm the team and message you.</p>
              <p className="mt-1.5 text-[12px] font-medium text-sky-700 underline">Track it here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
