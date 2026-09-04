import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { requirePermission } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { paymentInputSchema } from "@/lib/validation";
import { getBookingById, recordPayment } from "@/server/services/booking.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/bookings/[id]/payments — record a payment taken in person.
 *
 * Online capture goes through the payment provider configured in
 * `PAYMENT_PROVIDER`; this endpoint is the counter/doorstep path only.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requirePermission("bookings:update");
    enforceRateLimit("adminWrite", `${user.id}:${clientIp(request)}`);

    const { id } = await params;
    const input = await parseJsonBody(request, paymentInputSchema);

    await recordPayment(id, {
      amount: input.amount,
      method: input.method,
      status: input.status,
      providerRef: input.providerRef,
    });

    const booking = await getBookingById(id);
    return jsonOk({ booking }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
