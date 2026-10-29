import { Icon, type IconName } from "@/components/icons";

/**
 * The six promises every ad and landing page makes, in one place so the wording
 * never drifts between pages. Ad policy requires a landing page to show the
 * claims its ads make, so this strip sits near the top of every ad destination.
 */
const PROMISES: Array<{ icon: IconName; label: string }> = [
  { icon: "truck", label: "Free pickup & drop" },
  { icon: "home", label: "Free doorstep visit" },
  { icon: "diagnostic", label: "Free diagnostics" },
  { icon: "badge-check", label: "No fix, no fee" },
  { icon: "clock", label: "Same-day for most repairs" },
  { icon: "shield-check", label: "Warranty on every repair" },
];

/** Server component: a plain list, no client JavaScript. */
export function ServicePromises({
  className,
  narrow = false,
}: {
  className?: string;
  /** Stop at three columns, for placement inside a partial-width column. */
  narrow?: boolean;
}) {
  return (
    <section aria-label="Our service promises" className={className}>
      <ul
        className={`grid grid-cols-2 gap-2.5 sm:grid-cols-3 ${narrow ? "" : "lg:grid-cols-6"}`}
      >
        {PROMISES.map((promise) => (
          <li
            key={promise.label}
            className="flex min-w-0 items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
              <Icon name={promise.icon} size={16} aria-hidden="true" />
            </span>
            <span className="min-w-0 text-xs font-semibold leading-snug text-ink sm:text-sm">
              {promise.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
