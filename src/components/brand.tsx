import Link from "next/link";
import Image from "next/image";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className="header-brand inline-flex min-h-11 items-center"
      aria-label="entgo.kz — главная"
    >
      <Image
        src={inverse ? "/entgo-logo-light.svg" : "/entgo-logo-dark.svg"}
        alt="entgo.kz"
        width={132}
        height={34}
        priority
        className="h-8 w-auto"
      />
    </Link>
  );
}
