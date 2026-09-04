import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Authenticated admin layout — the real access gate.
 *
 * Runs on the server for every page underneath it. The edge middleware only
 * checks that a cookie exists; this resolves the actual session against the
 * database, so an expired, revoked or forged token lands back on the login page.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  // Sidebar badge counts, fetched once for the whole authenticated area.
  const [pendingCount, unreadMessages] = await Promise.all([
    prisma.booking.count({ where: { status: "BOOKING_RECEIVED" } }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
  ]);

  return (
    <AdminShell user={user} pendingCount={pendingCount} unreadMessages={unreadMessages}>
      {children}
    </AdminShell>
  );
}
