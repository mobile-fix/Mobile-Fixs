import type { Metadata } from "next";

import { BookingsTable } from "@/components/admin/BookingsTable";
import { requirePermission } from "@/lib/auth";

export const metadata: Metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // Authorisation is enforced here, on the server, not by hiding the nav link.
  await requirePermission("bookings:read");
  const { status } = await searchParams;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Bookings
        </h1>
        <p className="mt-1.5 text-ink-muted">
          Search, filter and open any repair. Status changes and rescheduling happen on the booking
          detail page.
        </p>
      </header>

      <BookingsTable initialStatus={status ?? "ALL"} />
    </div>
  );
}
