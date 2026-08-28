import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={`header-brand inline-flex min-h-11 items-center bg-transparent p-0 text-2xl font-bold tracking-[-.04em] shadow-none ${inverse ? "text-white" : "text-[#172033]"}`}
      aria-label="entgo.kz — главная"
    >
      entgo.kz
    </Link>
  );
}
