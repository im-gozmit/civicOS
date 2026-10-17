import fs from "node:fs";
import path from "node:path";
import { Landmark } from "lucide-react";
import { StatueViewer, TiltStatue } from "@/components/public/StatueViewers";

const has = (file: string) => fs.existsSync(path.join(process.cwd(), "public", file));

/**
 * Chandra Shekhar Azad statue for the home page. It uses the best asset found in /public:
 *   azad.glb         a real 3D model the visitor can turn (best)
 *   azad-statue.png  a transparent cut-out that tilts with the pointer
 * and falls back to a plain card until one of those is added.
 */
export function AzadStatue() {
  const glb = has("azad.glb");
  const png = !glb && has("azad-statue.png");

  return (
    <figure className="relative flex h-full min-h-[22rem] flex-col items-center justify-end">
      <div className="absolute inset-x-4 bottom-10 top-6 rounded-t-[999px] border-2 border-slate-900 bg-amber-200 shadow-[6px_6px_0_0_var(--ink)]" aria-hidden />
      {glb ? (
        <StatueViewer src="/azad.glb" />
      ) : png ? (
        <TiltStatue src="/azad-statue.png" />
      ) : (
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-slate-700">
          <Landmark className="h-16 w-16 text-slate-900" />
          <p className="font-display text-lg font-bold">Chandra Shekhar Azad</p>
        </div>
      )}
      <figcaption className="relative z-10 mt-3 rounded-md border-2 border-slate-900 bg-[var(--paper)] px-3 py-1 text-center shadow-[3px_3px_0_0_var(--ink)]">
        <span lang="hi" className="block font-[family-name:var(--font-deva)] text-sm font-bold text-slate-900">
          चंद्रशेखर आज़ाद
        </span>
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Azad Park, Prayagraj</span>
      </figcaption>
    </figure>
  );
}
