import type { Metadata } from "next";
import Link from "next/link";

import { BreakdownChart, DonutChart, TrendChart } from "@/components/admin/charts";
import { StatTile } from "@/components/ui/primitives";
import { requirePermission } from "@/lib/auth";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { getAnalyticsBundle } from "@/server/services/analytics.service";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requirePermission("analytics:read");

  const { days: daysParam } = await searchParams;
  const parsed = Number.parseInt(daysParam ?? "", 10);
  const days = RANGES.some((range) => range.days === parsed) ? parsed : 30;

  const bundle = await getAnalyticsBundle(days);
  const { summary } = bundle;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-1.5 text-ink-muted">
            Bookings, revenue and demand across the last {days} days.
          </p>
        </div>

        {/* Range switch — plain links, so the page stays server-rendered. */}
        <nav aria-label="Date range" className="flex gap-1 rounded-xl border border-line bg-sunken p-1">
          {RANGES.map((range) => (
            <Link
              key={range.days}
              href={`/admin/analytics?days=${range.days}`}
              aria-current={range.days === days ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors duration-200",
                range.days === days
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {range.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Headline figures */}
      <section aria-labelledby="headline-heading">
        <h2 id="headline-heading" className="sr-only">
          Headline figures
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Total bookings"
            value={summary.totals.bookings.toLocaleString("en-IN")}
            icon="list"
            tone="brand"
            trend={summary.trends.bookings}
            hint="vs previous 30 days"
          />
          <StatTile
            label="Revenue recognised"
            value={formatMoneyCompact(summary.totals.revenue)}
            icon="rupee"
            tone="success"
            trend={summary.trends.revenue}
            hint="completed repairs"
          />
          <StatTile
            label="Completion rate"
            value={`${summary.completionRate}%`}
            icon="check-circle"
            tone="info"
            hint={`${summary.totals.completed} completed, ${summary.totals.cancelled} cancelled`}
          />
          <StatTile
            label="Average repair value"
            value={formatMoney(summary.averageOrderValue)}
            icon="tag"
            tone="accent"
            hint={`${summary.totals.customers} customers`}
          />
        </div>
      </section>

      {/* Trends */}
      <section className="grid gap-5 xl:grid-cols-2" aria-labelledby="trends-heading">
        <h2 id="trends-heading" className="sr-only">
          Trends over time
        </h2>
        <TrendChart
          data={bundle.series}
          metric="bookings"
          title="Bookings over time"
          description="New bookings created each day"
        />
        <TrendChart
          data={bundle.series}
          metric="revenue"
          title="Revenue over time"
          description="Recognised on completion"
        />
      </section>

      {/* Breakdowns */}
      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3" aria-labelledby="breakdown-heading">
        <h2 id="breakdown-heading" className="sr-only">
          Demand breakdown
        </h2>

        <BreakdownChart
          title="Most repaired devices"
          description="By number of bookings"
          items={bundle.topDevices}
        />
        <BreakdownChart
          title="Most requested repairs"
          description="Across all devices"
          items={bundle.topServices}
          tone="accent"
        />
        <BreakdownChart
          title="Brands"
          description="Share of all bookings"
          items={bundle.brandBreakdown}
          tone="success"
        />

        <DonutChart
          title="Repair pipeline"
          description="Where every booking currently sits"
          items={bundle.statusBreakdown}
        />
        <DonutChart
          title="Service type"
          description="How customers choose to be served"
          items={bundle.serviceTypeBreakdown}
        />

        <div className="surface-card p-5">
          <h3 className="font-display text-base font-bold text-ink">Pipeline value</h3>
          <p className="mt-0.5 text-sm text-ink-muted">Open bookings not yet completed</p>
          <p className="tabular mt-5 font-display text-3xl font-bold text-ink">
            {formatMoney(summary.totals.pipelineValue)}
          </p>
          <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Awaiting action</dt>
              <dd className="tabular font-semibold text-ink">{summary.totals.pending}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">In progress</dt>
              <dd className="tabular font-semibold text-ink">{summary.totals.inProgress}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Today&rsquo;s appointments</dt>
              <dd className="tabular font-semibold text-ink">{summary.todaysAppointments}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Unread messages</dt>
              <dd className="tabular font-semibold text-ink">{summary.unreadMessages}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
