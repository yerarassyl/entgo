"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, Home, ListChecks, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  ["Главная", "/dashboard", Home],
  ["План", "/plan", CalendarDays],
  ["Темы", "/topics", BookOpen],
  ["Пробники", "/tests", ListChecks],
  ["Профиль", "/settings", UserRound],
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
  "/universities",
];

export function MobileBottomNav() {
  const pathname = usePathname();
  if (!enabledPrefixes.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <nav
      data-mobile-bottom-nav
      className="mobile-dock fixed inset-x-3 bottom-[calc(.55rem+env(safe-area-inset-bottom))] z-[60] grid grid-cols-5 rounded-[24px] border border-black/10 bg-[#111]/95 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.24)] backdrop-blur-xl lg:hidden"
      aria-label="Основная навигация"
    >
      {items.map(([label, href, Icon]) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-13 flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[10px] font-semibold transition-colors ${
              active ? "bg-white text-[#111]" : "text-white/60 hover:text-white"
            }`}
          >
            <Icon size={18} />
            <span className="truncate max-w-full">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

