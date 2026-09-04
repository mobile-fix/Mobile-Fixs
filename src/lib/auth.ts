import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "./db";
import { serverEnv } from "./env";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { hasPermission, type Permission, type Role } from "./constants";
import { SESSION_COOKIE } from "./auth-shared";

/**
 * Authentication for staff accounts.
 *
 * Design: a short signed JWT in an httpOnly cookie carries only a session id
 * (`jti`); every authorisation decision then loads the live Session + User rows.
 * That means revocation, deactivation and role changes take effect immediately
 * rather than at token expiry, and the cookie itself is useless if replayed after
 * logout.
 */

export { SESSION_COOKIE };

const BCRYPT_ROUNDS = 12;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

// ── Password hashing ────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Constant-ish-time dummy comparison used when an email does not exist, so that
 * response timing does not reveal which accounts are registered.
 */
const DUMMY_HASH = "$2a$12$C6UzMDM.H6dfI/f/IKcEe.7Q8GLQ9v0KZ0KTzQPKuHrq4mE3n1w0S";

export async function fakeVerify(): Promise<void> {
  await bcrypt.compare("not-a-real-password", DUMMY_HASH);
}

// ── Token helpers ───────────────────────────────────────────────────────────

function secretKey(): Uint8Array {
  return new TextEncoder().encode(serverEnv.sessionSecret);
}

async function signSessionToken(tokenId: string, expiresAt: Date): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setJti(tokenId)
    .setIssuedAt()
    .setIssuer("mymobifix")
    .setAudience("mymobifix-admin")
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
}

async function readTokenId(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "mymobifix",
      audience: "mymobifix-admin",
      algorithms: ["HS256"],
    });
    return typeof payload.jti === "string" ? payload.jti : null;
  } catch {
    return null;
  }
}

// ── Session lifecycle ───────────────────────────────────────────────────────

export async function createSession(
  userId: string,
  context: { userAgent?: string | null; ipAddress?: string | null } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const tokenId = randomUUID();
  const expiresAt = new Date(Date.now() + serverEnv.sessionMaxAge * 1000);

  await prisma.session.create({
    data: {
      tokenId,
      userId,
      expiresAt,
      userAgent: context.userAgent?.slice(0, 255) ?? null,
      ipAddress: context.ipAddress?.slice(0, 64) ?? null,
    },
  });

  const token = await signSessionToken(tokenId, expiresAt);
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: serverEnv.isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: serverEnv.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Resolves the signed-in staff member, or null.
 * Never throws — callers decide whether absence is an error.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenId = await readTokenId(token);
  if (!tokenId) return null;

  const session = await prisma.session.findUnique({
    where: { tokenId },
    select: {
      expiresAt: true,
      revokedAt: true,
      user: { select: { id: true, email: true, name: true, role: true, isActive: true } },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  if (!session.user.isActive) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role,
  };
}

/** Throws `UnauthorizedError` when there is no valid session. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

/**
 * Throws unless the signed-in user holds `permission`.
 * Every admin API route calls this — route hiding in the UI is presentation
 * only and is never relied on for access control.
 */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    throw new ForbiddenError(`Your ${user.role.toLowerCase()} role cannot perform this action.`);
  }
  return user;
}

export async function revokeCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return;

  const tokenId = await readTokenId(token);
  if (!tokenId) return;

  await prisma.session
    .updateMany({ where: { tokenId, revokedAt: null }, data: { revokedAt: new Date() } })
    .catch(() => undefined);
}

/** Invalidates every session for a user — used on password change or lockout. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Housekeeping: drop rows for sessions that expired more than a day ago. */
export async function purgeExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } },
  });
  return result.count;
}
