"use client";

import { useState } from "react";
import { Check, Copy, Share2, Sparkles, Users } from "lucide-react";

interface ReferralInviteCardProps {
  userId: string;
  userName?: string | null;
}

export function ReferralInviteCard({ userId, userName }: ReferralInviteCardProps) {
  const [copied, setCopied] = useState(false);

  const getInviteUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/register?ref=${userId}`;
    }
    return `https://entgo.kz/register?ref=${userId}`;
  };

  const handleCopy = async () => {
    const url = getInviteUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const url = encodeURIComponent(getInviteUrl());
    const text = encodeURIComponent(
      `Привет! Готовлюсь к ЕНТ на платформе ENTGO. Присоединяйся по моей ссылке, будем готовиться и соревноваться вместе: `
    );
    window.open(`https://wa.me/?text=${text}${url}`, "_blank");
  };

  const handleShareTelegram = () => {
    const url = encodeURIComponent(getInviteUrl());
    const text = encodeURIComponent(
      `Привет! Готовлюсь к ЕНТ на платформе ENTGO. Присоединяйся, будем соревноваться вместе!`
    );
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  return (
    <div className="rounded-[32px] border border-line bg-gradient-to-br from-white to-paper p-6 sm:p-9">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-paper px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink">
            <Sparkles size={14} className="text-amber-500" /> Совместная подготовка
          </div>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Пригласи друзей и соревнуйся</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Отправь свою персональную ссылку друзьям и одноклассникам. Вы сможете отслеживать прогресс друг друга в рейтинге и получать бонусы!
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:w-80">
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink font-semibold text-white transition hover:bg-black/80"
          >
            {copied ? (
              <>
                <Check size={18} className="text-emerald-400" />
                <span>Ссылка скопирована!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span>Скопировать ссылку</span>
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-50 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleShareTelegram}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-sky-500/20 bg-sky-50 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Telegram
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
