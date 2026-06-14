"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Atom,
  BookOpen,
  BrainCircuit,
  Calculator,
  Check,
  CheckCircle2,
  ClockAlert,
  Dna,
  FlaskConical,
  Globe2,
  GraduationCap,
  Languages,
  Laptop,
  Leaf,
  Landmark,
  LockKeyhole,
  MapPin,
  Sparkles,
  Target,
  TrendingUp,
  University,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
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
    key: "subjects",
    title: "Какие 2 предмета ты сдаёшь?",
    subtitle: "Выбери два профильных предмета. ENTGO учтёт их при построении персонального плана.",
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

const subjectOptions = [
  { value: "Математика", icon: Calculator },
  { value: "Физика", icon: Atom },
  { value: "Информатика", icon: Laptop },
  { value: "Химия", icon: FlaskConical },
  { value: "Биология", icon: Dna },
  { value: "География", icon: Globe2 },
  { value: "Всемирная история", icon: Landmark },
  { value: "Иностранный язык", icon: Languages },
  { value: "Казахский язык", icon: BookOpen },
  { value: "Русский язык", icon: BookOpen },
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
  subjects,
}: {
  university: string;
  city: string;
  currentScore: number;
  targetScore: number;
  timeLeft?: string;
  subjects?: string[];
}) {
  const rows = [
    { icon: GraduationCap, label: "Университет", value: university },
    ...(subjects?.length ? [{ icon: BookOpen, label: "Предметы", value: subjects.join(" + ") }] : []),
    { icon: MapPin, label: "Город", value: city || "Не указан" },
    { icon: TrendingUp, label: "Сейчас", value: `${currentScore}` },
    { icon: Target, label: "Цель", value: `${targetScore}` },
    ...(timeLeft ? [{ icon: ClockAlert, label: "ЕНТ", value: timeLeft }] : []),
  ];

  return (
    <aside className="rounded-[24px] border border-white/10 bg-white/8 p-5 text-white">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-white/55">Твой маршрут</p>
      <div className="mt-5 space-y-4">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white"><Icon size={17} /></span>
            <div className="min-w-0">
              <p className="text-[11px] text-white/50">{label}</p>
              <p className="truncate text-sm font-bold text-white">{value}</p>
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
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
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
      subjects: selectedSubjects,
      time: ["30–45 минут"],
      method: ["Пока никак"],
    }));
  }

  function next() {
    if (current.key === "subjects" && selectedSubjects.length !== 2) return;
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
      <main className="grid min-h-screen place-items-center bg-[#eef3fb] p-4 sm:p-8">
        <section className="grid w-full max-w-[1080px] overflow-hidden rounded-[36px] bg-white shadow-[0_35px_100px_rgba(37,70,140,.13)] lg:grid-cols-[.82fr_1.18fr]">
          <div className="flex min-h-[360px] flex-col items-center justify-center bg-[#164fc9] p-8 text-center text-white sm:p-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[.12em]">
              <BrainCircuit size={16} /> ENTGO AI
            </span>
            <div className="relative mt-8 size-[132px]">
              <svg className="-rotate-90" width="132" height="132" viewBox="0 0 120 120" aria-label={`Анализ выполнен на ${Math.round(analysisProgress)} процентов`}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="7" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="white" strokeLinecap="round" strokeWidth="7" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - analysisProgress / 100)} />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-3xl font-extrabold">{Math.round(analysisProgress)}%</span>
            </div>
            <h1 className="mt-7 max-w-sm text-3xl font-extrabold leading-tight tracking-[-.04em] sm:text-4xl">Строим маршрут до твоей цели</h1>
            <p className="mt-3 text-sm leading-6 text-white/65">Сверяем цель, срок и профильные предметы.</p>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#2563eb]">Персональный анализ</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-.035em] text-[#172033] sm:text-3xl">Собираем всё в понятный план</h2>
            <div className="mt-8 space-y-3">
              {analysisStages.map((stage, index) => {
                const completed = index < analysisStep || analysisProgress === 100;
                const active = index === analysisStep && analysisProgress < 100;
                return (
                  <div key={stage} className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${completed ? "border-[#caead9] bg-[#f1fbf6] text-[#168a52]" : active ? "border-[#bcd1ff] bg-[#eef5ff] text-[#2563eb]" : "border-[#e7ebf2] text-[#a2a9b5]"}`}>
                    <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${completed ? "bg-[#168a52] text-white" : active ? "bg-[#2563eb] text-white" : "bg-[#f1f3f7]"}`}>
                      {completed ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-extrabold">{index + 1}</span>}
                    </span>
                    <span className="text-sm font-bold">{stage}</span>
                  </div>
                );
              })}
            </div>
            <div className={`mt-6 rounded-2xl bg-[#f7f9fc] p-4 transition-all duration-500 ${analysisProgress > 18 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
              <p className="text-xs font-semibold text-[#7b8495]">Учитываем</p>
              <p className="mt-2 text-sm font-bold text-[#172033]">{universityData.shortName} · {selectedSubjects.join(" + ")} · цель {targetScore}</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "route") {
    return (
      <main className="min-h-screen bg-[#eef3fb] p-3 sm:p-6">
        <section className="mx-auto max-w-[1440px] rounded-[34px] bg-white px-5 py-10 text-center shadow-[0_30px_90px_rgba(37,70,140,.1)] sm:px-10 sm:py-14">
          <span className="route-fade-up inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-bold text-[#2563eb]">
            <Sparkles size={15} /> Персональный анализ завершен
          </span>
          <div className="route-fade-up route-delay-1 relative mx-auto mt-7 max-w-5xl">
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-[-.055em] text-[#172033] sm:text-6xl lg:text-[64px]">Твой маршрут до гранта готов</h1>
            <div className="mt-6 flex justify-center lg:absolute lg:-right-4 lg:top-0 lg:mt-0">
              <div className="grid size-28 place-items-center rounded-full bg-[conic-gradient(#2563eb_var(--readiness),#dbe8ff_0)] p-[7px] shadow-[0_12px_35px_rgba(37,99,235,.14)]" style={{ "--readiness": `${readiness}%` } as CSSProperties}>
                <span className="grid size-full place-items-center rounded-full bg-white text-center">
                  <span><small className="block text-[10px] font-semibold text-[#7b8495]">Готовность</small><strong className="mt-1 block text-2xl">{readiness}%</strong></span>
                </span>
              </div>
            </div>
          </div>
          <p className="route-fade-up route-delay-2 mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#727b8b]">На основе твоей цели и текущего уровня мы сформировали персональный план подготовки.</p>

          <div className="route-fade-up route-delay-2 mx-auto mt-12 grid min-h-[220px] w-full max-w-[900px] overflow-hidden rounded-[28px] bg-[#164fc9] text-white sm:grid-cols-3">
            {[
              { icon: University, label: "Университет", value: universityData.shortName },
              { icon: TrendingUp, label: "Разрыв до цели", value: `${scoreGap} баллов` },
              { icon: BookOpen, label: "Приоритетные темы", value: `${priorityTopics} тем` },
            ].map(({ icon: Icon, label, value }, index) => (
              <div key={label} className={`flex min-h-[180px] flex-col items-center justify-center p-7 ${index > 0 ? "border-t border-white/15 sm:border-l sm:border-t-0" : ""}`}>
                <span className="grid size-12 place-items-center rounded-2xl bg-white/12 text-white"><Icon size={24} /></span>
                <p className="mt-4 text-xs font-semibold text-white/55">{label}</p>
                <strong className="mt-2 text-2xl text-white">{value}</strong>
              </div>
            ))}
          </div>

          <div className="route-fade-up route-delay-3 mx-auto mt-16 max-w-5xl text-left">
            <h2 className="text-center text-3xl font-extrabold tracking-[-.045em] text-[#172033] sm:text-4xl">Твой путь до цели</h2>
            <div className="relative mt-10 grid gap-4 md:grid-cols-4 md:gap-5">
              <div className="absolute left-[10%] right-[10%] top-8 hidden h-1 rounded-full bg-[#dce8ff] md:block" />
              {[
                { label: "Сейчас", value: currentScore, caption: "Текущий уровень" },
                { label: "Первый прогресс", value: firstMilestone, caption: "Закрыты первые пробелы" },
                { label: "Уверенный уровень", value: secondMilestone, caption: "Результат закреплён" },
                { label: "Цель", value: targetScore, caption: universityData.shortName },
              ].map((milestone, index) => (
                <article key={milestone.label} className="relative rounded-[22px] border border-[#dfe6f2] bg-[#fbfcff] p-5 text-center">
                  <span className="relative z-10 mx-auto grid size-16 place-items-center rounded-2xl border-[6px] border-[#dce8ff] bg-[#2563eb] text-lg font-extrabold text-white shadow-[0_8px_22px_rgba(37,99,235,.2)]">{index + 1}</span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[.1em] text-[#2563eb]">{milestone.label}</p>
                  <strong className="mt-2 block text-3xl tracking-[-.04em]">{milestone.value}</strong>
                  <small className="mt-2 block text-[#7b8495]">{milestone.caption}</small>
                </article>
              ))}
            </div>
            <div className="mx-auto mt-6 grid max-w-3xl gap-3 text-sm font-semibold sm:grid-cols-3">
              <span className="flex items-center gap-3 rounded-2xl bg-[#f7f9fc] p-4"><BookOpen className="text-[#2563eb]" size={18} />{priorityTopics} приоритетных тем</span>
              <span className="flex items-center gap-3 rounded-2xl bg-[#f7f9fc] p-4"><BrainCircuit className="text-[#2563eb]" size={18} />AI-анализ ошибок</span>
              <span className="flex items-center gap-3 rounded-2xl bg-[#f7f9fc] p-4"><TrendingUp className="text-[#2563eb]" size={18} />Персональный план</span>
            </div>
          </div>

          <div className="route-fade-up route-delay-3 mx-auto mt-14 max-w-5xl rounded-[30px] border border-[#d8e5ff] bg-[#f1f6ff] p-7 text-left sm:p-10">
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white text-[#2563eb]"><Target size={23} /></span><h2 className="text-2xl font-extrabold">Что даст максимальный результат</h2></div>
            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {topTopics.map((topic) => (
                <article key={topic.name} className="rounded-[22px] bg-white p-6">
                  <strong className="text-lg">{topic.name}</strong>
                  <span className="mt-5 block text-sm font-bold text-[#2563eb]">+{topic.growth} потенциальных баллов</span>
                </article>
              ))}
            </div>
          </div>

          <p className="route-fade-up route-delay-3 mt-8 text-center text-lg font-semibold text-[#172033]"><Sparkles className="mr-2 inline text-[#2563eb]" size={19} />Большая часть прироста будет достигнута за счет этих тем.</p>
          <button onClick={() => setPhase("plan")} className="route-fade-up route-delay-3 group mt-10 inline-flex h-16 w-full max-w-[340px] items-center justify-center gap-3 rounded-full bg-[#2563eb] px-7 font-bold text-white shadow-[0_15px_35px_rgba(37,99,235,.22)] hover:-translate-y-0.5 hover:bg-[#1d4ed8]">
            Посмотреть мой план <ArrowRight className="transition-transform group-hover:translate-x-1" size={19} />
          </button>
          <p className="mt-3 text-xs text-[#8b93a1]">Следующий шаг: персональный план подготовки</p>
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
      <main className="min-h-screen bg-[#eef3fb] p-3 sm:p-6">
        <section className="mx-auto max-w-[1440px] rounded-[34px] bg-white px-5 py-10 shadow-[0_30px_90px_rgba(37,70,140,.1)] sm:px-10 sm:py-14">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef5ff] px-4 py-2 text-sm font-bold text-[#2563eb]"><Sparkles size={15} /> Твой персональный план готов</span>
            <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-extrabold tracking-[-.05em] text-[#172033] sm:text-6xl">ENTGO уже построил маршрут до твоей цели</h1>
            <p className="mt-5 text-lg text-[#727b8b]">На основе выбранного университета, текущего уровня и срока подготовки.</p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <div className="relative overflow-hidden rounded-[30px] border border-[#dfe6f2] bg-[#fbfcff] p-6 sm:p-9">
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

            <aside className="rounded-[30px] bg-[#164fc9] p-7 text-white sm:p-9">
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
                <article key={topic.name} className="rounded-2xl border border-[#e2e7f0] bg-[#fbfcff] p-6">
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
  const isSubjects = current.key === "subjects";

  return (
    <main className="min-h-screen bg-[#eef3fb] p-3 text-[#172033] sm:p-6">
      <header className="mx-auto max-w-[1440px]">
        <div className="flex h-14 items-center justify-between px-2 sm:h-16">
          <Brand />
          <Link href="/" className="rounded-full px-4 py-2 text-sm font-semibold text-[#667083] hover:bg-white">Выйти</Link>
        </div>
      </header>

      <section className={`mx-auto max-w-[1440px] transition-all duration-500 ${leaving ? "-translate-y-3 opacity-0" : "translate-y-0 opacity-100"}`}>
        <div className="grid min-h-[calc(100vh-100px)] overflow-hidden rounded-[30px] bg-white shadow-[0_30px_90px_rgba(37,70,140,.1)] lg:grid-cols-[300px_1fr]">
          <aside className="hidden bg-[#164fc9] p-7 text-white lg:flex lg:flex-col">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.15em] text-white/55">Настройка маршрута</p>
              <strong className="mt-3 block text-3xl tracking-[-.04em]">{step + 1}<span className="text-white/35"> / {steps.length}</span></strong>
            </div>
            <div className="mt-8 space-y-2">
              {steps.map((item, index) => (
                <div key={item.key} className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors ${index === step ? "bg-white text-[#164fc9]" : index < step ? "text-white" : "text-white/45"}`}>
                  <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${index === step ? "bg-[#e8f0ff]" : index < step ? "bg-white/15" : "bg-white/8"}`}>
                    {index < step ? <Check size={14} strokeWidth={3} /> : index + 1}
                  </span>
                  <span className="truncate font-semibold">{item.key === "university" ? "Университет" : item.key === "subjects" ? "Предметы" : item.key === "city" ? "Город" : item.key === "current" ? "Текущий балл" : item.key === "target" ? "Цель" : "Срок"}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-7">
              <SummaryCard university={universityData.shortName} city={city} currentScore={currentScore} targetScore={targetScore} timeLeft={timeLeft || undefined} subjects={selectedSubjects} />
            </div>
          </aside>

          <div className="flex min-w-0 flex-col p-5 sm:p-8 lg:p-10 xl:p-12">
            <div className="lg:hidden">
              <div className="flex items-center justify-between text-xs font-bold text-[#7b8495]">
                <span>Шаг {step + 1} из {steps.length}</span>
                <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e4eaf4]">
                <div className="h-full rounded-full bg-[#2563eb] transition-all duration-700" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
              </div>
            </div>
            <div className="flex-1">
            <p className="hidden text-xs font-bold uppercase tracking-[.14em] text-[#2563eb] lg:block">Шаг {step + 1} из {steps.length}</p>
            <h1 className="mt-6 max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-5xl xl:text-[58px]">{current.title}</h1>
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

            {isSubjects && (
              <div className="mt-10">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#667083]">Выбрано {selectedSubjects.length} из 2</p>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedSubjects.length === 2 ? "bg-[#e9f2ff] text-[#2563eb]" : "bg-white text-[#8a93a3]"}`}>
                    {selectedSubjects.length === 2 ? "Можно продолжать" : "Нужно выбрать два"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                  {subjectOptions.map(({ value, icon: Icon }) => {
                    const selected = selectedSubjects.includes(value);
                    const unavailable = !selected && selectedSubjects.length === 2;
                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={unavailable}
                        onClick={() => setSelectedSubjects((subjects) => (
                          subjects.includes(value)
                            ? subjects.filter((subject) => subject !== value)
                            : [...subjects, value]
                        ))}
                        className={`relative flex min-h-[132px] flex-col items-center justify-center gap-3 rounded-2xl border p-4 text-center transition-all sm:min-h-[112px] sm:flex-row sm:justify-start sm:gap-4 sm:p-5 sm:text-left ${
                          selected
                            ? "border-[#2563eb] bg-[#2563eb] text-white shadow-[0_15px_35px_rgba(37,99,235,.2)]"
                            : "border-[#e1e6ef] bg-white hover:-translate-y-0.5 hover:border-[#aac3f8] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
                        }`}
                      >
                        <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${selected ? "bg-white/15" : "bg-[#eff5ff] text-[#2563eb]"}`}>
                          <Icon size={24} strokeWidth={1.8} />
                        </span>
                        <strong className={`text-sm leading-5 sm:pr-5 sm:text-base ${selected ? "text-white" : "text-[#172033]"}`}>{value}</strong>
                        {selected && <CheckCircle2 className="absolute right-4 top-4" size={19} />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-5 text-sm leading-6 text-[#7b8495]">
                  Обязательные предметы ЕНТ уже включены. Здесь нужны только два профильных предмета.
                </p>
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

            {isDeadline && timeLeft && (
              <div className="mt-7 max-w-[700px] rounded-[22px] bg-[#eef5ff] p-5 text-[#2457bb]">
                <div className="flex items-center gap-3"><Sparkles size={20} /><strong>Данных достаточно. Можно строить персональный маршрут.</strong></div>
              </div>
            )}

            <div className="mt-8 flex max-w-[760px] items-center justify-between border-t border-[#e6eaf1] pt-6">
              <button onClick={() => step > 0 ? setStep((value) => value - 1) : router.push("/")} className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-bold text-[#667083] hover:bg-[#f4f7fb]">
                <ArrowLeft size={17} /> Назад
              </button>
              <button onClick={next} disabled={(isSubjects && selectedSubjects.length !== 2) || (isDeadline && !timeLeft)} className="inline-flex min-h-14 items-center gap-3 rounded-full bg-[#2563eb] px-7 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,.2)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0">
                {isDeadline ? "Построить маршрут" : "Продолжить"} <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
