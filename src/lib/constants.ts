/**
 * Domain constants — the single source of truth for every enum-like value in
 * the system. The database stores these as plain strings (for SQLite/Postgres
 * portability), so this file is what makes them type-safe end to end.
 */

// ── Repair status ───────────────────────────────────────────────────────────

export const REPAIR_STATUSES = [
  "BOOKING_RECEIVED",
  "DEVICE_RECEIVED",
  "DIAGNOSIS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_CHECK",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "ON_HOLD",
  "CANCELLED",
] as const;

export type RepairStatus = (typeof REPAIR_STATUSES)[number];

/** The happy-path pipeline rendered by the public tracker, in order. */
export const STATUS_FLOW: RepairStatus[] = [
  "BOOKING_RECEIVED",
  "DEVICE_RECEIVED",
  "DIAGNOSIS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_CHECK",
  "READY_FOR_PICKUP",
  "COMPLETED",
];

/** Statuses that sit outside the linear flow and are shown as callouts. */
export const OFF_FLOW_STATUSES: RepairStatus[] = ["ON_HOLD", "CANCELLED"];

export const STATUS_META: Record<
  RepairStatus,
  {
    label: string;
    /** Customer-facing explanation shown on the tracking timeline. */
    description: string;
    /** Design-system token group used for badges and timeline nodes. */
    tone: "neutral" | "info" | "progress" | "success" | "warning" | "danger";
  }
> = {
  BOOKING_RECEIVED: {
    label: "Booking Received",
    description: "We have your request and are confirming your appointment slot.",
    tone: "info",
  },
  DEVICE_RECEIVED: {
    label: "Device Received",
    description: "Your device is with our technician and logged into our system.",
    tone: "info",
  },
  DIAGNOSIS: {
    label: "Diagnosis",
    description: "We are running a full diagnostic to confirm the fault and final cost.",
    tone: "progress",
  },
  REPAIR_IN_PROGRESS: {
    label: "Repair In Progress",
    description: "Your repair is underway. Parts are being fitted and tested.",
    tone: "progress",
  },
  QUALITY_CHECK: {
    label: "Quality Check",
    description: "A 30-point check confirms every function works before handover.",
    tone: "progress",
  },
  READY_FOR_PICKUP: {
    label: "Ready for Pickup / Delivery",
    description: "Your device is repaired, checked and ready to come back to you.",
    tone: "success",
  },
  COMPLETED: {
    label: "Completed",
    description: "Repair complete and device returned. Your warranty starts today.",
    tone: "success",
  },
  ON_HOLD: {
    label: "On Hold",
    description: "We paused the repair and need to confirm something with you.",
    tone: "warning",
  },
  CANCELLED: {
    label: "Cancelled",
    description: "This booking was cancelled. No further work will take place.",
    tone: "danger",
  },
};

/**
 * Allowed status transitions. Enforced server-side in the booking service so an
 * admin cannot skip quality control or resurrect a cancelled job by hand.
 */
export const STATUS_TRANSITIONS: Record<RepairStatus, RepairStatus[]> = {
  BOOKING_RECEIVED: ["DEVICE_RECEIVED", "ON_HOLD", "CANCELLED"],
  DEVICE_RECEIVED: ["DIAGNOSIS", "ON_HOLD", "CANCELLED"],
  DIAGNOSIS: ["REPAIR_IN_PROGRESS", "ON_HOLD", "CANCELLED"],
  REPAIR_IN_PROGRESS: ["QUALITY_CHECK", "ON_HOLD", "CANCELLED"],
  QUALITY_CHECK: ["READY_FOR_PICKUP", "REPAIR_IN_PROGRESS", "ON_HOLD"],
  READY_FOR_PICKUP: ["COMPLETED", "ON_HOLD"],
  COMPLETED: [],
  ON_HOLD: ["DIAGNOSIS", "REPAIR_IN_PROGRESS", "QUALITY_CHECK", "CANCELLED"],
  CANCELLED: [],
};

