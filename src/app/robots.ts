import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/config";

/**
 * Robots directives.
 *
 * The admin area, the booking flow and the API are disallowed: none of them have
 * search value, and confirmation URLs contain a customer's repair reference.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/book/confirmation/"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
