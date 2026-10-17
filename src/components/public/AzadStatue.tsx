import fs from "node:fs";
import path from "node:path";
import { Landmark } from "lucide-react";
import { StatueViewer, TiltStatue } from "@/components/public/StatueViewers";

const has = (file: string) => fs.existsSync(path.join(process.cwd(), "public", file));

/**
 * Chandra Shekhar Azad statue for the home page, shown in an arched alcove. It uses the best asset in /public:
 *   azad.glb          a real 3D model the visitor can turn (best)
 *   azad-statue.webp  a photo of the statue on a dark, spot-lit background; it leans toward the pointer
 * and falls back to a plain card until one of those is added.
 */
export function AzadStatue() {
  const glb = has("azad.glb");
  const photo = !glb && has("azad-statue.webp");

  return (
    <figure className="relative mx-auto w-full max-w-[22rem] md:mx-0">
      <div className="overflow-hidden rounded-t-[999px] rounded-b-xl border-2 border-slate-900 bg-slate-950 shadow-[8px_8px_0_0_rgb(207_61_15/0.9)]">
        {glb ? (
          <StatueViewer src="/azad.glb" />
        ) : photo ? (
          <TiltStatue src="/azad-statue.webp" />
        ) : (
          <div className="flex aspect-[2/3] flex-col items-center justify-center gap-2 bg-amber-200 px-6 text-center text-slate-800">
            <Landmark className="h-16 w-16 text-slate-900" />
            <p className="font-display text-lg font-bold">Chandra Shekhar Azad</p>
          </div>
        )}
      </div>
      <figcaption className="relative -mt-5 ml-4 inline-block rounded-md border-2 border-slate-900 bg-[var(--paper)] px-3 py-1 shadow-[3px_3px_0_0_var(--ink)]">
        <span lang="hi" className="block font-[family-name:var(--font-deva)] text-sm font-bold text-slate-900">
          चंद्रशेखर आज़ाद
        </span>
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Azad Park, Prayagraj</span>
      </figcaption>
    </figure>
  );
}
