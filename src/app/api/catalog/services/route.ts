import { jsonError, jsonOk } from "@/lib/http";
import { listServices } from "@/server/services/catalog.service";

export const revalidate = 60;

/** GET /api/catalog/services — active repair services. Prices are not published. */
export async function GET() {
  try {
    const services = await listServices();

    return jsonOk(
      { services },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
