import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  ACTIVE_STATUSES,
  PART_GRADE_META,
  SERVICE_TYPE_META,
  STATUS_META,
  TIME_SLOTS,
  canTransition,
  type PartGrade,
  type RepairStatus,
  type ServiceType,
} from "@/lib/constants";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { generateBookingReference } from "@/lib/reference";
import { addDays, endOfDay, startOfDay, toDateKey } from "@/lib/utils";
import type { CreateBookingInput } from "@/lib/validation";
import { buildQuote } from "./pricing.service";
import { getBookingWindowDays, getMaxBookingsPerSlot } from "./settings.service";
import { notifyBookingCreated, notifyStatusChanged } from "./notification.service";

/**
 * Booking lifecycle.
 *
 * The price a customer sees is never trusted from the client: `createBooking`
 * re-runs the same `buildQuote` the estimator used and stores *that* result, so a
 * tampered request body cannot produce a discounted repair.
 */

// ── Availability ────────────────────────────────────────────────────────────

export type SlotAvailability = {
  id: string;
  label: string;
  available: boolean;
  remaining: number;
  reason?: string;
};

/**
 * Slot availability for a given day.
 * A slot closes when it is full, already past, or the date falls outside the
 * bookable window / on a Sunday.
 */
export async function getAvailability(dateKey: string): Promise<{
  date: string;
  isOpen: boolean;
  closedReason?: string;
  slots: SlotAvailability[];
}> {
  const date = parseDateKey(dateKey);
  const today = startOfDay(new Date());
  const windowDays = await getBookingWindowDays();
  const maxPerSlot = await getMaxBookingsPerSlot();

  const closedSlots = (reason: string) => ({
    date: dateKey,
    isOpen: false,
    closedReason: reason,
    slots: TIME_SLOTS.map((slot) => ({
      id: slot.id,
      label: slot.label,
      available: false,
      remaining: 0,
      reason,
    })),
  });

  if (date < today) return closedSlots("This date has already passed.");
  if (date > addDays(today, windowDays)) {
    return closedSlots(`Bookings open ${windowDays} days ahead.`);
  }
  // Sunday: closed.
  if (date.getDay() === 0) return closedSlots("We are closed on Sundays.");

  const counts = await prisma.appointment.groupBy({
    by: ["slotLabel"],
    where: {
      scheduledFor: { gte: startOfDay(date), lte: endOfDay(date) },
      status: { in: ["SCHEDULED", "RESCHEDULED"] },
    },
    _count: { _all: true },
  });

  const usedByLabel = new Map(counts.map((row) => [row.slotLabel, row._count._all]));
  const now = new Date();
  const isToday = toDateKey(date) === toDateKey(now);

  const slots: SlotAvailability[] = TIME_SLOTS.map((slot) => {
    const used = usedByLabel.get(slot.label) ?? 0;
    const remaining = Math.max(0, maxPerSlot - used);

    // Require at least 90 minutes of lead time on same-day bookings.
    if (isToday && slot.startHour <= now.getHours() + 1) {
      return { id: slot.id, label: slot.label, available: false, remaining, reason: "Too soon" };
    }
    if (remaining === 0) {
      return { id: slot.id, label: slot.label, available: false, remaining: 0, reason: "Fully booked" };
    }
    return { id: slot.id, label: slot.label, available: true, remaining };
  });

  return { date: dateKey, isOpen: slots.some((slot) => slot.available), slots };
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) throw new ValidationError("Choose a valid appointment date.");
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) throw new ValidationError("Choose a valid appointment date.");
  return startOfDay(date);
}

function slotById(slotId: string) {
  const slot = TIME_SLOTS.find((entry) => entry.id === slotId);
  if (!slot) throw new ValidationError("Choose a valid appointment time.");
  return slot;
}

function scheduledDateTime(dateKey: string, slotId: string): Date {
  const date = parseDateKey(dateKey);
  const slot = slotById(slotId);
  date.setHours(slot.startHour, 0, 0, 0);
  return date;
}

// ── Create ──────────────────────────────────────────────────────────────────

