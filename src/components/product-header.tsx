"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";

const navigation = [
  ["Главная", "/dashboard"],
  ["Пробники", "/tests"],
  ["Темы", "/topics"],
  ["Мой план", "/plan"],
  ["Статистика", "/statistics"],
] as const;

export function ProductHeader() {
  const pathname = usePathname();

  return (
    <header className="product-header sticky top-0 z-40 border-b border-line bg-white/92 backdrop-blur-xl">
      <div className="container-shell flex h-[76px] items-center justify-between gap-6">
        <Brand />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Навигация по кабинету">
          {navigation.map(([label, href]) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold ${
                  active ? "bg-[#111] text-white" : "text-[#696965] hover:bg-[#f3f2ee] hover:text-[#111]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/premium"
            className="hidden rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_26px_rgba(37,99,235,.18)] sm:inline-flex"
          >
            Полный доступ
          </Link>
          <Link
            href="/settings"
            aria-label="Настройки"
            className={`grid size-11 place-items-center rounded-full border ${
              pathname.startsWith("/settings")
                ? "border-[#111] bg-[#111] text-white"
                : "border-line bg-white hover:border-[#111]"
            }`}
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>
    </header>
  );
}
