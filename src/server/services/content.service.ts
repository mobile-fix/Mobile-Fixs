import "server-only";

import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

/** Reviews and contact messages. */

export async function listPublishedReviews(limit = 9) {
  const reviews = await prisma.review.findMany({
    where: { isPublished: true },
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });

  return reviews.map((review) => ({
    id: review.id,
    authorName: review.authorName,
    rating: review.rating,
    title: review.title,
    body: review.body,
    deviceLabel: review.deviceLabel,
    isVerified: review.isVerified,
    createdAt: review.createdAt.toISOString(),
  }));
}

export type PublicReview = Awaited<ReturnType<typeof listPublishedReviews>>[number];

export async function createContactMessage(input: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  return prisma.contactMessage.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      subject: input.subject,
      message: input.message,
      status: "NEW",
    },
    select: { id: true, createdAt: true },
  });
}

export async function listContactMessages(options: {
  status?: string;
  page: number;
  pageSize: number;
}) {
  const where = options.status && options.status !== "ALL" ? { status: options.status } : {};

  const [total, rows] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
  ]);

  return {
    total,
    page: options.page,
    pageSize: options.pageSize,
    totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function updateMessageStatus(id: string, status: string) {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) throw new NotFoundError("Message not found.");
  return prisma.contactMessage.update({ where: { id }, data: { status } });
}
