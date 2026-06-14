import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-white/90 backdrop-blur-xl">
      <div className="container-shell flex h-18 items-center justify-between max-sm:h-16">
        <Brand />
        <div className="hidden items-center gap-3 md:flex">
          <button className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-paper">ҚАЗ</button>
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-paper">
            Войти
          </Link>
          <Link href="/onboarding" className="rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8]">
            Зарегистрироваться
          </Link>
        </div>
        <div className="flex items-center gap-1.5 md:hidden">
          <Link href="/login" className="rounded-full px-2.5 py-2 text-xs font-semibold hover:bg-paper">
            Войти
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-[#2563eb] px-4 py-2.5 text-xs font-semibold text-white"
          >
            Начать
          </Link>
        </div>
      </div>
    </header>
  );
}
