import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";

export function LegalPage({
  eyebrow,
  title,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
}) {
  return (
    <main className="min-h-screen bg-paper pb-16">
      <header className="border-b border-line bg-white">
        <div className="container-shell flex h-18 items-center justify-between"><Brand /><Link href="/" className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold"><ArrowLeft size={16} /> На главную</Link></div>
      </header>
      <article className="container-shell max-w-4xl py-10 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">{eyebrow}</p>
        <h1 className="display mt-4 max-w-full break-words text-[clamp(2.3rem,10vw,4.5rem)] leading-[.98]">{title}</h1>
        <p className="mt-4 text-sm text-muted">Последнее обновление: {updated}</p>
        <div className="mt-10 rounded-[28px] border border-line bg-white p-7 sm:p-10">
          <div className="space-y-9">
            {sections.map((section) => <section key={section.title}><h2 className="text-xl font-semibold">{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-7 text-muted">{paragraph}</p>)}</section>)}
          </div>
        </div>
      </article>
    </main>
  );
}
