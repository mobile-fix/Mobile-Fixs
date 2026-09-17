"use client";

import { useState } from "react";

import { Icon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert, Card } from "@/components/ui/primitives";
import { Field, Input, Select, Textarea, describedBy } from "@/components/ui/form";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import type { FieldErrors } from "@/lib/errors";

/**
 * Contact form.
 *
 * Validates on the client for speed, then re-validates on the server. Server
 * field errors are mapped back onto the inputs that produced them. A hidden
 * honeypot catches naive bots without inflicting a CAPTCHA on real people.
 */

const SUBJECTS = [
  "General enquiry",
  "Repair quote",
  "Question about an existing repair",
  "Warranty claim",
  "Corporate or bulk repair",
  "Feedback or complaint",
];

export function ContactForm() {
  const toast = useToast();

  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    subject: SUBJECTS[0]!,
    message: "",
    website: "", // honeypot
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const setField = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const local: FieldErrors = {};
    if (values.name.trim().length < 2) local.name = ["Please enter your name."];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) {
      local.email = ["Enter a valid email address."];
    }
    if (values.message.trim().length < 20) {
      local.message = ["Please give us at least 20 characters so we can help properly."];
    }
    if (Object.keys(local).length > 0) {
      setErrors(local);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/contact", {
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        subject: values.subject,
        message: values.message,
        website: values.website,
      });

      setSent(true);
      toast.success("Message sent", "We reply within one business day.");
    } catch (cause) {
      const message =
        cause instanceof ApiClientError
          ? cause.message
          : "We could not send your message. Please try again.";
      if (cause instanceof ApiClientError && cause.fieldErrors) setErrors(cause.fieldErrors);
      setFormError(message);
      toast.error("Could not send message", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <Card className="p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-900/40 dark:text-success-300">
          <Icon name="check-circle" size={28} />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-ink">Message sent</h2>
        <p className="measure-tight mx-auto mt-2 text-ink-muted">
          Thanks {values.name.split(" ")[0]}. We have your enquiry and reply within one business day,
          usually much sooner.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/book" iconRight="arrow-right">
            Book a repair meanwhile
          </ButtonLink>
          <Button
            variant="outline"
            onClick={() => {
              setSent(false);
              setValues({
                name: "",
                email: "",
                phone: "",
                subject: SUBJECTS[0]!,
                message: "",
                website: "",
              });
            }}
          >
            Send another message
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="font-display text-xl font-bold text-ink">Send us a message</h2>
      <p className="mt-1.5 text-ink-muted">
        We reply within one business day. For anything urgent about a repair in progress, call us.
      </p>

      {formError ? (
        <Alert tone="danger" title="Could not send message" live className="mt-5">
          {formError}
        </Alert>
      ) : null}

      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name" htmlFor="contact-name" required error={errors.name}>
            <Input
              id="contact-name"
              autoComplete="name"
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
              hasError={Boolean(errors.name)}
              aria-describedby={describedBy("contact-name", errors.name)}
              placeholder="Priya Sharma"
            />
          </Field>

          <Field label="Email address" htmlFor="contact-email" required error={errors.email}>
            <Input
              id="contact-email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              hasError={Boolean(errors.email)}
              aria-describedby={describedBy("contact-email", errors.email)}
              placeholder="you@example.com"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Phone number"
            htmlFor="contact-phone"
            hint="Only if you would prefer a call back."
            error={errors.phone}
          >
            <Input
              id="contact-phone"
              type="tel"
              inputMode="numeric"
              prefix="+91"
              autoComplete="tel"
              value={values.phone}
              onChange={(event) => setField("phone", event.target.value)}
              hasError={Boolean(errors.phone)}
              aria-describedby={describedBy(
                "contact-phone",
                errors.phone,
                "Only if you would prefer a call back.",
              )}
              placeholder="98765 43210"
            />
          </Field>

          <Field label="Subject" htmlFor="contact-subject" required error={errors.subject}>
            <Select
              id="contact-subject"
              value={values.subject}
              onChange={(event) => setField("subject", event.target.value)}
              hasError={Boolean(errors.subject)}
            >
              {SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Message"
          htmlFor="contact-message"
          required
          error={errors.message}
          hint="Include your device model and repair ID if your question is about an existing booking."
          aside={
            <span className="tabular text-xs text-ink-subtle">{values.message.length}/2000</span>
          }
        >
          <Textarea
            id="contact-message"
            rows={6}
            maxLength={2000}
            value={values.message}
            onChange={(event) => setField("message", event.target.value)}
            hasError={Boolean(errors.message)}
            aria-describedby={describedBy(
              "contact-message",
              errors.message,
              "Include your device model and repair ID if your question is about an existing booking.",
            )}
            placeholder="I have a Galaxy S22 Ultra with a cracked screen. What would a replacement cost?"
          />
        </Field>

        {/* Honeypot: hidden from people, tempting to naive bots. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
          <label htmlFor="contact-website">Leave this field empty</label>
          <input
            id="contact-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(event) => setField("website", event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-subtle">
            We use your details only to answer this enquiry.
          </p>
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            loadingLabel="Sending…"
            iconRight="arrow-right"
          >
            Send message
          </Button>
        </div>
      </form>
    </Card>
  );
}
