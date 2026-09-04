"use client";

import { useId, useState, type ReactNode } from "react";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Accordion and tabs.
 *
 * Both are built on native semantics with explicit ARIA wiring: the accordion
 * uses `<button aria-expanded aria-controls>` over a region, and the tab list
 * implements roving-tabindex arrow-key navigation as the WAI-ARIA tabs pattern
 * requires.
 */

// ── Accordion ───────────────────────────────────────────────────────────────

export type AccordionItem = {
  id: string;
  question: ReactNode;
  answer: ReactNode;
};

export function Accordion({
  items,
  defaultOpenId,
  /** When false, opening one panel closes the others. */
  allowMultiple = false,
  className,
}: {
  items: AccordionItem[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
  className?: string;
}) {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenId ? [defaultOpenId] : []);
  const baseId = useId();

  const toggle = (id: string) => {
    setOpenIds((current) => {
      const isOpen = current.includes(id);
      if (allowMultiple) {
        return isOpen ? current.filter((item) => item !== id) : [...current, id];
      }
      return isOpen ? [] : [id];
    });
  };

  return (
    <div className={cn("divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface", className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;

        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors duration-200 sm:px-6",
                  isOpen ? "bg-brand-50/60 dark:bg-brand-950/40" : "hover:bg-sunken",
                )}
              >
                <span className="font-display text-base font-bold text-ink">{item.question}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line transition-transform duration-200",
                    isOpen && "rotate-180 border-brand-300 bg-brand-100 text-brand-800 dark:border-brand-600 dark:bg-brand-900 dark:text-brand-100",
                  )}
                >
                  <Icon name="chevron-down" size={16} />
                </span>
              </button>
            </h3>

            {/* Grid-rows transition animates height without measuring the DOM. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="px-5 pb-5 text-[0.95rem] leading-relaxed text-ink-muted sm:px-6"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────────────────

export type TabItem = {
  id: string;
  label: string;
  count?: number;
  content: ReactNode;
};

export function Tabs({
  items,
  defaultId,
  className,
  label,
}: {
  items: TabItem[];
  defaultId?: string;
  className?: string;
  label: string;
}) {
  const [activeId, setActiveId] = useState(defaultId ?? items[0]?.id ?? "");
  const baseId = useId();

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    const nextIndex = keys[event.key];
    if (nextIndex === undefined) return;

    event.preventDefault();
    const wrapped = (nextIndex + items.length) % items.length;
    const next = items[wrapped];
    if (!next) return;
    setActiveId(next.id);
    document.getElementById(`${baseId}-${next.id}-tab`)?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="scroll-x hide-scrollbar -mb-px flex gap-1 border-b border-line"
      >
        {items.map((item, index) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              id={`${baseId}-${item.id}-tab`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-${item.id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                "relative shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors duration-200",
                selected
                  ? "border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-200"
                  : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {item.label}
              {typeof item.count === "number" ? (
                <span
                  className={cn(
                    "tabular ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    selected ? "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100" : "bg-sunken text-ink-subtle",
                  )}
                >
                  {item.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          id={`${baseId}-${item.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-${item.id}-tab`}
          hidden={item.id !== activeId}
          tabIndex={0}
          className="pt-6 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {item.id === activeId ? item.content : null}
        </div>
      ))}
    </div>
  );
}
