"use client";

import { Bell, Check, GraduationCap, Headphones, KeyRound, LogOut, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ProductHeader } from "@/components/product-header";

const ENT_SUBJECT_PAIRS = [
  { label: "Математика + Физика (Инженерия / IT / Технические науки)", subjects: ["Математика", "Физика"] },
  { label: "Математика + Информатика (IT / Программирование / Data Science)", subjects: ["Математика", "Информатика"] },
  { label: "Биология + Химия (Медицина / Стоматология / Фармация)", subjects: ["Биология", "Химия"] },
  { label: "Биология + География (Экология / Агрономия / Биотехнология)", subjects: ["Биология", "География"] },
  { label: "География + Математика (Экономика / Финансы / Менеджмент)", subjects: ["География", "Математика"] },
  { label: "Всемирная история + География (Международные отношения / Туризм)", subjects: ["Всемирная история", "География"] },
  { label: "Всемирная история + Основы права (Юриспруденция / Право)", subjects: ["Всемирная история", "Основы права"] },
  { label: "Иностранный язык + Всемирная история (Лингвистика / Международные отношения)", subjects: ["Иностранный язык", "Всемирная история"] },
  { label: "Казахский / Русский язык + Литература (Филология / Педагогика)", subjects: ["Казахский язык", "Казахская литература"] },
  { label: "Химия + Физика (Химическая инженерия)", subjects: ["Химия", "Физика"] },
  { label: "Творческий экзамен (Дизайн / Архитектура / Искусство)", subjects: ["Творческий экзамен"] },
];

type UniversityOption = { id: string; name: string; shortName: string; grantScore: number };

type SettingsData = {
  name: string;
  email: string;
  city: string;
  school: string;
  targetScore: number;
  dailyMinutes: number;
  examDate: string;
  locale: "RU" | "KK";
  desiredUniversityId: string;
  profileSubjects: string[];
  emailReminders: boolean;
  weeklySummary: boolean;
  studyReminderAt: string;
};

