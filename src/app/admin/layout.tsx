import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getAdmin } from "@/lib/adminAuth";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Logo } from "@/components/ui/Logo";

async function WhoAmI() {
  await connection();
  const admin = await getAdmin();
  if (!admin) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[14rem] truncate text-sm text-slate-500 sm:inline">{admin.email}</span>
      <LogoutButton />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBanner />
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-lg">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" aria-label="Staff home">
              <Logo />
            </Link>
            <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">Staff</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-teal-700 sm:inline-flex">
              Public site <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Suspense fallback={null}>
              <WhoAmI />
            </Suspense>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </>
  );
}