export async function createBooking(input: CreateBookingInput) {
  // 1. Re-price server-side. This is the authoritative cost.
  const quote = await buildQuote({
    modelId: input.modelId,
    items: input.items.map((item) => ({
      serviceId: item.serviceId,
      partGrade: item.partGrade as PartGrade,
    })),
    serviceType: input.serviceType as ServiceType,
  });

  // 2. Re-check the slot is still open — the customer may have sat on step 4
  //    while the last space was taken.
  const availability = await getAvailability(input.scheduledDate);
  const slot = availability.slots.find((entry) => entry.id === input.slotId);
  if (!slot || !slot.available) {
    throw new ConflictError(
      slot?.reason === "Fully booked"
        ? "That time slot just filled up. Please pick another."
        : "That appointment time is no longer available. Please pick another.",
    );
  }

  const scheduledFor = scheduledDateTime(input.scheduledDate, input.slotId);
  const slotLabel = slotById(input.slotId).label;

  // 3. Guard against an accidental duplicate submission: same phone, same
  //    device, same day, still open.
  const duplicate = await prisma.booking.findFirst({
    where: {
      customer: { phone: input.customer.phone },
      deviceModelName: quote.model.name,
      status: { notIn: ["CANCELLED", "COMPLETED"] },
      createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    },
    select: { reference: true },
  });
  if (duplicate) {
    throw new ConflictError(
      `You already have an open booking (${duplicate.reference}) for this device. Track it instead, or call us to add another repair.`,
    );
  }

  const requiresAddress = SERVICE_TYPE_META[input.serviceType as ServiceType].requiresAddress;

  // 4. Persist everything atomically. A booking without its appointment or
  //    without its first history row would be a broken record.
  const booking = await withUniqueReference(async (reference) =>
    prisma.$transaction(async (tx) => {
      const customer = await tx.customer.upsert({
        where: { phone: input.customer.phone },
        create: {
          fullName: input.customer.fullName,
          phone: input.customer.phone,
          email: input.customer.email ?? null,
          addressLine: input.customer.addressLine ?? null,
          city: input.customer.city ?? null,
          postalCode: input.customer.postalCode ?? null,
          preferredContact: input.customer.preferredContact,
        },
        update: {
          fullName: input.customer.fullName,
          // Only overwrite optional details when the customer supplied them.
          ...(input.customer.email ? { email: input.customer.email } : {}),
          ...(input.customer.addressLine ? { addressLine: input.customer.addressLine } : {}),
          ...(input.customer.city ? { city: input.customer.city } : {}),
          ...(input.customer.postalCode ? { postalCode: input.customer.postalCode } : {}),
          preferredContact: input.customer.preferredContact,
        },
      });

      const created = await tx.booking.create({
        data: {
          reference,
          customerId: customer.id,
          modelId: quote.model.id,
          deviceBrandName: quote.brand.name,
          deviceModelName: quote.model.name,
          serviceType: input.serviceType,
          status: "BOOKING_RECEIVED",
          addressLine: requiresAddress ? (input.customer.addressLine ?? null) : null,
          city: requiresAddress ? (input.customer.city ?? null) : null,
          postalCode: requiresAddress ? (input.customer.postalCode ?? null) : null,
          imei: input.imei ?? null,
          problemDescription: input.problemDescription ?? null,
          preferredContact: input.customer.preferredContact,
          subtotal: quote.subtotal,
          discount: quote.discount,
          serviceFee: quote.serviceFee,
          total: quote.total,
          estimatedDurationMinutes: quote.estimatedDurationMinutes,
          items: {
            create: quote.lines.map((line) => ({
              serviceId: line.serviceId,
              repairPriceId: line.repairPriceId,
              serviceName: line.serviceName,
              partGrade: line.partGrade,
              unitPrice: line.unitPrice,
              quantity: 1,
              lineTotal: line.unitPrice,
              durationMinutes: line.durationMinutes,
              warrantyMonths: line.warrantyMonths,
            })),
          },
          appointment: {
            create: { scheduledFor, slotLabel, status: "SCHEDULED" },
          },
          statusHistory: {
            create: {
              toStatus: "BOOKING_RECEIVED",
              note: "Booking received. We will confirm your appointment shortly.",
              isPublic: true,
            },
          },
          payments: {
            create: {
              amount: quote.total,
              method: "CASH",
              status: "PENDING",
            },
          },
        },
        include: bookingDetailInclude,
      });

      return created;
    }),
  );

  // 5. Fire-and-forget notifications. A failing SMS provider must never roll
  //    back a booking that is already committed.
  void notifyBookingCreated(booking).catch((error) => {
    console.error("[booking] notification failed", error);
  });

  return serialiseBookingDetail(booking);
}

/**
 * Retries reference generation on the astronomically-unlikely collision with the
 * unique index, rather than pre-checking (which would race).
 */
async function withUniqueReference<T>(fn: (reference: string) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await fn(generateBookingReference());
    } catch (error) {
      const isUniqueViolation =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        String(error.meta?.target ?? "").includes("reference");
      if (!isUniqueViolation) throw error;
    }
  }
  throw new ConflictError("We could not allocate a repair ID. Please try again.");
}

