import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Admin sign in — CivicOS" };

export default function AdminLoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">CivicOS admin</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">Authorised staff only. There is no public sign-up.</p>
      <LoginForm />
    </main>
  );
}
