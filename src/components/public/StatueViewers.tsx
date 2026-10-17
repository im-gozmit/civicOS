"use client";

import { createElement, useEffect, useRef, useState } from "react";

/** A real 3D model (glTF/GLB) the visitor can drag to turn; it also turns slowly by itself. */
export function StatueViewer({ src }: { src: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // The viewer is a web component; load it in the browser only.
    import("@google/model-viewer").then(() => setReady(true)).catch(() => setReady(false));
  }, []);
  if (!ready) return <div className="relative z-10 h-80 w-full animate-pulse" aria-hidden />;
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
    class: "relative z-10 h-[24rem] w-full bg-transparent",
    style: { "--poster-color": "transparent" },
  });
}

/** A transparent cut-out that leans toward the pointer, to give a feel of depth when no 3D model exists. */
export function TiltStatue({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function move(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 18}deg) rotateX(${-y * 8}deg)`;
  }
  function leave() {
    if (ref.current) ref.current.style.transform = "";
  }
  return (
    <div className="relative z-10 w-full" onPointerMove={move} onPointerLeave={leave}>
      <div ref={ref} className="transition-transform duration-200 ease-out will-change-transform">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Statue of Chandra Shekhar Azad in Azad Park, Prayagraj" className="mx-auto h-[24rem] w-auto object-contain drop-shadow-[8px_10px_0_rgb(26_23_19/0.25)]" />
      </div>
    </div>
  );
}
