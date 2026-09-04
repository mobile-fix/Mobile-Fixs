import "server-only";

import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { ACTIVE_STATUSES, STATUS_META, type RepairStatus } from "@/lib/constants";

/** Customer records and their repair history, for the admin dashboard. */

export async function listCustomers(options: {
  search?: string;
  page: number;
  pageSize: number;
}) {
  const search = options.search?.trim();
  const where = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search.replace(/\D/g, "") || search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
      include: {
        bookings: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            reference: true,
            status: true,
            total: true,
            createdAt: true,
            deviceBrandName: true,
            deviceModelName: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    page: options.page,
    pageSize: options.pageSize,
    totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
    items: rows.map((customer) => {
      const current = customer.bookings.find((booking) =>
        ACTIVE_STATUSES.includes(booking.status as RepairStatus),
      );
      const completed = customer.bookings.filter((booking) => booking.status === "COMPLETED");

      return {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        city: customer.city,
        preferredContact: customer.preferredContact,
        totalBookings: customer.bookings.length,
        lifetimeValue: completed.reduce((sum, booking) => sum + booking.total, 0),
        lastBookingAt: customer.bookings[0]?.createdAt.toISOString() ?? null,
        currentRepair: current
          ? {
              reference: current.reference,
              status: current.status as RepairStatus,
              statusLabel: STATUS_META[current.status as RepairStatus].label,
              deviceLabel: `${current.deviceBrandName} ${current.deviceModelName}`,
            }
          : null,
        createdAt: customer.createdAt.toISOString(),
      };
    }),
  };
}

export type CustomerListResult = Awaited<ReturnType<typeof listCustomers>>;

export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        include: {
          items: { select: { serviceName: true, warrantyMonths: true } },
          appointment: { select: { scheduledFor: true, slotLabel: true } },
        },
      },
    },
  });
  if (!customer) throw new NotFoundError("Customer not found.");

  const completed = customer.bookings.filter((booking) => booking.status === "COMPLETED");

  return {
    id: customer.id,
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    addressLine: customer.addressLine,
    city: customer.city,
    state: customer.state,
    postalCode: customer.postalCode,
    preferredContact: customer.preferredContact,
    notes: customer.notes,
    createdAt: customer.createdAt.toISOString(),
    stats: {
      totalBookings: customer.bookings.length,
      completedBookings: completed.length,
      lifetimeValue: completed.reduce((sum, booking) => sum + booking.total, 0),
    },
    bookings: customer.bookings.map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      status: booking.status as RepairStatus,
      statusLabel: STATUS_META[booking.status as RepairStatus].label,
      deviceLabel: `${booking.deviceBrandName} ${booking.deviceModelName}`,
      services: booking.items.map((item) => item.serviceName),
      total: booking.total,
      scheduledFor: booking.appointment?.scheduledFor.toISOString() ?? null,
      slotLabel: booking.appointment?.slotLabel ?? null,
      createdAt: booking.createdAt.toISOString(),
    })),
  };
}

export type CustomerDetail = Awaited<ReturnType<typeof getCustomerById>>;

export async function updateCustomer(
  id: string,
  input: {
    fullName?: string;
    email?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    preferredContact?: string;
    notes?: string;
  },
) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new NotFoundError("Customer not found.");

  return prisma.customer.update({
    where: { id },
    data: {
      ...(input.fullName ? { fullName: input.fullName } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
      ...(input.addressLine !== undefined ? { addressLine: input.addressLine || null } : {}),
      ...(input.city !== undefined ? { city: input.city || null } : {}),
      ...(input.state !== undefined ? { state: input.state || null } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode || null } : {}),
      ...(input.preferredContact ? { preferredContact: input.preferredContact } : {}),
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
    },
  });
}
