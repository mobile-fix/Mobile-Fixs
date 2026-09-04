import { clientIp, jsonError, jsonOk, parseJsonBody } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { loginSchema } from "@/lib/validation";
import { login } from "@/server/services/auth.service";

export const dynamic = "force-dynamic";

/** POST /api/auth/login — staff sign-in. Rate limited by IP and by email. */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = await parseJsonBody(request, loginSchema);

    const user = await login({
      email: input.email,
      password: input.password,
      ip: clientIp(request),
      userAgent: request.headers.get("user-agent"),
    });

    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
