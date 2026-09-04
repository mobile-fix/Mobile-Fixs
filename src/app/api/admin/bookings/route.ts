import { jsonError, jsonOk, parseSearchParams } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { bookingListQuerySchema } from "@/lib/validation";
import { listBookings } from "@/server/services/booking.service";

export const dynamic = "force-dynamic";

/** GET /api/admin/bookings — filtered, sorted, paginated booking list. */
export async function GET(request: Request) {
  try {
    await requirePermission("bookings:read");
    const query = parseSearchParams(new URL(request.url), bookingListQuerySchema);

    const result = await listBookings({
      status: query.status,
      serviceType: query.serviceType,
      search: query.search,
      from: query.from,
      to: query.to,
      sort: query.sort,
      page: query.page,
      pageSize: query.pageSize,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
