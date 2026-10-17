"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { href: "/report", label: "Report" },
  { href: "/track", label: "Track" },
  { href: "/map", label: "Map" },
];

export function SiteHeader({ whatsappHref }: { whatsappHref: string | null }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="CivicOS home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = path === l.href || path.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {whatsappHref ? (
            <a href={whatsappHref} className="btn btn-secondary btn-sm hidden sm:inline-flex">
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
