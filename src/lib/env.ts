import "server-only";

/**
 * Server-only environment access with fail-fast validation.
 *
 * Importing `server-only` makes the build fail if this module is ever pulled
 * into a client component, which is the guarantee that secrets can never be
 * bundled into browser JavaScript.
 */

function required(name: string, value: string | undefined, minLength = 1): string {
  if (!value || value.trim().length < minLength) {
    throw new Error(
      `Missing or invalid environment variable ${name}. ` +
        `See .env.example for the expected value (minimum length ${minLength}).`,
    );
  }
  return value.trim();
}

function optional(value: string | undefined): string | undefined {
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function intOr(value: string | undefined, defaultValue: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

export const serverEnv = {
  get sessionSecret(): string {
    // Read lazily so that `next build` can statically analyse pages that never
    // touch auth without a secret being present in the build environment.
    return required("SESSION_SECRET", process.env.SESSION_SECRET, 32);
  },
  sessionMaxAge: intOr(process.env.SESSION_MAX_AGE, 60 * 60 * 8),
  isProduction: process.env.NODE_ENV === "production",

  smtp: {
    host: optional(process.env.SMTP_HOST),
    port: intOr(process.env.SMTP_PORT, 587),
    user: optional(process.env.SMTP_USER),
    password: optional(process.env.SMTP_PASSWORD),
    from: optional(process.env.SMTP_FROM),
    get configured() {
      return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    },
  },

  sms: {
    provider: optional(process.env.SMS_PROVIDER),
    apiKey: optional(process.env.SMS_API_KEY),
    senderId: optional(process.env.SMS_SENDER_ID),
    get configured() {
      return Boolean(process.env.SMS_PROVIDER && process.env.SMS_API_KEY);
    },
  },

  whatsapp: {
    apiUrl: optional(process.env.WHATSAPP_API_URL),
    token: optional(process.env.WHATSAPP_API_TOKEN),
    get configured() {
      return Boolean(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN);
    },
  },

  payments: {
    provider: optional(process.env.PAYMENT_PROVIDER),
    keyId: optional(process.env.PAYMENT_KEY_ID),
    keySecret: optional(process.env.PAYMENT_KEY_SECRET),
    webhookSecret: optional(process.env.PAYMENT_WEBHOOK_SECRET),
    get configured() {
      return Boolean(process.env.PAYMENT_PROVIDER && process.env.PAYMENT_KEY_ID);
    },
  },
} as const;
