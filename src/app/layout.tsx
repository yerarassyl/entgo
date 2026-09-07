import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import { AiTutor } from "@/components/ai-tutor";
import { PwaInstall } from "@/components/pwa-install";
import { SupportWidget } from "@/components/support-widget";
import "./globals.css";

function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    return url;
  }
  return "https://entgo.kz";
}

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "entgo.ai — Персональная подготовка к ЕНТ с ИИ",
    template: "%s · entgo.ai",
  },
  description:
    "Умная подготовка к ЕНТ нового поколения: 3000+ актуальных заданий, пробные тесты, подробные видеоразборы и персональный AI-репетитор 24/7.",
  keywords: [
    "ЕНТ",
    "подготовка к ЕНТ",
    "ҰБТ",
    "ҰБТ дайындық",
    "пробный ЕНТ",
    "тесты ЕНТ 2025",
    "тесты ЕНТ 2026",
    "математика ЕНТ",
    "математическая грамотность",
    "грамотность чтения",
    "история Казахстана",
    "entgo",
  ],
  authors: [{ name: "entgo.ai Team" }],
  openGraph: {
    type: "website",
    locale: "ru_KZ",
    url: siteUrl,
    title: "entgo.ai — Персональная подготовка к ЕНТ с ИИ",
    description:
      "Персональный план подготовки, пробные ЕНТ и понятный разбор каждой ошибки. Набери 130+ баллов на ЕНТ!",
    siteName: "entgo.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "entgo.ai — Персональная подготовка к ЕНТ с ИИ",
    description: "Персональный план подготовки к ЕНТ и пробные тесты с ИИ-разбором ошибок.",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#111111",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "entgo.ai",
  url: siteUrl,
  description:
    "Платформа персональной подготовки к Единому Национальному Тестированию (ЕНТ / ҰБТ) в Казахстане.",
  educationalCredentialAwarded: "Сертификат ЕНТ",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Курсы подготовки к ЕНТ",
    itemListElement: [
      {
        "@type": "Course",
        name: "Математика (Профильный предмет)",
        description: "Полная база заданий, теория и формулы ЕНТ по профильной математике.",
        provider: {
          "@type": "Organization",
          name: "entgo.ai",
        },
      },
      {
        "@type": "Course",
        name: "Математическая грамотность",
        description: "Задания, логика и экспресс-методы решения математической грамотности ЕНТ.",
        provider: {
          "@type": "Organization",
          name: "entgo.ai",
        },
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <AiTutor />
        <SupportWidget />
        <PwaInstall />
      </body>
    </html>
  );
}

