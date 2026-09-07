import type { MetadataRoute } from "next";
import { universityCatalog } from "@/data/universities";

export default function sitemap(): MetadataRoute.Sitemap {
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL;
  const baseUrl = rawUrl && (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) ? rawUrl : "https://entgo.kz";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/onboarding`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/universities`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const universityRoutes: MetadataRoute.Sitemap = universityCatalog.map((uni) => ({
    url: `${baseUrl}/universities/${uni.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...universityRoutes];
}
