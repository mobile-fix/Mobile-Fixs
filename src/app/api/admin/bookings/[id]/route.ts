import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateBookingSchema } from "@/lib/validation";
import { getBookingById, updateBookingDetails } from "@/server/services/booking.service";
import type { ServiceType } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/admin/bookings/[id] — full booking record for the detail view. */
export async function GET(_request: Request, { params }: Params) {
  try {
    await requirePermission("bookings:read");
    const { id } = await params;
    const booking = await getBookingById(id);
    return jsonOk({ booking });
  } catch (error) {
    return jsonError(error);
  }
}

/** PATCH /api/admin/bookings/[id] — assignment, notes, address and discount. */
export async function PATCH(request: Request, { params }: Params) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("bookings:update");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const input = await parseJsonBody(request, updateBookingSchema);

    const booking = await updateBookingDetails(id, {
      assignedTechnicianId: input.assignedTechnicianId ?? undefined,
      internalNotes: input.internalNotes,
      problemDescription: input.problemDescription,
      serviceType: input.serviceType as ServiceType | undefined,
      addressLine: input.addressLine,
      city: input.city,
      postalCode: input.postalCode,
      discount: input.discount,
    });

    return jsonOk({ booking });
  } catch (error) {
    return jsonError(error);
  }
}
