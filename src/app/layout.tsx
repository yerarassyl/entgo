import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import { AiTutor } from "@/components/ai-tutor";
import { PwaInstall } from "@/components/pwa-install";
import { SupportWidget } from "@/components/support-widget";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "entgo.kz — подготовка к ЕНТ с ИИ",
    template: "%s · entgo.kz",
  },
  description:
    "Персональный план подготовки, пробные ЕНТ и понятный разбор каждой ошибки.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        {children}
        <MobileBottomNav />
        <AiTutor />
        <SupportWidget />
        <PwaInstall />
      </body>
    </html>
  );
}
