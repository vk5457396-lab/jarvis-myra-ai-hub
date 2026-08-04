import type { MetadataRoute } from "next";

const SITE_URL = "https://www.codeninjavik.in";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/features", changeFrequency: "weekly", priority: 0.8 },
    { path: "/demos", changeFrequency: "weekly", priority: 0.7 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
    { path: "/pricing/jarvis", changeFrequency: "weekly", priority: 0.7 },
    { path: "/pricing/myra", changeFrequency: "weekly", priority: 0.7 },
    { path: "/pricing/aria", changeFrequency: "weekly", priority: 0.7 },
    { path: "/pricing/source", changeFrequency: "weekly", priority: 0.7 },
    { path: "/pricing/exe", changeFrequency: "weekly", priority: 0.7 },
    { path: "/pricing/bundle_jarvis_myra", changeFrequency: "weekly", priority: 0.7 },
    { path: "/services", changeFrequency: "weekly", priority: 0.7 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
    { path: "/thank-you", changeFrequency: "yearly", priority: 0.3 },
    { path: "/login", changeFrequency: "monthly", priority: 0.4 },
    { path: "/signup", changeFrequency: "monthly", priority: 0.4 },
    { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
    { path: "/refund-policy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/shipping-policy", changeFrequency: "yearly", priority: 0.3 },
  ];

  return entries.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
