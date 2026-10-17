import { FlaskConical } from "lucide-react";

/** A thin strip above the navbar: this is a demonstration, not an official government service. */
export function DemoBanner() {
  return (
    <div className="border-b-2 border-slate-900 bg-amber-200 text-slate-900" role="note">
      <p className="container-page flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 py-1.5 text-center text-xs leading-snug sm:text-[13px]">
        <span className="inline-flex items-center gap-1 rounded bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-amber-200">
          <FlaskConical className="h-3 w-3" aria-hidden /> Demo
        </span>
        <span>
          This is a demo built at the Azad Buildathon, not an official government service. The teams shown are demo queues, and nothing is
          dispatched without a person.
        </span>
      </p>
    </div>
  );
}
