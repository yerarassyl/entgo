import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) ? rawUrl : "https://entgo.kz";

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/universities',
          '/universities/*',
          '/onboarding',
          '/terms',
          '/privacy',
          '/login',
          '/register',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/exam/',
          '/dashboard/',
          '/settings/',
          '/history/',
          '/analytics/',
          '/mistakes/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
