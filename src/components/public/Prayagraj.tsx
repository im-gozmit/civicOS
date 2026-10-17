/**
 * Compact bar at the top of the hero, under the navbar: where the project was built. Azad Reads and Azad Labs
 * logos sit at the two ends. It is a dark, slightly see-through bar so it reads on the photo and on the plain look.
 */
export function BuildathonBanner() {
  const logo = "h-9 w-9 shrink-0 rounded-md border border-white/30 object-cover";
  return (
    <div className="rounded-xl border border-white/20 bg-slate-900/85 text-slate-100 shadow-lg backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/azad-reads.jpg" alt="Azad Reads logo: an open book with colourful pages" width={36} height={36} className={logo} />
        <span className="rounded-lg border border-white/30 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200 sm:text-xs">
          Built during the Azad Buildathon
        </span>
        <span className="text-center">
          Made with <strong className="font-semibold text-white">Azad Reads</strong> and <strong className="font-semibold text-white">Azad Labs</strong> in{" "}
          <strong className="font-semibold text-white">Prayagraj</strong> <span lang="hi" className="font-[family-name:var(--font-deva)]">(प्रयागराज)</span>
        </span>
        <a
          href="https://github.com/im-gozmit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline decoration-white/40 underline-offset-4 transition hover:text-amber-200 hover:decoration-amber-200"
        >
          Built by Mayank <span aria-hidden>&#8599;</span>
        </a>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/azad-labs.jpg" alt="Azad Labs logo: a figure with a cape riding a rocket" width={36} height={36} className={logo} />
      </div>
    </div>
  );
}
