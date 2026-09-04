import "server-only";

import { prisma } from "@/lib/db";
import {
  ACTIVE_STATUSES,
  STATUS_META,
  SERVICE_TYPE_META,
  type RepairStatus,
  type ServiceType,
} from "@/lib/constants";
import { addDays, endOfDay, percentChange, startOfDay, toDateKey } from "@/lib/utils";

/**
 * Business analytics for the admin dashboard.
 *
 * Revenue is recognised on completion only — an open booking is a forecast, not
 * income — so the headline number matches what the business has actually earned.
 */

export type DashboardSummary = {
  totals: {
    bookings: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    revenue: number;
    pipelineValue: number;
    customers: number;
  };
  trends: {
    bookings: number | null;
    revenue: number | null;
  };
  todaysAppointments: number;
  completionRate: number;
  averageOrderValue: number;
  unreadMessages: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date();
  const periodStart = startOfDay(addDays(now, -29));
  const previousStart = startOfDay(addDays(now, -59));
  const previousEnd = startOfDay(addDays(now, -30));

  const [
    bookings,
    pending,
    inProgress,
    completed,
    cancelled,
    revenueAgg,
    pipelineAgg,
    customers,
    todaysAppointments,
    unreadMessages,
    currentPeriod,
    previousPeriod,
    currentRevenue,
    previousRevenue,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "BOOKING_RECEIVED" } }),
    prisma.booking.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { total: true } }),
    prisma.booking.aggregate({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
      _sum: { total: true },
    }),
    prisma.customer.count(),
    prisma.appointment.count({
      where: {
        scheduledFor: { gte: startOfDay(now), lte: endOfDay(now) },
        status: { in: ["SCHEDULED", "RESCHEDULED"] },
      },
    }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.booking.count({ where: { createdAt: { gte: periodStart } } }),
    prisma.booking.count({ where: { createdAt: { gte: previousStart, lt: previousEnd } } }),
    prisma.booking.aggregate({
      where: { status: "COMPLETED", completedAt: { gte: periodStart } },
      _sum: { total: true },
    }),
    prisma.booking.aggregate({
      where: { status: "COMPLETED", completedAt: { gte: previousStart, lt: previousEnd } },
      _sum: { total: true },
    }),
  ]);

  const revenue = revenueAgg._sum.total ?? 0;
  const closed = completed + cancelled;

  return {
    totals: {
      bookings,
      pending,
      inProgress,
      completed,
      cancelled,
      revenue,
      pipelineValue: pipelineAgg._sum.total ?? 0,
      customers,
    },
    trends: {
      bookings: percentChange(currentPeriod, previousPeriod),
      revenue: percentChange(currentRevenue._sum.total ?? 0, previousRevenue._sum.total ?? 0),
    },
    todaysAppointments,
    completionRate: closed === 0 ? 0 : Math.round((completed / closed) * 100),
    averageOrderValue: completed === 0 ? 0 : Math.round(revenue / completed),
    unreadMessages,
  };
}

export type SeriesPoint = { label: string; date: string; bookings: number; revenue: number };

/** Daily bookings and recognised revenue over the requested window. */
export async function getBookingsSeries(days: number): Promise<SeriesPoint[]> {
  const start = startOfDay(addDays(new Date(), -(days - 1)));

  const [created, completed] = await Promise.all([
    prisma.booking.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.booking.findMany({
      where: { status: "COMPLETED", completedAt: { gte: start } },
      select: { completedAt: true, total: true },
    }),
  ]);

  const buckets = new Map<string, { bookings: number; revenue: number }>();
  for (let i = 0; i < days; i += 1) {
    buckets.set(toDateKey(addDays(start, i)), { bookings: 0, revenue: 0 });
  }

  for (const row of created) {
    const bucket = buckets.get(toDateKey(row.createdAt));
    if (bucket) bucket.bookings += 1;
  }
  for (const row of completed) {
    if (!row.completedAt) continue;
    const bucket = buckets.get(toDateKey(row.completedAt));
    if (bucket) bucket.revenue += row.total;
  }

  return [...buckets.entries()].map(([date, value]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    bookings: value.bookings,
    revenue: value.revenue,
  }));
}

export type BreakdownItem = { label: string; value: number; share: number; secondary?: string };

