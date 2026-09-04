/**
 * Auth constants safe for every runtime.
 *
 * `src/lib/auth.ts` is server-only (it imports Prisma and bcrypt, which cannot
 * run on the edge). Middleware needs the cookie name and nothing else, so it
 * lives here rather than forcing the whole auth module into the edge bundle.
 */
export const SESSION_COOKIE = "mmf_session";
