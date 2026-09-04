import { z } from "zod";

import { jsonError, jsonOk, parseSearchParams } from "@/lib/http";
import { cuidSchema } from "@/lib/validation";
import { getRepairOptionsForModel } from "@/server/services/pricing.service";
import { parseList } from "@/lib/json";

export const dynamic = "force-dynamic";

const querySchema = z.object({ modelId: cuidSchema });

/**
 * GET /api/catalog/repairs?modelId=
 * Every repair available for one device, each with its part-grade options,
 * price, duration and warranty — the data behind step 2 of the booking flow.
 */
export async function GET(request: Request) {
  try {
    const { modelId } = parseSearchParams(new URL(request.url), querySchema);
    const result = await getRepairOptionsForModel(modelId);

    return jsonOk({
      model: result.model,
      services: result.services.map((service) => ({
        ...service,
        symptoms: parseList(service.symptoms),
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
