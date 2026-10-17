import Link from "next/link";
import { ArrowRight, Castle, Landmark, Waves } from "lucide-react";

/** Strip announcing where the project was built: Azad Reads on the left, Azad Labs on the right. */
export function BuildathonBanner() {
  const tile = "h-14 w-14 shrink-0 rounded-lg border-2 border-slate-900 object-cover shadow-[3px_3px_0_0_var(--ink)] sm:h-16 sm:w-16";
  return (
    <div className="border-b-2 border-slate-900 bg-amber-300">
      <div className="container-page grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3 sm:gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/azad-reads.jpg" alt="Azad Reads logo: an open book with colourful pages" width={64} height={64} className={tile} />
        <div className="text-center">
          <p className="font-display text-lg font-extrabold leading-tight text-slate-900 sm:text-2xl">
            Built during the <span className="italic">Azad Buildathon</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-800 sm:text-xs">
            Azad Reads <span className="mx-1 text-teal-700">✦</span> Azad Labs <span className="mx-1 text-teal-700">✦</span>{" "}
            <span lang="hi" className="font-[family-name:var(--font-deva)] normal-case tracking-normal">प्रयागराज</span>
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/azad-labs.jpg" alt="Azad Labs logo: a figure with a cape riding a rocket" width={64} height={64} className={tile} />
      </div>
    </div>
  );
}

/** The confluence: Ganga and Yamuna meet, and the unseen Saraswati joins them (drawn dashed). */
function SangamArt() {
  return (
    <svg viewBox="0 0 420 260" className="h-auto w-full" role="img" aria-label="Illustration of the Ganga and Yamuna rivers meeting at the Sangam, with the unseen Saraswati drawn as a dashed line">
      <g fill="none" strokeLinecap="round">
        <path d="M0 36 C 100 20, 150 120, 240 142" stroke="#cf3d0f" strokeWidth="12" />
        <path d="M0 232 C 100 250, 160 170, 240 150" stroke="#1a1713" strokeWidth="12" />
        <path d="M0 134 C 90 130, 160 146, 240 146" stroke="#f59e0b" strokeWidth="5" strokeDasharray="2 12" />
        <path d="M240 146 C 310 148, 360 128, 420 150" stroke="#1a1713" strokeWidth="14" />
        <path d="M240 146 C 310 148, 360 128, 420 150" stroke="#cf3d0f" strokeWidth="6" strokeDasharray="14 14" />
      </g>
      <circle cx="240" cy="146" r="13" fill="#fffdf8" stroke="#1a1713" strokeWidth="4" />
      <g className="font-display" fontSize="15" fontWeight="800" fill="#1a1713">
        <text x="6" y="22">Ganga</text>
        <text x="6" y="256">Yamuna</text>
        <text x="6" y="120" fill="#92400e">Saraswati</text>
        <text x="262" y="112">Sangam</text>
      </g>
    </svg>
  );
}

export function SangamSection() {
  return (
    <section className="container-page py-10" aria-labelledby="city-title">
      <div className="grid items-center gap-8 rounded-2xl border-2 border-slate-900 bg-[var(--paper)] p-6 shadow-[8px_8px_0_0_var(--ink)] sm:p-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Made for Prayagraj</p>
          <h2 id="city-title" className="mt-3 text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
            Where the rivers meet, <span className="italic text-teal-600">the city speaks up.</span>
          </h2>
          <p lang="hi" className="mt-3 font-[family-name:var(--font-deva)] text-lg font-semibold text-slate-700">
            संगम नगरी की हर गली, हर सड़क के लिए।
          </p>
          <p className="mt-4 max-w-md leading-relaxed text-slate-700">
            Prayagraj is the city of the Sangam, where the Ganga and Yamuna meet and the unseen Saraswati joins them. Sudhaar brings
            people, photos and city teams together the same way: one place where every report is seen and followed.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            <li className="flex items-start gap-3 rounded-lg border-2 border-slate-900 bg-teal-50 p-3">
              <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
              <span className="text-sm leading-snug text-slate-800">
                <strong className="block text-slate-900">Chandra Shekhar Azad Park</strong>
                Home to the statue of the freedom fighter, whose name means &ldquo;free&rdquo;.
              </span>
            </li>
            <li className="flex items-start gap-3 rounded-lg border-2 border-slate-900 bg-teal-50 p-3">
              <Castle className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
              <span className="text-sm leading-snug text-slate-800">
                <strong className="block text-slate-900">Fort and ghats</strong>
                From the fort walls to the riverbank, every street counts.
              </span>
            </li>
          </ul>
          <Link href="/map" className="btn btn-dark btn-sm mt-6">
            <Waves className="h-4 w-4" /> See reports across the city <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-lg rounded-xl border-2 border-slate-900 bg-sky-50 p-4">
          <SangamArt />
          <p className="mt-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600">Triveni Sangam &middot; Prayagraj</p>
        </div>
      </div>
    </section>
  );
}
