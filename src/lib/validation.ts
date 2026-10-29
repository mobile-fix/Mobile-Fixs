import { z } from "zod";
import {
  CONTACT_METHODS,
  CUSTOMER_SERVICE_TYPES,
  MESSAGE_STATUSES,
  PART_GRADES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  REPAIR_STATUSES,
  ROLES,
  SERVICE_TYPES,
  DEVICE_TIERS,
  TIME_SLOTS,
} from "./constants";
import { normalisePhone } from "./utils";

/**
 * Validation schemas shared by the client forms and the API layer.
 *
 * The same schema runs in both places: the browser gets instant feedback, and
 * the server re-validates because client-side validation is a convenience, never
 * a security control.
 */

// ── Primitives ──────────────────────────────────────────────────────────────

/** Strips control characters and collapses whitespace before length checks. */
const sanitisedString = (max: number) =>
  z
    .string()
    .transform((value) =>
      value
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .pipe(z.string().max(max));

export const nameSchema = sanitisedString(80)
  .pipe(z.string().min(2, "Please enter your full name."))
  .refine((value) => /[\p{L}]/u.test(value), "Name must contain letters.");

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required.")
  .transform((value, ctx) => {
    const normalised = normalisePhone(value);
    if (!normalised) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.",
      });
      return z.NEVER;
    }
    return normalised;
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(160, "That email address is too long.");

export const optionalEmailSchema = z
  .union([z.literal(""), emailSchema])
  .optional()
  .transform((value) => (value ? value : undefined));

/**
 * IMEI: 15 digits validated with the Luhn checksum, so a typo is caught rather
 * than stored. Optional — customers often do not have it to hand.
 */
export const imeiSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^\d{15}$/, "An IMEI is exactly 15 digits.")
      .refine(luhnValid, "That IMEI does not look valid. Please re-check the digits."),
  ])
  .optional()
  .transform((value) => (value ? value : undefined));

function luhnValid(value: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = value.length - 1; i >= 0; i -= 1) {
    let digit = value.charCodeAt(i) - 48;
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export const postalCodeSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code."),
  ])
  .optional()
  .transform((value) => (value ? value : undefined));

export const cuidSchema = z.string().trim().min(1, "Required.").max(64);

export const referenceSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^MMF-[A-Z0-9]{6}$/, "Repair IDs look like MMF-7K4Q2M.");

const slotIds = TIME_SLOTS.map((slot) => slot.id) as [string, ...string[]];

// ── Public booking ──────────────────────────────────────────────────────────

/**
 * Service types a customer may choose. STORE_VISIT still exists in the database
 * for old bookings, but there is no shop to visit, so new customer bookings and
 * quotes must use one of the free doorstep options. Admin schemas below keep
 * the full SERVICE_TYPES list.
 */
const customerServiceTypeSchema = z.enum(CUSTOMER_SERVICE_TYPES, {
  errorMap: () => ({
    message: "Choose free pickup & drop or a free at-home repair.",
  }),
});

export const bookingItemInputSchema = z.object({
  serviceId: cuidSchema,
  partGrade: z.enum(PART_GRADES),
});

export const createBookingSchema = z
  .object({
    modelId: cuidSchema,
    items: z
      .array(bookingItemInputSchema)
      .min(1, "Choose at least one repair.")
      .max(4, "Please book at most four repairs per visit.")
      .refine(
        (items) => new Set(items.map((item) => item.serviceId)).size === items.length,
        "That repair is already in your booking.",
      ),
    serviceType: customerServiceTypeSchema,
    scheduledDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose an appointment date."),
    slotId: z.enum(slotIds, { errorMap: () => ({ message: "Choose an appointment time." }) }),
    customer: z.object({
      fullName: nameSchema,
      phone: phoneSchema,
      email: optionalEmailSchema,
      addressLine: sanitisedString(200).optional(),
      city: sanitisedString(80).optional(),
      postalCode: postalCodeSchema,
      preferredContact: z.enum(CONTACT_METHODS).default("PHONE"),
    }),
    imei: imeiSchema,
    problemDescription: sanitisedString(1000).optional(),
  })
  .superRefine((value, ctx) => {
    // Both customer options are doorstep options, so they cannot be fulfilled
    // without somewhere to go.
    if (!value.customer.addressLine || value.customer.addressLine.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer", "addressLine"],
        message: "A full address is required for pickup and at-home repairs.",
      });
    }
    if (!value.customer.city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer", "city"],
        message: "City is required for pickup and at-home repairs.",
      });
    }
    if (!value.customer.postalCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customer", "postalCode"],
        message: "PIN code is required for pickup and at-home repairs.",
      });
    }
  });

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// ── Quote / estimator ───────────────────────────────────────────────────────

export const quoteSchema = z.object({
  modelId: cuidSchema,
  items: z.array(bookingItemInputSchema).min(1).max(4),
  serviceType: customerServiceTypeSchema.default("PICKUP_DELIVERY"),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

// ── Tracking ────────────────────────────────────────────────────────────────

export const trackRepairSchema = z.object({
  reference: referenceSchema,
  phone: phoneSchema,
});

// ── Contact ─────────────────────────────────────────────────────────────────

export const contactMessageSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z
    .union([z.literal(""), phoneSchema])
    .optional()
    .transform((value) => (value ? value : undefined)),
  subject: sanitisedString(120).pipe(z.string().min(3, "Please add a subject.")),
  message: sanitisedString(2000).pipe(
    z.string().min(20, "Please give us at least 20 characters so we can help properly."),
  ),
  /** Honeypot — real users never fill a hidden field. */
  website: z.string().max(0, "Submission rejected.").optional(),
});

// ── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(200),
});

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "That password is too long.")
  .refine((value) => /[a-z]/.test(value), "Include a lowercase letter.")
  .refine((value) => /[A-Z]/.test(value), "Include an uppercase letter.")
  .refine((value) => /\d/.test(value), "Include a number.");

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

// ── Admin: catalogue ────────────────────────────────────────────────────────

export const brandInputSchema = z.object({
  name: sanitisedString(60).pipe(z.string().min(2, "Brand name is required.")),
  logoKey: z.string().trim().max(40).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export const modelInputSchema = z.object({
  brandId: cuidSchema,
  name: sanitisedString(80).pipe(z.string().min(1, "Model name is required.")),
  releaseYear: z.coerce
    .number()
    .int()
    .min(2005, "That release year looks wrong.")
    .max(new Date().getFullYear() + 1, "That release year is in the future.")
    .optional(),
  tier: z.enum(DEVICE_TIERS).default("MID"),
  aliases: sanitisedString(160).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const serviceInputSchema = z.object({
  name: sanitisedString(80).pipe(z.string().min(2, "Service name is required.")),
  shortDescription: sanitisedString(160).pipe(
    z.string().min(10, "Add a one-line description."),
  ),
  description: sanitisedString(1200).pipe(z.string().min(20, "Add a fuller description.")),
  symptoms: z.array(sanitisedString(120)).max(8).default([]),
  iconKey: z.string().trim().max(40).default("wrench"),
  defaultDurationMinutes: z.coerce.number().int().min(5).max(2880),
  defaultWarrantyMonths: z.coerce.number().int().min(0).max(36),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export const priceInputSchema = z
  .object({
    modelId: cuidSchema,
    serviceId: cuidSchema,
    partGrade: z.enum(PART_GRADES),
    price: z.coerce
      .number()
      .int("Price must be a whole rupee amount.")
      .min(0, "Price cannot be negative.")
      .max(500_000, "That price looks wrong."),
    compareAtPrice: z.coerce.number().int().min(0).max(500_000).optional(),
    durationMinutes: z.coerce.number().int().min(5).max(2880),
    warrantyMonths: z.coerce.number().int().min(0).max(36),
    isAvailable: z.boolean().default(true),
    notes: sanitisedString(300).optional(),
  })
  .refine(
    (value) => value.compareAtPrice === undefined || value.compareAtPrice > value.price,
    { path: ["compareAtPrice"], message: "The compare-at price must be higher than the price." },
  );

export const bulkPriceUpdateSchema = z.object({
  ids: z.array(cuidSchema).min(1).max(500),
  /** Percentage adjustment, e.g. -10 for a 10% cut. */
  adjustPercent: z.coerce.number().min(-90).max(300),
});

// ── Admin: bookings ─────────────────────────────────────────────────────────

export const updateBookingStatusSchema = z.object({
  status: z.enum(REPAIR_STATUSES),
  note: sanitisedString(500).optional(),
  isPublic: z.boolean().default(true),
});

export const updateBookingSchema = z.object({
  assignedTechnicianId: z.union([cuidSchema, z.literal(""), z.null()]).optional(),
  internalNotes: sanitisedString(2000).optional(),
  problemDescription: sanitisedString(1000).optional(),
  serviceType: z.enum(SERVICE_TYPES).optional(),
  addressLine: sanitisedString(200).optional(),
  city: sanitisedString(80).optional(),
  postalCode: postalCodeSchema,
  discount: z.coerce.number().int().min(0).max(100_000).optional(),
});

export const rescheduleSchema = z.object({
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  slotId: z.enum(slotIds),
});

export const updateCustomerSchema = z.object({
  fullName: nameSchema.optional(),
  email: optionalEmailSchema,
  addressLine: sanitisedString(200).optional(),
  city: sanitisedString(80).optional(),
  state: sanitisedString(80).optional(),
  postalCode: postalCodeSchema,
  preferredContact: z.enum(CONTACT_METHODS).optional(),
  notes: sanitisedString(1000).optional(),
});

export const paymentInputSchema = z.object({
  amount: z.coerce.number().int().min(1, "Enter an amount.").max(1_000_000),
  method: z.enum(PAYMENT_METHODS),
  status: z.enum(PAYMENT_STATUSES).default("PAID"),
  providerRef: sanitisedString(120).optional(),
});

export const updateMessageStatusSchema = z.object({
  status: z.enum(MESSAGE_STATUSES),
});

export const staffInputSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: z.enum(ROLES),
  password: passwordSchema.optional(),
  isActive: z.boolean().default(true),
});

// ── Query params ────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const bookingListQuerySchema = paginationSchema.extend({
  status: z.union([z.enum(REPAIR_STATUSES), z.literal("ALL")]).default("ALL"),
  serviceType: z.union([z.enum(SERVICE_TYPES), z.literal("ALL")]).default("ALL"),
  search: z.string().trim().max(120).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sort: z.enum(["newest", "oldest", "value"]).default("newest"),
});

export const pricingQuerySchema = paginationSchema.extend({
  brand: z.string().trim().max(60).optional(),
  model: z.string().trim().max(80).optional(),
  service: z.string().trim().max(80).optional(),
  search: z.string().trim().max(120).optional(),
  partGrade: z.union([z.enum(PART_GRADES), z.literal("ALL")]).default("ALL"),
});

export const modelQuerySchema = z.object({
  brand: z.string().trim().max(60).optional(),
  brandId: z.string().trim().max(64).optional(),
  search: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(60),
});

export const customerListQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
});

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
});
