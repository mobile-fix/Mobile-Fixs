import "server-only";

import { prisma } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors";
import {
  PART_GRADE_META,
  TIER_MULTIPLIER,
  type DeviceTier,
  type PartGrade,
  type ServiceType,
} from "@/lib/constants";
import { roundToCharmPrice } from "@/lib/money";
import { getServiceFee } from "./settings.service";

/**
 * Pricing engine.
 *
 * Prices are data, never code. A quote resolves each requested repair against a
 * `RepairPrice` row keyed by (model x service x part grade). When a model has no
 * explicit row — typically a device an admin added but has not priced yet — the
 * engine derives a clearly-flagged *estimate* from what the same repair costs on
 * other devices in the same tier, rather than silently failing or inventing a
 * number the customer would be held to.
 */

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
  /** True when derived from tier averages rather than an explicit price row. */
  isEstimate: boolean;
  repairPriceId: string | null;
  notes: string | null;
};

export type Quote = {
  model: { id: string; name: string; slug: string; tier: DeviceTier };
  brand: { id: string; name: string; slug: string };
  lines: QuoteLine[];
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  /**
   * Repairs done in one visit overlap, so total time is the longest repair plus
   * a reduced allowance for each additional one — not a naive sum.
   */
  estimatedDurationMinutes: number;
  /** Shortest warranty across the basket, which is what the customer effectively gets. */
  warrantyMonths: number;
  containsEstimate: boolean;
  serviceType: ServiceType;
};

export type QuoteRequestItem = { serviceId: string; partGrade: PartGrade };

/**
 * Builds a priced quote. Pure read path — safe to call from the estimator on
 * every keystroke, and reused verbatim by the booking service so the price a
 * customer is shown is provably the price that gets stored.
 */
export async function buildQuote(input: {
  modelId: string;
  items: QuoteRequestItem[];
  serviceType: ServiceType;
  discount?: number;
}): Promise<Quote> {
  const model = await prisma.deviceModel.findUnique({
    where: { id: input.modelId },
    include: { brand: true },
  });

  if (!model || !model.isActive || !model.brand.isActive) {
    throw new NotFoundError("We could not find that device. Please pick it from the list again.");
  }

  const serviceIds = input.items.map((item) => item.serviceId);
  const services = await prisma.repairService.findMany({
    where: { id: { in: serviceIds }, isActive: true },
  });

  const serviceById = new Map(services.map((service) => [service.id, service]));
  const missing = serviceIds.filter((id) => !serviceById.has(id));
  if (missing.length > 0) {
    throw new ValidationError("One of the selected repairs is no longer available.", {
      items: ["A repair you selected is unavailable. Please choose it again."],
    });
  }

  const priceRows = await prisma.repairPrice.findMany({
    where: { modelId: model.id, serviceId: { in: serviceIds }, isAvailable: true },
  });
  const priceByKey = new Map(priceRows.map((row) => [`${row.serviceId}:${row.partGrade}`, row]));

  const lines: QuoteLine[] = [];

  for (const item of input.items) {
    const service = serviceById.get(item.serviceId)!;
    const explicit = priceByKey.get(`${item.serviceId}:${item.partGrade}`);

    if (explicit) {
      lines.push({
        serviceId: service.id,
        serviceName: service.name,
        serviceSlug: service.slug,
        partGrade: item.partGrade,
        partGradeLabel: PART_GRADE_META[item.partGrade].label,
        unitPrice: explicit.price,
        compareAtPrice: explicit.compareAtPrice,
        durationMinutes: explicit.durationMinutes,
        warrantyMonths: explicit.warrantyMonths,
        isEstimate: false,
        repairPriceId: explicit.id,
        notes: explicit.notes,
      });
      continue;
    }

    const estimated = await estimateLine({
      serviceId: service.id,
      serviceName: service.name,
      serviceSlug: service.slug,
      partGrade: item.partGrade,
      tier: model.tier as DeviceTier,
      defaultDurationMinutes: service.defaultDurationMinutes,
      defaultWarrantyMonths: service.defaultWarrantyMonths,
    });
    lines.push(estimated);
  }

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice, 0);
  const serviceFee = await getServiceFee(input.serviceType);
  const discount = Math.min(input.discount ?? 0, subtotal);
  const total = Math.max(0, subtotal + serviceFee - discount);

  return {
    model: { id: model.id, name: model.name, slug: model.slug, tier: model.tier as DeviceTier },
    brand: { id: model.brand.id, name: model.brand.name, slug: model.brand.slug },
    lines,
    subtotal,
    serviceFee,
    discount,
    total,
    estimatedDurationMinutes: combineDurations(lines.map((line) => line.durationMinutes)),
    warrantyMonths: lines.length
      ? Math.min(...lines.map((line) => line.warrantyMonths))
      : 0,
    containsEstimate: lines.some((line) => line.isEstimate),
    serviceType: input.serviceType,
  };
}

/**
 * Derives a price for an unpriced (model, service, grade) combination from the
 * average across devices in the same tier. Flagged `isEstimate` so every surface
 * can label it honestly as "confirmed after diagnosis".
 */
