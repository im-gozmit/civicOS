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
