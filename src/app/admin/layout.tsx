import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | MyMobiFix Admin" },
  // The admin area must never appear in search results.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Admin root layout.
 *
 * Deliberately does no authentication: `/admin/login` lives under this path and
 * must remain reachable while signed out. The guard is in
 * `admin/(dashboard)/layout.tsx`, which wraps every authenticated page.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
