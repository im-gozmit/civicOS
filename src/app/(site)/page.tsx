import { Suspense } from "react";
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
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Waves,
} from "lucide-react";
import { LiveStats, LiveStatsSkeleton } from "@/components/public/LiveStats";
import { BuildathonBanner, SangamSection } from "@/components/public/Prayagraj";
import { AzadStatue } from "@/components/public/AzadStatue";

export default function Home() {
  const bot = (process.env.WHATSAPP_BOT_NUMBER || "").replace(/\D/g, "");
  const wa = bot ? `https://wa.me/${bot}?text=${encodeURIComponent("Hi")}` : null;

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="bg-hero overflow-hidden">
        <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-rise">
            <p className="inline-flex items-center gap-2 rounded-md border-2 border-slate-900 bg-[var(--paper)] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-slate-900 shadow-[3px_3px_0_0_var(--ink)]">
              <MapPin className="h-4 w-4 text-teal-600" /> Prayagraj <span lang="hi" className="font-[family-name:var(--font-deva)] normal-case tracking-normal">(प्रयागराज)</span> &middot; demo service
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[0.98] text-slate-900 sm:text-6xl lg:text-7xl">
              Spotted a civic problem?
              <span className="mt-2 block italic text-teal-600">
                Report it in a{" "}
                <span className="relative inline-block not-italic">
                  minute
                  <svg className="absolute -bottom-2 left-0 h-3 w-full text-slate-900" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
                    <path d="M0 6 Q 12 0 25 5 T 50 5 T 75 5 T 100 4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
                .
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-700">
              Send a photo on WhatsApp or the web. AI suggests the right team, staff check it, and you get updates until it is fixed.
              No account needed.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/report" className="btn btn-primary px-6 py-3.5 text-base">
                <Camera className="h-5 w-5" /> Report a problem
              </Link>
              {wa ? (
                <a href={wa} className="btn btn-whatsapp px-6 py-3.5 text-base">
                  <MessageCircle className="h-5 w-5" /> Report on WhatsApp
                </a>
              ) : (
                <Link href="/map" className="btn btn-secondary px-6 py-3.5 text-base">
                  See problems nearby
                </Link>
              )}
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCheck className="h-4 w-4 text-teal-600" /> Free, no sign-up</li>
              <li className="flex items-center gap-2"><Languages className="h-4 w-4 text-teal-600" /> English and हिन्दी</li>
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-teal-600" /> Private by design</li>
            </ul>
          </div>

          <div className="grid items-end gap-6 sm:grid-cols-[1fr_0.8fr]">
            <AzadStatue />
            <PhoneMock />
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

      {/* ---------- Live numbers ---------- */}
      <section className="container-page -mt-2 py-10" aria-labelledby="stats-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Live from the community</p>
            <h2 id="stats-title" className="mt-1 text-2xl font-bold text-slate-900">What has been reported so far</h2>
          </div>
          <Link href="/map" className="hidden items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800 sm:inline-flex">
            Open the map <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Suspense fallback={<LiveStatsSkeleton />}>
          <LiveStats />
        </Suspense>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="container-page py-10" aria-labelledby="how-title">
        <p className="eyebrow">How it works</p>
        <h2 id="how-title" className="mt-1 max-w-2xl text-3xl font-bold text-slate-900">From a photo to a fix, in four steps</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: Camera, title: "Send a photo", text: "Take a picture of the problem and share where it is. WhatsApp or the website, in English or हिन्दी." },
            { Icon: Sparkles, title: "AI reads it", text: "It checks the photo, writes a short summary and suggests which team should handle it." },
            { Icon: UserCheck, title: "Staff verify", text: "A person confirms or corrects the team. Nothing is promised to you before that." },
            { Icon: Bell, title: "You get updates", text: "A message each time the status changes, and a link to follow progress until it is closed." },
          ].map(({ Icon, title, text }, i) => (
            <li key={title} className="card card-pad relative">
              <span className="absolute right-5 top-4 font-display text-5xl font-extrabold text-slate-100">{i + 1}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
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

      {/* ---------- The city ---------- */}
      <SangamSection />

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
    <div className="relative mx-auto w-full max-w-[260px] rotate-2 animate-rise [animation-delay:120ms]" aria-hidden>
      <span className="absolute -left-6 top-10 z-10 -rotate-6 rounded-md border-2 border-slate-900 bg-amber-300 px-3 py-1.5 font-mono text-xs font-black uppercase tracking-widest text-slate-900 shadow-[3px_3px_0_0_var(--ink)]">
        Ticket in seconds
      </span>
      <div className="rounded-[2.4rem] border-[7px] border-slate-900 bg-slate-900 shadow-[10px_10px_0_0_rgb(207_61_15/0.9)]">
        <div className="overflow-hidden rounded-[1.9rem] bg-[#efeae2]">
          <div className="flex items-center gap-2.5 bg-[#075e54] px-4 py-3 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">CivicOS</p>
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
