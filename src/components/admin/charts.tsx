import { Icon } from "@/components/icons";
import { formatMoneyCompact } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Charts.
 *
 * Hand-drawn SVG rather than a charting library: these are four simple shapes,
 * and a library would add ~50 KB of client JavaScript to render them. Being plain
 * SVG they are also server-rendered, theme-aware and require no hydration.
 *
 * Accessibility: every chart carries a text summary for screen readers and, where
 * the data is not otherwise on the page, a visually-hidden data table — a chart
 * that only works visually is not a chart everyone can read.
 */

export type SeriesPoint = { label: string; date: string; bookings: number; revenue: number };
export type BreakdownItem = { label: string; value: number; share: number; secondary?: string };

// ── Line / area chart ───────────────────────────────────────────────────────

export function TrendChart({
  data,
  metric,
  title,
  description,
}: {
  data: SeriesPoint[];
  metric: "bookings" | "revenue";
  title: string;
  description?: string;
}) {
  if (data.length === 0) {
    return <ChartEmpty title={title} />;
  }

  const values = data.map((point) => point[metric]);
  const max = Math.max(...values, 1);
  const total = values.reduce((sum, value) => sum + value, 0);

  const width = 100;
  const height = 34;
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const points = values.map((value, index) => ({
    x: index * step,
    y: height - (value / max) * (height - 3) - 1.5,
  }));

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  const gradientId = `trend-${metric}`;
  const peakIndex = values.indexOf(Math.max(...values));

  return (
    <figure className="surface-card p-5">
      <figcaption className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold text-ink">{title}</h3>
          {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
        </div>
        <p className="tabular font-display text-2xl font-bold text-ink">
          {metric === "revenue" ? formatMoneyCompact(total) : total.toLocaleString("en-IN")}
        </p>
      </figcaption>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`${title}. ${describeSeries(data, metric)}`}
        className="mt-5 h-32 w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              className={metric === "revenue" ? "text-accent-500" : "text-brand-500"}
              stopColor="currentColor"
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              className={metric === "revenue" ? "text-accent-500" : "text-brand-500"}
              stopColor="currentColor"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0.25, 0.5, 0.75].map((fraction) => (
          <line
            key={fraction}
            x1="0"
            x2={width}
            y1={height * fraction}
            y2={height * fraction}
            className="text-line"
            stroke="currentColor"
            strokeWidth="0.2"
            strokeDasharray="1 1.5"
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className={metric === "revenue" ? "text-accent-500" : "text-brand-600 dark:text-brand-400"}
        />

        {/* Peak marker */}
        {points[peakIndex] ? (
          <circle
            cx={points[peakIndex]!.x}
            cy={points[peakIndex]!.y}
            r="0.9"
            className={metric === "revenue" ? "text-accent-500" : "text-brand-600 dark:text-brand-400"}
            fill="currentColor"
          />
        ) : null}
      </svg>

      <div className="mt-2 flex justify-between text-xs text-ink-subtle">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>

      {/* Text alternative for the chart. */}
      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-ink-muted hover:text-ink">
          View as data table
        </summary>
        <div className="scroll-x mt-2 max-h-56">
          <table className="w-full text-xs">
            <caption className="sr-only">{title} by day</caption>
            <thead>
              <tr className="text-left">
                <th scope="col" className="py-1 font-semibold text-ink">
                  Date
                </th>
                <th scope="col" className="py-1 text-right font-semibold text-ink">
                  {metric === "revenue" ? "Revenue" : "Bookings"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((point) => (
                <tr key={point.date}>
                  <th scope="row" className="py-1 text-left font-normal text-ink-muted">
                    {point.label}
                  </th>
                  <td className="tabular py-1 text-right text-ink">
                    {metric === "revenue"
                      ? formatMoneyCompact(point.revenue)
                      : point.bookings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function describeSeries(data: SeriesPoint[], metric: "bookings" | "revenue"): string {
  const values = data.map((point) => point[metric]);
  const total = values.reduce((sum, value) => sum + value, 0);
  const peakIndex = values.indexOf(Math.max(...values));
  const unit = metric === "revenue" ? "rupees" : "bookings";
  return `${total} ${unit} across ${data.length} days, peaking at ${values[peakIndex]} on ${data[peakIndex]?.label}.`;
}

// ── Horizontal bar breakdown ────────────────────────────────────────────────

export function BreakdownChart({
  title,
  description,
  items,
  emptyLabel = "No data yet",
  valueSuffix = "",
  tone = "brand",
}: {
  title: string;
  description?: string;
  items: BreakdownItem[];
  emptyLabel?: string;
  valueSuffix?: string;
  tone?: "brand" | "accent" | "success";
}) {
  if (items.length === 0) return <ChartEmpty title={title} label={emptyLabel} />;

  const max = Math.max(...items.map((item) => item.value), 1);
  const barTone =
    tone === "accent"
      ? "bg-accent-500"
      : tone === "success"
        ? "bg-success-500"
        : "bg-brand-600 dark:bg-brand-500";

  return (
    <figure className="surface-card p-5">
      <figcaption>
        <h3 className="font-display text-base font-bold text-ink">{title}</h3>
        {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
      </figcaption>

      <ul className="mt-5 space-y-3.5">
        {items.map((item) => (
          <li key={item.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-ink">{item.label}</span>
              <span className="tabular shrink-0 font-semibold text-ink">
                {item.value.toLocaleString("en-IN")}
                {valueSuffix}
                <span className="ml-1.5 text-xs font-normal text-ink-subtle">{item.share}%</span>
              </span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken"
              role="img"
              aria-label={`${item.label}: ${item.value}${valueSuffix}, ${item.share} percent of the total`}
            >
              <div
                className={cn("h-full rounded-full transition-[width] duration-500", barTone)}
                style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}

// ── Donut ───────────────────────────────────────────────────────────────────

const DONUT_COLORS = [
  "text-brand-600 dark:text-brand-400",
  "text-accent-500",
  "text-success-500",
  "text-info-500",
  "text-warning-500",
  "text-danger-500",
  "text-brand-300",
  "text-accent-300",
];

export function DonutChart({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: BreakdownItem[];
}) {
  if (items.length === 0) return <ChartEmpty title={title} />;

  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = 15.9155; // circumference ≈ 100, so dash values read as percentages
  let offset = 0;

  const segments = items.map((item, index) => {
    const percent = (item.value / total) * 100;
    const segment = {
      percent,
      offset,
      color: DONUT_COLORS[index % DONUT_COLORS.length]!,
      label: item.label,
      value: item.value,
    };
    offset += percent;
    return segment;
  });

  return (
    <figure className="surface-card p-5">
      <figcaption>
        <h3 className="font-display text-base font-bold text-ink">{title}</h3>
        {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
      </figcaption>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative shrink-0">
          <svg
            viewBox="0 0 42 42"
            width="132"
            height="132"
            role="img"
            aria-label={`${title}. ${segments
              .map((segment) => `${segment.label}: ${Math.round(segment.percent)} percent`)
              .join(", ")}.`}
          >
            <circle
              cx="21"
              cy="21"
              r={radius}
              fill="none"
              className="text-sunken"
              stroke="currentColor"
              strokeWidth="5"
            />
            {segments.map((segment) => (
              <circle
                key={segment.label}
                cx="21"
                cy="21"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className={segment.color}
                strokeDasharray={`${segment.percent} ${100 - segment.percent}`}
                // 25 puts the first segment at 12 o'clock rather than 3 o'clock.
                strokeDashoffset={25 - segment.offset}
              />
            ))}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular font-display text-xl font-bold text-ink">{total}</span>
            <span className="text-[11px] text-ink-subtle">total</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2">
          {segments.map((segment) => (
            <li key={segment.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn("h-2.5 w-2.5 shrink-0 rounded-full", segment.color)}
                  style={{ backgroundColor: "currentColor" }}
                />
                <span className="truncate text-ink-muted">{segment.label}</span>
              </span>
              <span className="tabular shrink-0 font-semibold text-ink">
                {segment.value}
                <span className="ml-1.5 text-xs font-normal text-ink-subtle">
                  {Math.round(segment.percent)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

// ── Empty ───────────────────────────────────────────────────────────────────

function ChartEmpty({ title, label = "No data yet" }: { title: string; label?: string }) {
  return (
    <div className="surface-card flex flex-col items-center justify-center p-8 text-center">
      <h3 className="font-display text-base font-bold text-ink">{title}</h3>
      <span className="mt-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sunken text-ink-subtle">
        <Icon name="chart" size={20} />
      </span>
      <p className="mt-3 text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-xs text-ink-subtle">
        This chart fills in as bookings come through.
      </p>
    </div>
  );
}
