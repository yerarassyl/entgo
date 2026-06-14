"use client";

import { ArrowRight, BookCheck, BrainCircuit, ListChecks, Repeat2 } from "lucide-react";
import Link from "next/link";

export function LessonActions({
  topicId,
  initiallyCompleted,
}: {
  topicId: string;
  initiallyCompleted: boolean;
}) {
  return (
    <div className="mt-7 space-y-3">
      <Link href={`/exam?topic=${topicId}`} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white"><BookCheck size={17} /> Проверить себя <ArrowRight size={16} /></Link>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        <Link href={`/exam?topic=${topicId}&mode=practice`} className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line text-xs font-semibold"><ListChecks size={16} /> Решить 5 задач</Link>
        <Link href={`/exam?topic=${topicId}&mode=mini-test`} className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line text-xs font-semibold"><BrainCircuit size={16} /> Пройти мини-тест</Link>
        <Link href={`/exam?topic=${topicId}&mode=repeat`} className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line text-xs font-semibold"><Repeat2 size={16} /> Закрепить тему</Link>
      </div>
      <p className="text-center text-[11px] leading-5 text-muted">{initiallyCompleted ? "Тема уже подтверждена проверкой." : "XP начисляется только после успешной проверки знаний."}</p>
    </div>
  );
}
