import { NextResponse } from "next/server";
import { ZodError, type TypeOf, type ZodTypeAny } from "zod";
import { AppError, RateLimitError, ValidationError, type FieldErrors } from "./errors";

/**
 * The one response envelope every API route uses.
 * Clients can branch on `ok` without inspecting status codes.
 */
export type ApiSuccess<T> = { ok: true; data: T; meta?: Record<string, unknown> };
export type ApiFailure = {
  ok: false;
  error: { code: string; message: string; fieldErrors?: FieldErrors };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function jsonOk<T>(
  data: T,
  init: { status?: number; meta?: Record<string, unknown>; headers?: HeadersInit } = {},
) {
  const body: ApiSuccess<T> = { ok: true, data };
  if (init.meta) body.meta = init.meta;
  return NextResponse.json(body, { status: init.status ?? 200, headers: init.headers });
}

/**
 * Converts any thrown value into a safe JSON error response.
 *
 * Unknown errors are logged server-side and reported to the client as a generic
 * message — internal messages, stack traces and SQL never cross the boundary.
 */
export function jsonError(error: unknown) {
  if (error instanceof ZodError) {
    const validation = new ValidationError(
      "Please correct the highlighted fields.",
      flattenZodError(error),
    );
    return failure(validation);
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message } } satisfies ApiFailure,
      { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
    );
  }

  if (error instanceof AppError) {
    return failure(error);
  }

  console.error("[api] unhandled error:", error);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong on our end. Please try again.",
      },
    } satisfies ApiFailure,
    { status: 500 },
  );
}

function failure(error: AppError) {
  const body: ApiFailure = {
    ok: false,
    error: {
      code: error.code,
      message: error.expose ? error.message : "Something went wrong. Please try again.",
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    },
  };
  return NextResponse.json(body, { status: error.status });
}

export function flattenZodError(error: ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

/**
 * Parses and validates a JSON request body.
 * A malformed body produces a clean 400 rather than an unhandled SyntaxError.
 *
 * The schema is taken as a generic so the return type is the schema's *output*
 * — defaults and transforms applied — rather than its input shape.
 */
export async function parseJsonBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<TypeOf<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON.", {
      status: 400,
      code: "INVALID_JSON",
    });
  }
  return schema.parse(raw) as TypeOf<S>;
}

/** Validates `URLSearchParams` against a schema, coercing repeated keys to arrays. */
export function parseSearchParams<S extends ZodTypeAny>(url: URL, schema: S): TypeOf<S> {
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    raw[key] = values.length > 1 ? values : values[0]!;
  }
  return schema.parse(raw) as TypeOf<S>;
}

/**
 * Best-effort client IP for rate limiting. Behind a proxy the first entry of
 * `x-forwarded-for` is the original client.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
