import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white pb-24 md:pb-0">
      <div className="container-page grid gap-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-slate-600">
            Report civic problems with a photo, get a complaint number, and follow it until it is fixed.
          </p>
          <p className="text-sm font-semibold text-slate-800">
            Made in Prayagraj, during the Azad Buildathon.
          </p>
        </div>
        <nav aria-label="Footer" className="space-y-2 text-sm">
          <p className="font-semibold text-slate-900">Citizens</p>
          <ul className="space-y-1.5 text-slate-600">
            <li>
              <Link className="hover:text-teal-700" href="/report">
                Report a problem
              </Link>
            </li>
            <li>
              <Link className="hover:text-teal-700" href="/track">
                Track a complaint
              </Link>
            </li>
            <li>
              <Link className="hover:text-teal-700" href="/map">
                Problems nearby
              </Link>
            </li>
          </ul>
        </nav>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-slate-900">Staff</p>
          <ul className="space-y-1.5 text-slate-600">
            <li>
              <Link className="hover:text-teal-700" href="/admin">
                Staff sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <p className="container-page py-4 text-xs leading-relaxed text-slate-500">
          Sudhaar is a demo service for Prayagraj. The teams shown are demo queues, not official government departments, and a report
          here does not mean a department has accepted it.
        </p>
      </div>
    </footer>
  );
}
