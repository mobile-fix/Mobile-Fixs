"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/primitives";
import { Field, Input, describedBy } from "@/components/ui/form";
import { api, ApiClientError } from "@/lib/api-client";
import type { FieldErrors } from "@/lib/errors";

/**
 * Staff sign-in.
 *
 * The server returns one generic message for both an unknown email and a wrong
 * password, and burns comparable time on each, so the form cannot be used to
 * discover which accounts exist. A 429 is surfaced with its own explanation
 * rather than looking like a credential failure.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setRateLimited(false);

    const local: FieldErrors = {};
    if (!email.trim()) local.email = ["Enter your email address."];
    if (!password) local.password = ["Enter your password."];
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      await api.post("/api/auth/login", { email: email.trim(), password });

      // `next` is validated as a same-site admin path so the parameter cannot be
      // used as an open redirect.
      const next = searchParams.get("next");
      const destination = next && /^\/admin(\/|$)/.test(next) ? next : "/admin";

      router.replace(destination);
      router.refresh();
    } catch (cause) {
      if (cause instanceof ApiClientError) {
        setRateLimited(cause.code === "RATE_LIMITED");
        setFormError(cause.message);
        if (cause.fieldErrors) setErrors(cause.fieldErrors);
      } else {
        setFormError("We could not sign you in. Please try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {formError ? (
        <Alert
          tone={rateLimited ? "warning" : "danger"}
          title={rateLimited ? "Too many attempts" : "Sign-in failed"}
          live
        >
          {formError}
        </Alert>
      ) : null}

      <Field label="Email address" htmlFor="login-email" required error={errors.email}>
        <Input
          id="login-email"
          type="email"
          autoComplete="username"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          hasError={Boolean(errors.email)}
          aria-describedby={describedBy("login-email", errors.email)}
          placeholder="you@mymobifix.com"
        />
      </Field>

      <Field label="Password" htmlFor="login-password" required error={errors.password}>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            hasError={Boolean(errors.password)}
            aria-describedby={describedBy("login-password", errors.password)}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-sunken hover:text-ink"
          >
            <Icon name={showPassword ? "eye-off" : "eye"} size={17} />
          </button>
        </div>
      </Field>

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={submitting}
        loadingLabel="Signing in…"
        iconRight="arrow-right"
      >
        Sign in
      </Button>
    </form>
  );
}
