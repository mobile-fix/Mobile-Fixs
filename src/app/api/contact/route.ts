import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { enforceRateLimit } from "@/lib/rate-limit";
import { contactMessageSchema } from "@/lib/validation";
import { createContactMessage } from "@/server/services/content.service";

export const dynamic = "force-dynamic";

/** POST /api/contact — support enquiry. Honeypot + rate limit for spam control. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit("contact", clientIp(request));

    const input = await parseJsonBody(request, contactMessageSchema);
    const message = await createContactMessage(input);

    return jsonOk({ id: message.id, receivedAt: message.createdAt.toISOString() }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
