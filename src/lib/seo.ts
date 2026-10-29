import type { Metadata } from "next";

import { siteConfig } from "@/lib/config";

/**
 * Per-page metadata.
 *
 * Next.js replaces — not merges — a parent's `openGraph` object when a page sets
 * its own, and inherits it untouched when the page sets none. Either way a page
 * that only sets `title` ends up sharing the homepage's og:url and og:title, so
 * every link preview on WhatsApp or Facebook would show the homepage. Building
 * all three blocks from one call keeps title, canonical and previews in step.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  /** Page title without the "| MyMobiFix" suffix — the root template adds it. */
  title: string;
  description: string;
  /** Canonical path, starting with "/". */
  path: string;
  noindex?: boolean;
}): Metadata {
  const url = `${siteConfig.url}${path === "/" ? "" : path}`;
  const socialTitle = `${title} | ${siteConfig.name}`;
  // Named explicitly: a page-level openGraph object also drops the image that
  // src/app/opengraph-image.tsx would otherwise contribute.
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: socialTitle };

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_IN",
      siteName: siteConfig.name,
      url,
      title: socialTitle,
      description,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [image] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Trims to `max` characters at a word boundary, adding an ellipsis when cut. */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s—-]+$/, "")}…`;
}
