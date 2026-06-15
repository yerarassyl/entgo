import { LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { PremiumClient } from "@/components/premium-client";
import { ProductHeader } from "@/components/product-header";
import { getSessionUser } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/subscription";

export default async function PremiumPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const subscription = await getActiveSubscription(user.id);

  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper pb-24 text-[#172033]">
      <ProductHeader />
      <section className="container-shell max-w-5xl py-12 text-center sm:py-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-bold text-[#2563eb]"><LockKeyhole size={15} /> Разблокируй полный доступ</span>
        <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-extrabold tracking-[-.055em] sm:text-6xl lg:text-[64px]">Продолжи путь к своей цели</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#737d8e]">Получи полный доступ к персональному плану, AI-помощнику и всем инструментам подготовки.</p>
        <PremiumClient activeUntil={subscription ? new Intl.DateTimeFormat("ru-RU").format(subscription.currentEnd) : null} />
      </section>
    </main>
  );
}
