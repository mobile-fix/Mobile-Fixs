import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingDetail } from "@/components/admin/BookingDetail";
import { Icon } from "@/components/icons";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/constants";
import { NotFoundError } from "@/lib/errors";
import { getBookingById } from "@/server/services/booking.service";
import { listAssignableTechnicians } from "@/server/services/auth.service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const booking = await getBookingById(id);
    return { title: `${booking.reference} — ${booking.device.modelName}` };
  } catch {
    return { title: "Booking" };
  }
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("bookings:read");
  const { id } = await params;

  let booking;
  try {
    booking = await getBookingById(id);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const technicians = await listAssignableTechnicians();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <Icon name="arrow-left" size={15} />
        Back to bookings
      </Link>

      <BookingDetail
        booking={booking}
        technicians={technicians}
        canWriteCustomers={hasPermission(user.role, "customers:read")}
      />
    </div>
  );
}
