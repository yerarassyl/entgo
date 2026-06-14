import Link from "next/link";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white py-12">
      <div className="container-shell grid gap-10 md:grid-cols-[1.5fr_1fr]">
        <div>
          <Brand />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
            Подготовка к ЕНТ без хаоса: диагностика, понятный план и ежедневные короткие занятия.
          </p>
        </div>
        <div className="grid gap-3 text-sm">
          <p className="mb-1 font-semibold">Документы</p>
          <Link href="/privacy" className="text-muted hover:text-ink">Конфиденциальность</Link>
          <Link href="/terms" className="text-muted hover:text-ink">Условия использования</Link>
          <p className="mt-3 text-xs text-muted">© 2026 entgo.kz</p>
        </div>
      </div>
    </footer>
  );
}
