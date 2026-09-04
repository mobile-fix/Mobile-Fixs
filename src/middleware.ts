import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth-shared";

/**
 * Edge redirect for the admin area.
 *
 * This is a convenience only — it checks whether a session cookie is *present*,
 * which is all the edge runtime can do without a database. Real authentication
 * and authorisation happen server-side in the admin layout and in every
 * `/api/admin/*` route via `requirePermission`. A forged cookie gets past this
 * middleware and straight into a 401.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  // Signed-in staff hitting the login page go to the dashboard instead.
  if (pathname === "/admin/login" && hasSessionCookie) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    // Preserve the destination so sign-in returns the user where they were going.
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
