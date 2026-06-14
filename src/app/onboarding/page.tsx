"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ClockAlert,
  GraduationCap,
  Leaf,
  LockKeyhole,
  MapPin,
  Sparkles,
  Target,
  TrendingUp,
  University,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/brand";
import { universityCatalog } from "@/data/universities";

type Phase = "questions" | "analyzing" | "route" | "plan";

const steps = [
  {
    key: "university",
    title: "Куда хочешь поступить?",
    subtitle: "Выбери университет, к гранту которого хочешь построить маршрут.",
  },
  {
    key: "city",
    title: "В каком городе ты живёшь?",
    subtitle: "Это поможет учитывать доступный темп и формат подготовки.",
  },
  {
    key: "current",
    title: "Сколько баллов набираешь сейчас?",
    subtitle: "Укажи результат последнего пробника или примерную оценку.",
  },
  {
    key: "target",
    title: "Какой результат хочешь получить?",
    subtitle: "Выбери цель, к которой хочешь прийти на ЕНТ.",
  },
  {
    key: "date",
    title: "Когда ты планируешь сдавать ЕНТ?",
    subtitle: "Это поможет определить интенсивность подготовки.",
  },
] as const;

const cityOptions = ["Астана", "Алматы", "Шымкент", "Другой город"];

const timeOptions = [
  {
    value: "Меньше месяца",
    title: "Меньше месяца",
    description: "Понадобится интенсивная подготовка.",
    insight: "Составим интенсивный маршрут: ежедневные задания, быстрый разбор ошибок и фокус только на темах с максимальным приростом.",
    icon: ClockAlert,
  },
  {
    value: "1–3 месяца",
    title: "1–3 месяца",
    description: "Можно быстро закрыть основные пробелы.",
    insight: "Оптимальный темп — 5 учебных дней в неделю. Сначала закроем основные пробелы, затем закрепим результат пробниками.",
    icon: Zap,
  },
  {
    value: "3–6 месяцев",
    title: "3–6 месяцев",
    description: "Достаточно времени для стабильного роста.",
    insight: "Срок позволяет спокойно освоить слабые места, несколько раз проверить их на практике и снизить риск повторных ошибок.",
    icon: TrendingUp,
  },
  {
    value: "Больше 6 месяцев",
    title: "Более 6 месяцев",
    description: "Можно подготовиться максимально спокойно.",
    insight: "Построим плавный маршрут без перегрузки: фундамент, регулярное повторение и постепенный выход на экзаменационный темп.",
    icon: Leaf,
  },
];

const topTopics = [
  { name: "Производные", growth: 5, reason: "Высокая частота появления на ЕНТ" },
  { name: "Грамотность чтения", growth: 4, reason: "Самый быстрый источник дополнительных баллов" },
  { name: "Теория вероятности", growth: 3, reason: "Часто вызывает ошибки" },
];

