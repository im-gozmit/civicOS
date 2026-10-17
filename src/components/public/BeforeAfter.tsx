import { Wrench } from "lucide-react";
import { AdminImage } from "@/components/admin/AdminImage";

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" });

/**
 * The citizen's own photo, and, once staff have uploaded one, the photo taken after the repair. Photos are served
 * through the citizen's private tracking link, so nobody else can open them.
 */
export function BeforeAfter({ token, before, after, reportedAt }: { token: string; before: string[]; after: Array<{ file: string; at: string }>; reportedAt: string }) {
  if (before.length === 0 && after.length === 0) return null;
  const src = (file: string) => `/api/v1/track/media/${token}/${file}`;
  const photo = "max-h-72 w-full rounded-xl border-2 border-slate-900 object-cover shadow-[4px_4px_0_0_var(--ink)]";
  return (
    <section className="rounded-xl border-2 border-slate-900 bg-[var(--paper)] p-5 shadow-[4px_4px_0_0_var(--ink)] sm:p-6" aria-label="Photos">
      <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Photos</h2>
      <div className={`mt-4 grid gap-5 ${after.length > 0 ? "sm:grid-cols-2" : ""}`}>
        {before.length > 0 ? (
          <figure>
            <figcaption className="mb-2 flex items-center justify-between gap-2">
              <span className="rounded-full border-2 border-slate-900 bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white">Reported</span>
              <span className="text-xs text-slate-500">The photo you sent &middot; {when(reportedAt)}</span>
            </figcaption>
            <div className="space-y-3">
              {before.map((f) => (
                <AdminImage key={f} src={src(f)} alt="The photo you sent" className={photo} audience="citizen" />
              ))}
            </div>
          </figure>
        ) : null}

        {after.length > 0 ? (
          <figure>
            <figcaption className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-emerald-700 bg-emerald-100 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                <Wrench className="h-3 w-3" aria-hidden /> After repair
              </span>
              <span className="text-xs text-slate-500">Uploaded by staff &middot; {when(after[after.length - 1].at)}</span>
            </figcaption>
            <div className="space-y-3">
              {after.map((a) => (
                <AdminImage key={a.file} src={src(a.file)} alt="Photo taken after the repair" className={photo} audience="citizen" />
              ))}
            </div>
          </figure>
        ) : null}
      </div>
      {after.length === 0 ? <p className="mt-3 text-xs text-slate-500">When staff finish the work, the photo taken after the repair will appear here next to yours.</p> : null}
    </section>
  );
}