export function canTransition(from: RepairStatus, to: RepairStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses that mean no further work will happen. */
export const TERMINAL_STATUSES: RepairStatus[] = ["COMPLETED", "CANCELLED"];

/** Statuses counted as active work-in-progress on the admin dashboard. */
export const ACTIVE_STATUSES: RepairStatus[] = [
  "DEVICE_RECEIVED",
  "DIAGNOSIS",
  "REPAIR_IN_PROGRESS",
  "QUALITY_CHECK",
];

// ── Service type ────────────────────────────────────────────────────────────

export const SERVICE_TYPES = ["STORE_VISIT", "PICKUP_DELIVERY", "AT_HOME"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

/**
 * What customers can choose today. There is no walk-in shop, so STORE_VISIT is
 * kept only so old bookings and admin views keep working; it is never offered
 * on the booking form and is rejected for new customer bookings and quotes.
 */
export const CUSTOMER_SERVICE_TYPES = ["PICKUP_DELIVERY", "AT_HOME"] as const;
export type CustomerServiceType = (typeof CUSTOMER_SERVICE_TYPES)[number];

export const SERVICE_TYPE_META: Record<
  ServiceType,
  {
    label: string;
    description: string;
    /** Default visit fee in whole rupees; overridable via the settings table. */
    defaultFee: number;
    iconKey: string;
    requiresAddress: boolean;
    highlight: string;
  }
> = {
  STORE_VISIT: {
    label: "Store Visit",
    description: "No longer offered. Kept so earlier bookings still display correctly.",
    defaultFee: 0,
    iconKey: "store",
    requiresAddress: false,
    highlight: "No longer offered",
  },
  PICKUP_DELIVERY: {
    label: "Pickup & Delivery",
    description:
      "We collect your device, repair it and deliver it back to your door. No pickup or delivery fee.",
    defaultFee: 0,
    iconKey: "truck",
    requiresAddress: true,
    highlight: "Free pickup & drop",
  },
  AT_HOME: {
    label: "At-Home Repair",
    description:
      "A technician repairs your device at your home or office. No visit fee.",
    defaultFee: 0,
    iconKey: "home",
    requiresAddress: true,
    highlight: "Free doorstep visit",
  },
};

// ── Part grade ──────────────────────────────────────────────────────────────

export const PART_GRADES = ["ORIGINAL", "PREMIUM", "STANDARD"] as const;
export type PartGrade = (typeof PART_GRADES)[number];

export const PART_GRADE_META: Record<
  PartGrade,
  { label: string; description: string; multiplier: number; warrantyBonusMonths: number }
> = {
  ORIGINAL: {
    label: "Original (OEM)",
    description: "Manufacturer-original part with identical specification to the factory component.",
    multiplier: 1.35,
    warrantyBonusMonths: 6,
  },
  PREMIUM: {
    label: "Premium",
    description: "High-grade equivalent part, colour and brightness matched. Our most popular choice.",
    multiplier: 1,
    warrantyBonusMonths: 0,
  },
  STANDARD: {
    label: "Standard",
    description: "Reliable budget-friendly part that restores full function at the lowest cost.",
    multiplier: 0.72,
    warrantyBonusMonths: -3,
  },
};

// ── Device tier (fallback pricing) ──────────────────────────────────────────

export const DEVICE_TIERS = ["BUDGET", "MID", "FLAGSHIP"] as const;
export type DeviceTier = (typeof DEVICE_TIERS)[number];

export const TIER_MULTIPLIER: Record<DeviceTier, number> = {
  BUDGET: 0.7,
  MID: 1,
  FLAGSHIP: 1.6,
};

// ── Contact preference ──────────────────────────────────────────────────────

export const CONTACT_METHODS = ["PHONE", "EMAIL", "WHATSAPP"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export const CONTACT_METHOD_LABEL: Record<ContactMethod, string> = {
  PHONE: "Phone call",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

// ── Staff roles ─────────────────────────────────────────────────────────────

export const ROLES = ["OWNER", "MANAGER", "TECHNICIAN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  TECHNICIAN: "Technician",
};

/**
 * Capability matrix. Authorisation is always checked server-side against this
 * table — never by hiding a link in the UI.
 */
export const PERMISSIONS = {
  "bookings:read": ["OWNER", "MANAGER", "TECHNICIAN"],
  "bookings:update": ["OWNER", "MANAGER", "TECHNICIAN"],
  "bookings:delete": ["OWNER"],
  "catalog:read": ["OWNER", "MANAGER", "TECHNICIAN"],
  "catalog:write": ["OWNER", "MANAGER"],
  "customers:read": ["OWNER", "MANAGER"],
  "customers:write": ["OWNER", "MANAGER"],
  "analytics:read": ["OWNER", "MANAGER"],
  "staff:manage": ["OWNER"],
  "messages:read": ["OWNER", "MANAGER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

// ── Appointment scheduling ──────────────────────────────────────────────────

export const APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/**
 * Bookable windows. `startHour` is used to build the concrete UTC-safe Date and
 * to reject slots that have already begun today.
 */
export const TIME_SLOTS = [
  { id: "09-11", label: "9:00 AM – 11:00 AM", startHour: 9, endHour: 11 },
  { id: "11-13", label: "11:00 AM – 1:00 PM", startHour: 11, endHour: 13 },
  { id: "13-15", label: "1:00 PM – 3:00 PM", startHour: 13, endHour: 15 },
  { id: "15-17", label: "3:00 PM – 5:00 PM", startHour: 15, endHour: 17 },
  { id: "17-19", label: "5:00 PM – 7:00 PM", startHour: 17, endHour: 19 },
  { id: "19-21", label: "7:00 PM – 9:00 PM", startHour: 19, endHour: 21 },
] as const;

export type TimeSlotId = (typeof TIME_SLOTS)[number]["id"];

/** How many days ahead a customer may book. */
export const BOOKING_WINDOW_DAYS = 21;

/** Capacity guard: maximum bookings accepted per slot per day. */
export const MAX_BOOKINGS_PER_SLOT = 8;

// ── Payments ────────────────────────────────────────────────────────────────

export const PAYMENT_METHODS = ["CASH", "CARD", "UPI", "ONLINE"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash on completion",
  CARD: "Credit / Debit card",
  UPI: "UPI",
  ONLINE: "Online (card, netbanking, wallet)",
};

// ── Contact messages ────────────────────────────────────────────────────────

export const MESSAGE_STATUSES = ["NEW", "READ", "RESOLVED"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

// ── Settings keys ───────────────────────────────────────────────────────────

export const SETTING_KEYS = {
  serviceFees: "service_fees",
  bookingWindowDays: "booking_window_days",
  maxBookingsPerSlot: "max_bookings_per_slot",
} as const;
