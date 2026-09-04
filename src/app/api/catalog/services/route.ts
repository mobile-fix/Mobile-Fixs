import { jsonError, jsonOk } from "@/lib/http";
import { listServices } from "@/server/services/catalog.service";
import { getStartingPrices } from "@/server/services/pricing.service";

export const revalidate = 60;

/** GET /api/catalog/services — active repair services with their "from" price. */
export async function GET() {
  try {
    const [services, startingPrices] = await Promise.all([listServices(), getStartingPrices()]);

    return jsonOk(
      {
        services: services.map((service) => ({
          ...service,
          startingPrice: startingPrices[service.id]?.from ?? null,
        })),
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