// ── Reads ───────────────────────────────────────────────────────────────────

const bookingDetailInclude = {
  customer: true,
  items: true,
  appointment: true,
  payments: { orderBy: { createdAt: "desc" } },
  statusHistory: {
    orderBy: { createdAt: "asc" },
    include: { changedBy: { select: { id: true, name: true } } },
  },
  technician: { select: { id: true, name: true, email: true } },
  model: { include: { brand: { select: { name: true, slug: true, logoKey: true } } } },
} satisfies Prisma.BookingInclude;

type BookingWithDetail = Prisma.BookingGetPayload<{ include: typeof bookingDetailInclude }>;

export function serialiseBookingDetail(booking: BookingWithDetail) {
  return {
    id: booking.id,
    reference: booking.reference,
    status: booking.status as RepairStatus,
    statusLabel: STATUS_META[booking.status as RepairStatus].label,
    serviceType: booking.serviceType as ServiceType,
    serviceTypeLabel: SERVICE_TYPE_META[booking.serviceType as ServiceType].label,
    device: {
      brandName: booking.deviceBrandName,
      modelName: booking.deviceModelName,
      modelId: booking.modelId,
      logoKey: booking.model?.brand.logoKey ?? null,
    },
    customer: {
      id: booking.customer.id,
      fullName: booking.customer.fullName,
      phone: booking.customer.phone,
      email: booking.customer.email,
      preferredContact: booking.customer.preferredContact,
    },
    address: {
      line: booking.addressLine,
      city: booking.city,
      postalCode: booking.postalCode,
    },
    imei: booking.imei,
    problemDescription: booking.problemDescription,
    internalNotes: booking.internalNotes,
    items: booking.items.map((item) => ({
      id: item.id,
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      partGrade: item.partGrade as PartGrade,
      partGradeLabel: PART_GRADE_META[item.partGrade as PartGrade]?.label ?? item.partGrade,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      durationMinutes: item.durationMinutes,
      warrantyMonths: item.warrantyMonths,
    })),
    pricing: {
      subtotal: booking.subtotal,
      discount: booking.discount,
      serviceFee: booking.serviceFee,
      total: booking.total,
    },
    estimatedDurationMinutes: booking.estimatedDurationMinutes,
    appointment: booking.appointment
      ? {
          id: booking.appointment.id,
          scheduledFor: booking.appointment.scheduledFor.toISOString(),
          slotLabel: booking.appointment.slotLabel,
          status: booking.appointment.status,
        }
      : null,
    technician: booking.technician,
    payments: booking.payments.map((payment) => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      providerRef: payment.providerRef,
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
    })),
    statusHistory: booking.statusHistory.map((entry) => ({
      id: entry.id,
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus as RepairStatus,
      note: entry.note,
      isPublic: entry.isPublic,
      changedBy: entry.changedBy?.name ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
    completedAt: booking.completedAt?.toISOString() ?? null,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    cancellationReason: booking.cancellationReason,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

export type BookingDetail = ReturnType<typeof serialiseBookingDetail>;

export async function getBookingById(id: string): Promise<BookingDetail> {
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingDetailInclude });
  if (!booking) throw new NotFoundError("Booking not found.");
  return serialiseBookingDetail(booking);
}

export async function getBookingByReference(reference: string): Promise<BookingDetail> {
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: bookingDetailInclude,
  });
  if (!booking) throw new NotFoundError("Booking not found.");
  return serialiseBookingDetail(booking);
}

export type BookingListFilters = {
  status?: string;
  serviceType?: string;
  search?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "oldest" | "value";
  page: number;
  pageSize: number;
  technicianId?: string;
};

/**
 * Builds the search OR-clause for the booking list.
 *
 * Each clause is only included when it can actually match: stripping the digits
 * out of a term like "iPhone" leaves an empty string, and `contains: ""` matches
 * every row — which would silently turn a text search into "show everything".
 */
function buildSearchClauses(rawSearch: string): Prisma.BookingWhereInput[] {
  const search = rawSearch.trim();
  if (!search) return [];

  const clauses: Prisma.BookingWhereInput[] = [
    { reference: { contains: search.toUpperCase(), mode: "insensitive" } },
    { deviceModelName: { contains: search, mode: "insensitive" } },
    { deviceBrandName: { contains: search, mode: "insensitive" } },
    { customer: { fullName: { contains: search, mode: "insensitive" } } },
    { customer: { email: { contains: search, mode: "insensitive" } } },
  ];

  // Only search phone numbers when the term actually contains digits.
  const digits = search.replace(/\D/g, "");
  if (digits.length >= 3) {
    clauses.push({ customer: { phone: { contains: digits } } });
  }

  return clauses;
}

