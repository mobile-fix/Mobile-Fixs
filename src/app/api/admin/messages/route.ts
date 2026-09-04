import { z } from "zod";

import { jsonError, jsonOk, parseSearchParams } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { MESSAGE_STATUSES } from "@/lib/constants";
import { paginationSchema } from "@/lib/validation";
import { listContactMessages } from "@/server/services/content.service";

export const dynamic = "force-dynamic";

const querySchema = paginationSchema.extend({
  status: z.union([z.enum(MESSAGE_STATUSES), z.literal("ALL")]).default("ALL"),
});

/** GET /api/admin/messages — contact-form enquiries. */
export async function GET(request: Request) {
  try {
    await requirePermission("messages:read");
    const query = parseSearchParams(new URL(request.url), querySchema);

    const result = await listContactMessages({
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });

    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
