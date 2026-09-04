import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";
import { listBrands, listServices } from "@/server/services/catalog.service";

/**
 * Sitemap.
 *
 * Built from the live catalogue so a newly added service appears without a code
 * change. Private routes (booking flow, confirmations, tracking results, admin)
 * are deliberately excluded — they are user-specific and marked noindex.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pricing`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/how-it-works`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/track`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/warranty`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [services, brands] = await Promise.all([listServices(), listBrands()]);

    const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
      url: `${base}/services/${service.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Brand-filtered pricing views are real, indexable landing pages for
    // "iPhone repair price"-style searches.
    const brandRoutes: MetadataRoute.Sitemap = brands.map((brand) => ({
      url: `${base}/pricing?brand=${brand.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticRoutes, ...serviceRoutes, ...brandRoutes];
  } catch {
    // A database hiccup should degrade the sitemap, not fail the request.
    return staticRoutes;
  }
}
