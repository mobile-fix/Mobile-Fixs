"use client";

import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/**
 * Pagination.
 *
 * Renders a compact window of page numbers with ellipses rather than every page,
 * so a 300-page result set does not produce 300 controls. Marked up as a
 * navigation landmark with the current page announced via `aria-current`.
 */

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  className,
  itemLabel = "results",
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  itemLabel?: string;
}) {
  if (totalPages <= 1) {
    return total > 0 ? (
      <p className={cn("text-sm text-ink-subtle", className)}>
        Showing all <span className="tabular font-semibold text-ink">{total}</span> {itemLabel}
      </p>
    ) : null;
  }

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}
    >
      <p className="text-sm text-ink-subtle">
        Showing <span className="tabular font-semibold text-ink">{first}</span>–
        <span className="tabular font-semibold text-ink">{last}</span> of{" "}
        <span className="tabular font-semibold text-ink">{total}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-1">
        <PageButton
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          label="Previous page"
        >
          <Icon name="chevron-left" size={16} />
        </PageButton>

        {buildPageWindow(page, totalPages).map((entry, index) =>
          entry === "gap" ? (
            <span
              key={`gap-${index}`}
              aria-hidden="true"
              className="px-1.5 text-sm text-ink-subtle"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? "page" : undefined}
              aria-label={`Page ${entry}`}
              className={cn(
                "tabular h-9 min-w-9 rounded-lg px-2.5 text-sm font-semibold transition-colors duration-200",
                entry === page
                  ? "bg-brand-950 text-white dark:bg-brand-600"
                  : "text-ink-muted hover:bg-sunken hover:text-ink",
              )}
            >
              {entry}
            </button>
          ),
        )}

        <PageButton
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          label="Next page"
        >
          <Icon name="chevron-right" size={16} />
        </PageButton>
      </div>
    </nav>
  );
}

function PageButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors duration-200 hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line"
    >
      {children}
    </button>
  );
}

/** Produces e.g. `[1, "gap", 6, 7, 8, "gap", 42]`. */
function buildPageWindow(page: number, totalPages: number): Array<number | "gap"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "gap"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push("gap");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < totalPages - 1) pages.push("gap");
  pages.push(totalPages);

  return pages;
}
