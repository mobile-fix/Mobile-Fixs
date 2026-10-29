import type { MetadataRoute } from "next";

import { hasBrandLandingPage } from "@/lib/brand-content";
import { siteConfig } from "@/lib/config";
import { listBrands, listServices } from "@/server/services/catalog.service";

/**
 * Regenerate hourly so a service or brand added in the admin appears without a
 * redeploy. Without this the sitemap is rendered once at build time and frozen.
 */
export const revalidate = 3600;

/**
 * When the legal and informational copy last changed. A fixed date, not "now":
 * a lastmod that moves on every request tells crawlers nothing and teaches them
 * to ignore the field. Bump this when those pages are edited.
 */
const CONTENT_LAST_MODIFIED = new Date("2026-10-29");

/**
 * Sitemap.
 *
 * Built from the live catalogue so a newly added service appears without a code
 * change. Private and utility routes (booking flow, confirmations, tracking,
 * admin) are deliberately excluded — they are user-specific and marked noindex
 * or have nothing to rank for.
 *
 * Catalogue pages carry no `lastModified`: the catalogue reads do not expose an
 * updatedAt, and a made-up date is worse than none.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/services`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/repair`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/how-it-works`, lastModified: CONTENT_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/faq`, lastModified: CONTENT_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified: CONTENT_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, lastModified: CONTENT_LAST_MODIFIED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/warranty`, lastModified: CONTENT_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/terms`, lastModified: CONTENT_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, lastModified: CONTENT_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [services, brands] = await Promise.all([listServices(), listBrands()]);

    const serviceRoutes: MetadataRoute.Sitemap = services.map((service) => ({
      url: `${base}/services/${service.slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const brandRoutes: MetadataRoute.Sitemap = brands
      .filter((brand) => hasBrandLandingPage(brand.slug))
      .map((brand) => ({
        url: `${base}/repair/${brand.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    return [...staticRoutes, ...serviceRoutes, ...brandRoutes];
  } catch {
    // A database hiccup should degrade the sitemap, not fail the request.
    return staticRoutes;
  }
}