export async function listBookings(filters: BookingListFilters) {
  const where: Prisma.BookingWhereInput = {
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(filters.serviceType && filters.serviceType !== "ALL"
      ? { serviceType: filters.serviceType }
      : {}),
    ...(filters.technicianId ? { assignedTechnicianId: filters.technicianId } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: startOfDay(parseDateKey(filters.from)) } : {}),
            ...(filters.to ? { lte: endOfDay(parseDateKey(filters.to)) } : {}),
          },
        }
      : {}),
    ...(filters.search ? { OR: buildSearchClauses(filters.search) } : {}),
  };

  const orderBy: Prisma.BookingOrderByWithRelationInput =
    filters.sort === "oldest"
      ? { createdAt: "asc" }
      : filters.sort === "value"
        ? { total: "desc" }
        : { createdAt: "desc" };

  const [total, rows] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: {
        customer: { select: { id: true, fullName: true, phone: true, email: true } },
        appointment: { select: { scheduledFor: true, slotLabel: true } },
        items: { select: { serviceName: true } },
        technician: { select: { id: true, name: true } },
      },
    }),
  ]);

  return {
    total,
    page: filters.page,
    pageSize: filters.pageSize,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    items: rows.map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      status: booking.status as RepairStatus,
      statusLabel: STATUS_META[booking.status as RepairStatus].label,
      serviceType: booking.serviceType as ServiceType,
      serviceTypeLabel: SERVICE_TYPE_META[booking.serviceType as ServiceType].label,
      deviceLabel: `${booking.deviceBrandName} ${booking.deviceModelName}`,
      services: booking.items.map((item) => item.serviceName),
      customerId: booking.customer.id,
      customerName: booking.customer.fullName,
      customerPhone: booking.customer.phone,
      total: booking.total,
      technicianName: booking.technician?.name ?? null,
      scheduledFor: booking.appointment?.scheduledFor.toISOString() ?? null,
      slotLabel: booking.appointment?.slotLabel ?? null,
      createdAt: booking.createdAt.toISOString(),
    })),
  };
}

export type BookingListResult = Awaited<ReturnType<typeof listBookings>>;

// ── Mutations ───────────────────────────────────────────────────────────────

export async function updateBookingStatus(
  bookingId: string,
  input: { status: RepairStatus; note?: string; isPublic?: boolean },
  actorId: string,
): Promise<BookingDetail> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, reference: true },
  });
  if (!booking) throw new NotFoundError("Booking not found.");

  const from = booking.status as RepairStatus;
  if (from === input.status) {
    throw new ConflictError(`This repair is already marked "${STATUS_META[from].label}".`);
  }
  if (!canTransition(from, input.status)) {
    const allowed = STATUS_META[from].label;
    throw new ConflictError(
      `A repair at "${allowed}" cannot move straight to "${STATUS_META[input.status].label}".`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.repairStatusHistory.create({
      data: {
        bookingId,
        fromStatus: from,
        toStatus: input.status,
        note: input.note ?? null,
        changedById: actorId,
        isPublic: input.isPublic ?? true,
      },
    });

    return tx.booking.update({
      where: { id: bookingId },
      data: {
        status: input.status,
        ...(input.status === "COMPLETED" ? { completedAt: new Date() } : {}),
        ...(input.status === "CANCELLED"
          ? { cancelledAt: new Date(), cancellationReason: input.note ?? null }
          : {}),
      },
      include: bookingDetailInclude,
    });
  });

  // Keep the appointment record consistent with the repair outcome.
  if (input.status === "COMPLETED" || input.status === "CANCELLED") {
    await prisma.appointment
      .updateMany({
        where: { bookingId },
        data: { status: input.status === "COMPLETED" ? "COMPLETED" : "CANCELLED" },
      })
      .catch(() => undefined);
  }

  const detail = serialiseBookingDetail(updated);
  void notifyStatusChanged(detail, from).catch((error) => {
    console.error("[booking] status notification failed", error);
  });

  return detail;
}

