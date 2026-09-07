"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Brand } from "@/components/brand";

const navigation = [
  ["Главная", "/dashboard"],
  ["Мой план", "/plan"],
  ["Пробники", "/tests"],
  ["Темы", "/topics"],
  ["Вузы", "/universities"],
  ["Разбор ошибок", "/results"],
  ["Статистика", "/statistics"],
] as const;

export function ProductHeader({ name, currentLocale = "RU" }: { name?: string; currentLocale?: "RU" | "KK" } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocale] = useState<"RU" | "KK">(currentLocale);
  const initials = name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  const toggleLanguage = async (newLocale: "RU" | "KK") => {
    setLocale(newLocale);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });
      router.refresh();
    } catch {
      // Ignore
    }
  };

  return (
    <header className="product-header sticky top-0 z-40 border-b border-line bg-white/92 backdrop-blur-xl">
      <div className="container-shell flex h-[76px] items-center justify-between gap-4">
        <Brand />
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Навигация по кабинету">
          {navigation.map(([label, href]) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  active ? "bg-[#111] text-white" : "text-[#696965] hover:bg-[#f3f2ee] hover:text-[#111]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {/* Quick language toggle */}
          <div className="flex items-center rounded-full border border-line bg-white p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => toggleLanguage("RU")}
              className={`rounded-full px-2.5 py-1 transition ${
                locale === "RU" ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => toggleLanguage("KK")}
              className={`rounded-full px-2.5 py-1 transition ${
                locale === "KK" ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              ҚАЗ
            </button>
          </div>

          <Link
            href="/settings"
            aria-label="Профиль и настройки"
            className={`grid size-11 place-items-center rounded-full border transition ${
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
