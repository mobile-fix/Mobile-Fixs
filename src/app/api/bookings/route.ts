import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createBookingSchema } from "@/lib/validation";
import { createBooking } from "@/server/services/booking.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings — creates a repair booking.
 *
 * The client sends selections only, never prices: the service re-prices the
 * basket, re-checks slot capacity and stores the result, so a tampered payload
 * cannot buy a discounted repair or overbook a full slot.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit("booking", clientIp(request));

    const input = await parseJsonBody(request, createBookingSchema);
    const booking = await createBooking(input);

    // The customer only needs the repair ID to reach the confirmation page. The
    // full record (prices, internal notes) stays with staff.
    return jsonOk(
      { booking: { reference: booking.reference, status: booking.status } },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
