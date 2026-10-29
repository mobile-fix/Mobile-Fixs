"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Alert, Card } from "@/components/ui/primitives";
import { Checkbox, Field, Input, OptionCard, Select, Textarea, describedBy } from "@/components/ui/form";
import { useToast } from "@/components/ui/Toast";
import { track } from "@/lib/analytics";
import { api, ApiClientError } from "@/lib/api-client";
import {
  CONTACT_METHODS,
  CONTACT_METHOD_LABEL,
  CUSTOMER_SERVICE_TYPES,
  SERVICE_TYPE_META,
  type ContactMethod,
  type CustomerServiceType,
} from "@/lib/constants";
import { createBookingSchema } from "@/lib/validation";
import { cn, formatDate } from "@/lib/utils";
import type { FieldErrors } from "@/lib/errors";

import { DeviceSelector } from "./DeviceSelector";
import { RepairSelector } from "./RepairSelector";
import { DateTimePicker } from "./DateTimePicker";
import { QuoteSummary } from "./QuoteSummary";
import { useQuote } from "./useQuote";
import { decodeBasket, type BasketItem, type ModelOption } from "./types";

/**
 * Six-step booking flow.
 *
 * Design decisions that matter here:
 *  - Selections made in the homepage estimator arrive as URL params, so nothing
 *    is re-entered and the deep link is shareable.
 *  - Each step validates before advancing, using the *same* Zod schema the API
 *    uses — so client feedback and server rules can never disagree.
 *  - The running quote is visible on every step, not revealed at the end.
 *  - Server field errors are mapped back onto the exact inputs that caused them
 *    and the wizard jumps to the step containing the first problem.
 */

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEP_META: Record<Step, { title: string; description: string }> = {
  1: { title: "Your device", description: "Tell us what needs fixing." },
  2: { title: "The repair", description: "Pick the fault and the part quality you want." },
  3: { title: "Service type", description: "Free pickup & drop, or a technician at your door." },
  4: { title: "Date & time", description: "Choose a slot that suits you." },
  5: { title: "Your details", description: "How we reach you and where we go." },
  6: { title: "Review", description: "Check everything, then confirm." },
};

type CustomerForm = {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  postalCode: string;
  preferredContact: ContactMethod;
  imei: string;
  problemDescription: string;
};

const EMPTY_CUSTOMER: CustomerForm = {
  fullName: "",
  phone: "",
  email: "",
  addressLine: "",
  city: "",
  postalCode: "",
  preferredContact: "PHONE",
  imei: "",
  problemDescription: "",
};

