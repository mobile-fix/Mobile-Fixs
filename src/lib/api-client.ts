import type { ApiResponse, ApiFailure } from "./http";
import type { FieldErrors } from "./errors";

/**
 * Browser-side API client.
 *
 * Unwraps the standard `{ ok, data | error }` envelope so callers work with
 * plain values and a single `ApiClientError`. Network failures, non-JSON
 * responses and HTTP errors all arrive as the same error type, which is what
 * makes "never fail silently" practical to enforce in the UI.
 */

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors?: FieldErrors;

  constructor(message: string, options: { code?: string; status?: number; fieldErrors?: FieldErrors } = {}) {
    super(message);
    this.name = "ApiClientError";
    this.code = options.code ?? "UNKNOWN";
    this.status = options.status ?? 0;
    this.fieldErrors = options.fieldErrors;
  }

  /** True when retrying the same request could plausibly succeed. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

type RequestOptions = {
  signal?: AbortSignal;
  /** Sent as a JSON body; the method defaults to POST when present. */
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: Record<string, string>;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? (options.body !== undefined ? "POST" : "GET");

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      signal: options.signal,
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        // Marks the request as same-origin JSON; the server rejects
        // cross-origin form posts that lack it (CSRF defence in depth).
        "X-Requested-With": "fetch",
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiClientError(
      "We could not reach the server. Check your connection and try again.",
      { code: "NETWORK_ERROR", status: 0 },
    );
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    // A non-JSON response (proxy error page, 502 HTML) still has to surface.
    throw new ApiClientError(
      response.ok
        ? "The server returned an unexpected response."
        : `Request failed (${response.status}). Please try again.`,
      { code: "INVALID_RESPONSE", status: response.status },
    );
  }

  if (!response.ok || !payload.ok) {
    const failure = payload as ApiFailure;
    throw new ApiClientError(
      failure?.error?.message ?? "Something went wrong. Please try again.",
      {
        code: failure?.error?.code,
        status: response.status,
        fieldErrors: failure?.error?.fieldErrors,
      },
    );
  }

  return payload.data;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, { method: "GET", signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: "POST", body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: "PATCH", body, signal }),
  delete: <T>(path: string, signal?: AbortSignal) =>
    apiRequest<T>(path, { method: "DELETE", signal }),
};

/** Builds a query string, dropping empty values so URLs stay clean. */
export function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}
