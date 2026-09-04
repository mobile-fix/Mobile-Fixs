import "server-only";

import { prisma } from "@/lib/db";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import {
  createSession,
  fakeVerify,
  hashPassword,
  revokeAllSessions,
  setSessionCookie,
  verifyPassword,
  type SessionUser,
} from "@/lib/auth";
import { enforceRateLimit, resetRateLimit } from "@/lib/rate-limit";
import type { Role } from "@/lib/constants";

/** Staff authentication use-cases. */

export async function login(input: {
  email: string;
  password: string;
  ip: string;
  userAgent?: string | null;
}): Promise<SessionUser> {
  // Rate limit by IP *and* by email so neither a single host nor a distributed
  // attempt against one account can brute-force a password.
  enforceRateLimit("login", input.ip);
  enforceRateLimit("login", `email:${input.email}`);

  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    // Burn comparable time so a missing account is not detectable by timing.
    await fakeVerify();
    throw new UnauthorizedError("Incorrect email or password.");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Incorrect email or password.");

  if (!user.isActive) {
    throw new ForbiddenError("This account has been deactivated. Contact the account owner.");
  }

  const { token, expiresAt } = await createSession(user.id, {
    ipAddress: input.ip,
    userAgent: input.userAgent,
  });
  await setSessionCookie(token, expiresAt);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  resetRateLimit("login", input.ip);
  resetRateLimit("login", `email:${input.email}`);

  return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError();

  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Your current password is incorrect.");

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });

  // Force every other device to sign in again with the new credential.
  await revokeAllSessions(userId);
}

export async function listStaff() {
  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      _count: { select: { assignedBookings: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    assignedBookings: user._count.assignedBookings,
    createdAt: user.createdAt.toISOString(),
  }));
}

/** Technicians available for booking assignment. */
export async function listAssignableTechnicians() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
}
