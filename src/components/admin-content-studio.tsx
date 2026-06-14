"use client";

import { BookOpen, CirclePlus, LoaderCircle, Save } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Topic = {
  id: string;
  subjectId: string;
  label: string;
  lesson?: {
    summary: string;
    rule: string;
    example: string;
    mistake: string;
    steps: string[];
    published: boolean;
  } | null;
};

type Subject = { id: string; label: string };

export function AdminContentStudio({
  subjects,
  topics,
  canPublish,
}: {
  subjects: Subject[];
  topics: Topic[];
  canPublish: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"question" | "lesson" | "topic">("question");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const subjectTopics = useMemo(
    () => topics.filter((topic) => topic.subjectId === subjectId),
    [subjectId, topics],
  );
  const [topicId, setTopicId] = useState(subjectTopics[0]?.id ?? topics[0]?.id ?? "");
  const [lessonTopicId, setLessonTopicId] = useState(topics[0]?.id ?? "");
  const lesson = topics.find((topic) => topic.id === lessonTopicId)?.lesson;
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  function changeSubject(value: string) {
    setSubjectId(value);
    setTopicId(topics.find((topic) => topic.subjectId === value)?.id ?? "");
  }

  async function createQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        topicId,
        body: form.get("body"),
        explanation: form.get("explanation"),
        options: [0, 1, 2, 3].map((index) => form.get(`option-${index}`)),
        correctIndex: Number(form.get("correctIndex")),
        difficulty: Number(form.get("difficulty")),
        status: form.get("status"),
      }),
    });
    const result = await response.json() as { error?: string };
    setPending(false);
    setMessage(response.ok ? "Вопрос добавлен в банк." : result.error ?? "Не удалось сохранить вопрос.");
    if (response.ok) {
      event.currentTarget.reset();
      router.refresh();
    }
  }

  async function saveLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/lessons/${lessonTopicId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: form.get("summary"),
        rule: form.get("rule"),
        example: form.get("example"),
        mistake: form.get("mistake"),
        steps: String(form.get("steps")).split("\n").map((value) => value.trim()).filter(Boolean),
        published: form.get("published") === "on",
      }),
    });
    const result = await response.json() as { error?: string };
    setPending(false);
    setMessage(response.ok ? "Урок сохранён." : result.error ?? "Не удалось сохранить урок.");
    if (response.ok) router.refresh();
  }

  async function createTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        title: form.get("title"),
        grade: form.get("grade"),
        description: form.get("description"),
        tags: String(form.get("tags")).split(",").map((value) => value.trim()).filter(Boolean),
        difficulty: Number(form.get("difficulty")),
        expectedScoreGain: Number(form.get("expectedScoreGain")),
      }),
    });
    const result = await response.json() as { error?: string; status?: string };
    setPending(false);
    setMessage(response.ok ? `Тема сохранена со статусом ${result.status}.` : result.error ?? "Не удалось сохранить тему.");
    if (response.ok) router.refresh();
  }

  const inputClass = "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-ink";

  return (
    <section className="mt-10 rounded-[28px] border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-muted">Контент-студия</p>
          <h2 className="mt-2 text-2xl font-semibold">Вопросы и теория</h2>
        </div>
        <div className="grid w-full grid-cols-3 rounded-2xl bg-paper p-1 sm:flex sm:w-auto sm:rounded-full">
          <button onClick={() => { setTab("question"); setMessage(""); }} className={`min-h-11 rounded-xl px-2 py-2 text-xs font-semibold sm:rounded-full sm:px-4 sm:text-sm ${tab === "question" ? "bg-ink text-white" : ""}`}>Вопрос</button>
          <button onClick={() => { setTab("lesson"); setMessage(""); }} className={`min-h-11 rounded-xl px-2 py-2 text-xs font-semibold sm:rounded-full sm:px-4 sm:text-sm ${tab === "lesson" ? "bg-ink text-white" : ""}`}>Теория</button>
          <button onClick={() => { setTab("topic"); setMessage(""); }} className={`min-h-11 rounded-xl px-2 py-2 text-xs font-semibold sm:rounded-full sm:px-4 sm:text-sm ${tab === "topic" ? "bg-ink text-white" : ""}`}>Тема</button>
        </div>
      </div>

      {tab === "question" ? (
        <form onSubmit={createQuestion} className="mt-7 grid gap-5 lg:grid-cols-2">
          <label className="text-sm font-semibold">Предмет<select value={subjectId} onChange={(event) => changeSubject(event.target.value)} className={inputClass}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}</select></label>
          <label className="text-sm font-semibold">Тема<select value={topicId} onChange={(event) => setTopicId(event.target.value)} className={inputClass}>{subjectTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}</select></label>
          <label className="text-sm font-semibold lg:col-span-2">Условие<textarea name="body" required minLength={5} rows={4} className={inputClass} placeholder="Введите текст задания" /></label>
          {[0, 1, 2, 3].map((index) => <label key={index} className="text-sm font-semibold">Вариант {String.fromCharCode(65 + index)}<input name={`option-${index}`} required className={inputClass} /></label>)}
          <label className="text-sm font-semibold">Правильный ответ<select name="correctIndex" className={inputClass}>{[0, 1, 2, 3].map((index) => <option key={index} value={index}>{String.fromCharCode(65 + index)}</option>)}</select></label>
          <label className="text-sm font-semibold">Сложность<select name="difficulty" defaultValue="2" className={inputClass}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="text-sm font-semibold lg:col-span-2">Объяснение<textarea name="explanation" required minLength={5} rows={4} className={inputClass} placeholder="Почему ответ правильный и где обычно ошибаются" /></label>
          <label className="text-sm font-semibold">Статус<select name="status" defaultValue={canPublish ? "DRAFT" : "REVIEW"} className={inputClass}>{canPublish && <option value="DRAFT">Черновик</option>}<option value="REVIEW">На проверке</option>{canPublish && <option value="PUBLISHED">Опубликовать</option>}</select></label>
          <div className="flex items-end"><button disabled={pending || !topicId} className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white disabled:opacity-40">{pending ? <LoaderCircle size={17} className="animate-spin" /> : <CirclePlus size={17} />} Добавить вопрос</button></div>
        </form>
      ) : tab === "lesson" ? (
        <form key={lessonTopicId} onSubmit={saveLesson} className="mt-7 grid gap-5 lg:grid-cols-2">
          <label className="text-sm font-semibold lg:col-span-2">Тема<select value={lessonTopicId} onChange={(event) => setLessonTopicId(event.target.value)} className={inputClass}>{topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}</select></label>
          <label className="text-sm font-semibold lg:col-span-2">Простое объяснение<textarea name="summary" required defaultValue={lesson?.summary} rows={4} className={inputClass} /></label>
          <label className="text-sm font-semibold">Правило<textarea name="rule" required defaultValue={lesson?.rule} rows={4} className={inputClass} /></label>
          <label className="text-sm font-semibold">Пример<textarea name="example" required defaultValue={lesson?.example} rows={4} className={inputClass} /></label>
          <label className="text-sm font-semibold">Типичная ошибка<textarea name="mistake" required defaultValue={lesson?.mistake} rows={4} className={inputClass} /></label>
          <label className="text-sm font-semibold">Шаги, каждый с новой строки<textarea name="steps" required defaultValue={lesson?.steps.join("\n")} rows={4} className={inputClass} /></label>
          {canPublish ? <label className="flex items-center gap-3 text-sm font-semibold"><input name="published" type="checkbox" defaultChecked={lesson?.published} className="size-4 accent-black" /> Опубликовать урок</label> : <p className="self-center text-sm text-muted">Урок будет отправлен суперадмину на проверку.</p>}
          <div className="flex items-center justify-end"><button disabled={pending || !lessonTopicId} className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white disabled:opacity-40">{pending ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />} Сохранить урок</button></div>
        </form>
      ) : <form onSubmit={createTopic} className="mt-7 grid gap-5 lg:grid-cols-2">
        <label className="text-sm font-semibold lg:col-span-2">Предмет<select value={subjectId} onChange={(event) => changeSubject(event.target.value)} className={inputClass}>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}</select></label>
        <label className="text-sm font-semibold lg:col-span-2">Название темы<input name="title" required minLength={3} className={inputClass} placeholder="Например, Показательные уравнения" /></label>
        <label className="text-sm font-semibold">Класс<select name="grade" defaultValue="11" className={inputClass}>{["9", "10", "11", "ЕНТ"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-sm font-semibold">Сложность<select name="difficulty" defaultValue="2" className={inputClass}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-sm font-semibold lg:col-span-2">Описание<textarea name="description" required minLength={10} rows={4} className={inputClass} placeholder="Что изучает тема и почему она важна для ЕНТ" /></label>
        <label className="text-sm font-semibold lg:col-span-2">Теги<input name="tags" className={inputClass} placeholder="алгебра, уравнения, высокий приоритет" /></label>
        <label className="text-sm font-semibold">Ожидаемый прирост балла<input name="expectedScoreGain" type="number" min="0.1" max="20" step="0.1" defaultValue="1.5" className={inputClass} /></label>
        <div className="flex items-end"><p className="text-xs leading-5 text-muted">После создания добавьте теорию во вкладке «Урок теории», а задачи, ответы и объяснения во вкладке «Новый вопрос».</p></div>
        <div className="lg:col-span-2"><button disabled={pending} className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white disabled:opacity-40">{pending ? <LoaderCircle size={17} className="animate-spin" /> : <CirclePlus size={17} />} Предложить тему</button></div>
      </form>}
      {message && <p className="mt-5 rounded-xl bg-paper px-4 py-3 text-sm font-semibold">{message}</p>}
      <p className="mt-5 flex items-center gap-2 text-xs text-muted"><BookOpen size={14} /> {canPublish ? "Все изменения записываются в журнал аудита." : "Новый контент публикуется только после проверки суперадмином."}</p>
    </section>
  );
}
