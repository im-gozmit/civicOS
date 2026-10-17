import Link from "next/link";
import { ArrowRight, Camera, Heart } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { BackToTop, PrayagrajClock } from "@/components/ui/FooterExtras";

const LINKEDIN = "https://linkedin.com/in/gozmit";
const GITHUB = "https://github.com/im-gozmit";

function LinkedInMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/** A footer link whose arrow slides in on hover. */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-slate-300 transition hover:text-white">
      <span className="relative">
        {children}
        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-orange-400 transition-all duration-300 group-hover:w-full" />
      </span>
      <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-orange-400 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
    </Link>
  );
}

const social =
  "group inline-flex h-11 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition duration-300 hover:-translate-y-1 hover:border-orange-400 hover:bg-orange-500 hover:text-slate-950 hover:shadow-[0_8px_0_-2px_rgb(255_255_255/0.15)]";

export function SiteFooter() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-slate-900 pb-24 text-slate-300 md:pb-0">
      {/* A strip of sunset along the top edge. */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-300 via-orange-500 to-teal-600" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" aria-hidden />

      <div className="container-page relative grid gap-10 py-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="space-y-5">
          <Logo onDark size="lg" />
          <p className="max-w-sm text-sm leading-relaxed text-slate-400">
            Report civic problems with a photo, get a complaint number, and follow it until it is fixed.
          </p>
          <Link href="/report" className="btn btn-primary btn-sm">
            <Camera className="h-4 w-4" /> Report a problem
          </Link>
        </div>

        <nav aria-label="Footer" className="space-y-3 text-sm">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Citizens</p>
          <ul className="space-y-2.5">
            <li><FooterLink href="/report">Report a problem</FooterLink></li>
            <li><FooterLink href="/track">Track a complaint</FooterLink></li>
            <li><FooterLink href="/#map">Problems nearby</FooterLink></li>
          </ul>
        </nav>

        <div className="space-y-3 text-sm">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Staff</p>
          <ul className="space-y-2.5">
            <li><FooterLink href="/admin">Staff sign in</FooterLink></li>
          </ul>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Built at</p>
          <p className="leading-relaxed text-slate-300">The Azad Buildathon, with Azad Reads and Azad Labs, in Prayagraj.</p>
          <PrayagrajClock />
        </div>
      </div>

      {/* Big wordmark: a faint watermark that lights up orange when hovered. */}
      <div className="group relative select-none overflow-hidden" aria-hidden>
        <p
          lang="hi"
          className="whitespace-nowrap text-center font-[family-name:var(--font-deva)] text-[28vw] font-black leading-[0.9] text-white/[0.11] transition-colors duration-500 group-hover:text-orange-500/90 md:text-[16vw]"
        >
          सुधार
        </p>
      </div>

      <div className="border-t border-white/10">
        <p className="container-page py-4 text-xs leading-relaxed text-slate-500">
          Sudhaar is a demo service for Prayagraj. The teams shown are demo queues, not official government departments, and a report
          here does not mean a department has accepted it.
        </p>
      </div>

      <div className="border-t border-white/10 bg-black/30">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-5 md:flex-row">
          <p className="group/love flex items-center gap-1.5 text-sm font-semibold text-slate-100">
            Made with
            <Heart className="h-4 w-4 fill-orange-500 text-orange-500 transition duration-300 group-hover/love:scale-150 group-hover/love:fill-rose-500 group-hover/love:text-rose-500" aria-label="love" />
            for Prayagraj by Mayank
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="Mayank on LinkedIn" className={social}>
              <LinkedInMark /> LinkedIn
            </a>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" aria-label="Mayank on GitHub" className={social}>
              <GitHubMark /> GitHub
            </a>
            <BackToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