export function BookingWizard() {
  const searchParams = useSearchParams();
  const toast = useToast();

  const [step, setStep] = useState<Step>(1);
  const [model, setModel] = useState<ModelOption | null>(null);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  // Pickup & drop works for every repair, so it is the safe preselection.
  const [serviceType, setServiceType] = useState<CustomerServiceType>("PICKUP_DELIVERY");
  const [date, setDate] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerForm>(EMPTY_CUSTOMER);
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [prefillDone, setPrefillDone] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);

  const { quote, loading: quoteLoading, error: quoteError, retry } = useQuote({
    modelId: model?.id ?? null,
    items: basket,
    serviceType,
  });

  // ── Prefill from the homepage estimator ───────────────────────────────────
  useEffect(() => {
    if (prefillDone) return;

    const modelId = searchParams.get("model");
    const repairs = decodeBasket(searchParams.get("repairs"));
    const type = searchParams.get("serviceType") as CustomerServiceType | null;

    // Old links may still carry serviceType=STORE_VISIT; those keep the default.
    if (type && CUSTOMER_SERVICE_TYPES.includes(type)) setServiceType(type);
    if (repairs.length > 0) setBasket(repairs);

    if (!modelId) {
      setPrefillDone(true);
      return;
    }

    // Resolve the id to a full model record so the summary can name the device.
    api
      .get<{ models: ModelOption[] }>(`/api/catalog/models?limit=100`)
      .then((data) => {
        const found = data.models.find((entry) => entry.id === modelId);
        if (found) {
          setModel(found);
          setStep(repairs.length > 0 ? 3 : 2);
        }
      })
      .catch(() => {
        // A stale or invalid link should not break the page — the customer just
        // starts from step 1.
      })
      .finally(() => setPrefillDone(true));
  }, [searchParams, prefillDone]);

  // Move focus to the step heading on change so keyboard and screen-reader
  // users land in the new content rather than at the top of the document.
  useEffect(() => {
    headingRef.current?.focus();
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [step]);

  const requiresAddress = SERVICE_TYPE_META[serviceType].requiresAddress;

  const setField = useCallback(<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) => {
    setCustomer((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[`customer.${String(key)}`] && !current[String(key)]) return current;
      const next = { ...current };
      delete next[`customer.${String(key)}`];
      delete next[String(key)];
      return next;
    });
  }, []);

  // ── Per-step validation ───────────────────────────────────────────────────
  const validateStep = (target: Step): boolean => {
    const next: FieldErrors = {};

    if (target >= 1 && !model) next.model = ["Choose your device to continue."];
    if (target >= 2 && basket.length === 0) {
      next.items = ["Select at least one repair to continue."];
    }
    if (target >= 4) {
      if (!date) next.scheduledDate = ["Choose an appointment date."];
      if (!slotId) next.slotId = ["Choose an appointment time."];
    }
    if (target >= 5) {
      // Reuse the shared schema for the customer block so client-side rules are
      // byte-for-byte the ones the server will apply.
      const result = createBookingSchema.safeParse({
        modelId: model?.id ?? "",
        items: basket,
        serviceType,
        scheduledDate: date ?? "",
        slotId: slotId ?? "",
        customer: {
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          addressLine: customer.addressLine,
          city: customer.city,
          postalCode: customer.postalCode,
          preferredContact: customer.preferredContact,
        },
        imei: customer.imei,
        problemDescription: customer.problemDescription,
      });

      if (!result.success) {
        for (const issue of result.error.issues) {
          const key = issue.path.join(".");
          // Ignore complaints about steps the customer has not reached yet.
          if (key.startsWith("customer") || key === "imei") {
            (next[key] ??= []).push(issue.message);
          }
        }
      }

      if (customer.preferredContact === "EMAIL" && !customer.email) {
        (next["customer.email"] ??= []).push(
          "Add an email address, or choose a different contact method.",
        );
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goTo = (target: Step) => {
    setFormError(null);
    // Moving backwards never needs validation.
    if (target < step) {
      setStep(target);
      return;
    }
    if (!validateStep((target - 1) as Step)) return;
    setStep(target);
  };

  const canAdvance =
    (step === 1 && Boolean(model)) ||
    (step === 2 && basket.length > 0) ||
    step === 3 ||
    (step === 4 && Boolean(date && slotId)) ||
    step === 5 ||
    step === 6;

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    setFormError(null);

    if (!validateStep(5)) {
      setStep(5);
      toast.error("Check your details", "Some information is missing or invalid.");
      return;
    }
    if (!consent) {
      setFormError("Please confirm you accept the repair terms before booking.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        modelId: model!.id,
        items: basket,
        serviceType,
        scheduledDate: date!,
        slotId: slotId!,
        customer: {
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email || undefined,
          addressLine: customer.addressLine || undefined,
          city: customer.city || undefined,
          postalCode: customer.postalCode || undefined,
          preferredContact: customer.preferredContact,
        },
        imei: customer.imei || undefined,
        problemDescription: customer.problemDescription || undefined,
      };

      const data = await api.post<{ booking: { reference: string } }>("/api/bookings", payload);

      // Fired here rather than on the confirmation page so a reload of that
      // page cannot count the same booking twice.
      await track({ name: "booking_submitted", service: `${model!.brandName} ${model!.name}` });

      // A full page load, not router.push: the confirmation URL contains the
      // repair reference, and ad tags already running on this page would
      // otherwise report the client-side navigation to it. The confirmation
      // page loads no tags of its own (see isPrivatePath).
      window.location.assign(`/book/confirmation/${data.booking.reference}`);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError
          ? cause.message
          : "We could not create your booking. Please try again.";

      if (cause instanceof ApiClientError && cause.fieldErrors) {
        setErrors(cause.fieldErrors);
        // Jump to the earliest step that has a problem.
        const keys = Object.keys(cause.fieldErrors);
        if (keys.some((key) => key.startsWith("customer") || key === "imei")) setStep(5);
        else if (keys.includes("serviceType")) setStep(3);
        else if (keys.some((key) => key === "slotId" || key === "scheduledDate")) setStep(4);
        else if (keys.some((key) => key === "items")) setStep(2);
        else if (keys.some((key) => key === "modelId")) setStep(1);
      }

      setFormError(message);
      toast.error("Booking failed", message);
      setSubmitting(false);
    }
  };

  const steps: Step[] = [1, 2, 3, 4, 5, 6];

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      {/* Main column */}
      <div className="lg:col-span-8">
        <StepIndicator current={step} onSelect={goTo} />

        <div className="mt-8">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-2xl font-bold tracking-tight text-ink focus-visible:outline-2 focus-visible:outline-offset-4 sm:text-3xl"
          >
            {STEP_META[step].title}
          </h2>
          <p className="mt-1.5 text-ink-muted">{STEP_META[step].description}</p>
        </div>

        {formError ? (
          <Alert tone="danger" title="Could not complete booking" live className="mt-6">
            {formError}
          </Alert>
        ) : null}

        <div className="mt-7">
          {/* Step 1 — device */}
          {step === 1 ? (
            <>
              <DeviceSelector
                selectedModel={model}
                onSelect={(next) => {
                  setModel(next);
                  setBasket([]);
                  setErrors({});
                }}
              />
              {errors.model ? (
                <p role="alert" className="mt-3 text-sm font-medium text-danger-700 dark:text-danger-500">
                  {errors.model[0]}
                </p>
              ) : null}
            </>
          ) : null}

          {/* Step 2 — repair */}
          {step === 2 && model ? (
            <>
              <RepairSelector modelId={model.id} basket={basket} onChange={setBasket} />
              {errors.items ? (
                <p role="alert" className="mt-3 text-sm font-medium text-danger-700 dark:text-danger-500">
                  {errors.items[0]}
                </p>
              ) : null}
            </>
          ) : null}

          {/* Step 3 — service type */}
          {step === 3 ? (
            <fieldset className="space-y-3">
              <legend className="sr-only">Choose how you want the repair done</legend>
              {CUSTOMER_SERVICE_TYPES.map((type) => {
                const meta = SERVICE_TYPE_META[type];
                return (
                  <OptionCard
                    key={type}
                    name="serviceType"
                    value={type}
                    checked={serviceType === type}
                    onChange={(value) => setServiceType(value as CustomerServiceType)}
                    icon={meta.iconKey as never}
                    title={meta.label}
                    description={meta.description}
                    meta={
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-accent-300">
                        <Icon name="sparkles" size={13} />
                        {meta.highlight}
                      </span>
                    }
                  />
                );
              })}
            </fieldset>
          ) : null}

          {/* Step 4 — date & time */}
          {step === 4 ? (
            <DateTimePicker
              selectedDate={date}
              selectedSlotId={slotId}
              onChange={(nextDate, nextSlot) => {
                setDate(nextDate);
                setSlotId(nextSlot);
                setErrors((current) => {
                  const next = { ...current };
                  delete next.scheduledDate;
                  delete next.slotId;
                  return next;
                });
              }}
              error={errors.slotId?.[0] ?? errors.scheduledDate?.[0]}
            />
          ) : null}

          {/* Step 5 — customer details */}
          {step === 5 ? (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Full name"
                  htmlFor="fullName"
                  required
                  error={errors["customer.fullName"]}
                >
                  <Input
                    id="fullName"
                    name="name"
                    autoComplete="name"
                    value={customer.fullName}
                    onChange={(event) => setField("fullName", event.target.value)}
                    hasError={Boolean(errors["customer.fullName"])}
                    aria-describedby={describedBy("fullName", errors["customer.fullName"])}
                    placeholder="Priya Sharma"
                  />
                </Field>

                <Field
                  label="Phone number"
                  htmlFor="phone"
                  required
                  hint="We use this to confirm your appointment and to track the repair."
                  error={errors["customer.phone"]}
                >
                  <Input
                    id="phone"
                    name="tel"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    prefix="+91"
                    value={customer.phone}
                    onChange={(event) => setField("phone", event.target.value)}
                    hasError={Boolean(errors["customer.phone"])}
                    aria-describedby={describedBy(
                      "phone",
                      errors["customer.phone"],
                      "We use this to confirm your appointment and to track the repair.",
                    )}
                    placeholder="98765 43210"
                  />
                </Field>
              </div>

              <Field
                label="Email address"
                htmlFor="email"
                hint="For your booking confirmation and repair receipt."
                error={errors["customer.email"]}
              >
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={customer.email}
                  onChange={(event) => setField("email", event.target.value)}
                  hasError={Boolean(errors["customer.email"])}
                  aria-describedby={describedBy(
                    "email",
                    errors["customer.email"],
                    "For your booking confirmation and repair receipt.",
                  )}
                  placeholder="you@example.com"
                />
              </Field>

              {requiresAddress ? (
                <div className="space-y-5 rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-800 dark:bg-brand-950/40 sm:p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-brand-800 dark:text-brand-200">
                    <Icon name={SERVICE_TYPE_META[serviceType].iconKey as never} size={16} />
                    Address for {SERVICE_TYPE_META[serviceType].label.toLowerCase()}
                  </p>

                  <Field
                    label="Street address"
                    htmlFor="addressLine"
                    required
                    error={errors["customer.addressLine"]}
                  >
                    <Input
                      id="addressLine"
                      autoComplete="street-address"
                      value={customer.addressLine}
                      onChange={(event) => setField("addressLine", event.target.value)}
                      hasError={Boolean(errors["customer.addressLine"])}
                      aria-describedby={describedBy("addressLine", errors["customer.addressLine"])}
                      placeholder="Flat 402, Tower B, Green Residency"
                    />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="City" htmlFor="city" required error={errors["customer.city"]}>
                      <Input
                        id="city"
                        autoComplete="address-level2"
                        value={customer.city}
                        onChange={(event) => setField("city", event.target.value)}
                        hasError={Boolean(errors["customer.city"])}
                        aria-describedby={describedBy("city", errors["customer.city"])}
                        placeholder="New Delhi"
                      />
                    </Field>

                    <Field
                      label="PIN code"
                      htmlFor="postalCode"
                      required
                      error={errors["customer.postalCode"]}
                    >
                      <Input
                        id="postalCode"
                        inputMode="numeric"
                        autoComplete="postal-code"
                        maxLength={6}
                        value={customer.postalCode}
                        onChange={(event) => setField("postalCode", event.target.value)}
                        hasError={Boolean(errors["customer.postalCode"])}
                        aria-describedby={describedBy("postalCode", errors["customer.postalCode"])}
                        placeholder="110001"
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Preferred contact method"
                  htmlFor="preferredContact"
                  required
                  error={errors["customer.preferredContact"]}
                >
                  <Select
                    id="preferredContact"
                    value={customer.preferredContact}
                    onChange={(event) =>
                      setField("preferredContact", event.target.value as ContactMethod)
                    }
                  >
                    {CONTACT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {CONTACT_METHOD_LABEL[method]}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field
                  label="IMEI / serial number"
                  htmlFor="imei"
                  hint="Dial *#06# to see it. Helps us pre-order the right part."
                  error={errors.imei}
                >
                  <Input
                    id="imei"
                    inputMode="numeric"
                    maxLength={15}
                    value={customer.imei}
                    onChange={(event) => setField("imei", event.target.value)}
                    hasError={Boolean(errors.imei)}
                    aria-describedby={describedBy(
                      "imei",
                      errors.imei,
                      "Dial *#06# to see it. Helps us pre-order the right part.",
                    )}
                    placeholder="15 digits"
                  />
                </Field>
              </div>

              <Field
                label="Describe the problem"
                htmlFor="problemDescription"
                hint="What happened, and what is it doing now? The more detail, the faster the diagnosis."
                error={errors.problemDescription}
                aside={
                  <span className="tabular text-xs text-ink-subtle">
                    {customer.problemDescription.length}/1000
                  </span>
                }
              >
                <Textarea
                  id="problemDescription"
                  rows={4}
                  maxLength={1000}
                  value={customer.problemDescription}
                  onChange={(event) => setField("problemDescription", event.target.value)}
                  hasError={Boolean(errors.problemDescription)}
                  aria-describedby={describedBy(
                    "problemDescription",
                    errors.problemDescription,
                    "What happened, and what is it doing now? The more detail, the faster the diagnosis.",
                  )}
                  placeholder="Dropped it on tile last night. Top third of the screen is cracked and touch does not respond there, but the display still lights up."
                />
              </Field>
            </div>
          ) : null}

          {/* Step 6 — review */}
          {step === 6 ? (
            <div className="space-y-4">
              <ReviewRow
                title="Device"
                onEdit={() => setStep(1)}
                lines={[model ? model.label : "—"]}
              />
              <ReviewRow
                title="Repairs"
                onEdit={() => setStep(2)}
                lines={
                  quote
                    ? quote.lines.map(
                        (line) =>
                          `${line.serviceName} · ${line.partGradeLabel}`,
                      )
                    : ["—"]
                }
              />
              <ReviewRow
                title="Service type"
                onEdit={() => setStep(3)}
                lines={[SERVICE_TYPE_META[serviceType].label]}
              />
              <ReviewRow
                title="Appointment"
                onEdit={() => setStep(4)}
                lines={[
                  date ? formatDate(date) : "—",
                  slotId ? slotLabelFor(slotId) : "—",
                ]}
              />
              <ReviewRow
                title="Your details"
                onEdit={() => setStep(5)}
                lines={[
                  customer.fullName || "—",
                  customer.phone ? `+91 ${customer.phone}` : "—",
                  customer.email || "No email provided",
                  ...(requiresAddress
                    ? [
                        [customer.addressLine, customer.city, customer.postalCode]
                          .filter(Boolean)
                          .join(", ") || "—",
                      ]
                    : []),
                  `Contact by ${CONTACT_METHOD_LABEL[customer.preferredContact].toLowerCase()}`,
                  ...(customer.imei ? [`IMEI ${customer.imei}`] : []),
                ]}
              />

              {customer.problemDescription ? (
                <ReviewRow
                  title="Problem description"
                  onEdit={() => setStep(5)}
                  lines={[customer.problemDescription]}
                />
              ) : null}

              <Card className="p-5">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onChange={(event) => {
                    setConsent(event.target.checked);
                    setFormError(null);
                  }}
                  label="I accept the repair terms"
                  description="I understand the cost is confirmed with me after diagnosis, that I approve it before work begins, and that I pay only once the repair is complete."
                />
              </Card>

              <Alert tone="info">
                Nothing is charged now. You pay after the repair, once you have your device back and
                are happy with it.
              </Alert>
            </div>
          ) : null}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            size="lg"
            iconLeft="arrow-left"
            onClick={() => goTo(Math.max(1, step - 1) as Step)}
            disabled={step === 1 || submitting}
          >
            Back
          </Button>

          {step < 6 ? (
            <Button
              size="lg"
              iconRight="arrow-right"
              onClick={() => goTo((step + 1) as Step)}
              disabled={!canAdvance}
            >
              Continue
            </Button>
          ) : (
            <Button
              size="lg"
              iconRight="check"
              onClick={submit}
              loading={submitting}
              loadingLabel="Creating booking…"
            >
              Confirm booking
            </Button>
          )}
        </div>
      </div>

      {/* Summary column */}
      <aside className="lg:col-span-4" aria-label="Booking summary">
        <div className="lg:sticky lg:top-28">
          <QuoteSummary
            quote={quote}
            loading={quoteLoading}
            error={quoteError}
            onRetry={retry}
            serviceType={serviceType}
            compact
          />

          {date && slotId ? (
            <Card className="mt-4 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                <Icon name="calendar" size={14} />
                Appointment
              </p>
              <p className="mt-1.5 font-semibold text-ink">{formatDate(date)}</p>
              <p className="text-sm text-ink-muted">{slotLabelFor(slotId)}</p>
            </Card>
          ) : null}

          <div className="mt-4 space-y-2 rounded-xl border border-line bg-surface p-4 text-sm">
            {[
              "Free diagnostics — always",
              "Free pickup & drop or doorstep visit",
              "No fix, no fee",
              "Pay only after the repair",
              "Warranty on every job",
            ].map((point) => (
              <p key={point} className="flex items-center gap-2 text-ink-muted">
                <Icon
                  name="check-circle"
                  size={15}
                  className="shrink-0 text-success-600 dark:text-success-500"
                />
                {point}
              </p>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StepIndicator({ current, onSelect }: { current: Step; onSelect: (step: Step) => void }) {
  const steps: Step[] = [1, 2, 3, 4, 5, 6];

  return (
    <nav aria-label="Booking progress">
      <ol className="scroll-x hide-scrollbar flex items-center gap-1 pb-1">
        {steps.map((entry, index) => {
          const state = entry < current ? "complete" : entry === current ? "current" : "upcoming";
          return (
            <li key={entry} className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => onSelect(entry)}
                disabled={entry > current}
                aria-current={state === "current" ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-200",
                  entry <= current ? "hover:bg-sunken" : "cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    state === "complete" && "bg-success-600 text-white",
                    state === "current" && "bg-brand-700 text-white",
                    state === "upcoming" && "bg-sunken text-ink-subtle",
                  )}
                >
                  {state === "complete" ? <Icon name="check" size={13} strokeWidth={3} /> : entry}
                </span>
                <span
                  className={cn(
                    "hidden whitespace-nowrap text-sm font-semibold sm:inline",
                    state === "upcoming" ? "text-ink-subtle" : "text-ink",
                  )}
                >
                  {STEP_META[entry].title}
                </span>
                <span className="sr-only">
                  Step {entry} of 6: {STEP_META[entry].title}
                  {state === "complete" ? " (completed)" : ""}
                </span>
              </button>
              {index < steps.length - 1 ? (
                <span aria-hidden="true" className="mx-0.5 h-px w-3 bg-line sm:w-4" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ReviewRow({
  title,
  lines,
  onEdit,
}: {
  title: string;
  lines: string[];
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="min-w-0">
        <h3 className="text-xs font-bold uppercase tracking-wide text-ink-subtle">{title}</h3>
        <div className="mt-1.5 space-y-0.5">
          {lines.map((line, index) => (
            <p
              key={`${line}-${index}`}
              className={cn(
                "text-sm",
                index === 0 ? "font-semibold text-ink" : "text-ink-muted",
              )}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
      <Button variant="ghost" size="sm" iconLeft="edit" onClick={onEdit}>
        Edit
      </Button>
    </div>
  );
}

/** Slot ids are stable (`09-11`), so the label can be derived without a lookup. */
function slotLabelFor(slotId: string): string {
  const [start, end] = slotId.split("-").map(Number);
  if (start === undefined || end === undefined) return slotId;
  const format = (hour: number) => {
    const suffix = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}:00 ${suffix}`;
  };
  return `${format(start)} – ${format(end)}`;
}
