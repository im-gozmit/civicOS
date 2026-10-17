"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, House, Map, Search } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", Icon: House, primary: false },
  { href: "/map", label: "Map", Icon: Map, primary: false },
  { href: "/report", label: "Report", Icon: Camera, primary: true },
  { href: "/track", label: "Track", Icon: Search, primary: false },
];

/** Thumb-reach navigation on phones; the desktop header takes over from the md breakpoint. */
export function MobileTabBar() {
  const path = usePathname();
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
        {TABS.map(({ href, label, Icon, primary }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className="flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium">
                {primary ? (
                  <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-pop ring-4 ring-white">
                    <Icon className="h-5 w-5" />
                  </span>
                ) : (
                  <Icon className={`h-5 w-5 ${active ? "text-teal-700" : "text-slate-500"}`} />
                )}
                <span className={active || primary ? "text-teal-800" : "text-slate-500"}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
