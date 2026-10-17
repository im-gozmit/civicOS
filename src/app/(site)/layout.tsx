import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { MobileTabBar } from "@/components/ui/MobileTabBar";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";

/** Shown for an instant while the header works out which page is open. */
function HeaderFallback() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" aria-label="Sudhaar home">
          <Logo />
        </Link>
      </div>
    </header>
  );
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const bot = (process.env.WHATSAPP_BOT_NUMBER || "").replace(/\D/g, "");
  const whatsappHref = bot ? `https://wa.me/${bot}?text=${encodeURIComponent("Hi")}` : null;
  return (
    <>
      {/* The header and tab bar read the current address, which is only known per request. */}
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader whatsappHref={whatsappHref} />
      </Suspense>
      <div id="main" className="flex-1">
        {children}
      </div>
      <SiteFooter />
      <Suspense fallback={null}>
        <MobileTabBar />
      </Suspense>
    </>
  );
}
