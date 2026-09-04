import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateBookingStatusSchema } from "@/lib/validation";
import { updateBookingStatus } from "@/server/services/booking.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bookings/[id]/status — advance a repair.
 *
 * The service enforces the allowed transition graph, so a repair cannot skip
 * quality check or be revived after cancellation even via a crafted request.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("bookings:update");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const input = await parseJsonBody(request, updateBookingStatusSchema);

    const booking = await updateBookingStatus(
      id,
      { status: input.status, note: input.note, isPublic: input.isPublic },
      user.id,
    );

    return jsonOk({ booking });
  } catch (error) {
    return jsonError(error);
  }
}