function SummaryCard({
  university,
  city,
  currentScore,
  targetScore,
  timeLeft,
}: {
  university: string;
  city: string;
  currentScore: number;
  targetScore: number;
  timeLeft?: string;
}) {
  const rows = [
    { icon: GraduationCap, label: "Университет", value: university },
    { icon: MapPin, label: "Город", value: city || "Не указан" },
    { icon: TrendingUp, label: "Сейчас", value: `${currentScore}` },
    { icon: Target, label: "Цель", value: `${targetScore}` },
    ...(timeLeft ? [{ icon: ClockAlert, label: "ЕНТ", value: timeLeft }] : []),
  ];

  return (
    <aside className="rounded-[28px] border border-[#dfe6f4] bg-white p-6 shadow-[0_24px_70px_rgba(31,64,130,.07)]">
      <p className="text-sm font-bold text-[#172033]">Что уже известно</p>
      <div className="mt-5 space-y-4">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eff5ff] text-[#2563eb]"><Icon size={17} /></span>
            <div className="min-w-0">
              <p className="text-xs text-[#7b8495]">{label}</p>
              <p className="truncate text-sm font-bold text-[#172033]">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("questions");
  const [university, setUniversity] = useState("mnu");
  const [city, setCity] = useState("Астана");
  const [currentScore, setCurrentScore] = useState(90);
  const [targetScore, setTargetScore] = useState(125);
  const [displayScore, setDisplayScore] = useState(125);
  const [timeLeft, setTimeLeft] = useState("");
  const [targetSettled, setTargetSettled] = useState(true);
  const [showRouteHint, setShowRouteHint] = useState(true);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const current = steps[step];
  const universityData = universityCatalog.find((item) => item.slug === university) ?? universityCatalog[0];
  const scoreGap = Math.max(0, targetScore - currentScore);
  const priorityTopics = Math.max(8, Math.ceil(scoreGap / 2));
  const readiness = Math.min(92, Math.max(48, 100 - Math.round(scoreGap * 0.8)));
  const currentScoreProgress = ((currentScore - 20) / 120) * 100;
  const targetScoreProgress = ((targetScore - 20) / 120) * 100;
  const selectedTimeOption = timeOptions.find((option) => option.value === timeLeft);
  const firstMilestone = Math.round(currentScore + scoreGap / 3);
  const secondMilestone = Math.round(currentScore + (scoreGap * 2) / 3);

  const analysisStages = useMemo(() => [
    "Определяем проходной балл",
    "Анализируем цель",
    "Рассчитываем разрыв",
    "Подбираем темы",
    "Формируем персональный план",
  ], []);

  useEffect(() => {
    if (displayScore === targetScore) return;
    const difference = targetScore - displayScore;
    const timer = window.setTimeout(
      () => setDisplayScore((value) => value + Math.sign(difference)),
      Math.max(12, 90 / Math.abs(difference)),
    );
    return () => window.clearTimeout(timer);
  }, [displayScore, targetScore]);

  useEffect(() => {
    if (current.key !== "target") return;
    const badge = window.setTimeout(() => setTargetSettled(true), 400);
    const hint = window.setTimeout(() => setShowRouteHint(true), 800);
    return () => {
      window.clearTimeout(badge);
      window.clearTimeout(hint);
    };
  }, [current.key, targetScore]);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const startedAt = performance.now();
    const duration = 5_200;
    let frame = 0;
    const draw = (now: number) => {
      const progress = Math.min(100, ((now - startedAt) / duration) * 100);
      setAnalysisProgress(progress);
      setAnalysisStep(Math.min(analysisStages.length - 1, Math.floor(progress / 20)));
      if (progress < 100) frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    const next = window.setTimeout(() => setPhase("route"), duration + 800);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(next);
    };
  }, [analysisStages.length, phase]);

  function saveAnswers() {
    const compatibleDate =
      timeLeft === "Меньше месяца"
        ? "Меньше месяца"
        : timeLeft === "1–3 месяца"
          ? "1–2 месяца"
          : timeLeft === "3–6 месяцев"
            ? "2–4 месяца"
            : "Больше 4 месяцев";
    localStorage.setItem("entgo-onboarding", JSON.stringify({
      score: targetScore,
      currentScore,
      desiredUniversitySlug: university,
      city,
      date: [compatibleDate],
      subjects: [],
      time: ["30–45 минут"],
      method: ["Пока никак"],
    }));
  }

  function next() {
    if (current.key === "date" && !timeLeft) return;
    if (step < steps.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    saveAnswers();
    setLeaving(true);
    window.setTimeout(() => {
      setLeaving(false);
      setPhase("analyzing");
    }, 520);
  }

  if (phase === "analyzing") {
    const circumference = 2 * Math.PI * 52;
    return (
      <main className="grid min-h-screen place-items-center bg-white px-5 py-10">
        <section className="w-full max-w-[760px] rounded-[32px] bg-white p-7 text-center shadow-[0_28px_100px_rgba(24,50,100,.12)] sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-bold text-[#2563eb]">
            <BrainCircuit size={16} /> ENTGO AI
          </span>
          <div className="relative mx-auto mt-8 size-[120px]">
            <svg className="-rotate-90" width="120" height="120" viewBox="0 0 120 120" aria-label={`Анализ выполнен на ${Math.round(analysisProgress)} процентов`}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e8edf6" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#2563eb"
                strokeLinecap="round"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - analysisProgress / 100)}
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-3xl font-extrabold text-[#172033]">AI</span>
          </div>
          <h1 className="mt-7 text-3xl font-extrabold tracking-[-.04em] text-[#172033] sm:text-[40px]">
            Создаем твой персональный план
          </h1>
          <p className="mt-3 text-lg text-[#727b8b]">Это займет всего несколько секунд.</p>

          <div className="mx-auto mt-9 grid max-w-2xl gap-7 text-left sm:grid-cols-2">
            <div className="space-y-3">
              {analysisStages.map((stage, index) => {
                const completed = index < analysisStep || analysisProgress === 100;
                const active = index === analysisStep && analysisProgress < 100;
                return (
                  <div key={stage} className={`flex items-center gap-3 text-sm font-semibold transition-colors ${completed ? "text-[#168a52]" : active ? "text-[#2563eb]" : "text-[#a2a9b5]"}`}>
                    <span className={`grid size-6 place-items-center rounded-full border ${completed ? "border-[#168a52] bg-[#e9f8f0]" : active ? "border-[#2563eb] bg-[#eef5ff]" : "border-[#d9dee7]"}`}>
                      {completed ? <Check size={14} strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
                    </span>
                    {stage}
                  </div>
                );
              })}
            </div>
            <div className="space-y-3 rounded-2xl bg-[#f7f9fc] p-5">
              {[
                `Университет: ${universityData.shortName}`,
                `Цель: ${targetScore} баллов`,
                `Текущий уровень: ${currentScore}`,
                `Срок: ${timeLeft.toLowerCase()}`,
              ].map((item, index) => (
                <div key={item} className={`flex items-center gap-2 text-sm font-semibold transition-all duration-500 ${analysisProgress >= (index + 1) * 20 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
                  <CheckCircle2 className="text-[#2563eb]" size={16} /> {item}
                </div>
              ))}
            </div>
          </div>

          <div className={`mt-8 transition-all duration-500 ${analysisProgress === 100 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
            <p className="text-lg font-bold text-[#168a52]">План готов</p>
            <p className="mt-1 text-sm text-[#727b8b]">Мы нашли оптимальный маршрут подготовки к выбранной цели.</p>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "route") {
    return (
      <main className="min-h-screen bg-white px-5 py-8 lg:h-[100svh] lg:overflow-hidden lg:py-5">
        <section className="mx-auto flex h-full max-w-6xl flex-col text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-bold text-[#2563eb]">
            <Sparkles size={15} /> Персональный анализ завершен
          </span>
          <div className="relative mx-auto mt-4 max-w-4xl">
            <h1 className="text-4xl font-extrabold tracking-[-.055em] text-[#172033] sm:text-5xl lg:text-[48px]">Твой маршрут до гранта готов</h1>
            <div className="mt-4 flex justify-center sm:absolute sm:-right-24 sm:-top-2 sm:mt-0">
              <div className="grid size-20 place-items-center rounded-full border-[6px] border-[#dbe8ff] border-t-[#2563eb] bg-white text-center shadow-sm">
                <span><strong className="block text-xl">{readiness}%</strong><small className="text-[9px] text-[#727b8b]">готовность</small></span>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-3 max-w-2xl text-base text-[#727b8b]">На основе твоей цели и текущего уровня мы сформировали персональный план подготовки.</p>

          <div className="mt-6 grid flex-1 gap-5 text-left lg:min-h-0 lg:grid-cols-[.95fr_1.05fr]">
            <div className="flex flex-col gap-5">
              <div className="grid overflow-hidden rounded-[24px] border border-[#e2e7f0] bg-white shadow-[0_18px_55px_rgba(24,50,100,.07)] sm:grid-cols-3">
                {[
                  { icon: University, label: "Университет", value: universityData.shortName },
                  { icon: TrendingUp, label: "Разрыв до цели", value: `${scoreGap} баллов` },
                  { icon: BookOpen, label: "Приоритетные темы", value: `${priorityTopics} тем` },
                ].map(({ icon: Icon, label, value }, index) => (
                  <div key={label} className={`p-5 text-center ${index > 0 ? "border-t border-[#e2e7f0] sm:border-l sm:border-t-0" : ""}`}>
                    <Icon className="mx-auto text-[#2563eb]" size={22} />
                    <p className="mt-2 text-[11px] text-[#7b8495]">{label}</p>
                    <strong className="mt-1 block text-lg text-[#172033]">{value}</strong>
                  </div>
                ))}
              </div>

              <div className="flex-1 rounded-[24px] border border-[#e2e7f0] p-6">
                <h2 className="text-2xl font-extrabold tracking-[-.04em] text-[#172033]">Твой путь до цели</h2>
                <div className="relative mt-7 grid grid-cols-4">
                  <div className="absolute left-[12.5%] right-[12.5%] top-2.5 h-1 bg-[#dce8ff]" />
                  {[
                    ["Сейчас", currentScore],
                    ["Первый прогресс", firstMilestone],
                    ["Уверенный уровень", secondMilestone],
                    ["Цель", targetScore],
                  ].map(([label, value]) => (
                    <div key={label} className="relative text-center">
                      <span className="mx-auto block size-6 rounded-full border-[6px] border-[#dce8ff] bg-[#2563eb]" />
                      <p className="mt-3 text-[10px] leading-4 text-[#7b8495]">{label}</p>
                      <strong className="mt-1 block text-lg text-[#172033]">{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="mt-7 grid gap-2 text-xs font-semibold sm:grid-cols-3">
                  <span className="rounded-xl bg-[#f7f9fc] p-3"><BookOpen className="mb-1.5 text-[#2563eb]" size={16} />{priorityTopics} тем</span>
                  <span className="rounded-xl bg-[#f7f9fc] p-3"><BrainCircuit className="mb-1.5 text-[#2563eb]" size={16} />AI-анализ</span>
                  <span className="rounded-xl bg-[#f7f9fc] p-3"><TrendingUp className="mb-1.5 text-[#2563eb]" size={16} />Личный план</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-[24px] bg-[#eef5ff] p-6">
              <div className="flex items-center gap-3"><Target className="text-[#2563eb]" /><h2 className="text-xl font-extrabold">Что даст максимальный результат</h2></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {topTopics.map((topic) => (
                  <div key={topic.name} className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4">
                    <strong>{topic.name}</strong>
                    <span className="shrink-0 text-sm font-bold text-[#2563eb]">+{topic.growth} баллов</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-sm font-semibold leading-6 text-[#172033]">Большая часть прироста будет достигнута за счет этих тем.</p>
              <button onClick={() => setPhase("plan")} className="group mt-auto inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-[#2563eb] px-7 font-bold text-white hover:bg-[#1d4ed8]">
                Посмотреть мой план <ArrowRight className="transition-transform group-hover:translate-x-1" size={19} />
              </button>
              <p className="mt-2 text-center text-[11px] text-[#8b93a1]">Следующий шаг: персональный план подготовки</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "plan") {
    const weeks = [
      ["Функции", "Тригонометрия", "Грамотность чтения"],
      ["Производные", "Анализ текста", "Геометрия"],
    ];
    return (
      <main className="min-h-screen bg-white px-5 py-12 sm:py-16">
        <section className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-bold text-[#2563eb]"><Sparkles size={15} /> Твой персональный план готов</span>
            <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-extrabold tracking-[-.05em] text-[#172033] sm:text-6xl">ENTGO уже построил маршрут до твоей цели</h1>
            <p className="mt-5 text-lg text-[#727b8b]">На основе выбранного университета, текущего уровня и срока подготовки.</p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <div className="relative overflow-hidden rounded-[30px] border border-[#e2e7f0] bg-white p-6 shadow-[0_24px_80px_rgba(24,50,100,.08)] sm:p-9">
              <div className="absolute bottom-0 left-0 right-0 z-10 h-40 bg-gradient-to-t from-white via-white/90 to-transparent" />
              <div className="space-y-7">
                {weeks.map((topics, index) => (
                  <div key={index} className="relative border-l-2 border-[#2563eb] pl-7">
                    <span className="absolute -left-[7px] top-0 size-3 rounded-full bg-[#2563eb]" />
                    <p className="text-sm font-extrabold text-[#2563eb]">Неделя {index + 1}</p>
                    <div className="mt-3 space-y-2">
                      {topics.map((topic) => <p key={topic} className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="text-[#168a52]" size={16} /> {topic}</p>)}
                    </div>
                  </div>
                ))}
                {[3, 4, 5].map((week) => (
                  <div key={week} className="relative border-l-2 border-[#dfe4ec] pl-7 opacity-60">
                    <span className="absolute -left-[7px] top-0 size-3 rounded-full bg-[#dfe4ec]" />
                    <p className="text-sm font-extrabold">Неделя {week}</p>
                    <p className="mt-3 flex items-center gap-2 text-sm text-[#727b8b]"><LockKeyhole size={15} /> Заблокировано</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-[30px] bg-[#10234d] p-7 text-white sm:p-9">
              <h2 className="text-2xl font-extrabold">Что входит в твой план</h2>
              <div className="mt-7 space-y-5">
                {[
                  [Target, "Ежедневные задачи"],
                  [BookOpen, "Приоритетные темы"],
                  [TrendingUp, "Отслеживание прогресса"],
                  [BrainCircuit, "AI объяснение ошибок"],
                  [GraduationCap, "Подготовка до цели"],
                ].map(([Icon, label], index) => {
                  const ItemIcon = Icon as typeof Target;
                  return (
                    <div key={label as string} className="flex items-center gap-3" style={{ animationDelay: `${index * 100}ms` }}>
                      <span className="grid size-10 place-items-center rounded-xl bg-white/10"><ItemIcon size={18} /></span>
                      <span className="text-sm font-semibold">{label as string}</span>
                    </div>
                  );
                })}
              </div>
            </aside>
          </div>

          <div className="mt-12">
            <h2 className="text-3xl font-extrabold tracking-[-.04em]">Почему именно эти темы?</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {topTopics.map((topic) => (
                <article key={topic.name} className="rounded-2xl border border-[#e2e7f0] p-6">
                  <strong className="text-lg">{topic.name}</strong>
                  <p className="mt-3 text-sm leading-6 text-[#727b8b]">{topic.reason}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-[30px] bg-[#2563eb] p-8 text-center text-white sm:p-11">
            <Target className="mx-auto" size={30} />
            <h2 className="mx-auto mt-5 max-w-3xl text-2xl font-extrabold sm:text-4xl">Для достижения цели {targetScore} баллов система определила {priorityTopics} ключевых тем.</h2>
            <p className="mt-4 text-white/75">Из них 6 тем имеют максимальное влияние на результат.</p>
          </div>

          <h2 className="mx-auto mt-16 max-w-4xl text-center text-3xl font-extrabold tracking-[-.045em] sm:text-5xl">
            Большинство учеников учат всё подряд.<br />Твой план показывает только то, что приближает к цели.
          </h2>
          <div className="text-center">
            <button onClick={() => router.push("/register")} className="group mt-10 inline-flex h-16 w-full max-w-[380px] items-center justify-center gap-3 rounded-full bg-[#2563eb] px-7 font-bold text-white hover:bg-[#1d4ed8]">
              Разблокировать полный план <ArrowRight className="transition-transform group-hover:translate-x-1" size={19} />
            </button>
          </div>
        </section>
      </main>
    );
  }

  const isGoal = current.key === "target";
  const isDeadline = current.key === "date";

  return (
    <main className="min-h-screen bg-[#f8faff] text-[#172033]">
      <header className="border-b border-[#e3e8f0] bg-white">
        <div className="container-shell flex h-18 items-center justify-between">
          <Brand />
          <Link href="/" className="text-sm font-semibold text-[#727b8b] hover:text-[#172033]">Выйти</Link>
        </div>
      </header>

      <div className="h-1 bg-[#e5eaf3]">
        <div className="h-full bg-[#2563eb] transition-all duration-700" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      <section className={`container-shell py-8 transition-all duration-500 sm:py-12 ${leaving ? "-translate-y-4 opacity-0" : "translate-y-0 opacity-100"}`}>
        <div className={`grid gap-8 ${isGoal || isDeadline ? "lg:grid-cols-[1fr_280px]" : ""}`}>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#8a93a3]">Шаг {step + 1} из {steps.length}</p>
            <h1 className="mt-7 max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-6xl lg:text-[56px]">{current.title}</h1>
            <p className="mt-4 text-lg text-[#727b8b]">{current.subtitle}</p>

            {current.key === "university" && (
              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {universityCatalog.map((item) => {
                  const selected = university === item.slug;
                  return (
                    <button key={item.slug} onClick={() => { setUniversity(item.slug); setCity(item.city); }} className={`relative flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${selected ? "border-[#2563eb] bg-[#2563eb] text-white shadow-[0_15px_35px_rgba(37,99,235,.2)]" : "border-[#e1e6ef] bg-white hover:border-[#aac3f8]"}`}>
                      <span className={`grid h-14 w-16 shrink-0 place-items-center overflow-hidden rounded-xl p-1.5 ${selected ? "bg-white" : "bg-[#f7f9fc] ring-1 ring-[#e6eaf1]"}`}>
                        <Image
                          src={item.logoPath}
                          alt={`Логотип ${item.shortName}`}
                          width={96}
                          height={56}
                          className="h-full w-full object-contain"
                        />
                      </span>
                      <span><strong className="block">{item.shortName}</strong><small className={selected ? "text-white/75" : "text-[#7b8495]"}>{item.city} · грант от {item.grantScore}</small></span>
                      {selected && <CheckCircle2 className="absolute right-3 top-3" size={18} />}
                    </button>
                  );
                })}
              </div>
            )}

            {current.key === "city" && (
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {cityOptions.map((option) => {
                  const selected = city === option;
                  return (
                    <button key={option} onClick={() => setCity(option)} className={`flex min-h-24 items-center justify-between rounded-2xl border px-6 text-left text-lg font-bold transition-all ${selected ? "border-[#2563eb] bg-[#2563eb] text-white" : "border-[#e1e6ef] bg-white hover:border-[#aac3f8]"}`}>
                      <span className="flex items-center gap-3"><MapPin size={21} /> {option}</span>
                      {selected && <CheckCircle2 size={20} />}
                    </button>
                  );
                })}
              </div>
            )}

            {current.key === "current" && (
              <div className="mt-10 max-w-[700px] rounded-[32px] border border-[#e1e6ef] bg-white p-7 text-center shadow-[0_24px_80px_rgba(24,50,100,.08)] sm:p-10">
                <p className="text-sm text-[#7b8495]">Текущий результат</p>
                <strong className="mt-4 block text-[88px] font-extrabold leading-none tracking-[-.07em] sm:text-[110px]">{currentScore}</strong>
                <input
                  aria-label="Текущий балл"
                  type="range"
                  min="20"
                  max="140"
                  value={currentScore}
                  onChange={(event) => setCurrentScore(Number(event.target.value))}
                  className="entgo-range mt-12 w-full"
                  style={{ background: `linear-gradient(90deg, #2563eb 0 ${currentScoreProgress}%, #dfe6f2 ${currentScoreProgress}% 100%)` }}
                />
                <div className="mt-4 flex justify-between text-sm text-[#8a93a3]"><span>20</span><span>140</span></div>
              </div>
            )}

            {isGoal && (
              <>
                <div className="mt-10 max-w-[700px] rounded-[32px] border border-[#e1e6ef] bg-white p-7 text-center shadow-[0_24px_80px_rgba(24,50,100,.09)] sm:min-h-[360px] sm:p-10">
                  <strong className="block text-[92px] font-extrabold leading-none tracking-[-.075em] sm:text-[110px]">{displayScore}</strong>
                  <p className="mt-3 text-sm text-[#7b8495]">Целевой результат</p>
                  <div className="mt-7 flex min-h-9 flex-wrap justify-center gap-2">
                    <span className={`inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2 text-sm font-bold text-white transition-all duration-300 ${targetSettled ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}><Target size={15} /> Цель зафиксирована</span>
                  </div>
                  <div className="mx-auto mt-6 grid max-w-md grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3 rounded-2xl bg-[#f7f9fc] p-4">
                    <span><small className="block text-[#8a93a3]">Сейчас</small><strong className="text-xl">{currentScore}</strong></span>
                    <ArrowDown className="-rotate-90 text-[#9ca4b1]" size={18} />
                    <span><small className="block text-[#8a93a3]">Цель</small><strong className="text-xl">{targetScore}</strong></span>
                    <ArrowDown className="-rotate-90 text-[#9ca4b1]" size={18} />
                    <span><small className="block text-[#8a93a3]">Разрыв</small><strong className="text-xl text-[#2563eb]">{scoreGap}</strong></span>
                  </div>
                </div>
                <div className="mt-8 max-w-[700px]">
                  <input
                    aria-label="Целевой результат"
                    type="range"
                    min="20"
                    max="140"
                    value={targetScore}
                    onChange={(event) => {
                      setTargetSettled(false);
                      setShowRouteHint(false);
                      setTargetScore(Math.max(currentScore, Number(event.target.value)));
                    }}
                    className="entgo-range w-full"
                    style={{ background: `linear-gradient(90deg, #2563eb 0 ${targetScoreProgress}%, #dfe6f2 ${targetScoreProgress}% 100%)` }}
                  />
                  <div className="mt-4 flex justify-between text-sm text-[#8a93a3]"><span>20</span><span>140</span></div>
                  <p className={`mt-7 text-center text-base font-semibold text-[#2563eb] transition-all duration-500 ${showRouteHint ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
                    Теперь мы можем построить персональный маршрут до выбранного результата.
                  </p>
                </div>
              </>
            )}

            {isDeadline && (
              <>
                <div className="mt-10 grid max-w-[700px] gap-5 sm:grid-cols-2">
                  {timeOptions.map(({ value, title, description, icon: Icon }) => {
                    const selected = timeLeft === value;
                    return (
                      <button key={value} onClick={() => setTimeLeft(value)} className={`relative flex min-h-[170px] flex-col items-center justify-center rounded-[24px] border p-6 text-center transition-all duration-200 ${selected ? "scale-[1.02] border-[#2563eb] bg-[#2563eb] text-white shadow-[0_18px_40px_rgba(37,99,235,.24)]" : "border-[#e1e6ef] bg-white shadow-[0_12px_35px_rgba(24,50,100,.05)] hover:-translate-y-1"}`}>
                        {selected && <CheckCircle2 className="absolute right-4 top-4" size={21} />}
                        <Icon size={38} strokeWidth={1.7} />
                        <strong className="mt-4 text-xl">{title}</strong>
                        <span className={`mt-2 text-sm leading-5 ${selected ? "text-white/75" : "text-[#7b8495]"}`}>{description}</span>
                      </button>
                    );
                  })}
                </div>
                {timeLeft && (
                  <div className="mt-6 max-w-[700px] rounded-2xl bg-[#eef5ff] p-5 text-sm leading-6 text-[#2457bb]">
                    <strong className="flex items-center gap-2"><BrainCircuit size={17} /> AI Insight</strong>
                    <p className="mt-2">{selectedTimeOption?.insight}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {(isGoal || isDeadline) && (
            <div className="hidden lg:block">
              <SummaryCard university={universityData.shortName} city={city} currentScore={currentScore} targetScore={targetScore} timeLeft={isDeadline ? timeLeft : undefined} />
            </div>
          )}
        </div>

        {isDeadline && timeLeft && (
          <div className="mt-8 max-w-[700px] rounded-[24px] bg-[#2563eb] p-6 text-white">
            <div className="flex items-center gap-3"><Sparkles size={21} /><strong>Отлично. У нас достаточно данных для построения персонального плана.</strong></div>
          </div>
        )}

        <div className="mt-10 flex max-w-[700px] items-center justify-between border-t border-[#e1e6ef] pt-6">
          <button onClick={() => step > 0 ? setStep((value) => value - 1) : router.push("/")} className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-bold text-[#667083] hover:bg-white">
            <ArrowLeft size={17} /> Назад
          </button>
          <button onClick={next} disabled={isDeadline && !timeLeft} className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[#2563eb] px-7 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,.2)] disabled:cursor-not-allowed disabled:opacity-35">
            {isDeadline ? "Построить мой план" : "Продолжить"} <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </main>
  );
}
