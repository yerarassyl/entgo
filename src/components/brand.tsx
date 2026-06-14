import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={`header-brand inline-flex min-h-11 items-center text-[22px] font-semibold tracking-[-0.05em] ${inverse ? "text-white" : "text-ink"}`}
      aria-label="entgo.kz — главная"
    >
      entgo<span className={inverse ? "text-white/55" : "text-black/35"}>.kz</span>
    </Link>
  );
}
