import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { parseList, stringifyList } from "@/lib/json";
import { slugify } from "@/lib/utils";
import type { z } from "zod";
import type {
  brandInputSchema,
  modelInputSchema,
  priceInputSchema,
  serviceInputSchema,
} from "@/lib/validation";

/**
 * Device and service catalogue.
 *
 * Everything a customer can pick — brands, models, repair services and their
 * prices — lives here, and every admin mutation goes through these functions so
 * slug generation, uniqueness and cascade rules are enforced in exactly one place.
 */

// ── Public reads ────────────────────────────────────────────────────────────

export async function listBrands(options: { includeInactive?: boolean } = {}) {
  const brands = await prisma.deviceBrand.findMany({
    where: options.includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { models: options.includeInactive ? true : { where: { isActive: true } } },
      },
    },
  });

  return brands.map((brand) => ({
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    logoKey: brand.logoKey,
    isActive: brand.isActive,
    sortOrder: brand.sortOrder,
    modelCount: brand._count.models,
  }));
}

export async function listModels(options: {
  brandId?: string;
  brandSlug?: string;
  search?: string;
  limit?: number;
  includeInactive?: boolean;
}) {
  const { search } = options;

  const models = await prisma.deviceModel.findMany({
    where: {
      ...(options.includeInactive ? {} : { isActive: true, brand: { isActive: true } }),
      ...(options.brandId ? { brandId: options.brandId } : {}),
      ...(options.brandSlug ? { brand: { slug: options.brandSlug } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { aliases: { contains: search, mode: "insensitive" } },
              { brand: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { releaseYear: "desc" }, { name: "asc" }],
    take: options.limit ?? 60,
    include: { brand: { select: { id: true, name: true, slug: true, logoKey: true } } },
  });

  return models.map((model) => ({
    id: model.id,
    name: model.name,
    slug: model.slug,
    tier: model.tier,
    releaseYear: model.releaseYear,
    isActive: model.isActive,
    brandId: model.brandId,
    brandName: model.brand.name,
    brandSlug: model.brand.slug,
    logoKey: model.brand.logoKey,
    label: `${model.brand.name} ${model.name}`,
  }));
}

export async function getModelBySlug(brandSlug: string, modelSlug: string) {
  const model = await prisma.deviceModel.findFirst({
    where: { slug: modelSlug, brand: { slug: brandSlug } },
    include: { brand: true },
  });
  if (!model) throw new NotFoundError("We do not have that device listed yet.");
  return model;
}

export async function listServices(options: { includeInactive?: boolean } = {}) {
  const services = await prisma.repairService.findMany({
    where: options.includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return services.map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    shortDescription: service.shortDescription,
    description: service.description,
    symptoms: parseList(service.symptoms),
    iconKey: service.iconKey,
    defaultDurationMinutes: service.defaultDurationMinutes,
    defaultWarrantyMonths: service.defaultWarrantyMonths,
    isActive: service.isActive,
    sortOrder: service.sortOrder,
  }));
}

export type CatalogService = Awaited<ReturnType<typeof listServices>>[number];

export async function getServiceBySlug(slug: string) {
  const service = await prisma.repairService.findUnique({ where: { slug } });
  if (!service || !service.isActive) throw new NotFoundError("That repair service was not found.");
  return { ...service, symptoms: parseList(service.symptoms) };
}

/** Paginated price book powering the public pricing page and admin table. */
export async function listPrices(options: {
  brandSlug?: string;
  modelSearch?: string;
  serviceSlug?: string;
  partGrade?: string;
  search?: string;
  page: number;
  pageSize: number;
  includeUnavailable?: boolean;
}) {
  const where = {
    ...(options.includeUnavailable ? {} : { isAvailable: true }),
    ...(options.partGrade && options.partGrade !== "ALL" ? { partGrade: options.partGrade } : {}),
    ...(options.serviceSlug ? { service: { slug: options.serviceSlug } } : {}),
    model: {
      ...(options.includeUnavailable ? {} : { isActive: true }),
      ...(options.brandSlug ? { brand: { slug: options.brandSlug } } : {}),
      ...(options.modelSearch ? { name: { contains: options.modelSearch, mode: "insensitive" } } : {}),
    },
    ...(options.search
      ? {
          OR: [
            { model: { name: { contains: options.search, mode: "insensitive" } } },
            { model: { aliases: { contains: options.search, mode: "insensitive" } } },
            { model: { brand: { name: { contains: options.search, mode: "insensitive" } } } },
            { service: { name: { contains: options.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  } satisfies Prisma.RepairPriceWhereInput;

  const [total, rows] = await Promise.all([
    prisma.repairPrice.count({ where }),
    prisma.repairPrice.findMany({
      where,
      orderBy: [{ model: { brand: { sortOrder: "asc" } } }, { model: { sortOrder: "asc" } }, { price: "asc" }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
      include: {
        model: { include: { brand: { select: { name: true, slug: true, logoKey: true } } } },
        service: { select: { id: true, name: true, slug: true, iconKey: true } },
      },
    }),
  ]);

  return {
    total,
    page: options.page,
    pageSize: options.pageSize,
    totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
    items: rows.map((row) => ({
      id: row.id,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      partGrade: row.partGrade,
      durationMinutes: row.durationMinutes,
      warrantyMonths: row.warrantyMonths,
      isAvailable: row.isAvailable,
      notes: row.notes,
      modelId: row.modelId,
      serviceId: row.serviceId,
      modelName: row.model.name,
      modelSlug: row.model.slug,
      brandName: row.model.brand.name,
      brandSlug: row.model.brand.slug,
      logoKey: row.model.brand.logoKey,
      serviceName: row.service.name,
      serviceSlug: row.service.slug,
      serviceIconKey: row.service.iconKey,
    })),
  };
}

export type PriceListResult = Awaited<ReturnType<typeof listPrices>>;

// ── Admin writes: brands ────────────────────────────────────────────────────

type BrandInput = z.infer<typeof brandInputSchema>;

export async function createBrand(input: BrandInput) {
  const slug = slugify(input.name);
  const existing = await prisma.deviceBrand.findFirst({
    where: { OR: [{ slug }, { name: input.name }] },
  });
  if (existing) throw new ConflictError(`A brand called "${input.name}" already exists.`);

  return prisma.deviceBrand.create({
    data: {
      name: input.name,
      slug,
      logoKey: input.logoKey || slug,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
}

export async function updateBrand(id: string, input: Partial<BrandInput>) {
  const brand = await prisma.deviceBrand.findUnique({ where: { id } });
  if (!brand) throw new NotFoundError("Brand not found.");

  const slug = input.name ? slugify(input.name) : brand.slug;
  if (input.name && slug !== brand.slug) {
    const clash = await prisma.deviceBrand.findFirst({
      where: { slug, NOT: { id } },
    });
    if (clash) throw new ConflictError(`A brand called "${input.name}" already exists.`);
  }

  return prisma.deviceBrand.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name, slug } : {}),
      ...(input.logoKey !== undefined ? { logoKey: input.logoKey } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

/**
 * Brands are deactivated, not deleted, when they have models — historical
 * bookings must keep resolving. A brand with no models can be removed outright.
 */
export async function deleteBrand(id: string) {
  const modelCount = await prisma.deviceModel.count({ where: { brandId: id } });
  if (modelCount > 0) {
    return prisma.deviceBrand.update({ where: { id }, data: { isActive: false } });
  }
  return prisma.deviceBrand.delete({ where: { id } });
}

// ── Admin writes: models ────────────────────────────────────────────────────

type ModelInput = z.infer<typeof modelInputSchema>;

export async function createModel(input: ModelInput) {
  const brand = await prisma.deviceBrand.findUnique({ where: { id: input.brandId } });
  if (!brand) throw new NotFoundError("Choose an existing brand for this model.");

  const slug = slugify(input.name);
  const existing = await prisma.deviceModel.findUnique({
    where: { brandId_slug: { brandId: input.brandId, slug } },
  });
  if (existing) throw new ConflictError(`${brand.name} ${input.name} already exists.`);

  return prisma.deviceModel.create({
    data: {
      brandId: input.brandId,
      name: input.name,
      slug,
      releaseYear: input.releaseYear ?? null,
      tier: input.tier,
      aliases: input.aliases ?? null,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updateModel(id: string, input: Partial<ModelInput>) {
  const model = await prisma.deviceModel.findUnique({ where: { id } });
  if (!model) throw new NotFoundError("Model not found.");

  const slug = input.name ? slugify(input.name) : model.slug;
  const brandId = input.brandId ?? model.brandId;

  if ((input.name && slug !== model.slug) || (input.brandId && brandId !== model.brandId)) {
    const clash = await prisma.deviceModel.findFirst({
      where: { brandId, slug, NOT: { id } },
    });
    if (clash) throw new ConflictError("Another model with that name already exists for this brand.");
  }

  return prisma.deviceModel.update({
    where: { id },
    data: {
      ...(input.brandId ? { brandId: input.brandId } : {}),
      ...(input.name ? { name: input.name, slug } : {}),
      ...(input.releaseYear !== undefined ? { releaseYear: input.releaseYear ?? null } : {}),
      ...(input.tier ? { tier: input.tier } : {}),
      ...(input.aliases !== undefined ? { aliases: input.aliases ?? null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
}

export async function deleteModel(id: string) {
  const bookingCount = await prisma.booking.count({ where: { modelId: id } });
  if (bookingCount > 0) {
    // Preserve referential history; hide it from customers instead.
    return prisma.deviceModel.update({ where: { id }, data: { isActive: false } });
  }
  return prisma.deviceModel.delete({ where: { id } });
}

/**
 * Copies an entire price book from one model to another — the practical way to
 * onboard a new device without re-keying dozens of rows by hand.
 */
export async function cloneModelPrices(sourceModelId: string, targetModelId: string) {
  const [source, target] = await Promise.all([
    prisma.deviceModel.findUnique({ where: { id: sourceModelId } }),
    prisma.deviceModel.findUnique({ where: { id: targetModelId } }),
  ]);
  if (!source) throw new NotFoundError("Source device not found.");
  if (!target) throw new NotFoundError("Target device not found.");
  if (sourceModelId === targetModelId) {
    throw new ConflictError("Pick a different device to copy prices from.");
  }

  const rows = await prisma.repairPrice.findMany({ where: { modelId: sourceModelId } });
  if (rows.length === 0) throw new NotFoundError("That device has no prices to copy.");

  const existing = await prisma.repairPrice.findMany({
    where: { modelId: targetModelId },
    select: { serviceId: true, partGrade: true },
  });
  const taken = new Set(existing.map((row) => `${row.serviceId}:${row.partGrade}`));

  const toCreate = rows
    .filter((row) => !taken.has(`${row.serviceId}:${row.partGrade}`))
    .map((row) => ({
      modelId: targetModelId,
      serviceId: row.serviceId,
      partGrade: row.partGrade,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      durationMinutes: row.durationMinutes,
      warrantyMonths: row.warrantyMonths,
      isAvailable: row.isAvailable,
      notes: row.notes,
    }));

  if (toCreate.length === 0) {
    throw new ConflictError("That device already has prices for every service.");
  }

  await prisma.repairPrice.createMany({ data: toCreate });
  return { created: toCreate.length, skipped: rows.length - toCreate.length };
}

// ── Admin writes: services ──────────────────────────────────────────────────

type ServiceInput = z.infer<typeof serviceInputSchema>;

export async function createService(input: ServiceInput) {
  const slug = slugify(input.name);
  const existing = await prisma.repairService.findFirst({
    where: { OR: [{ slug }, { name: input.name }] },
  });
  if (existing) throw new ConflictError(`A service called "${input.name}" already exists.`);

  return prisma.repairService.create({
    data: {
      name: input.name,
      slug,
      shortDescription: input.shortDescription,
      description: input.description,
      symptoms: stringifyList(input.symptoms),
      iconKey: input.iconKey,
      defaultDurationMinutes: input.defaultDurationMinutes,
      defaultWarrantyMonths: input.defaultWarrantyMonths,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
}

export async function updateService(id: string, input: Partial<ServiceInput>) {
  const service = await prisma.repairService.findUnique({ where: { id } });
  if (!service) throw new NotFoundError("Service not found.");

  const slug = input.name ? slugify(input.name) : service.slug;
  if (input.name && slug !== service.slug) {
    const clash = await prisma.repairService.findFirst({ where: { slug, NOT: { id } } });
    if (clash) throw new ConflictError(`A service called "${input.name}" already exists.`);
  }

  return prisma.repairService.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name, slug } : {}),
      ...(input.shortDescription ? { shortDescription: input.shortDescription } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.symptoms ? { symptoms: stringifyList(input.symptoms) } : {}),
      ...(input.iconKey ? { iconKey: input.iconKey } : {}),
      ...(input.defaultDurationMinutes !== undefined
        ? { defaultDurationMinutes: input.defaultDurationMinutes }
        : {}),
      ...(input.defaultWarrantyMonths !== undefined
        ? { defaultWarrantyMonths: input.defaultWarrantyMonths }
        : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

export async function deleteService(id: string) {
  const used = await prisma.bookingItem.count({ where: { serviceId: id } });
  if (used > 0) {
    return prisma.repairService.update({ where: { id }, data: { isActive: false } });
  }
  return prisma.repairService.delete({ where: { id } });
}

// ── Admin writes: prices ────────────────────────────────────────────────────

type PriceInput = z.infer<typeof priceInputSchema>;

export async function upsertPrice(input: PriceInput) {
  const [model, service] = await Promise.all([
    prisma.deviceModel.findUnique({ where: { id: input.modelId } }),
    prisma.repairService.findUnique({ where: { id: input.serviceId } }),
  ]);
  if (!model) throw new NotFoundError("Device not found.");
  if (!service) throw new NotFoundError("Service not found.");

  return prisma.repairPrice.upsert({
    where: {
      modelId_serviceId_partGrade: {
        modelId: input.modelId,
        serviceId: input.serviceId,
        partGrade: input.partGrade,
      },
    },
    create: {
      modelId: input.modelId,
      serviceId: input.serviceId,
      partGrade: input.partGrade,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      durationMinutes: input.durationMinutes,
      warrantyMonths: input.warrantyMonths,
      isAvailable: input.isAvailable,
      notes: input.notes ?? null,
    },
    update: {
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? null,
      durationMinutes: input.durationMinutes,
      warrantyMonths: input.warrantyMonths,
      isAvailable: input.isAvailable,
      notes: input.notes ?? null,
    },
  });
}

export async function updatePrice(id: string, input: Partial<PriceInput>) {
  const price = await prisma.repairPrice.findUnique({ where: { id } });
  if (!price) throw new NotFoundError("Price not found.");

  return prisma.repairPrice.update({
    where: { id },
    data: {
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.compareAtPrice !== undefined ? { compareAtPrice: input.compareAtPrice ?? null } : {}),
      ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
      ...(input.warrantyMonths !== undefined ? { warrantyMonths: input.warrantyMonths } : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
      ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
    },
  });
}

export async function deletePrice(id: string) {
  const price = await prisma.repairPrice.findUnique({ where: { id } });
  if (!price) throw new NotFoundError("Price not found.");
  return prisma.repairPrice.delete({ where: { id } });
}

/** Applies a percentage adjustment across many prices in one transaction. */
export async function bulkAdjustPrices(ids: string[], adjustPercent: number) {
  const rows = await prisma.repairPrice.findMany({ where: { id: { in: ids } } });
  if (rows.length === 0) throw new NotFoundError("No matching prices to update.");

  const factor = 1 + adjustPercent / 100;
  await prisma.$transaction(
    rows.map((row) =>
      prisma.repairPrice.update({
        where: { id: row.id },
        data: { price: Math.max(0, Math.round((row.price * factor) / 10) * 10) },
      }),
    ),
  );
  return { updated: rows.length };
}
