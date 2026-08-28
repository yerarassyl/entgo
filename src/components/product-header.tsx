"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";

const navigation = [
  ["Главная", "/dashboard"],
  ["Мой план", "/plan"],
  ["Пробники", "/tests"],
  ["Разбор ошибок", "/results"],
  ["Статистика", "/statistics"],
] as const;

export function ProductHeader({ name }: { name?: string } = {}) {
  const pathname = usePathname();
  const initials = name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

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
            href="/settings"
            aria-label="Профиль и настройки"
            className={`grid size-11 place-items-center rounded-full border ${
              pathname.startsWith("/settings")
                ? "border-[#111] bg-[#111] text-white"
                : "border-line bg-white hover:border-[#111]"
            }`}
          >
            {initials ? <span className="text-xs font-extrabold">{initials}</span> : <UserRound size={18} />}
          </Link>
        </div>
      </div>
    </header>
  );
}
