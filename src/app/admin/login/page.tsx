import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Staff sign in" };

export default function AdminLoginPage() {
  return (
    <div className="bg-hero min-h-[calc(100*var(--vh)-4rem)]">
      <main className="container-page flex justify-center py-14 sm:py-20">
        <div className="w-full max-w-md">
          <div className="card card-pad shadow-pop">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Staff sign in</h1>
            <p className="mt-1.5 text-sm text-slate-500">Authorised staff only. There is no public sign-up.</p>
            <div className="mt-6">
              <LoginForm />
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">After several wrong attempts, sign-in is paused for 15 minutes.</p>
        </div>
      </main>
    </div>
  );
}
