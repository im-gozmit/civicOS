"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ViewSwitch } from "@/components/ui/ViewSwitch";

const LINKS = [
  { href: "/report", label: "Report" },
  { href: "/track", label: "Track" },
  { href: "/map", label: "Map" },
];

export function SiteHeader({ whatsappHref }: { whatsappHref: string | null }) {
  const path = usePathname();
  // On the home page the header floats over the hero photo until the visitor scrolls.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const overHero = path === "/" && !scrolled;
  return (
    <header
      className={`site-header sticky top-0 z-40 border-b transition-colors ${
        overHero ? "border-transparent bg-transparent text-white" : "border-slate-200/70 bg-white/80 text-slate-900 backdrop-blur-lg"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Sudhaar home">
          <Logo onDark={overHero} />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = path === l.href || path.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`nav-link rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  overHero
                    ? active
                      ? "bg-white/20 text-white"
                      : "text-white/90 hover:bg-white/15"
                    : active
                      ? "bg-teal-50 text-teal-800"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {path === "/" ? <ViewSwitch /> : null}
          {whatsappHref ? (
            <a href={whatsappHref} className={`header-wa btn btn-sm hidden sm:inline-flex ${overHero ? "border-white/80 bg-black/25 text-white backdrop-blur-sm" : "btn-secondary"}`}>
              <MessageCircle className="h-4 w-4 text-[#1faa59]" />
              WhatsApp
            </a>
          ) : null}
          <Link href="/report" className="btn btn-primary btn-sm">
            Report a problem
          </Link>
        </div>
      </div>
    </header>
  );
}
