import { jsonError, jsonOk, parseSearchParams } from "@/lib/http";
import { availabilityQuerySchema } from "@/lib/validation";
import { getAvailability } from "@/server/services/booking.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/availability?date=YYYY-MM-DD
 * Real slot capacity for a day — closed days, past slots and full slots all come
 * back with the reason, so the UI can explain *why* a time is unavailable.
 */
export async function GET(request: Request) {
  try {
    const { date } = parseSearchParams(new URL(request.url), availabilityQuerySchema);
    const availability = await getAvailability(date);
    return jsonOk(availability);
  } catch (error) {
    return jsonError(error);
  }
}
