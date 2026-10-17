import fs from "node:fs";
import path from "node:path";
import { Landmark } from "lucide-react";
import { StatueViewer, TiltStatue } from "@/components/public/StatueViewers";

const has = (file: string) => fs.existsSync(path.join(process.cwd(), "public", file));

/**
 * Chandra Shekhar Azad statue for the home page, shown in an arched alcove. It uses the best asset in /public:
 *   azad.glb          a real 3D model the visitor can turn (best)
 *   azad-statue-cutout.webp  a transparent cut-out of the statue; it leans toward the pointer
 * and falls back to a plain card until one of those is added.
 */
export function AzadStatue() {
  const glb = has("azad.glb");
  const photo = !glb && has("azad-statue-cutout.webp");

  return (
    <figure className="relative mx-auto w-full max-w-[11rem] md:mx-0 md:max-w-[12.5rem]">
      <div>
        {glb ? (
          <StatueViewer src="/azad.glb" />
        ) : photo ? (
          <TiltStatue src="/azad-statue-cutout.webp" />
        ) : (
          <div className="flex aspect-[1/2] flex-col items-center justify-center gap-2 rounded-t-[999px] border-2 border-slate-900 bg-amber-200 px-6 text-center text-slate-800">
            <Landmark className="h-16 w-16 text-slate-900" />
            <p className="font-display text-lg font-bold">Chandra Shekhar Azad</p>
          </div>
        )}
      </div>
      {/* A stone plinth for the statue to stand on, with the name plate set into it. */}
      <div className="relative -mx-[18%] -mt-3 rounded-sm border border-black/50 bg-gradient-to-b from-stone-500 via-stone-700 to-stone-900 shadow-[0_14px_30px_-8px_rgb(0_0_0/0.7)]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-white/25" aria-hidden />
      <figcaption className="block px-2 py-2 text-center">
        <span lang="hi" className="block font-[family-name:var(--font-deva)] text-sm font-bold text-white">
          चंद्रशेखर आज़ाद
        </span>
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Azad Park, Prayagraj</span>
      </figcaption>
      </div>
    </figure>
  );
}
