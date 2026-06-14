"use client";
/* eslint-disable @next/next/no-img-element */

import { Camera, CheckCircle2, Headphones, LoaderCircle, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export function SupportWidget() {
  const pathname = usePathname();
  const mobileDockPath = ["/dashboard", "/tests", "/topics", "/plan", "/statistics", "/leaderboard", "/achievements", "/settings", "/premium", "/rewards", "/study", "/results"].some((prefix) => pathname.startsWith(prefix));
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<string>();
  const [capturing, setCapturing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const openSupport = () => {
      setOpen(true);
      setSent(false);
    };
    window.addEventListener("entgo:support-open", openSupport);
    return () => window.removeEventListener("entgo:support-open", openSupport);
  }, []);

  if (
    pathname === "/" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/exam") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/premium")
  ) return null;

  async function capture() {
    if (capturing) return;
    setCapturing(true);
    setError("");
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(document.documentElement, {
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        scale: Math.min(1.25, window.devicePixelRatio),
        useCORS: true,
        ignoreElements: (element) => element.hasAttribute("data-support-widget"),
      });
      setScreenshot(canvas.toDataURL("image/jpeg", 0.72));
    } catch {
      setError("Не удалось сделать снимок. Сообщение можно отправить без него.");
    } finally {
      setCapturing(false);
    }
  }

  async function show() {
    setOpen(true);
    setSent(false);
    if (!screenshot) await capture();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending || message.trim().length < 5) return;
    setSending(true);
    setError("");
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        screenshot,
        pageUrl: window.location.href,
      }),
    });
    const result = await response.json() as { error?: string };
    setSending(false);
    if (!response.ok) {
      setError(result.error ?? "Не удалось отправить сообщение.");
      return;
    }
    setSent(true);
    setMessage("");
  }

  return (
    <div data-support-widget className="floating-support fixed left-3 z-[69] md:bottom-5 md:left-5">
      {open && (
        <section className="mb-3 w-[min(390px,calc(100vw-28px))] overflow-hidden rounded-[24px] border border-line bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <div><p className="text-sm font-bold">Служба поддержки</p><p className="text-[11px] text-muted">Снимок страницы прикрепляется автоматически</p></div>
            <button onClick={() => setOpen(false)} aria-label="Закрыть поддержку"><X size={18} /></button>
          </header>
          {sent ? (
            <div className="p-6 text-center"><CheckCircle2 className="mx-auto text-success" /><p className="mt-3 font-semibold">Сообщение отправлено</p><p className="mt-2 text-xs leading-5 text-muted">Ответ появится в истории обращения и придёт на подтверждённую почту.</p></div>
          ) : (
            <form onSubmit={submit} className="p-4">
              {/* The preview is an ephemeral data URL, so Next Image optimization is not applicable. */}
              {screenshot ? <img src={screenshot} alt="Снимок текущей страницы" className="h-28 w-full rounded-xl border border-line object-cover object-top" /> : <div className="grid h-24 place-items-center rounded-xl bg-paper text-xs text-muted">{capturing ? <LoaderCircle className="animate-spin" /> : "Снимок не прикреплён"}</div>}
              <button type="button" onClick={capture} disabled={capturing} className="mt-2 inline-flex items-center gap-2 text-xs font-semibold"><Camera size={14} /> Обновить снимок</button>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={5} maxLength={2_000} rows={4} placeholder="Опиши проблему или предложение" className="mt-4 w-full resize-none rounded-xl border border-line p-4 text-sm outline-none focus:border-ink" />
              {error && <p className="mt-2 text-xs text-danger">{error}</p>}
              <button disabled={sending || message.trim().length < 5} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2563eb] text-sm font-semibold text-white disabled:opacity-40">{sending ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />} Отправить</button>
            </form>
          )}
        </section>
      )}
      <button onClick={() => void show()} aria-label="Поддержка" className={`${mobileDockPath ? "hidden md:flex" : "flex"} size-12 items-center justify-center gap-2 rounded-full border border-line bg-white text-xs font-bold shadow-lg md:w-auto md:px-4`}><Headphones size={17} /><span className="hidden md:inline">Поддержка</span></button>
    </div>
  );
}