export async function rescheduleBooking(
  bookingId: string,
  input: { scheduledDate: string; slotId: string },
): Promise<BookingDetail> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { appointment: true },
  });
  if (!booking) throw new NotFoundError("Booking not found.");
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    throw new ConflictError("A closed repair cannot be rescheduled.");
  }

  const availability = await getAvailability(input.scheduledDate);
  const slot = availability.slots.find((entry) => entry.id === input.slotId);
  if (!slot?.available) {
    throw new ConflictError(slot?.reason ?? "That appointment time is not available.");
  }

  const scheduledFor = scheduledDateTime(input.scheduledDate, input.slotId);
  const slotLabel = slotById(input.slotId).label;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.appointment.upsert({
      where: { bookingId },
      create: { bookingId, scheduledFor, slotLabel, status: "SCHEDULED" },
      update: {
        scheduledFor,
        slotLabel,
        status: "RESCHEDULED",
        rescheduledFrom: booking.appointment?.scheduledFor ?? null,
      },
    });

    await tx.repairStatusHistory.create({
      data: {
        bookingId,
        fromStatus: booking.status,
        toStatus: booking.status,
        note: `Appointment moved to ${slotLabel} on ${input.scheduledDate}.`,
        isPublic: true,
      },
    });

    return tx.booking.findUniqueOrThrow({ where: { id: bookingId }, include: bookingDetailInclude });
  });

  return serialiseBookingDetail(updated);
}

export async function updateBookingDetails(
  bookingId: string,
  input: {
    assignedTechnicianId?: string | null;
    internalNotes?: string;
    problemDescription?: string;
    serviceType?: ServiceType;
    addressLine?: string;
    city?: string;
    postalCode?: string;
    discount?: number;
  },
): Promise<BookingDetail> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError("Booking not found.");

  if (input.assignedTechnicianId) {
    const technician = await prisma.user.findFirst({
      where: { id: input.assignedTechnicianId, isActive: true },
      select: { id: true },
    });
    if (!technician) throw new ValidationError("That technician account is not available.");
  }

  // Changing the discount or service type changes the price — recompute rather
  // than letting the stored total drift.
  let pricing: { serviceFee: number; discount: number; total: number } | null = null;
  if (input.discount !== undefined || input.serviceType) {
    const serviceType = (input.serviceType ?? booking.serviceType) as ServiceType;
    const discount = Math.min(input.discount ?? booking.discount, booking.subtotal);
    const { getServiceFee } = await import("./settings.service");
    const serviceFee = await getServiceFee(serviceType);
    pricing = {
      serviceFee,
      discount,
      total: Math.max(0, booking.subtotal + serviceFee - discount),
    };
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      ...(input.assignedTechnicianId !== undefined
        ? { assignedTechnicianId: input.assignedTechnicianId || null }
        : {}),
      ...(input.internalNotes !== undefined ? { internalNotes: input.internalNotes } : {}),
      ...(input.problemDescription !== undefined
        ? { problemDescription: input.problemDescription }
        : {}),
      ...(input.serviceType ? { serviceType: input.serviceType } : {}),
      ...(input.addressLine !== undefined ? { addressLine: input.addressLine } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      ...(pricing ?? {}),
    },
    include: bookingDetailInclude,
  });

  return serialiseBookingDetail(updated);
}

export async function recordPayment(
  bookingId: string,
  input: { amount: number; method: string; status: string; providerRef?: string },
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundError("Booking not found.");

  return prisma.payment.create({
    data: {
      bookingId,
      amount: input.amount,
      method: input.method,
      status: input.status,
      providerRef: input.providerRef ?? null,
      paidAt: input.status === "PAID" ? new Date() : null,
    },
  });
}

/** Today's schedule for the admin dashboard. */
export async function getTodaysAppointments() {
  const now = new Date();
  const rows = await prisma.appointment.findMany({
    where: {
      scheduledFor: { gte: startOfDay(now), lte: endOfDay(now) },
      status: { in: ["SCHEDULED", "RESCHEDULED"] },
    },
    orderBy: { scheduledFor: "asc" },
    include: {
      booking: {
        include: {
          customer: { select: { fullName: true, phone: true } },
          items: { select: { serviceName: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    bookingId: row.booking.id,
    reference: row.booking.reference,
    scheduledFor: row.scheduledFor.toISOString(),
    slotLabel: row.slotLabel,
    status: row.booking.status as RepairStatus,
    serviceType: row.booking.serviceType as ServiceType,
    deviceLabel: `${row.booking.deviceBrandName} ${row.booking.deviceModelName}`,
    services: row.booking.items.map((item) => item.serviceName),
    customerName: row.booking.customer.fullName,
    customerPhone: row.booking.customer.phone,
    total: row.booking.total,
  }));
}

export async function countActiveRepairs(): Promise<number> {
  return prisma.booking.count({ where: { status: { in: ACTIVE_STATUSES } } });
}
