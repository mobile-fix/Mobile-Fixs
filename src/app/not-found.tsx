import Link from "next/link";
import type { Metadata } from "next";

import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/site/Logo";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

/** 404. Offers the routes people actually want rather than a dead end. */
export default function NotFound() {
  const suggestions = [
    { href: "/book", label: "Book a repair", description: "Pick a device and a time slot", icon: "calendar" as const },
    { href: "/services", label: "Our services", description: "Every repair we offer", icon: "wrench" as const },
    { href: "/track", label: "Track a repair", description: "Check where your device is", icon: "search" as const },
    { href: "/contact", label: "Contact us", description: "Ask us anything", icon: "message" as const },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="container-page flex h-16 items-center">
          <Logo href="/" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl text-center">
          <p className="font-display text-6xl font-bold text-line-strong sm:text-7xl">404</p>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            We could not find that page
          </h1>
          <p className="measure mx-auto mt-3 text-ink-muted">
            The link may be out of date, or the page may have moved. Here is where most people are
            headed.
          </p>

          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {suggestions.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="card-interactive flex items-center gap-3.5 rounded-xl border border-line bg-surface p-4 text-left"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
                    <Icon name={item.icon} size={19} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{item.label}</span>
                    <span className="block text-sm text-ink-muted">{item.description}</span>
                  </span>
                  <Icon name="chevron-right" size={16} className="ml-auto shrink-0 text-ink-subtle" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <ButtonLink href="/" variant="outline" iconLeft="arrow-left">
              Back to home
            </ButtonLink>
          </div>
        </div>
      </main>
    </div>
  );
}
