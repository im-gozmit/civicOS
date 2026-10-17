"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="btn btn-secondary btn-sm"
      onClick={async () => {
        await fetch("/api/v1/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  );
}