async function estimateLine(input: {
  serviceId: string;
  serviceName: string;
  serviceSlug: string;
  partGrade: PartGrade;
  tier: DeviceTier;
  defaultDurationMinutes: number;
  defaultWarrantyMonths: number;
}): Promise<QuoteLine> {
  const sameTier = await prisma.repairPrice.aggregate({
    where: {
      serviceId: input.serviceId,
      partGrade: input.partGrade,
      isAvailable: true,
      model: { tier: input.tier, isActive: true },
    },
    _avg: { price: true, durationMinutes: true, warrantyMonths: true },
  });

  let basis = sameTier._avg.price;

  if (basis === null) {
    // Nothing in this tier — fall back to the service average across all tiers,
    // rescaled by the tier multiplier.
    const anyTier = await prisma.repairPrice.aggregate({
      where: { serviceId: input.serviceId, partGrade: input.partGrade, isAvailable: true },
      _avg: { price: true },
    });
    basis = anyTier._avg.price === null ? null : anyTier._avg.price * TIER_MULTIPLIER[input.tier];
  }

  if (basis === null) {
    // The repair has never been priced anywhere. Say so rather than guess.
    throw new NotFoundError(
      `${input.serviceName} is not yet priced for this device. Contact support for a custom quote.`,
    );
  }

  return {
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    serviceSlug: input.serviceSlug,
    partGrade: input.partGrade,
    partGradeLabel: PART_GRADE_META[input.partGrade].label,
    unitPrice: roundToCharmPrice(basis),
    compareAtPrice: null,
    durationMinutes: Math.round(sameTier._avg.durationMinutes ?? input.defaultDurationMinutes),
    warrantyMonths: Math.round(sameTier._avg.warrantyMonths ?? input.defaultWarrantyMonths),
    isEstimate: true,
    repairPriceId: null,
    notes: "Indicative price — confirmed free of charge after diagnosis.",
  };
}

/**
 * Repairs performed in a single visit share teardown and reassembly, so the
 * realistic total is the longest job plus 40% of each additional one.
 */
export function combineDurations(durations: number[]): number {
  if (durations.length === 0) return 0;
  const sorted = [...durations].sort((a, b) => b - a);
  const [longest, ...rest] = sorted;
  const extra = rest.reduce((sum, value) => sum + value * 0.4, 0);
  return Math.round((longest! + extra) / 5) * 5;
}


/**
 * All repair options for one model — powers the public repair-selection step.
 * Deliberately carries no prices: the site does not publish them.
 */
export async function getRepairOptionsForModel(modelId: string) {
  const model = await prisma.deviceModel.findUnique({
    where: { id: modelId },
    include: { brand: true },
  });
  if (!model || !model.isActive) throw new NotFoundError("That device is no longer listed.");

  const [services, prices] = await Promise.all([
    prisma.repairService.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.repairPrice.findMany({ where: { modelId, isAvailable: true } }),
  ]);

  const byService = new Map<string, typeof prices>();
  for (const price of prices) {
    const list = byService.get(price.serviceId) ?? [];
    list.push(price);
    byService.set(price.serviceId, list);
  }

  const gradeOrder: PartGrade[] = ["ORIGINAL", "PREMIUM", "STANDARD"];

  return {
    model: {
      id: model.id,
      name: model.name,
      slug: model.slug,
      tier: model.tier as DeviceTier,
      brandName: model.brand.name,
      brandSlug: model.brand.slug,
    },
    services: services.map((service) => {
      const options = (byService.get(service.id) ?? [])
        .sort(
          (a, b) =>
            gradeOrder.indexOf(a.partGrade as PartGrade) -
            gradeOrder.indexOf(b.partGrade as PartGrade),
        )
        .map((price) => ({
          id: price.id,
          partGrade: price.partGrade as PartGrade,
          partGradeLabel: PART_GRADE_META[price.partGrade as PartGrade].label,
          partGradeDescription: PART_GRADE_META[price.partGrade as PartGrade].description,
          durationMinutes: price.durationMinutes,
          warrantyMonths: price.warrantyMonths,
          notes: price.notes,
        }));

      return {
        id: service.id,
        name: service.name,
        slug: service.slug,
        shortDescription: service.shortDescription,
        iconKey: service.iconKey,
        symptoms: service.symptoms,
        options,
        available: options.length > 0,
        defaultDurationMinutes: service.defaultDurationMinutes,
        defaultWarrantyMonths: service.defaultWarrantyMonths,
      };
    }),
  };
}

export type RepairOptions = Awaited<ReturnType<typeof getRepairOptionsForModel>>;

/**
 * The quote as the public site may see it: the repairs, time and warranty, with
 * every monetary field removed. The full quote is still computed server-side
 * and stored on the booking for staff.
 */
export function toPublicQuote(quote: Quote) {
  return {
    model: quote.model,
    brand: quote.brand,
    lines: quote.lines.map((line) => ({
      serviceId: line.serviceId,
      serviceName: line.serviceName,
      serviceSlug: line.serviceSlug,
      partGrade: line.partGrade,
      partGradeLabel: line.partGradeLabel,
      durationMinutes: line.durationMinutes,
      warrantyMonths: line.warrantyMonths,
      notes: line.notes,
    })),
    estimatedDurationMinutes: quote.estimatedDurationMinutes,
    warrantyMonths: quote.warrantyMonths,
    serviceType: quote.serviceType,
  };
}

export type PublicQuote = ReturnType<typeof toPublicQuote>;
