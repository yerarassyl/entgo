import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { PremiumClient } from "@/components/premium-client";
import { getSessionUser } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/subscription";

export default async function PremiumPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const subscription = await getActiveSubscription(user.id);

  return (
    <main className="mobile-app-page min-h-screen bg-white pb-16 text-[#172033]">
      <header className="border-b border-[#e3e8f0] bg-white">
        <div className="container-shell flex h-18 items-center justify-between">
          <Brand />
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dfe5ef] px-4 text-sm font-bold"><ArrowLeft size={16} /> В кабинет</Link>
        </div>
      </header>
      <section className="container-shell max-w-5xl py-12 text-center sm:py-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-bold text-[#2563eb]"><LockKeyhole size={15} /> Разблокируй полный доступ</span>
        <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-extrabold tracking-[-.055em] sm:text-6xl lg:text-[64px]">Продолжи путь к своей цели</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#737d8e]">Получи полный доступ к персональному плану, AI-помощнику и всем инструментам подготовки.</p>
        <PremiumClient activeUntil={subscription ? new Intl.DateTimeFormat("ru-RU").format(subscription.currentEnd) : null} />
      </section>
    </main>
  );
}
