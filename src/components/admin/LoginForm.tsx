"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/v1/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
      return;
    }
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setError(data?.error ?? "Login failed.");
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span className="text-zinc-600">Email</span>
        <input name="email" type="email" required autoComplete="username" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" />
      </label>
      <label className="block text-sm">
        <span className="text-zinc-600">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" />
      </label>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button disabled={busy} className="w-full rounded bg-teal-700 px-3 py-2 font-medium text-white disabled:opacity-60">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
