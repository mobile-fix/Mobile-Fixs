import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";

import { ToastProvider } from "@/components/ui/Toast";
import { ThemeScript } from "@/components/site/ThemeToggle";
import { siteConfig, trackingConfig } from "@/lib/config";
import "./globals.css";

/**
 * Inter (body) + Outfit (display).
 *
 * Loaded through next/font rather than an `@import` from Google Fonts. Same two
 * families, but self-hosted and preloaded: an `@import` inside CSS is
 * render-blocking and adds a third-party connection on the critical path, which
 * works against the performance goal these fonts were chosen for.
 */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["Segoe UI", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "MyMobiFix — Mobile Phone Repair with Warranty",
    template: "%s | MyMobiFix",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  // No canonical or og:url here: a default inherited by every page would mark
  // each one as a copy of the homepage. Public pages set their own through
  // pageMetadata() in src/lib/seo.ts.
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: true, email: true, address: false },
  category: "Mobile Phone Repair Services",
  // Ownership proofs for Google Search Console and Meta Business Manager;
  // each tag is omitted while its token is unset.
  verification: {
    google: trackingConfig.googleSiteVerification || undefined,
    other: trackingConfig.metaDomainVerification
      ? { "facebook-domain-verification": trackingConfig.metaDomainVerification }
      : undefined,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Never cap zoom — pinch-to-zoom is an accessibility requirement.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8fd" },
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning className={`${outfit.variable} ${inter.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
