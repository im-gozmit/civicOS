import fs from "node:fs";
import path from "node:path";
import { Landmark } from "lucide-react";
import { StatueViewer, TiltStatue } from "@/components/public/StatueViewers";

const has = (file: string) => fs.existsSync(path.join(process.cwd(), "public", file));

/**
 * Chandra Shekhar Azad statue for the home page, shown in an arched alcove. It uses the best asset in /public:
 *   azad.glb          a real 3D model the visitor can turn (best)
 *   azad-statue.webp  a transparent cut-out of the statue; it leans toward the pointer
 * and falls back to a plain card until one of those is added.
 */
export function AzadStatue() {
  const glb = has("azad.glb");
  const photo = !glb && has("azad-statue.webp");

  return (
    <figure className="relative mx-auto w-full max-w-[14rem] md:mx-0 md:max-w-[17rem]">
      <div>
        {glb ? (
          <StatueViewer src="/azad.glb" />
        ) : photo ? (
          <TiltStatue src="/azad-statue.webp" />
        ) : (
          <div className="flex aspect-[1/2] flex-col items-center justify-center gap-2 rounded-t-[999px] border-2 border-slate-900 bg-amber-200 px-6 text-center text-slate-800">
            <Landmark className="h-16 w-16 text-slate-900" />
            <p className="font-display text-lg font-bold">Chandra Shekhar Azad</p>
          </div>
        )}
      </div>
      <div className="mx-auto -mt-2 h-4 w-4/5 rounded-[50%] bg-slate-900/25 blur-md" aria-hidden />
      <figcaption className="relative mt-3 inline-block rounded-md border-2 border-slate-900 bg-[var(--paper)] px-3 py-1 shadow-[3px_3px_0_0_var(--ink)]">
        <span lang="hi" className="block font-[family-name:var(--font-deva)] text-sm font-bold text-slate-900">
          चंद्रशेखर आज़ाद
        </span>
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Azad Park, Prayagraj</span>
      </figcaption>
    </figure>
  );
}
