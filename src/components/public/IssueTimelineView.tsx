import type { ReactNode } from "react";

export interface TimelineEntry {
  title: string;
  note?: string;
  meta?: string;
  /** "done" gets a filled dot, "pending" a hollow one. */
  state?: "done" | "pending";
}

export interface Fact {
  label: string;
  value: ReactNode;
  note?: string;
}

/**
 * One layout for "an issue and where it stands": chips and headline on top, the photo and timeline on the left,
 * and a stack of fact cards on the right. Used right after a report is registered and on the tracking page.
 */
export function IssueTimelineView({
  eyebrow = "Issue timeline",
  chips,
  title,
  description,
  media,
  timeline,
  facts,
  children,
  aside,
}: {
  eyebrow?: string;
  chips: ReactNode;
  title: string;
  description?: string | null;
  media?: ReactNode;
  timeline: TimelineEntry[];
  facts: Fact[];
  /** Extra blocks under the timeline (progress, agent report, notes). */
  children?: ReactNode;
  /** Extra blocks under the fact cards (action buttons). */
  aside?: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-5xl">
      <p className="eyebrow">{eyebrow}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">{chips}</div>
      <h1 className="mt-4 max-w-3xl text-3xl font-black leading-[1.1] text-slate-900 sm:text-4xl">{title}</h1>
      {description ? <p className="mt-3 max-w-3xl text-lg leading-relaxed text-slate-600">{description}</p> : null}

      <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_17rem] md:items-start">
        <div className="space-y-6">
          {media}

          <section className="rounded-xl border-2 border-slate-900 bg-[var(--paper)] p-5 shadow-[4px_4px_0_0_var(--ink)] sm:p-6">
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Timeline</h2>
            <ol className="mt-5">
              {timeline.map((t, i) => {
                const pending = t.state === "pending";
                return (
                  <li key={`${t.title}-${i}`} className={`relative flex gap-4 pb-5 last:pb-0 ${pending ? "opacity-60" : ""}`}>
                    {i < timeline.length - 1 ? <span className="absolute left-[7px] top-5 h-full w-px bg-slate-300" aria-hidden /> : null}
                    <span
                      className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${pending ? "border-slate-400 bg-[var(--paper)]" : "border-teal-600 bg-teal-600"}`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{t.title}</p>
                      {t.note ? <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{t.note}</p> : null}
                      {t.meta ? <p className="mt-1 font-mono text-xs text-slate-500">{t.meta}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {children}
        </div>

        <aside className="space-y-3">
          {facts.map((f) => (
            <div key={f.label} className="rounded-xl border-2 border-slate-900 bg-[var(--paper)] px-4 py-3 shadow-[3px_3px_0_0_var(--ink)]">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{f.label}</p>
              <div className="mt-1 text-[15px] font-semibold leading-snug text-slate-900">{f.value}</div>
              {f.note ? <p className="mt-1 text-xs font-normal leading-relaxed text-slate-500">{f.note}</p> : null}
            </div>
          ))}
          {aside}
        </aside>
      </div>
    </article>
  );
}

/** Small pill used in the chip row. */
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "ink" | "plain" | "amber" | "rose" | "green" }) {
  const cls = {
    ink: "border-slate-900 bg-slate-900 text-white",
    plain: "border-slate-900 bg-[var(--paper)] text-slate-700",
    amber: "border-amber-500 bg-amber-100 text-amber-900",
    rose: "border-rose-500 bg-rose-100 text-rose-900",
    green: "border-emerald-600 bg-emerald-100 text-emerald-900",
  }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${cls}`}>{children}</span>;
}

export function severityTone(severity?: string | null): "amber" | "rose" | "green" | "plain" {
  const s = (severity ?? "").toUpperCase();
  if (s === "CRITICAL" || s === "HIGH") return "rose";
  if (s === "MEDIUM") return "amber";
  if (s === "LOW") return "green";
  return "plain";
}