export async function getTopDevices(limit = 6): Promise<BreakdownItem[]> {
  const grouped = await prisma.booking.groupBy({
    by: ["deviceBrandName", "deviceModelName"],
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const total = grouped.reduce((sum, row) => sum + row._count._all, 0) || 1;
  return grouped.map((row) => ({
    label: `${row.deviceBrandName} ${row.deviceModelName}`,
    value: row._count._all,
    share: Math.round((row._count._all / total) * 100),
  }));
}

export async function getTopServices(limit = 6): Promise<BreakdownItem[]> {
  const grouped = await prisma.bookingItem.groupBy({
    by: ["serviceName"],
    _count: { _all: true },
    _sum: { lineTotal: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const total = grouped.reduce((sum, row) => sum + row._count._all, 0) || 1;
  return grouped.map((row) => ({
    label: row.serviceName,
    value: row._count._all,
    share: Math.round((row._count._all / total) * 100),
    secondary: String(row._sum.lineTotal ?? 0),
  }));
}

export async function getStatusBreakdown(): Promise<BreakdownItem[]> {
  const grouped = await prisma.booking.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const total = grouped.reduce((sum, row) => sum + row._count._all, 0) || 1;
  return grouped
    .map((row) => ({
      label: STATUS_META[row.status as RepairStatus]?.label ?? row.status,
      value: row._count._all,
      share: Math.round((row._count._all / total) * 100),
      secondary: row.status,
    }))
    .sort((a, b) => b.value - a.value);
}

export async function getServiceTypeBreakdown(): Promise<BreakdownItem[]> {
  const grouped = await prisma.booking.groupBy({
    by: ["serviceType"],
    _count: { _all: true },
  });

  const total = grouped.reduce((sum, row) => sum + row._count._all, 0) || 1;
  return grouped
    .map((row) => ({
      label: SERVICE_TYPE_META[row.serviceType as ServiceType]?.label ?? row.serviceType,
      value: row._count._all,
      share: Math.round((row._count._all / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

export async function getBrandBreakdown(limit = 8): Promise<BreakdownItem[]> {
  const grouped = await prisma.booking.groupBy({
    by: ["deviceBrandName"],
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  const total = grouped.reduce((sum, row) => sum + row._count._all, 0) || 1;
  return grouped.map((row) => ({
    label: row.deviceBrandName,
    value: row._count._all,
    share: Math.round((row._count._all / total) * 100),
  }));
}

export type AnalyticsBundle = {
  series: SeriesPoint[];
  topDevices: BreakdownItem[];
  topServices: BreakdownItem[];
  statusBreakdown: BreakdownItem[];
  serviceTypeBreakdown: BreakdownItem[];
  brandBreakdown: BreakdownItem[];
  summary: DashboardSummary;
};

export async function getAnalyticsBundle(days: number): Promise<AnalyticsBundle> {
  const [series, topDevices, topServices, statusBreakdown, serviceTypeBreakdown, brandBreakdown, summary] =
    await Promise.all([
      getBookingsSeries(days),
      getTopDevices(),
      getTopServices(),
      getStatusBreakdown(),
      getServiceTypeBreakdown(),
      getBrandBreakdown(),
      getDashboardSummary(),
    ]);

  return {
    series,
    topDevices,
    topServices,
    statusBreakdown,
    serviceTypeBreakdown,
    brandBreakdown,
    summary,
  };
}

/**
 * Aggregate trust metrics for the marketing pages.
 * Derived from real rows in the database — never invented at render time.
 */
export async function getPublicStats() {
  const [completed, customers, reviewAgg, brands, models] = await Promise.all([
    prisma.booking.count({ where: { status: "COMPLETED" } }),
    prisma.customer.count(),
    prisma.review.aggregate({
      where: { isPublished: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.deviceBrand.count({ where: { isActive: true } }),
    prisma.deviceModel.count({ where: { isActive: true } }),
  ]);

  return {
    repairsCompleted: completed,
    customers,
    averageRating: reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : null,
    reviewCount: reviewAgg._count._all,
    brandsSupported: brands,
    modelsSupported: models,
  };
}

export type PublicStats = Awaited<ReturnType<typeof getPublicStats>>;
