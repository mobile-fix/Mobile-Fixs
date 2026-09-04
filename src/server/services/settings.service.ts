import "server-only";

import { prisma } from "@/lib/db";
import {
  BOOKING_WINDOW_DAYS,
  MAX_BOOKINGS_PER_SLOT,
  SERVICE_TYPE_META,
  SETTING_KEYS,
  SERVICE_TYPES,
  type ServiceType,
} from "@/lib/constants";
import { parseJsonObject } from "@/lib/json";

/**
 * Business settings an admin can change without a deploy.
 *
 * Reads are cached per-request-ish with a short TTL: settings change rarely but
 * are read on every quote, so hitting the database each time would be wasteful.
 */

type ServiceFeeMap = Record<ServiceType, number>;

const DEFAULT_FEES: ServiceFeeMap = Object.fromEntries(
  SERVICE_TYPES.map((type) => [type, SERVICE_TYPE_META[type].defaultFee]),
) as ServiceFeeMap;

type CacheEntry = { value: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 30_000;

async function readSetting<T>(key: string, fallback: T): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const row = await prisma.setting.findUnique({ where: { key } });
  const value = row ? (parseJsonObject<{ v: T }>(row.value, { v: fallback }).v ?? fallback) : fallback;
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
  return value;
}

async function writeSetting<T>(key: string, value: T): Promise<void> {
  const encoded = JSON.stringify({ v: value });
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: encoded },
    update: { value: encoded },
  });
  cache.delete(key);
}

export async function getServiceFees(): Promise<ServiceFeeMap> {
  const stored = await readSetting<Partial<ServiceFeeMap>>(SETTING_KEYS.serviceFees, {});
  // Merge so a partially-configured settings row still yields every service type.
  return { ...DEFAULT_FEES, ...stored };
}

export async function getServiceFee(serviceType: ServiceType): Promise<number> {
  const fees = await getServiceFees();
  return fees[serviceType] ?? DEFAULT_FEES[serviceType];
}

export async function setServiceFees(fees: Partial<ServiceFeeMap>): Promise<ServiceFeeMap> {
  const merged = { ...(await getServiceFees()), ...fees };
  await writeSetting(SETTING_KEYS.serviceFees, merged);
  return merged;
}

export async function getBookingWindowDays(): Promise<number> {
  return readSetting(SETTING_KEYS.bookingWindowDays, BOOKING_WINDOW_DAYS);
}

export async function getMaxBookingsPerSlot(): Promise<number> {
  return readSetting(SETTING_KEYS.maxBookingsPerSlot, MAX_BOOKINGS_PER_SLOT);
}

export async function seedDefaultSettings(): Promise<void> {
  await writeSetting(SETTING_KEYS.serviceFees, DEFAULT_FEES);
  await writeSetting(SETTING_KEYS.bookingWindowDays, BOOKING_WINDOW_DAYS);
  await writeSetting(SETTING_KEYS.maxBookingsPerSlot, MAX_BOOKINGS_PER_SLOT);
}

/** Clears the read cache — call after any bulk settings mutation. */
export function invalidateSettingsCache(): void {
  cache.clear();
}
