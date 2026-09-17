/**
 * Database seed.
 *
 * Populates the catalogue (brands, models, services and ~1,400 price rows), a
 * staff roster, and 90 days of illustrative bookings so the admin dashboard and
 * analytics have real data to render on a fresh install.
 *
 * Idempotent: safe to run repeatedly. Catalogue rows are upserted; demo bookings
 * are only generated when the bookings table is empty, so re-seeding never
 * inflates the numbers.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { BRANDS, CITIES, DEMO_CUSTOMERS, DEMO_REVIEWS, SERVICES } from "./seed-data";
import { PART_GRADE_META, TIME_SLOTS, type PartGrade } from "../src/lib/constants";

const prisma = new PrismaClient();

// ── Deterministic PRNG ──────────────────────────────────────────────────────
// A fixed seed keeps demo data stable across machines, so screenshots, tests and
// reviews all describe the same dataset.

let randomState = 0x2f6e2b1;
function random(): number {
  randomState ^= randomState << 13;
  randomState ^= randomState >>> 17;
  randomState ^= randomState << 5;
  return ((randomState >>> 0) % 1_000_000) / 1_000_000;
}
function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}
function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}
function weightedPick<T>(entries: Array<[T, number]>): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1]![0];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function roundToCharmPrice(amount: number): number {
  if (amount <= 0) return 0;
  const rounded = Math.round(amount / 50) * 50;
  return Math.max(49, rounded - 1);
}

const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const usedReferences = new Set<string>();
function makeReference(): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = "";
    for (let i = 0; i < 6; i += 1) code += REFERENCE_ALPHABET[randomInt(0, REFERENCE_ALPHABET.length - 1)];
    const reference = `MMF-${code}`;
    if (!usedReferences.has(reference)) {
      usedReferences.add(reference);
      return reference;
    }
  }
  throw new Error("Could not allocate a unique demo reference");
}

function phoneFor(index: number): string {
  // Deterministic, clearly-synthetic numbers in the valid 6-9 leading range.
  return String(9000000000 + index * 137171).slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// ── Seed steps ──────────────────────────────────────────────────────────────

async function seedStaff() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@mymobifix.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2024";
  const name = process.env.SEED_ADMIN_NAME ?? "MyMobiFix Admin";

  if (!SEED_DEMO_DATA && password === "ChangeMe!2024") {
    console.warn(
      "  WARNING: the owner account is using the default password published in the README.\n" +
        "           Set SEED_ADMIN_PASSWORD before seeding any database the public can reach.",
    );
  }

  // The manager and technician accounts exist to demonstrate the role model.
  // Their passwords are published in the README, so on a real deployment they
  // would be working logins to the dashboard — create them for demos only.
  const roster = [
    { email, name, role: "OWNER", password },
    ...(SEED_DEMO_DATA
      ? [
          { email: "manager@mymobifix.com", name: "Priyanka Deshmukh", role: "MANAGER", password: "Manager!2024" },
          { email: "tech1@mymobifix.com", name: "Imran Sheikh", role: "TECHNICIAN", password: "Technician!2024" },
          { email: "tech2@mymobifix.com", name: "Ravi Kumar", role: "TECHNICIAN", password: "Technician!2024" },
        ]
      : []),
  ];

  const users = [];
  for (const member of roster) {
    const passwordHash = await bcrypt.hash(member.password, 12);
    const user = await prisma.user.upsert({
      where: { email: member.email },
      create: {
        email: member.email,
        name: member.name,
        role: member.role,
        passwordHash,
        isActive: true,
      },
      // Keep the role and name in sync but never silently reset a changed password.
      update: { name: member.name, role: member.role, isActive: true },
    });
    users.push(user);
  }

  console.log(`  staff: ${users.length} accounts`);
  return users;
}

async function seedServices() {
  const created = [];
  for (const service of SERVICES) {
    const slug = slugify(service.name);
    const row = await prisma.repairService.upsert({
      where: { slug },
      create: {
        name: service.name,
        slug,
        shortDescription: service.shortDescription,
        description: service.description,
        symptoms: JSON.stringify(service.symptoms),
        iconKey: service.iconKey,
        defaultDurationMinutes: service.durationMinutes,
        defaultWarrantyMonths: service.warrantyMonths,
        sortOrder: service.sortOrder,
        isActive: true,
      },
      update: {
        name: service.name,
        shortDescription: service.shortDescription,
        description: service.description,
        symptoms: JSON.stringify(service.symptoms),
        iconKey: service.iconKey,
        defaultDurationMinutes: service.durationMinutes,
        defaultWarrantyMonths: service.warrantyMonths,
        sortOrder: service.sortOrder,
      },
    });
    created.push({ row, seed: service });
  }
  console.log(`  services: ${created.length}`);
  return created;
}

async function seedCatalogue(services: Awaited<ReturnType<typeof seedServices>>) {
  let modelCount = 0;
  const priceRows: Array<{
    modelId: string;
    serviceId: string;
    partGrade: string;
    price: number;
    compareAtPrice: number | null;
    durationMinutes: number;
    warrantyMonths: number;
    isAvailable: boolean;
    notes: string | null;
  }> = [];

  const modelIndex: Array<{ id: string; name: string; brandName: string; tier: string }> = [];

  for (const brandSeed of BRANDS) {
    const brandSlug = slugify(brandSeed.name);
    const brand = await prisma.deviceBrand.upsert({
      where: { slug: brandSlug },
      create: {
        name: brandSeed.name,
        slug: brandSlug,
        logoKey: brandSeed.logoKey,
        sortOrder: brandSeed.sortOrder,
        isActive: true,
      },
      update: { name: brandSeed.name, logoKey: brandSeed.logoKey, sortOrder: brandSeed.sortOrder },
    });

    for (const [position, modelSeed] of brandSeed.models.entries()) {
      const modelSlug = slugify(modelSeed.name);
      const model = await prisma.deviceModel.upsert({
        where: { brandId_slug: { brandId: brand.id, slug: modelSlug } },
        create: {
          brandId: brand.id,
          name: modelSeed.name,
          slug: modelSlug,
          releaseYear: modelSeed.year,
          tier: modelSeed.tier,
          aliases: modelSeed.aliases ?? null,
          sortOrder: position,
          isActive: true,
        },
        update: {
          name: modelSeed.name,
          releaseYear: modelSeed.year,
          tier: modelSeed.tier,
          aliases: modelSeed.aliases ?? null,
          sortOrder: position,
        },
      });
      modelCount += 1;
      modelIndex.push({
        id: model.id,
        name: model.name,
        brandName: brand.name,
        tier: modelSeed.tier,
      });

      if (!brandSeed.priced) continue;

      for (const { row: serviceRow, seed: serviceSeed } of services) {
        const basePrice = serviceSeed.base[modelSeed.tier];

        for (const grade of serviceSeed.grades) {
          const meta = PART_GRADE_META[grade as PartGrade];
          const price =
            basePrice === 0
              ? 0
              : roundToCharmPrice(basePrice * modelSeed.index * meta.multiplier);

          // A modest promotional compare-at price on premium screen and battery
          // work, which is where customers actually shop around.
          const promotable =
            grade === "PREMIUM" &&
            (serviceSeed.name === "Screen Replacement" || serviceSeed.name === "Battery Replacement");

          priceRows.push({
            modelId: model.id,
            serviceId: serviceRow.id,
            partGrade: grade,
            price,
            compareAtPrice: promotable && price > 0 ? roundToCharmPrice(price * 1.18) : null,
            durationMinutes: serviceSeed.durationMinutes,
            warrantyMonths: Math.max(
              0,
              Math.min(24, serviceSeed.warrantyMonths + meta.warrantyBonusMonths),
            ),
            isAvailable: true,
            notes: null,
          });
        }
      }
    }
  }

  // Postgres supports ON CONFLICT DO NOTHING, so re-seeding is idempotent
  // without a read-then-filter round trip.
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < priceRows.length; i += CHUNK) {
    const result = await prisma.repairPrice.createMany({
      data: priceRows.slice(i, i + CHUNK),
      skipDuplicates: true,
    });
    inserted += result.count;
  }

  console.log(`  brands: ${BRANDS.length}, models: ${modelCount}, prices: +${inserted} (of ${priceRows.length})`);
  return modelIndex;
}

async function seedSettings() {
  const entries: Array<[string, unknown]> = [
    ["service_fees", { STORE_VISIT: 0, PICKUP_DELIVERY: 199, AT_HOME: 299 }],
    ["booking_window_days", 21],
    ["max_bookings_per_slot", 8],
  ];

  for (const [key, value] of entries) {
    const encoded = JSON.stringify({ v: value });
    await prisma.setting.upsert({
      where: { key },
      create: { key, value: encoded },
      update: { value: encoded },
    });
  }
  console.log(`  settings: ${entries.length}`);
}

async function seedDemoBookings(
  models: Array<{ id: string; name: string; brandName: string; tier: string }>,
  staff: Array<{ id: string; role: string }>,
) {
  const existing = await prisma.booking.count();
  if (existing > 0) {
    console.log(`  bookings: skipped (${existing} already present)`);
    return;
  }

  const technicians = staff.filter((member) => member.role === "TECHNICIAN");
  const manager = staff.find((member) => member.role === "MANAGER") ?? staff[0]!;
  const pricedModels = models.filter((model) => model.brandName !== "Other");

  // Customers
  const customers = [];
  for (const [index, fullName] of DEMO_CUSTOMERS.entries()) {
    const location = CITIES[index % CITIES.length]!;
    const customer = await prisma.customer.create({
      data: {
        fullName,
        phone: phoneFor(index + 1),
        email: `${slugify(fullName)}@example.com`,
        addressLine: `${randomInt(1, 240)} ${pick(["Park Avenue", "MG Road", "Sector 21", "Lake View Road", "Church Street"])}`,
        city: location.city,
        state: location.state,
        postalCode: location.postalCode,
        preferredContact: weightedPick([
          ["PHONE", 5],
          ["WHATSAPP", 3],
          ["EMAIL", 2],
        ]),
      },
    });
    customers.push(customer);
  }

  const services = await prisma.repairService.findMany({ where: { isActive: true } });
  const serviceById = new Map(services.map((service) => [service.id, service]));

  const statusPlan: Array<[string, number]> = [
    ["COMPLETED", 58],
    ["READY_FOR_PICKUP", 6],
    ["QUALITY_CHECK", 5],
    ["REPAIR_IN_PROGRESS", 8],
    ["DIAGNOSIS", 5],
    ["DEVICE_RECEIVED", 5],
    ["BOOKING_RECEIVED", 8],
    ["CANCELLED", 5],
  ];

  const flowOrder = [
    "BOOKING_RECEIVED",
    "DEVICE_RECEIVED",
    "DIAGNOSIS",
    "REPAIR_IN_PROGRESS",
    "QUALITY_CHECK",
    "READY_FOR_PICKUP",
    "COMPLETED",
  ];

  const TOTAL = 96;
  let created = 0;

  for (let i = 0; i < TOTAL; i += 1) {
    const model = pick(pricedModels);
    const customer = pick(customers);
    const status = weightedPick(statusPlan);

    // Bookings spread across the last 90 days; recent ones are more likely to be
    // mid-flow, older ones completed.
    const daysAgo = status === "BOOKING_RECEIVED" ? randomInt(0, 3) : randomInt(0, 89);
    const createdAt = addDays(new Date(), -daysAgo);
    createdAt.setHours(randomInt(9, 19), pick([0, 15, 30, 45]), 0, 0);

    const prices = await prisma.repairPrice.findMany({
      where: { modelId: model.id, isAvailable: true, price: { gt: 0 } },
    });
    if (prices.length === 0) continue;

    // One repair usually, occasionally two.
    const lineCount = random() < 0.22 ? 2 : 1;
    const chosen: typeof prices = [];
    const seenServices = new Set<string>();
    for (let attempt = 0; attempt < 12 && chosen.length < lineCount; attempt += 1) {
      const candidate = pick(prices);
      if (seenServices.has(candidate.serviceId)) continue;
      seenServices.add(candidate.serviceId);
      chosen.push(candidate);
    }
    if (chosen.length === 0) continue;

    const serviceType = weightedPick([
      ["AT_HOME", 5],
      ["STORE_VISIT", 4],
      ["PICKUP_DELIVERY", 3],
    ]);
    const serviceFee = serviceType === "STORE_VISIT" ? 0 : serviceType === "AT_HOME" ? 299 : 199;
    const subtotal = chosen.reduce((sum, price) => sum + price.price, 0);
    const discount = random() < 0.15 ? Math.round((subtotal * 0.1) / 10) * 10 : 0;
    const total = Math.max(0, subtotal + serviceFee - discount);

    const durations = chosen.map((price) => price.durationMinutes).sort((a, b) => b - a);
    const estimatedDurationMinutes =
      Math.round((durations[0]! + durations.slice(1).reduce((s, d) => s + d * 0.4, 0)) / 5) * 5;

    const slot = pick(TIME_SLOTS);
    const scheduledFor = new Date(createdAt);
    scheduledFor.setDate(scheduledFor.getDate() + randomInt(0, 2));
    scheduledFor.setHours(slot.startHour, 0, 0, 0);

    const requiresAddress = serviceType !== "STORE_VISIT";
    const completed = status === "COMPLETED";
    const cancelled = status === "CANCELLED";
    const completedAt = completed ? addDays(createdAt, randomInt(0, 2)) : null;

    const booking = await prisma.booking.create({
      data: {
        reference: makeReference(),
        customerId: customer.id,
        modelId: model.id,
        deviceBrandName: model.brandName,
        deviceModelName: model.name,
        serviceType,
        status,
        addressLine: requiresAddress ? customer.addressLine : null,
        city: requiresAddress ? customer.city : null,
        postalCode: requiresAddress ? customer.postalCode : null,
        problemDescription: pick([
          "Dropped it on the driveway, glass is cracked across the top half.",
          "Battery drains from 100% to 20% in about three hours.",
          "Charging only works if I hold the cable at an angle.",
          "Callers say I sound muffled unless I use speakerphone.",
          "Rear camera is blurry in every shot after a fall.",
          "Phone got splashed at the pool and restarts randomly.",
          "Screen is fine but touch does not work on the left edge.",
        ]),
        preferredContact: customer.preferredContact,
        subtotal,
        discount,
        serviceFee,
        total,
        estimatedDurationMinutes,
        assignedTechnicianId:
          technicians.length > 0 && status !== "BOOKING_RECEIVED" ? pick(technicians).id : null,
        completedAt,
        cancelledAt: cancelled ? addDays(createdAt, 1) : null,
        cancellationReason: cancelled
          ? pick([
              "Customer decided to upgrade the device instead.",
              "Repair cost exceeded the value of the device.",
              "Customer was unreachable at the scheduled time.",
            ])
          : null,
        createdAt,
        items: {
          create: chosen.map((price) => ({
            serviceId: price.serviceId,
            repairPriceId: price.id,
            serviceName: serviceById.get(price.serviceId)?.name ?? "Repair",
            partGrade: price.partGrade,
            unitPrice: price.price,
            quantity: 1,
            lineTotal: price.price,
            durationMinutes: price.durationMinutes,
            warrantyMonths: price.warrantyMonths,
          })),
        },
        appointment: {
          create: {
            scheduledFor,
            slotLabel: slot.label,
            status: completed ? "COMPLETED" : cancelled ? "CANCELLED" : "SCHEDULED",
          },
        },
        payments: {
          create: {
            amount: total,
            method: weightedPick([
              ["UPI", 5],
              ["CASH", 3],
              ["CARD", 2],
            ]),
            status: completed ? "PAID" : cancelled ? "FAILED" : "PENDING",
            paidAt: completed ? completedAt : null,
          },
        },
      },
    });

    // Build a plausible audit trail up to the current status.
    const targetIndex = cancelled ? 1 : flowOrder.indexOf(status);
    const history: Array<{
      fromStatus: string | null;
      toStatus: string;
      note: string | null;
      createdAt: Date;
    }> = [];

    let cursor = new Date(createdAt);
    for (let step = 0; step <= Math.max(0, targetIndex); step += 1) {
      history.push({
        fromStatus: step === 0 ? null : flowOrder[step - 1]!,
        toStatus: flowOrder[step]!,
        note: step === 0 ? "Booking received. We will confirm your appointment shortly." : null,
        createdAt: new Date(cursor),
      });
      cursor = new Date(cursor.getTime() + randomInt(30, 240) * 60 * 1000);
    }

    if (cancelled) {
      history.push({
        fromStatus: flowOrder[Math.max(0, targetIndex)]!,
        toStatus: "CANCELLED",
        note: "Booking cancelled.",
        createdAt: new Date(cursor),
      });
    }

    await prisma.repairStatusHistory.createMany({
      data: history.map((entry) => ({
        bookingId: booking.id,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        note: entry.note,
        changedById: entry.fromStatus === null ? null : manager.id,
        isPublic: true,
        createdAt: entry.createdAt,
      })),
    });

    created += 1;
  }

  console.log(`  bookings: ${created} demo records across 90 days`);
  return created;
}

async function seedReviews() {
  const existing = await prisma.review.count();
  if (existing > 0) {
    console.log(`  reviews: skipped (${existing} already present)`);
    return;
  }

  // Attach reviews to genuinely completed bookings where possible, so the
  // "Verified repair" badge is truthful rather than decorative.
  const completed = await prisma.booking.findMany({
    where: { status: "COMPLETED" },
    take: DEMO_REVIEWS.length,
    orderBy: { completedAt: "desc" },
    select: { id: true, customerId: true, deviceBrandName: true, deviceModelName: true },
  });

  for (const [index, review] of DEMO_REVIEWS.entries()) {
    const booking = completed[index];
    await prisma.review.create({
      data: {
        bookingId: booking?.id ?? null,
        customerId: booking?.customerId ?? null,
        authorName: review.authorName,
        rating: review.rating,
        title: review.title,
        body: review.body,
        deviceLabel: booking
          ? `${booking.deviceBrandName} ${booking.deviceModelName}`
          : review.deviceLabel,
        isVerified: Boolean(booking),
        isPublished: true,
        createdAt: addDays(new Date(), -randomInt(2, 80)),
      },
    });
  }
  console.log(`  reviews: ${DEMO_REVIEWS.length}`);
}

async function seedContactMessages() {
  const existing = await prisma.contactMessage.count();
  if (existing > 0) {
    console.log(`  messages: skipped (${existing} already present)`);
    return;
  }

  const messages = [
    {
      name: "Deepak Anand",
      email: "deepak.anand@example.com",
      phone: "9876543210",
      subject: "Do you repair tablets as well?",
      message:
        "I have an iPad with a cracked screen. The site only lists phones — do you handle tablets, and if so what would a 10.9-inch screen cost?",
      status: "NEW",
    },
    {
      name: "Lakshmi Iyer",
      email: "lakshmi.iyer@example.com",
      phone: "9812345678",
      subject: "Bulk repair for office devices",
      message:
        "We have around fifteen company phones needing battery replacements. Is there a corporate rate, and can your technician come to our office to do them in one visit?",
      status: "READ",
    },
    {
      name: "Ganesh Prabhu",
      email: "ganesh.p@example.com",
      phone: null,
      subject: "Warranty question",
      message:
        "My screen was replaced two months ago and there is a faint line appearing at the edge. Is that covered under the six-month warranty and how do I raise a claim?",
      status: "RESOLVED",
    },
  ];

  await prisma.contactMessage.createMany({ data: messages });
  console.log(`  messages: ${messages.length}`);
}

/**
 * Demo data (fake customers, bookings, reviews, enquiries) is opt-in.
 *
 * A production seed should establish the catalogue and the owner account and
 * nothing else: invented testimonials and phantom bookings must never reach a
 * live site. Set SEED_DEMO_DATA=true to populate a showcase environment.
 */
const SEED_DEMO_DATA = process.env.SEED_DEMO_DATA === "true";

async function main() {
  console.log(`Seeding MyMobiFix (demo data: ${SEED_DEMO_DATA ? "on" : "off"})...`);

  const staff = await seedStaff();
  await seedSettings();
  const services = await seedServices();
  const models = await seedCatalogue(services);

  if (SEED_DEMO_DATA) {
    await seedDemoBookings(models, staff);
    await seedReviews();
    await seedContactMessages();
  } else {
    console.log("  demo bookings/reviews/messages: skipped (SEED_DEMO_DATA is not 'true')");
  }

  const counts = {
    brands: await prisma.deviceBrand.count(),
    models: await prisma.deviceModel.count(),
    services: await prisma.repairService.count(),
    prices: await prisma.repairPrice.count(),
    customers: await prisma.customer.count(),
    bookings: await prisma.booking.count(),
    reviews: await prisma.review.count(),
  };

  console.log("\nSeed complete:");
  console.table(counts);
  console.log(
    `\nAdmin sign-in: ${process.env.SEED_ADMIN_EMAIL ?? "admin@mymobifix.com"} / ${
      process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2024"
    }`,
  );
  console.log("Change this password immediately on any real deployment.\n");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
