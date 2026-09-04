/**
 * Typed application errors.
 *
 * Business logic throws these; the API layer converts them into HTTP responses
 * in one place (`src/lib/http.ts`). That keeps route handlers free of status-code
 * bookkeeping and guarantees no internal error detail leaks to the client.
 */

export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: FieldErrors;
  /** Safe to show the end user verbatim. */
  readonly expose: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      fieldErrors?: FieldErrors;
      expose?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.status = options.status ?? 500;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.fieldErrors = options.fieldErrors;
    this.expose = options.expose ?? true;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Please correct the highlighted fields.", fieldErrors?: FieldErrors) {
    super(message, { status: 422, code: "VALIDATION_ERROR", fieldErrors });
  }
}

export class BadRequestError extends AppError {
  constructor(message = "That request could not be understood.") {
    super(message, { status: 400, code: "BAD_REQUEST" });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message, { status: 401, code: "UNAUTHORIZED" });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, { status: 403, code: "FORBIDDEN" });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "We could not find what you were looking for.") {
    super(message, { status: 404, code: "NOT_FOUND" });
  }
}

export class ConflictError extends AppError {
  constructor(message = "That action conflicts with the current state.") {
    super(message, { status: 409, code: "CONFLICT" });
  }
}

export class RateLimitError extends AppError {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, message = "Too many attempts. Please wait a moment and try again.") {
    super(message, { status: 429, code: "RATE_LIMITED" });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "This service is temporarily unavailable. Please try again shortly.") {
    super(message, { status: 503, code: "SERVICE_UNAVAILABLE" });
  }
}

/**
 * Integration not wired up. Thrown instead of silently pretending an external
 * provider (SMS, email, payments) succeeded when its credentials are absent.
 */
export class IntegrationNotConfiguredError extends AppError {
  constructor(integration: string) {
    super(`${integration} is not configured on this environment.`, {
      status: 501,
      code: "INTEGRATION_NOT_CONFIGURED",
    });
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
