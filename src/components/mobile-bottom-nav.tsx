"use client";

import Link from "next/link";
import { CalendarDays, Home, ListChecks, Settings, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  ["Главная", "/dashboard", Home],
  ["Пробники", "/tests", ListChecks],
  ["План", "/plan", CalendarDays],
  ["Профиль", "/settings", Settings],
] as const;

const enabledPrefixes = [
  "/dashboard",
  "/tests",
  "/topics",
  "/plan",
  "/statistics",
  "/leaderboard",
  "/achievements",
  "/settings",
  "/rewards",
  "/study",
  "/results",
];

export function MobileBottomNav() {
  const pathname = usePathname();
  if (!enabledPrefixes.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <nav
      data-mobile-bottom-nav
      className="mobile-dock fixed inset-x-3 bottom-[calc(.55rem+env(safe-area-inset-bottom))] z-[60] grid grid-cols-5 rounded-[22px] border border-black/10 bg-white/95 p-1.5 shadow-[0_12px_45px_rgba(0,0,0,.16)] backdrop-blur-xl lg:hidden"
      aria-label="Основная навигация"
    >
      {items.slice(0, 2).map(([label, href, Icon]) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold ${active ? "bg-paper text-ink" : "text-muted"}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("entgo:ai-open"))}
        className="mx-auto grid size-13 place-items-center rounded-2xl bg-ink text-white shadow-lg"
        aria-label="Открыть AI-репетитора"
      >
        <Sparkles size={19} />
      </button>
      {items.slice(2).map(([label, href, Icon]) => {
        const active = pathname === href || pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-semibold ${active ? "bg-paper text-ink" : "text-muted"}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
