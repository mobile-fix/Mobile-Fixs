import type { PartGrade, ServiceType } from "@/lib/constants";

/** Shapes returned by the public catalogue and quote APIs. */

export type BrandOption = {
  id: string;
  name: string;
  slug: string;
  logoKey: string | null;
  isActive: boolean;
  sortOrder: number;
  modelCount: number;
};

export type ModelOption = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  releaseYear: number | null;
  brandId: string;
  brandName: string;
  brandSlug: string;
  logoKey: string | null;
  label: string;
};

export type RepairOption = {
  id: string;
  partGrade: PartGrade;
  partGradeLabel: string;
  partGradeDescription: string;
  price: number;
  compareAtPrice: number | null;
  durationMinutes: number;
  warrantyMonths: number;
  notes: string | null;
};

export type RepairServiceOption = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  iconKey: string;
  symptoms: string[];
  options: RepairOption[];
  available: boolean;
  fromPrice: number | null;
  defaultDurationMinutes: number;
  defaultWarrantyMonths: number;
};

export type RepairCatalogue = {
  model: {
    id: string;
    name: string;
    slug: string;
    tier: string;
    brandName: string;
    brandSlug: string;
  };
  services: RepairServiceOption[];
};

export type QuoteLine = {
  serviceId: string;
  serviceName: string;
  serviceSlug: string;
  partGrade: PartGrade;
  partGradeLabel: string;
  unitPrice: number;
  compareAtPrice: number | null;
  durationMinutes: number;
  warrantyMonths: number;
  isEstimate: boolean;
  repairPriceId: string | null;
  notes: string | null;
};

export type Quote = {
  model: { id: string; name: string; slug: string; tier: string };
  brand: { id: string; name: string; slug: string };
  lines: QuoteLine[];
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  estimatedDurationMinutes: number;
  warrantyMonths: number;
  containsEstimate: boolean;
  serviceType: ServiceType;
};

/** One chosen repair: a service plus the part grade the customer picked. */
export type BasketItem = { serviceId: string; partGrade: PartGrade };

export type SlotAvailability = {
  id: string;
  label: string;
  available: boolean;
  remaining: number;
  reason?: string;
};

export type Availability = {
  date: string;
  isOpen: boolean;
  closedReason?: string;
  slots: SlotAvailability[];
};

/**
 * Encodes the basket into a URL-safe string so a selection made on the homepage
 * estimator survives navigation to /book and can be shared or bookmarked.
 * Format: `serviceId:GRADE,serviceId:GRADE`.
 */
export function encodeBasket(items: BasketItem[]): string {
  return items.map((item) => `${item.serviceId}:${item.partGrade}`).join(",");
}

export function decodeBasket(value: string | null | undefined): BasketItem[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => {
      const [serviceId, partGrade] = entry.split(":");
      if (!serviceId || !partGrade) return null;
      return { serviceId, partGrade: partGrade as PartGrade };
    })
    .filter((item): item is BasketItem => item !== null)
    .slice(0, 4);
}
