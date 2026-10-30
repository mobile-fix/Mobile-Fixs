import type { NextConfig } from "next";

/**
 * CDN origin serving the landing hero's background video.
 * Declared once so the CSP and the component cannot drift apart.
 */
export const HERO_VIDEO_ORIGIN = "https://d8j0ntlcm91z4.cloudfront.net";

/** The public origin every other host redirects to. */
const CANONICAL_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.mymobifix.com";
const RENDER_HOSTNAME = "mymobifix.onrender.com";

/**
 * Hosts the Google tag (GA4 + Google Ads) and the Meta Pixel load from and
 * report to. They are allowed whether or not a tag is configured: the tags
 * themselves only load when their ID is set (see components/site/Analytics).
 * Google's list follows its published CSP guide for gtag.js with Ads.
 */
const TRACKING_ORIGINS = {
  script: [
    "https://www.google.com",
    "https://www.googletagmanager.com",
    "https://*.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://googleads.g.doubleclick.net",
    "https://www.googleadservices.com",
    "https://connect.facebook.net",
  ].join(" "),
  connect: [
    "https://*.google-analytics.com",
    // A wildcard does not match the bare host, and GA4 also posts hits to
    // analytics.google.com itself; without it page views are silently dropped.
    "https://analytics.google.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",
    "https://*.doubleclick.net",
    "https://www.google.com",
    "https://www.google.co.in",
    "https://pagead2.googlesyndication.com",
    "https://www.googleadservices.com",
    "https://www.facebook.com",
    "https://connect.facebook.net",
  ].join(" "),
  img: [
    "https://*.google-analytics.com",
    "https://analytics.google.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",
    "https://*.doubleclick.net",
    "https://www.google.com",
    "https://www.google.co.in",
    "https://pagead2.googlesyndication.com",
    "https://www.googleadservices.com",
    "https://www.facebook.com",
  ].join(" "),
  frame: ["https://td.doubleclick.net", "https://www.googletagmanager.com"].join(" "),
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [],
  },
  experimental: {
    optimizePackageImports: ["@/components/ui"],
  },
  async redirects() {
    return [
      // Prices are no longer published. Old links and search results for the price
      // list land on Contact, where the WhatsApp number is. Temporary (307) so the
      // page can return without search engines having dropped it for good.
      { source: "/pricing", destination: "/contact", permanent: false },
      // Render's default hostname serves the same site as the custom domain. A
      // permanent redirect stops Google indexing it as a duplicate and splitting
      // ranking signals between the two hosts. Skipped if the site URL is still
      // the Render hostname, which would otherwise redirect to itself forever.
      ...(new URL(CANONICAL_ORIGIN).hostname === RENDER_HOSTNAME
        ? []
        : [
            {
              source: "/:path*",
              has: [{ type: "host" as const, value: RENDER_HOSTNAME }],
              destination: `${CANONICAL_ORIGIN}/:path*`,
              permanent: true,
            },
          ]),
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next.js injects inline runtime scripts; 'unsafe-inline' is required for the
      // App Router flight payload. Styles are inlined by Tailwind at build time.
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${TRACKING_ORIGINS.script}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      `img-src 'self' data: blob: ${TRACKING_ORIGINS.img}`,
      // The landing hero streams its background video from this CDN. Without an
      // explicit media-src it would fall back to default-src 'self' and the
      // video would fail silently with no console error in some browsers.
      `media-src 'self' blob: ${HERO_VIDEO_ORIGIN}`,
      `connect-src 'self' ${TRACKING_ORIGINS.connect}`,
      `frame-src 'self' https://www.google.com https://maps.google.com ${TRACKING_ORIGINS.frame}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
