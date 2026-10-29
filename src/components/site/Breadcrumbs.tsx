import Link from "next/link";

import { Icon } from "@/components/icons";
import { JsonLd } from "@/components/site/JsonLd";
import { siteConfig } from "@/lib/config";

/**
 * Breadcrumb trail.
 *
 * Emits BreadcrumbList structured data alongside the visible trail so search
 * results show the hierarchy, without duplicating the link data by hand.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Array<{ href?: string; label: string }>;
  className?: string;
}) {
  const structuredData = {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${siteConfig.url}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1">
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="rounded px-1 py-0.5 text-ink-subtle transition-colors hover:text-brand-700 dark:hover:text-accent-300"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className="px-1 py-0.5 font-medium text-ink"
                  >
                    {item.label}
                  </span>
                )}
                {!isLast ? (
                  <Icon name="chevron-right" size={13} className="text-ink-subtle" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
