import type { ReactNode } from "react";

import { Breadcrumbs } from "./Breadcrumbs";
import { Alert } from "@/components/ui/primitives";

/**
 * Shared shell for policy pages.
 *
 * Policy text is a template written for this demonstration deployment, not legal
 * advice — the notice at the top says so plainly rather than implying a lawyer
 * reviewed it.
 */
export function LegalPage({
  title,
  intro,
  updated,
  children,
  showTemplateNotice = true,
}: {
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
  showTemplateNotice?: boolean;
}) {
  return (
    <div className="pb-20 pt-8 lg:pt-10">
      <div className="container-page">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: title }]} />

        <header className="mt-6 max-w-3xl">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{intro}</p>
          <p className="mt-3 text-sm text-ink-subtle">Last updated: {updated}</p>
        </header>

        {showTemplateNotice ? (
          <Alert tone="warning" title="Template policy" className="mt-8 max-w-3xl">
            This document is a starting template supplied with the platform, not reviewed legal
            advice. Replace it with terms drafted for your jurisdiction and business before trading.
          </Alert>
        ) : null}

        <div className="measure mt-10 space-y-8">{children}</div>
      </div>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-ink">{heading}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink-muted [&_li]:leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="ml-5 list-disc space-y-2">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
