"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "Чем ENTGO отличается от других платформ подготовки к ЕНТ?",
    answer: (
      <>
        <p>
          ENTGO не даёт одинаковую программу всем ученикам. После диагностики система
          определяет твои слабые места, рассчитывает путь до выбранного университета и
          показывает, какие задания дадут максимальный прирост баллов именно тебе.
        </p>
        <p className="mt-4">
          Вместо вопроса «что учить?» ты каждый день получаешь конкретный следующий шаг.
        </p>
      </>
    ),
  },
  {
    question: "Насколько точен прогноз ENTGO?",
    answer: (
      <p>
        Прогноз строится на основе результатов диагностики, пробников и твоего прогресса
        в системе. Чем больше заданий ты решаешь, тем точнее становится прогноз.
      </p>
    ),
  },
  {
    question: "AI действительно анализирует мои ошибки?",
    answer: (
      <p>
        Да. AI не просто показывает правильный ответ. Он анализирует твои ошибки,
        объясняет решение, определяет слабые места и помогает понять, что мешает набрать
        больше баллов.
      </p>
    ),
  },
  {
    question: "Как получить награду по программе 130+?",
    answer: (
      <p>
        Если ты готовился в ENTGO и набрал 130+ на официальном ЕНТ, ты можешь отправить
        результат на проверку и принять участие в программе наград текущего сезона.
      </p>
    ),
  },
  {
    question: "Подойдёт ли ENTGO, если до ЕНТ осталось мало времени?",
    answer: (
      <p>
        Да. Система помогает определить темы с максимальным потенциалом роста и
        показывает самый быстрый путь к улучшению результата.
      </p>
    ),
  },
];

const advantages = [
  "Персональный план вместо общей программы",
  "Темы с максимальным приростом баллов",
  "Прогноз и отслеживание прогресса",
  "AI анализирует именно твои ошибки",
];

export function LandingFinalCta() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="landing-final-section bg-white pb-24 sm:pb-36">
      <div className="landing-shell">
        <div className="mx-auto h-px max-w-6xl bg-line" />

        <div className="mx-auto max-w-6xl pt-20 text-center sm:pt-24">
          <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-6xl lg:text-7xl">
            Твой путь к желаемому баллу начинается здесь
          </h2>
          <Link
            href="/onboarding"
            className="landing-final-button mt-12 inline-flex min-h-20 items-center justify-center gap-4 rounded-full bg-[#2563eb] px-9 py-5 text-lg font-semibold text-white shadow-[0_18px_45px_rgba(37,99,235,.25)] transition hover:-translate-y-1 hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb] sm:min-h-24 sm:px-14 sm:text-2xl"
          >
            Получить персональный план
            <ArrowRight className="size-6 shrink-0 sm:size-7" aria-hidden="true" />
          </Link>
        </div>

        <div className="my-24 h-px bg-line sm:my-32" />

        <div className="mx-auto max-w-5xl">
          <h3 className="text-center text-4xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-6xl lg:text-7xl">
            Часто задаваемые вопросы
          </h3>

          <div className="landing-faq mt-12 border-y border-line">
            {faqs.map((item, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={item.question}
                  className={`border-b border-line transition-colors last:border-b-0 ${
                    isOpen ? "text-[#2563eb]" : "text-ink"
                  }`}
                >
                  <button
                    type="button"
                    className="flex min-h-20 w-full items-center justify-between gap-6 py-6 text-left text-base font-semibold sm:min-h-24 sm:text-xl"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 border-[#2563eb] bg-[#2563eb] text-white"
                          : "border-line bg-white text-ink"
                      }`}
                    >
                      <ChevronDown size={20} aria-hidden="true" />
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${index}`}
                    className={`grid transition-[grid-template-rows,opacity] duration-400 ease-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="max-w-3xl pb-7 pr-14 text-sm leading-7 text-muted sm:pb-9 sm:text-base sm:leading-8">
                        {item.answer}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="landing-advantages mt-14 grid gap-3 sm:grid-cols-2">
            {advantages.map((advantage) => (
              <div
                key={advantage}
                className="flex min-h-16 items-center gap-3 rounded-xl border border-line bg-white px-5 py-4 text-sm font-semibold sm:text-base"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#2563eb]/8 text-[#2563eb]">
                  <Check size={17} strokeWidth={2.4} aria-hidden="true" />
                </span>
                {advantage}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
