"use client";

import { useEffect, useRef, useState } from "react";

import { api, ApiClientError } from "@/lib/api-client";
import type { ServiceType } from "@/lib/constants";
import type { BasketItem, Quote } from "./types";

/**
 * Live quote.
 *
 * Refreshes whenever the device, basket or service type changes. Requests are
 * debounced and the previous one aborted, and the last successful quote is kept
 * on screen while a new one loads — so the summary never flashes to empty and the
 * layout never jumps.
 */
export function useQuote({
  modelId,
  items,
  serviceType,
}: {
  modelId: string | null;
  items: BasketItem[];
  serviceType: ServiceType;
}) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const requestRef = useRef<AbortController | null>(null);

  // Serialise the basket so the effect compares by value, not array identity.
  const basketKey = items.map((item) => `${item.serviceId}:${item.partGrade}`).join("|");

  useEffect(() => {
    requestRef.current?.abort();

    if (!modelId || items.length === 0) {
      setQuote(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(() => {
      api
        .post<{ quote: Quote }>("/api/quote", { modelId, items, serviceType }, controller.signal)
        .then((data) => setQuote(data.quote))
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setQuote(null);
          setError(
            cause instanceof ApiClientError
              ? cause.message
              : "We could not load your repair summary. Please try again.",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelId, basketKey, serviceType, retryToken]);

  return {
    quote,
    loading,
    error,
    retry: () => setRetryToken((token) => token + 1),
  };
}
