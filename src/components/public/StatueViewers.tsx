"use client";

import { createElement, useEffect, useRef, useState } from "react";

/** A real 3D model (glTF/GLB) the visitor can drag to turn; it also turns slowly by itself. */
export function StatueViewer({ src }: { src: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // The viewer is a web component; load it in the browser only.
    import("@google/model-viewer").then(() => setReady(true)).catch(() => setReady(false));
  }, []);
  if (!ready) return <div className="aspect-[2/3] w-full animate-pulse bg-slate-900" aria-hidden />;
  return createElement("model-viewer", {
    src,
    alt: "3D model of the Chandra Shekhar Azad statue. Drag to turn it.",
    "camera-controls": true,
    "auto-rotate": true,
    "auto-rotate-delay": 1500,
    "rotation-per-second": "18deg",
    "disable-zoom": true,
    "interaction-prompt": "none",
    "shadow-intensity": "0.8",
    exposure: "1.05",
    class: "block aspect-[2/3] w-full bg-transparent",
    style: { "--poster-color": "transparent" },
  });
}

/** The statue photo, leaning slightly toward the pointer to give a feel of depth. */
export function TiltStatue({ src }: { src: string }) {
  const ref = useRef<HTMLImageElement>(null);
  function move(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 5}deg)`;
  }
  function leave() {
    if (ref.current) ref.current.style.transform = "";
  }
  return (
    <div onPointerMove={move} onPointerLeave={leave}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt="Statue of Chandra Shekhar Azad in Azad Park, Prayagraj"
        width={424}
        height={1200}
        className="block h-auto w-full drop-shadow-[6px_8px_0_rgb(26_23_19/0.18)] transition-transform duration-300 ease-out will-change-transform"
      />
    </div>
  );
}
