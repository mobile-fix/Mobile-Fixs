import "server-only";

import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import {
  OFF_FLOW_STATUSES,
  STATUS_FLOW,
  STATUS_META,
  SERVICE_TYPE_META,
  type RepairStatus,
  type ServiceType,
} from "@/lib/constants";
import { normaliseReference } from "@/lib/reference";

/**
 * Public repair tracking.
 *
 * Deliberately narrow: it returns only what the customer needs to see. Internal
 * notes, technician assignment, IMEI and staff names are never included, and
 * lookup requires *both* the reference and the phone number on the booking — so
 * guessing a reference alone reveals nothing.
 */

export type TrackingStep = {
  status: RepairStatus;
  label: string;
  description: string;
  state: "complete" | "current" | "upcoming";
  at: string | null;
  note: string | null;
};

export type TrackingResult = {
  reference: string;
  status: RepairStatus;
  statusLabel: string;
  statusDescription: string;
  tone: (typeof STATUS_META)[RepairStatus]["tone"];
  isOffFlow: boolean;
  device: string;
  services: Array<{ name: string; warrantyMonths: number }>;
  serviceType: ServiceType;
  serviceTypeLabel: string;
  total: number;
  estimatedDurationMinutes: number;
  bookedAt: string;
  completedAt: string | null;
  appointment: { scheduledFor: string; slotLabel: string } | null;
  progressPercent: number;
  steps: TrackingStep[];
  updates: Array<{ at: string; label: string; note: string | null }>;
  customerFirstName: string;
};

export async function trackRepair(input: {
  reference: string;
  phone: string;
}): Promise<TrackingResult> {
  const reference = normaliseReference(input.reference);

  const booking = await prisma.booking.findFirst({
    where: { reference, customer: { phone: input.phone } },
    include: {
      customer: { select: { fullName: true } },
      items: { select: { serviceName: true, warrantyMonths: true } },
      appointment: true,
      statusHistory: { where: { isPublic: true }, orderBy: { createdAt: "asc" } },
    },
  });

  // A single generic message for both "no such reference" and "phone does not
  // match" — otherwise the endpoint becomes a reference-enumeration oracle.
  if (!booking) {
    throw new NotFoundError(
      "We could not find a repair with that ID and phone number. Please check both and try again.",
    );
  }

  const status = booking.status as RepairStatus;
  const isOffFlow = OFF_FLOW_STATUSES.includes(status);

  // First time each flow status was reached, for the timestamp on the timeline.
  const reachedAt = new Map<string, { at: Date; note: string | null }>();
  for (const entry of booking.statusHistory) {
    if (!reachedAt.has(entry.toStatus)) {
      reachedAt.set(entry.toStatus, { at: entry.createdAt, note: entry.note });
    }
  }

  const currentIndex = isOffFlow ? -1 : STATUS_FLOW.indexOf(status);

  const steps: TrackingStep[] = STATUS_FLOW.map((flowStatus, index) => {
    const reached = reachedAt.get(flowStatus);
    let state: TrackingStep["state"] = "upcoming";
    if (currentIndex >= 0) {
      if (index < currentIndex) state = "complete";
      else if (index === currentIndex) state = "current";
    } else if (reached) {
      state = "complete";
    }

    return {
      status: flowStatus,
      label: STATUS_META[flowStatus].label,
      description: STATUS_META[flowStatus].description,
      state,
      at: reached?.at.toISOString() ?? null,
      note: reached?.note ?? null,
    };
  });

  const progressPercent =
    currentIndex >= 0
      ? Math.round((currentIndex / (STATUS_FLOW.length - 1)) * 100)
      : status === "CANCELLED"
        ? 0
        : Math.round(
            (Math.max(0, steps.filter((step) => step.state === "complete").length - 1) /
              (STATUS_FLOW.length - 1)) *
              100,
          );

  return {
    reference: booking.reference,
    status,
    statusLabel: STATUS_META[status].label,
    statusDescription: STATUS_META[status].description,
    tone: STATUS_META[status].tone,
    isOffFlow,
    device: `${booking.deviceBrandName} ${booking.deviceModelName}`,
    services: booking.items.map((item) => ({
      name: item.serviceName,
      warrantyMonths: item.warrantyMonths,
    })),
    serviceType: booking.serviceType as ServiceType,
    serviceTypeLabel: SERVICE_TYPE_META[booking.serviceType as ServiceType].label,
    total: booking.total,
    estimatedDurationMinutes: booking.estimatedDurationMinutes,
    bookedAt: booking.createdAt.toISOString(),
    completedAt: booking.completedAt?.toISOString() ?? null,
    appointment: booking.appointment
      ? {
          scheduledFor: booking.appointment.scheduledFor.toISOString(),
          slotLabel: booking.appointment.slotLabel,
        }
      : null,
    progressPercent,
    steps,
    updates: booking.statusHistory
      .slice()
      .reverse()
      .map((entry) => ({
        at: entry.createdAt.toISOString(),
        label: STATUS_META[entry.toStatus as RepairStatus]?.label ?? entry.toStatus,
        note: entry.note,
      })),
    customerFirstName: booking.customer.fullName.split(/\s+/)[0] ?? "there",
  };
}
