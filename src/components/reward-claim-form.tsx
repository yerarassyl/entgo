"use client";

import { CheckCircle2, Gift } from "lucide-react";
import { FormEvent, useState } from "react";

export function RewardClaimForm({ existingStatus }: { existingStatus: string | null }) {
  const [status, setStatus] = useState(existingStatus);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/rewards/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        officialScore: Number(form.get("officialScore")),
        proofUrl: form.get("proofUrl"),
        contact: form.get("contact"),
      }),
    });
    const result = (await response.json()) as { status?: string; error?: string };
    setLoading(false);
    if (!response.ok) return setError(result.error ?? "Не удалось отправить заявку.");
    setStatus(result.status ?? "SUBMITTED");
  }
  if (status) return <div className="rounded-[28px] bg-[#e9f7ef] p-8 text-success"><CheckCircle2 size={28} /><h2 className="mt-5 text-xl font-semibold">Заявка принята</h2><p className="mt-2 text-sm">Статус: {status}. Команда проверит официальный результат и свяжется с тобой.</p></div>;
  return (
    <form onSubmit={submit} className="rounded-[28px] border border-line bg-white p-7 sm:p-9">
      <Gift /><h2 className="mt-5 text-2xl font-semibold">Подать заявку</h2>
      <div className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">Официальный балл<input name="officialScore" type="number" min={130} max={140} required className="mt-2 h-12 w-full rounded-xl border border-line px-4" /></label>
        <label className="block text-sm font-semibold">Ссылка на подтверждение<input name="proofUrl" type="url" required placeholder="https://..." className="mt-2 h-12 w-full rounded-xl border border-line px-4" /><span className="mt-2 block text-xs font-normal leading-5 text-muted">Прикрепите ссылку на официальный результат ЕНТ или скриншот, загруженный в облако.</span></label>
        <label className="block text-sm font-semibold">Телефон или Telegram<input name="contact" required minLength={5} maxLength={100} className="mt-2 h-12 w-full rounded-xl border border-line px-4" /></label>
      </div>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <button disabled={loading} className="mt-6 h-13 w-full rounded-full bg-ink text-sm font-semibold text-white disabled:opacity-50">{loading ? "Отправляем..." : "Отправить на проверку"}</button>
    </form>
  );
}
