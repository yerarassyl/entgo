"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaInstall() {
  const [event, setEvent] = useState<InstallEvent>();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js?v=3", { updateViaCache: "none" })
        .then((registration) => registration.update())
        .catch(() => undefined);
    }
    const listener = (value: Event) => {
      value.preventDefault();
      setEvent(value as InstallEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", listener);
    return () => window.removeEventListener("beforeinstallprompt", listener);
  }, []);
  if (hidden || !event) return null;
  return <div className="fixed inset-x-3 bottom-20 z-[68] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink p-4 text-white shadow-2xl md:hidden"><Download size={20} /><div className="min-w-0 flex-1"><p className="text-sm font-bold">Установить ENTGO</p><p className="text-xs text-white/55">Работает как приложение и открывается с главного экрана.</p></div><button onClick={async () => { await event.prompt(); setHidden(true); }} className="rounded-full bg-white px-3 py-2 text-xs font-bold text-ink">Установить</button><button onClick={() => setHidden(true)} aria-label="Закрыть"><X size={16} /></button></div>;
}
