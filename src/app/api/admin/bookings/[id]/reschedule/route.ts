import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { rescheduleSchema } from "@/lib/validation";
import { rescheduleBooking } from "@/server/services/booking.service";

export const dynamic = "force-dynamic";

/** POST /api/admin/bookings/[id]/reschedule — move an appointment. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("bookings:update");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const input = await parseJsonBody(request, rescheduleSchema);
    const booking = await rescheduleBooking(id, input);

    return jsonOk({ booking });
  } catch (error) {
    return jsonError(error);
  }
}
