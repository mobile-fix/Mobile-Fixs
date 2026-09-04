import { jsonError, jsonOk } from "@/lib/http";
import { listBrands } from "@/server/services/catalog.service";

/**
 * GET /api/catalog/brands — active device brands for the picker.
 * The catalogue changes rarely, so the response is cached at the edge for a
 * minute with stale-while-revalidate to keep the first step of booking instant.
 */
export const revalidate = 60;

export async function GET() {
  try {
    const brands = await listBrands();
    return jsonOk(
      { brands },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
