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
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Trash2,
  UserCheck,
  Waves,
} from "lucide-react";
import { IssueMap } from "@/components/public/IssueMap";
import { BuildathonBanner } from "@/components/public/Prayagraj";
import { AzadStatue } from "@/components/public/AzadStatue";

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
          <div className="animate-rise self-center pb-14 lg:pb-20">
            <div className="flex flex-wrap items-center gap-2">
            <p className="hero-pill inline-flex items-center gap-2 rounded-md border border-white/70 bg-black/30 px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-amber-300" /> Prayagraj <span lang="hi" className="font-[family-name:var(--font-deva)] normal-case tracking-normal">(प्रयागराज)</span> &middot; demo service
            </p>
            <p className="inline-flex items-center gap-1.5 rounded-md border-2 border-slate-900 bg-amber-300 px-3 py-1 font-mono text-xs font-black uppercase tracking-widest text-slate-900 shadow-[3px_3px_0_0_var(--ink)]">
              <Timer className="h-4 w-4" /> WhatsApp complaint in under 60 seconds
            </p>
          </div>
            <h1 className="hero-h1 mt-6 text-5xl font-black leading-[0.98] text-white [text-shadow:0_2px_24px_rgb(0_0_0/0.35)] sm:text-6xl lg:text-7xl">
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

            <ul className="hero-trust mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
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
          Citizen <span className="text-teal-600">&rarr;</span> AI <span className="text-teal-600">&rarr;</span> Staff <span className="text-teal-600">&rarr;</span>{" "}
          <span className="italic text-teal-600">Verified.</span>
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { Icon: Camera, text: "Citizen uploads photo, voice, location" },
            { Icon: Sparkles, text: "AI understands and classifies the issue" },
            { Icon: UserCheck, text: "AI suggests the team, staff verify it" },
            { Icon: Bell, text: "Staff resolve it and upload proof" },
            { Icon: ShieldCheck, text: "AI checks the repair, a person closes the loop" },
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

        {/* The 60-second promise */}
        <div className="mt-8 overflow-hidden rounded-2xl border-2 border-slate-900 bg-slate-900 p-6 text-white shadow-[8px_8px_0_0_rgb(207_61_15/0.9)] sm:p-10">
          <div className="grid items-center gap-8 lg:grid-cols-[auto_1fr_auto]">
            <div className="flex items-end gap-3">
              <span className="font-display text-8xl font-black leading-none text-orange-400 sm:text-9xl">60</span>
              <span className="pb-3 font-mono text-sm font-bold uppercase leading-tight tracking-widest text-white/80">seconds<br />on WhatsApp</span>
            </div>
            <div>
              <h3 className="text-2xl font-black leading-tight sm:text-3xl">From &ldquo;Hi&rdquo; to a complaint number, before you finish your chai.</h3>
              <ol className="mt-5 grid gap-3 sm:grid-cols-4">
                {[
                  { t: "0:05", label: "Say Hi", Icon: MessageCircle },
                  { t: "0:20", label: "Send a photo", Icon: Camera },
                  { t: "0:40", label: "Share your location pin", Icon: MapPin },
                  { t: "0:60", label: "Get your number and link", Icon: Send },
                ].map(({ t, label, Icon }) => (
                  <li key={label} className="rounded-lg border border-white/15 bg-white/5 p-3">
                    <span className="font-mono text-xs font-bold text-orange-300">{t}</span>
                    <span className="mt-1 flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4 shrink-0 text-orange-300" /> {label}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden>
                <div className="sixty-fill h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-500 to-teal-600" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {wa ? (
                <a href={wa} className="btn btn-whatsapp px-6 py-3.5 text-base">
                  <MessageCircle className="h-5 w-5" /> Start on WhatsApp
                </a>
              ) : (
                <Link href="/report" className="btn btn-primary px-6 py-3.5 text-base">
                  <Camera className="h-5 w-5" /> Report a problem
                </Link>
              )}
              <p className="text-center text-xs text-white/60">No app. No sign-up. Hindi or English.</p>
            </div>
          </div>
        </div>
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
