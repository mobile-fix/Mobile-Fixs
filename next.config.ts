import type { NextConfig } from "next";

/**
 * CDN origin serving the landing hero's background video.
 * Declared once so the CSP and the component cannot drift apart.
 */
export const HERO_VIDEO_ORIGIN = "https://d8j0ntlcm91z4.cloudfront.net";

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
  // Prices are no longer published. Old links and search results for the price
  // list land on Contact, where the WhatsApp number is. Temporary (307) so the
  // page can return without search engines having dropped it for good.
  async redirects() {
    return [{ source: "/pricing", destination: "/contact", permanent: false }];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next.js injects inline runtime scripts; 'unsafe-inline' is required for the
      // App Router flight payload. Styles are inlined by Tailwind at build time.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob:",
      // The landing hero streams its background video from this CDN. Without an
      // explicit media-src it would fall back to default-src 'self' and the
      // video would fail silently with no console error in some browsers.
      `media-src 'self' blob: ${HERO_VIDEO_ORIGIN}`,
      "connect-src 'self'",
      "frame-src 'self' https://www.google.com https://maps.google.com",
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
