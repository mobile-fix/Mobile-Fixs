import type { Metadata } from "next";
import Link from "next/link";

import { BreakdownChart, TrendChart } from "@/components/admin/charts";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, Card, EmptyState, StatTile, StatusBadge } from "@/components/ui/primitives";
import { requirePermission } from "@/lib/auth";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { formatPhone, formatRelative } from "@/lib/utils";
import { hasPermission } from "@/lib/constants";
import {
  getBookingsSeries,
  getDashboardSummary,
  getTopServices,
} from "@/server/services/analytics.service";
import { getTodaysAppointments, listBookings } from "@/server/services/booking.service";
import { integrationStatus } from "@/server/services/notification.service";

export const metadata: Metadata = { title: "Dashboard" };

/** Live operational data — never cached. */
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requirePermission("bookings:read");
  const canSeeAnalytics = hasPermission(user.role, "analytics:read");

  const [summary, appointments, recent, series, topServices] = await Promise.all([
    getDashboardSummary(),
    getTodaysAppointments(),
    listBookings({ page: 1, pageSize: 6, sort: "newest" }),
    canSeeAnalytics ? getBookingsSeries(30) : Promise.resolve([]),
    canSeeAnalytics ? getTopServices(5) : Promise.resolve([]),
  ]);

  const integrations = integrationStatus();
  const unconfigured = Object.entries(integrations).filter(([, value]) => !value.configured);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Good to see you, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-ink-muted">
            {summary.todaysAppointments > 0
              ? `${summary.todaysAppointments} appointment${summary.todaysAppointments === 1 ? "" : "s"} today, ${summary.totals.pending} booking${summary.totals.pending === 1 ? "" : "s"} awaiting action.`
              : "No appointments scheduled for today."}
          </p>
        </div>
        <ButtonLink href="/admin/bookings" iconRight="arrow-right">
          Manage bookings
        </ButtonLink>
      </header>

      {/* Stats */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Key figures
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
            label="Awaiting action"
            value={summary.totals.pending}
            icon="clock"
            tone={summary.totals.pending > 0 ? "warning" : "neutral"}
            hint="new bookings to confirm"
          />
          <StatTile
            label="In progress"
            value={summary.totals.inProgress}
            icon="refresh"
            tone="progress"
            hint="devices currently with us"
          />
          <StatTile
            label="Revenue recognised"
            value={formatMoneyCompact(summary.totals.revenue)}
            icon="rupee"
            tone="success"
            trend={summary.trends.revenue}
            hint="completed repairs only"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Completed"
            value={summary.totals.completed}
            icon="check-circle"
            tone="success"
          />
          <StatTile
            label="Completion rate"
            value={`${summary.completionRate}%`}
            icon="trending-up"
            tone="brand"
            hint="of closed bookings"
          />
          <StatTile
            label="Average repair value"
            value={formatMoney(summary.averageOrderValue)}
            icon="tag"
            tone="accent"
          />
          <StatTile
            label="Pipeline value"
            value={formatMoneyCompact(summary.totals.pipelineValue)}
            icon="package"
            tone="info"
            hint="open bookings"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Today */}
        <section className="xl:col-span-7" aria-labelledby="today-heading">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h2 id="today-heading" className="font-display text-base font-bold text-ink">
                Today&rsquo;s appointments
              </h2>
              <Badge tone={appointments.length > 0 ? "brand" : "neutral"}>
                {appointments.length} scheduled
              </Badge>
            </div>

            {appointments.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="Nothing scheduled today"
                description="New bookings appear here as soon as customers confirm them."
                className="m-4 border-0 bg-transparent py-10"
              />
            ) : (
              <ul className="divide-y divide-line">
                {appointments.map((appointment) => (
                  <li key={appointment.id}>
                    <Link
                      href={`/admin/bookings/${appointment.bookingId}`}
                      className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-sunken"
                    >
                      <span className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-sunken px-2 py-2">
                        <span className="tabular text-sm font-bold text-ink">
                          {new Date(appointment.scheduledFor).toLocaleTimeString("en-IN", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">{appointment.deviceLabel}</span>
                          <StatusBadge status={appointment.status} size="sm" />
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-ink-muted">
                          {appointment.customerName} · {appointment.services.join(", ")}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-subtle">
                          {appointment.reference} · {appointment.slotLabel}
                        </span>
                      </span>

                      <span className="shrink-0 text-right">
                        <span className="tabular block font-semibold text-ink">
                          {formatMoney(appointment.total)}
                        </span>
                        <span className="block text-xs text-ink-subtle">
                          {appointment.serviceType.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </span>

                      <Icon name="chevron-right" size={16} className="shrink-0 text-ink-subtle" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* Recent bookings */}
        <section className="xl:col-span-5" aria-labelledby="recent-heading">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h2 id="recent-heading" className="font-display text-base font-bold text-ink">
                Latest bookings
              </h2>
              <Link
                href="/admin/bookings"
                className="text-sm font-semibold text-brand-700 hover:underline dark:text-accent-300"
              >
                View all
              </Link>
            </div>

            {recent.items.length === 0 ? (
              <EmptyState
                icon="inbox"
                title="No bookings yet"
                className="m-4 border-0 bg-transparent py-10"
              />
            ) : (
              <ul className="divide-y divide-line">
                {recent.items.map((booking) => (
                  <li key={booking.id}>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-sunken"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {booking.deviceLabel}
                        </span>
                        <span className="block truncate text-xs text-ink-subtle">
                          {booking.reference} · {booking.customerName} ·{" "}
                          {formatPhone(booking.customerPhone)}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <StatusBadge status={booking.status} size="sm" />
                        <span className="mt-1 block text-xs text-ink-subtle">
                          {formatRelative(booking.createdAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      {/* Analytics preview */}
      {canSeeAnalytics ? (
        <section aria-labelledby="analytics-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="analytics-heading" className="font-display text-lg font-bold text-ink">
              Last 30 days
            </h2>
            <Link
              href="/admin/analytics"
              className="text-sm font-semibold text-brand-700 hover:underline dark:text-accent-300"
            >
              Full analytics
            </Link>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendChart
                data={series}
                metric="bookings"
                title="Bookings per day"
                description="New bookings created"
              />
            </div>
            <BreakdownChart
              title="Most requested repairs"
              items={topServices}
              description="Across all devices"
            />
          </div>
        </section>
      ) : null}

      {/* Integration status */}
      {hasPermission(user.role, "analytics:read") ? (
        <section aria-labelledby="integrations-heading">
          <Card className="p-5">
            <h2 id="integrations-heading" className="font-display text-base font-bold text-ink">
              Integrations
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Outbound channels report their real configuration state. Nothing is sent through a
              channel that is not wired up — it is logged as skipped rather than silently dropped.
            </p>

            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(integrations).map(([key, value]) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3.5 py-3"
                >
                  <span>
                    <span className="block text-sm font-semibold capitalize text-ink">{key}</span>
                    <span className="block text-xs text-ink-subtle">{value.provider}</span>
                  </span>
                  <Badge tone={value.configured ? "success" : "neutral"} size="sm">
                    {value.configured ? "Configured" : "Not set"}
                  </Badge>
                </li>
              ))}
            </ul>

            {unconfigured.length > 0 ? (
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-subtle">
                <Icon name="info" size={13} className="mt-0.5 shrink-0" />
                <span>
                  {unconfigured.length} channel{unconfigured.length === 1 ? "" : "s"} not configured.
                  Add the relevant environment variables from{" "}
                  <code className="font-mono">.env.example</code> to enable them.
                </span>
              </p>
            ) : null}
          </Card>
        </section>
      ) : null}
    </div>
  );
}
