"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ header = false }: { header?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      className={header
        ? "flex h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink shadow-sm hover:bg-paper disabled:opacity-50"
        : "mt-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-paper hover:text-ink disabled:opacity-50"}
    >
      <LogOut size={18} />
      {loading ? "Выходим..." : "Выйти"}
    </button>
  );
}