export function SettingsClient({
  initial,
  universities = [],
}: {
  initial: SettingsData;
  universities?: UniversityOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [mobileTab, setMobileTab] = useState<"profile" | "subjects" | "reminders" | "security">("profile");

  const initialSubjectsKey = initial.profileSubjects.join(" + ");
  const [selectedPair, setSelectedPair] = useState<string>(() => {
    const found = ENT_SUBJECT_PAIRS.find((p) => p.subjects.join(" + ") === initialSubjectsKey);
    return found ? found.subjects.join(" + ") : ENT_SUBJECT_PAIRS[0].subjects.join(" + ");
  });

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    setMessage("");

    const pairObj = ENT_SUBJECT_PAIRS.find((p) => p.subjects.join(" + ") === selectedPair);
    const profileSubjects = pairObj ? pairObj.subjects : initial.profileSubjects;

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          city: String(form.get("city") ?? "") || null,
          school: String(form.get("school") ?? "") || null,
          targetScore: Number(form.get("targetScore")),
          dailyMinutes: Number(form.get("dailyMinutes")),
          examDate: String(form.get("examDate") ?? "") || null,
          locale: form.get("locale"),
          desiredUniversityId: String(form.get("desiredUniversityId") ?? "") || null,
          profileSubjects,
          emailReminders: form.get("emailReminders") === "on",
          weeklySummary: form.get("weeklySummary") === "on",
          studyReminderAt: form.get("studyReminderAt"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Не удалось сохранить.");
      setMessage("Настройки сохранены.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPasswordError("");
    setPasswordMessage("");
    const response = await fetch("/api/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setPasswordError(result.error ?? "Не удалось сменить пароль.");
      return;
    }
    formElement.reset();
    setPasswordMessage("Пароль изменён. Войдите заново.");
    window.setTimeout(() => router.push("/login"), 900);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <main className="mobile-app-page product-v2 min-h-screen bg-paper pb-24">
      <ProductHeader />

      <div className="container-shell py-10 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-muted">Аккаунт</p>
        <h1 className="display mt-4 text-5xl sm:text-7xl">
          Настрой подготовку <span className="italic">под себя.</span>
        </h1>

        {/* Mobile Tabs */}
        <div className="mt-6 grid grid-cols-4 rounded-2xl bg-white p-1 sm:hidden">
          {[
            ["profile", "Профиль"],
            ["subjects", "Предметы"],
            ["reminders", "Напом."],
            ["security", "Пароль"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMobileTab(value as typeof mobileTab)}
              className={`min-h-11 rounded-xl px-1 text-[11px] font-bold ${
                mobileTab === value ? "bg-ink text-white" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form
          onSubmit={saveProfile}
          className={`mt-5 grid gap-5 sm:mt-10 xl:grid-cols-[1fr_.72fr] ${
            mobileTab === "security" ? "hidden sm:grid" : ""
          }`}
        >
          {/* Main Profile Section */}
          <section
            className={`${
              mobileTab === "profile" || mobileTab === "subjects" ? "block" : "hidden"
            } rounded-[26px] border border-line bg-white p-6 sm:block sm:p-8`}
          >
            <div className="flex items-center gap-3">
              <UserRound size={20} />
              <h2 className="text-lg font-semibold">Профиль и цель</h2>
            </div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Имя</span>
                <input
                  name="name"
                  defaultValue={initial.name}
                  required
                  minLength={2}
                  maxLength={80}
                  className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Email</span>
                <input
                  value={initial.email}
                  disabled
                  className="h-13 w-full rounded-xl border border-line bg-paper px-4 text-sm text-muted"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Город</span>
                <input
                  name="city"
                  defaultValue={initial.city}
                  maxLength={80}
                  className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Школа</span>
                <input
                  name="school"
                  defaultValue={initial.school}
                  maxLength={120}
                  className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink"
                />
              </label>

              {/* Subject Pair Selection */}
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Комбинация профильных предметов ЕНТ</span>
                <select
                  value={selectedPair}
                  onChange={(e) => setSelectedPair(e.target.value)}
                  className="h-13 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink"
                >
                  {ENT_SUBJECT_PAIRS.map((pair) => (
                    <option key={pair.label} value={pair.subjects.join(" + ")}>
                      {pair.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Target University Selection */}
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Целевой университет Казахстана</span>
                <select
                  name="desiredUniversityId"
                  defaultValue={initial.desiredUniversityId}
                  className="h-13 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink"
                >
                  <option value="">Не выбран (общий расчет)</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.shortName} — {uni.name} (грант от {uni.grantScore} б.)
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Целевой балл</span>
                <input
                  name="targetScore"
                  type="number"
                  min={60}
                  max={140}
                  defaultValue={initial.targetScore}
                  className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Минут в день</span>
                <input
                  name="dailyMinutes"
                  type="number"
                  min={15}
                  max={240}
                  step={5}
                  defaultValue={initial.dailyMinutes}
                  className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Дата ЕНТ</span>
                <input
                  name="examDate"
                  type="date"
                  defaultValue={initial.examDate}
                  className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Язык интерфейса</span>
                <select
                  name="locale"
                  defaultValue={initial.locale}
                  className="h-13 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-ink"
                >
                  <option value="RU">Русский</option>
                  <option value="KK">Қазақша</option>
                </select>
              </label>
            </div>
          </section>

          {/* Reminders Section */}
          <section
            className={`${
              mobileTab === "reminders" ? "block" : "hidden"
            } rounded-[26px] border border-line bg-white p-6 sm:block sm:p-8`}
          >
            <div className="flex items-center gap-3">
              <Bell size={20} />
              <h2 className="text-lg font-semibold">Напоминания</h2>
            </div>
            <div className="mt-7 space-y-4">
              <label className="flex items-start gap-3 rounded-2xl bg-paper p-4 text-sm">
                <input
                  name="emailReminders"
                  type="checkbox"
                  defaultChecked={initial.emailReminders}
                  className="mt-0.5 size-4 accent-black"
                />
                <span>
                  <strong className="block">Ежедневное напоминание</strong>
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    Подскажем, когда пора выполнить задачи дня.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-2xl bg-paper p-4 text-sm">
                <input
                  name="weeklySummary"
                  type="checkbox"
                  defaultChecked={initial.weeklySummary}
                  className="mt-0.5 size-4 accent-black"
                />
                <span>
                  <strong className="block">Итоги недели</strong>
                  <span className="mt-1 block text-xs leading-5 text-muted">
                    Баллы, минуты и темы, которые стали сильнее.
                  </span>
                </span>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Время напоминания</span>
                <input
                  name="studyReminderAt"
                  type="time"
                  defaultValue={initial.studyReminderAt}
                  className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink"
                />
              </label>
            </div>
          </section>

          {/* Save Action */}
          <div className="xl:col-span-2">
            {error && <p className="rounded-xl bg-[#fff1ef] p-3 text-sm text-danger">{error}</p>}
            {message && (
              <p className="flex items-center gap-2 rounded-xl bg-[#edf9f2] p-3 text-sm font-semibold text-success">
                <Check size={15} />
                {message}
              </p>
            )}
            <button
              disabled={saving}
              className="mt-3 inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-6 text-sm font-semibold text-white shadow-md hover:bg-black disabled:opacity-50 sm:max-w-sm sm:rounded-full"
            >
              <Save size={16} />
              {saving ? "Сохраняем..." : "Сохранить настройки"}
            </button>
          </div>
        </form>

        {/* Change Password */}
        <form
          onSubmit={changePassword}
          className={`${
            mobileTab === "security" ? "block" : "hidden"
          } mt-5 rounded-[26px] border border-line bg-white p-6 sm:block sm:p-8`}
        >
          <div className="flex items-center gap-3">
            <KeyRound size={20} />
            <h2 className="text-lg font-semibold">Безопасность</h2>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Текущий пароль</span>
              <input
                name="currentPassword"
                required
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="current-password"
                className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Новый пароль</span>
              <input
                name="newPassword"
                required
                type="password"
                minLength={10}
                maxLength={128}
                autoComplete="new-password"
                className="h-13 w-full rounded-xl border border-line px-4 text-sm outline-none focus:border-ink"
              />
            </label>
          </div>
          {passwordError && <p className="mt-5 text-sm font-medium text-danger">{passwordError}</p>}
          {passwordMessage && <p className="mt-5 text-sm font-medium text-success">{passwordMessage}</p>}
          <button className="mt-6 rounded-full border border-ink px-6 py-3 text-sm font-semibold hover:bg-paper transition">
            Изменить пароль
          </button>
        </form>

        {/* Action Buttons: Support & Logout */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("entgo:support-open"))}
            className="flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-line bg-white px-6 text-sm font-bold shadow-sm hover:bg-paper"
          >
            <Headphones size={18} /> Написать в поддержку
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex min-h-13 items-center justify-center gap-2 rounded-2xl border border-danger/20 bg-[#fff1ef] px-6 text-sm font-bold text-danger shadow-sm hover:bg-[#ffe5e2] transition"
          >
            <LogOut size={17} /> {loggingOut ? "Выходим..." : "Выйти из аккаунта"}
          </button>
        </div>
      </div>
    </main>
  );
}

