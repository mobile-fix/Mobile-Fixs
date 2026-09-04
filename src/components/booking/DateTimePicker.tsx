"use client";

import { useEffect, useMemo, useState } from "react";

import { Icon } from "@/components/icons";
import { Alert, Badge, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/Button";
import { api, ApiClientError } from "@/lib/api-client";
import { addDays, cn, startOfDay, toDateKey } from "@/lib/utils";
import { BOOKING_WINDOW_DAYS } from "@/lib/constants";
import type { Availability } from "./types";

/**
 * Appointment picker.
 *
 * Availability is fetched per day from the server rather than assumed, so a slot
 * that filled up while the customer was deciding is shown as unavailable *with
 * the reason* — "Fully booked", "Too soon" — instead of failing at submit.
 */
export function DateTimePicker({
  selectedDate,
  selectedSlotId,
  onChange,
  error,
}: {
  selectedDate: string | null;
  selectedSlotId: string | null;
  onChange: (date: string, slotId: string | null) => void;
  error?: string;
}) {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  // A rolling 7-day strip the customer can page through, capped at the
  // configured booking window.
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, weekOffset * 7 + index);
      return {
        key: toDateKey(date),
        weekday: date.toLocaleDateString("en-IN", { weekday: "short" }),
        day: date.getDate(),
        month: date.toLocaleDateString("en-IN", { month: "short" }),
        isToday: weekOffset === 0 && index === 0,
        isSunday: date.getDay() === 0,
        beyondWindow: weekOffset * 7 + index > BOOKING_WINDOW_DAYS,
      };
    });
  }, [weekOffset]);

  // Select the first bookable day automatically so the step is never empty.
  useEffect(() => {
    if (selectedDate) return;
    const firstOpen = days.find((day) => !day.isSunday && !day.beyondWindow);
    if (firstOpen) onChange(firstOpen.key, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;

    const controller = new AbortController();
    setLoading(true);
    setLoadError(null);

    api
      .get<Availability>(
        `/api/availability?date=${encodeURIComponent(selectedDate)}`,
        controller.signal,
      )
      .then(setAvailability)
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setAvailability(null);
        setLoadError(
          cause instanceof ApiClientError ? cause.message : "Could not load available times.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [selectedDate]);

  const maxOffset = Math.floor(BOOKING_WINDOW_DAYS / 7);

  return (
    <div className="space-y-6">
      {/* Date strip */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">Choose a date</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWeekOffset((offset) => Math.max(0, offset - 1))}
              disabled={weekOffset === 0}
              aria-label="Previous week"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((offset) => Math.min(maxOffset, offset + 1))}
              disabled={weekOffset >= maxOffset}
              aria-label="Next week"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink-muted transition-colors hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label="Appointment date"
          className="scroll-x hide-scrollbar -mx-1 flex gap-2 px-1 pb-1"
        >
          {days.map((day) => {
            const selected = day.key === selectedDate;
            const disabled = day.isSunday || day.beyondWindow;

            return (
              <button
                key={day.key}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => onChange(day.key, null)}
                className={cn(
                  "flex min-w-[4.25rem] flex-1 shrink-0 flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-3 transition-[border-color,background-color,box-shadow] duration-200",
                  selected
                    ? "border-brand-600 bg-brand-50 shadow-md dark:border-brand-500 dark:bg-brand-950/60"
                    : "border-line bg-surface hover:border-brand-300 hover:bg-brand-50/50 dark:hover:border-brand-700",
                  disabled && "cursor-not-allowed opacity-40 hover:border-line hover:bg-surface",
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                  {day.isToday ? "Today" : day.weekday}
                </span>
                <span className="tabular font-display text-lg font-bold text-ink">{day.day}</span>
                <span className="text-[11px] text-ink-subtle">{day.month}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      <div>
        <p className="mb-3 text-sm font-semibold text-ink">Choose a time</p>

        {loadError ? (
          <Alert tone="danger" title="Could not load times" live>
            {loadError}
          </Alert>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : availability ? (
          <>
            {!availability.isOpen ? (
              <Alert tone="warning" title="No slots on this date" live className="mb-3">
                {availability.closedReason ?? "Every slot on this date is taken. Try another day."}
              </Alert>
            ) : null}

            <div role="radiogroup" aria-label="Appointment time" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {availability.slots.map((slot) => {
                const selected = slot.id === selectedSlotId;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={!slot.available}
                    onClick={() => onChange(selectedDate!, slot.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl border-2 px-3.5 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200",
                      selected
                        ? "border-brand-600 bg-brand-50 shadow-md dark:border-brand-500 dark:bg-brand-950/60"
                        : "border-line bg-surface hover:border-brand-300 hover:bg-brand-50/50 dark:hover:border-brand-700",
                      !slot.available &&
                        "cursor-not-allowed border-line bg-sunken opacity-55 hover:border-line hover:bg-sunken",
                    )}
                  >
                    <span className="text-sm font-bold text-ink">{slot.label}</span>
                    {slot.available ? (
                      slot.remaining <= 3 ? (
                        <span className="text-[11px] font-semibold text-warning-700 dark:text-warning-500">
                          Only {slot.remaining} left
                        </span>
                      ) : (
                        <span className="text-[11px] text-success-700 dark:text-success-500">
                          Available
                        </span>
                      )
                    ) : (
                      <span className="text-[11px] text-ink-subtle">{slot.reason ?? "Unavailable"}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-danger-700 dark:text-danger-500">
            <Icon name="alert-circle" size={15} />
            {error}
          </p>
        ) : null}
      </div>

      {availability && !availability.isOpen ? (
        <Button
          variant="outline"
          size="sm"
          iconRight="chevron-right"
          onClick={() => setWeekOffset((offset) => Math.min(maxOffset, offset + 1))}
        >
          Look at next week
        </Button>
      ) : null}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-subtle">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        <span>
          Slots are 2-hour windows. We confirm the exact arrival time on your preferred contact
          method the morning of your appointment.
        </span>
      </p>
    </div>
  );
}
