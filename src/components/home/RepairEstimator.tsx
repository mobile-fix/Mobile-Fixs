"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DeviceSelector } from "@/components/booking/DeviceSelector";
import { RepairSelector } from "@/components/booking/RepairSelector";
import { QuoteSummary } from "@/components/booking/QuoteSummary";
import { useQuote } from "@/components/booking/useQuote";
import { encodeBasket, type BasketItem, type ModelOption } from "@/components/booking/types";
import { Icon } from "@/components/icons";
import { Button, ButtonLink } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/form";
import { SERVICE_TYPES, SERVICE_TYPE_META, type ServiceType } from "@/lib/constants";

/**
 * Homepage repair estimator.
 *
 * The core differentiator: a visitor gets a real, itemised price without leaving
 * the homepage, creating an account or submitting a form. The selection carries
 * straight into the booking wizard through the URL, so nothing is re-entered.
 */
export function RepairEstimator() {
  const router = useRouter();
  const [model, setModel] = useState<ModelOption | null>(null);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>("STORE_VISIT");

  const { quote, loading, error, retry } = useQuote({
    modelId: model?.id ?? null,
    items: basket,
    serviceType,
  });

  const continueToBooking = () => {
    if (!model) return;
    const params = new URLSearchParams({
      model: model.id,
      serviceType,
    });
    if (basket.length > 0) params.set("repairs", encodeBasket(basket));
    router.push(`/book?${params.toString()}`);
  };

  const step = !model ? 1 : basket.length === 0 ? 2 : 3;

  return (
    <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
      <div className="lg:col-span-3">
        <ol className="mb-6 flex items-center gap-2 text-sm" aria-label="Estimate progress">
          {[
            { n: 1, label: "Device" },
            { n: 2, label: "Repair" },
            { n: 3, label: "Price" },
          ].map((entry, index) => (
            <li key={entry.n} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step >= entry.n
                    ? "bg-brand-700 text-white"
                    : "bg-sunken text-ink-subtle"
                }`}
                aria-current={step === entry.n ? "step" : undefined}
              >
                {step > entry.n ? <Icon name="check" size={13} strokeWidth={3} /> : entry.n}
              </span>
              <span
                className={`font-semibold ${step >= entry.n ? "text-ink" : "text-ink-subtle"}`}
              >
                {entry.label}
              </span>
              {index < 2 ? (
                <span aria-hidden="true" className="mx-1 h-px w-4 bg-line sm:w-8" />
              ) : null}
            </li>
          ))}
        </ol>

        <div className="space-y-6">
          <section aria-labelledby="estimator-device">
            <h3 id="estimator-device" className="sr-only">
              Select your device
            </h3>
            <DeviceSelector selectedModel={model} onSelect={(next) => {
              setModel(next);
              setBasket([]);
            }} />
          </section>

          {model ? (
            <section aria-labelledby="estimator-repair" className="animate-fade-up">
              <h3
                id="estimator-repair"
                className="mb-3 font-display text-base font-bold text-ink"
              >
                What needs fixing?
              </h3>
              <RepairSelector modelId={model.id} basket={basket} onChange={setBasket} />
            </section>
          ) : null}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-28">
          {model && basket.length > 0 ? (
            <div className="mb-4">
              <p className="mb-2 text-sm font-semibold text-ink">How would you like it repaired?</p>
              <SegmentedControl
                label="Service type"
                value={serviceType}
                onChange={setServiceType}
                options={SERVICE_TYPES.map((type) => ({
                  value: type,
                  label: SERVICE_TYPE_META[type].label,
                  icon: SERVICE_TYPE_META[type].iconKey as never,
                }))}
                className="w-full flex-wrap"
              />
            </div>
          ) : null}

          <QuoteSummary
            quote={quote}
            loading={loading}
            error={error}
            onRetry={retry}
            serviceType={serviceType}
            footer={
              quote ? (
                <div className="space-y-3">
                  <Button
                    size="lg"
                    fullWidth
                    iconRight="arrow-right"
                    onClick={continueToBooking}
                  >
                    Continue to booking
                  </Button>
                  <p className="text-center text-xs text-ink-subtle">
                    No payment now. Pay after the repair is done.
                  </p>
                </div>
              ) : undefined
            }
          />

          {!model ? (
            <div className="mt-4 rounded-xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold text-ink">Not sure what is wrong?</p>
              <p className="mt-1 text-sm text-ink-muted">
                Book a free 30-point diagnostic. We identify the fault, quote it, and you decide.
              </p>
              <ButtonLink
                href="/book"
                variant="outline"
                size="sm"
                className="mt-3"
                iconRight="arrow-right"
              >
                Book a free diagnostic
              </ButtonLink>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
