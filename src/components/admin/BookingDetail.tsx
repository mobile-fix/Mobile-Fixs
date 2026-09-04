"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Alert, Badge, Card, StatusBadge } from "@/components/ui/primitives";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, ApiClientError } from "@/lib/api-client";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABEL,
  SERVICE_TYPE_META,
  STATUS_FLOW,
  STATUS_META,
  STATUS_TRANSITIONS,
  TIME_SLOTS,
  type RepairStatus,
} from "@/lib/constants";
import { formatMoney, formatDuration, formatWarranty } from "@/lib/money";
import { addDays, cn, formatDate, formatDateTime, formatPhone, maskIdentifier, toDateKey } from "@/lib/utils";
import type { BookingDetail as BookingDetailType } from "@/server/services/booking.service";

/**
 * Booking detail and management.
 *
 * Only transitions the server would actually accept are offered, so the UI can
 * never present an action that will fail. Every mutation returns the refreshed
 * booking, which is applied to local state — no full page reload, and no risk of
 * the screen drifting from the database.
 */

type Technician = { id: string; name: string; role: string };

export function BookingDetail({
  booking: initialBooking,
  technicians,
  canWriteCustomers,
}: {
  booking: BookingDetailType;
  technicians: Technician[];
  canWriteCustomers: boolean;
}) {
  const router = useRouter();
  const toast = useToast();

  const [booking, setBooking] = useState(initialBooking);
  const [statusModal, setStatusModal] = useState<RepairStatus | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [statusPublic, setStatusPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(toDateKey(addDays(new Date(), 1)));
  const [rescheduleSlot, setRescheduleSlot] = useState<string>(TIME_SLOTS[0]!.id);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(String(booking.pricing.total));
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");

  const [notes, setNotes] = useState(booking.internalNotes ?? "");
  const [technicianId, setTechnicianId] = useState(booking.technician?.id ?? "");
  const [savingDetails, setSavingDetails] = useState(false);

  const allowedTransitions = STATUS_TRANSITIONS[booking.status] ?? [];
  const nextInFlow = STATUS_FLOW[STATUS_FLOW.indexOf(booking.status) + 1];
  const serviceMeta = SERVICE_TYPE_META[booking.serviceType];

  const applyUpdate = (updated: BookingDetailType) => {
    setBooking(updated);
    setNotes(updated.internalNotes ?? "");
    setTechnicianId(updated.technician?.id ?? "");
    // Refresh server components (sidebar counts, dashboard totals).
    router.refresh();
  };

  const changeStatus = async (status: RepairStatus) => {
    setBusy(true);
    setError(null);
    try {
      const data = await api.post<{ booking: BookingDetailType }>(
        `/api/admin/bookings/${booking.id}/status`,
        { status, note: statusNote || undefined, isPublic: statusPublic },
      );
      applyUpdate(data.booking);
      toast.success("Status updated", `Now ${STATUS_META[status].label}.`);
      setStatusModal(null);
      setStatusNote("");
      setStatusPublic(true);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError ? cause.message : "Could not update the status.";
      setError(message);
      toast.error("Update failed", message);
    } finally {
      setBusy(false);
    }
  };

  const reschedule = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await api.post<{ booking: BookingDetailType }>(
        `/api/admin/bookings/${booking.id}/reschedule`,
        { scheduledDate: rescheduleDate, slotId: rescheduleSlot },
      );
      applyUpdate(data.booking);
      toast.success("Appointment moved");
      setRescheduleOpen(false);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError ? cause.message : "Could not reschedule the appointment.";
      setError(message);
      toast.error("Reschedule failed", message);
    } finally {
      setBusy(false);
    }
  };

  const recordPayment = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await api.post<{ booking: BookingDetailType }>(
        `/api/admin/bookings/${booking.id}/payments`,
        { amount: Number(paymentAmount), method: paymentMethod, status: "PAID" },
      );
      applyUpdate(data.booking);
      toast.success("Payment recorded");
      setPaymentOpen(false);
    } catch (cause) {
      const message =
        cause instanceof ApiClientError ? cause.message : "Could not record the payment.";
      setError(message);
      toast.error("Could not record payment", message);
    } finally {
      setBusy(false);
    }
  };

  const saveDetails = async () => {
    setSavingDetails(true);
    setError(null);
    try {
      const data = await api.patch<{ booking: BookingDetailType }>(
        `/api/admin/bookings/${booking.id}`,
        { internalNotes: notes, assignedTechnicianId: technicianId || null },
      );
      applyUpdate(data.booking);
      toast.success("Booking updated");
    } catch (cause) {
      const message = cause instanceof ApiClientError ? cause.message : "Could not save changes.";
      setError(message);
      toast.error("Save failed", message);
    } finally {
      setSavingDetails(false);
    }
  };

  const paidTotal = booking.payments
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      {error ? (
        <Alert tone="danger" title="Action failed" live>
          {error}
        </Alert>
      ) : null}

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-sunken px-5 py-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-ink-subtle">
              {booking.reference}
            </p>
            <h1 className="mt-1 font-display text-xl font-bold text-ink sm:text-2xl">
              {booking.device.brandName} {booking.device.modelName}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Booked {formatDateTime(booking.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={booking.status} />
            <Badge tone="neutral" size="sm" icon={serviceMeta.iconKey as never}>
              {serviceMeta.label}
            </Badge>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-4">
          {nextInFlow && allowedTransitions.includes(nextInFlow) ? (
            <Button
              size="sm"
              iconRight="arrow-right"
              onClick={() => setStatusModal(nextInFlow)}
              disabled={busy}
            >
              Advance to {STATUS_META[nextInFlow].label}
            </Button>
          ) : null}

          {allowedTransitions
            .filter((status) => status !== nextInFlow)
            .map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === "CANCELLED" ? "danger" : "outline"}
                onClick={() => setStatusModal(status)}
                disabled={busy}
              >
                {STATUS_META[status].label}
              </Button>
            ))}

          {allowedTransitions.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-ink-subtle">
              <Icon name="lock" size={14} />
              This repair is closed — no further status changes are possible.
            </p>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left column */}
        <div className="space-y-6 xl:col-span-8">
          {/* Repairs */}
          <Card>
            <div className="border-b border-line px-5 py-3.5">
              <h2 className="font-display text-base font-bold text-ink">Repairs</h2>
            </div>
            <ul className="divide-y divide-line">
              {booking.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div>
                    <p className="font-semibold text-ink">{item.serviceName}</p>
                    <p className="mt-0.5 text-xs text-ink-subtle">
                      {item.partGradeLabel} · {formatDuration(item.durationMinutes)} ·{" "}
                      {formatWarranty(item.warrantyMonths)}
                    </p>
                  </div>
                  <p className="tabular shrink-0 font-semibold text-ink">
                    {item.lineTotal === 0 ? "Free" : formatMoney(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="tabular font-semibold text-ink">
                  {formatMoney(booking.pricing.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">{serviceMeta.label} fee</dt>
                <dd className="tabular font-semibold text-ink">
                  {formatMoney(booking.pricing.serviceFee)}
                </dd>
              </div>
              {booking.pricing.discount > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-success-700 dark:text-success-500">Discount</dt>
                  <dd className="tabular font-semibold text-success-700 dark:text-success-500">
                    −{formatMoney(booking.pricing.discount)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-t border-line pt-2">
                <dt className="font-bold text-ink">Total</dt>
                <dd className="tabular font-display text-lg font-bold text-ink">
                  {formatMoney(booking.pricing.total)}
                </dd>
              </div>
            </dl>
          </Card>

          {/* Problem description */}
          {booking.problemDescription ? (
            <Card className="p-5">
              <h2 className="font-display text-base font-bold text-ink">
                What the customer reported
              </h2>
              <p className="mt-2 leading-relaxed text-ink-muted">{booking.problemDescription}</p>
            </Card>
          ) : null}

          {/* Status history */}
          <Card>
            <div className="border-b border-line px-5 py-3.5">
              <h2 className="font-display text-base font-bold text-ink">Repair history</h2>
            </div>
            <ol className="divide-y divide-line">
              {[...booking.statusHistory].reverse().map((entry) => (
                <li key={entry.id} className="flex items-start gap-3.5 px-5 py-3.5">
                  <span
                    className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      entry.toStatus === "CANCELLED"
                        ? "bg-danger-50 text-danger-600 dark:bg-danger-900/40 dark:text-danger-300"
                        : entry.toStatus === "COMPLETED"
                          ? "bg-success-50 text-success-600 dark:bg-success-900/40 dark:text-success-300"
                          : "bg-sunken text-ink-muted",
                    )}
                  >
                    <Icon name="check" size={13} strokeWidth={3} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">
                        {STATUS_META[entry.toStatus]?.label ?? entry.toStatus}
                      </p>
                      {!entry.isPublic ? (
                        <Badge tone="neutral" size="sm" icon="eye-off">
                          Internal
                        </Badge>
                      ) : null}
                    </div>
                    {entry.note ? (
                      <p className="mt-0.5 text-sm text-ink-muted">{entry.note}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-ink-subtle">
                      {formatDateTime(entry.createdAt)}
                      {entry.changedBy ? ` · ${entry.changedBy}` : " · system"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          {/* Internal management */}
          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-ink">Internal</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Only visible to staff — never shown on the customer tracking page.
            </p>

            <div className="mt-4 space-y-4">
              <Field label="Assigned technician" htmlFor="technician">
                <Select
                  id="technician"
                  value={technicianId}
                  onChange={(event) => setTechnicianId(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Internal notes" htmlFor="internal-notes">
                <Textarea
                  id="internal-notes"
                  rows={4}
                  maxLength={2000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Parts ordered, diagnostic findings, anything the next technician needs to know…"
                />
              </Field>

              <Button
                onClick={saveDetails}
                loading={savingDetails}
                loadingLabel="Saving…"
                iconLeft="check"
              >
                Save changes
              </Button>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6 xl:col-span-4">
          {/* Customer */}
          <Card className="p-5">
            <h2 className="font-display text-base font-bold text-ink">Customer</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">Name</dt>
                <dd className="mt-0.5 font-semibold text-ink">{booking.customer.fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">Phone</dt>
                <dd className="tabular mt-0.5">
                  <a
                    href={`tel:+91${booking.customer.phone}`}
                    className="font-semibold text-brand-700 hover:underline dark:text-accent-300"
                  >
                    +91 {formatPhone(booking.customer.phone)}
                  </a>
                </dd>
              </div>
              {booking.customer.email ? (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                    Email
                  </dt>
                  <dd className="mt-0.5">
                    <a
                      href={`mailto:${booking.customer.email}`}
                      className="break-all font-semibold text-brand-700 hover:underline dark:text-accent-300"
                    >
                      {booking.customer.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                  Preferred contact
                </dt>
                <dd className="mt-0.5 capitalize text-ink">
                  {booking.customer.preferredContact.toLowerCase()}
                </dd>
              </div>
              {booking.address.line ? (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">
                    Address
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {booking.address.line}
                    <br />
                    {[booking.address.city, booking.address.postalCode].filter(Boolean).join(" ")}
                  </dd>
                </div>
              ) : null}
              {booking.imei ? (
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink-subtle">IMEI</dt>
                  <dd className="tabular mt-0.5 font-mono text-ink">
                    {maskIdentifier(booking.imei)}
                  </dd>
                </div>
              ) : null}
            </dl>

            {canWriteCustomers ? (
              <a
                href={`/admin/customers/${booking.customer.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline dark:text-accent-300"
              >
                View customer record
                <Icon name="arrow-right" size={14} />
              </a>
            ) : null}
          </Card>

          {/* Appointment */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-base font-bold text-ink">Appointment</h2>
              <Button
                size="sm"
                variant="outline"
                iconLeft="calendar"
                onClick={() => setRescheduleOpen(true)}
                disabled={booking.status === "COMPLETED" || booking.status === "CANCELLED"}
              >
                Reschedule
              </Button>
            </div>

            {booking.appointment ? (
              <div className="mt-3">
                <p className="font-semibold text-ink">
                  {formatDate(booking.appointment.scheduledFor)}
                </p>
                <p className="text-sm text-ink-muted">{booking.appointment.slotLabel}</p>
                <p className="mt-2 text-xs text-ink-subtle">
                  Estimated work: {formatDuration(booking.estimatedDurationMinutes)}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-subtle">No appointment scheduled.</p>
            )}
          </Card>

          {/* Payments */}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-base font-bold text-ink">Payments</h2>
              <Button
                size="sm"
                variant="outline"
                iconLeft="plus"
                onClick={() => setPaymentOpen(true)}
              >
                Record
              </Button>
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-3">
              <span className="text-sm text-ink-muted">Paid</span>
              <span
                className={cn(
                  "tabular font-display text-lg font-bold",
                  paidTotal >= booking.pricing.total
                    ? "text-success-700 dark:text-success-500"
                    : "text-ink",
                )}
              >
                {formatMoney(paidTotal)} / {formatMoney(booking.pricing.total)}
              </span>
            </div>

            <ul className="mt-3 space-y-2">
              {booking.payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm"
                >
                  <span>
                    <span className="block font-medium text-ink">
                      {PAYMENT_METHOD_LABEL[payment.method as keyof typeof PAYMENT_METHOD_LABEL] ??
                        payment.method}
                    </span>
                    <span className="block text-xs text-ink-subtle">
                      {payment.paidAt ? formatDateTime(payment.paidAt) : "Not yet paid"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="tabular block font-semibold text-ink">
                      {formatMoney(payment.amount)}
                    </span>
                    <Badge
                      tone={
                        payment.status === "PAID"
                          ? "success"
                          : payment.status === "FAILED"
                            ? "danger"
                            : "neutral"
                      }
                      size="sm"
                    >
                      {payment.status}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Status change modal */}
      <Modal
        open={statusModal !== null}
        onClose={() => {
          setStatusModal(null);
          setStatusNote("");
        }}
        title={statusModal ? `Move to ${STATUS_META[statusModal].label}` : ""}
        description={statusModal ? STATUS_META[statusModal].description : undefined}
        dismissible={!busy}
        footer={
          <>
            <Button variant="outline" onClick={() => setStatusModal(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={statusModal === "CANCELLED" ? "danger" : "primary"}
              onClick={() => statusModal && changeStatus(statusModal)}
              loading={busy}
              loadingLabel="Updating…"
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Note for the customer"
            htmlFor="status-note"
            hint={
              statusPublic
                ? "Shown on the customer's tracking page."
                : "Kept internal — the customer will not see this."
            }
          >
            <Textarea
              id="status-note"
              rows={3}
              maxLength={500}
              value={statusNote}
              onChange={(event) => setStatusNote(event.target.value)}
              placeholder={
                statusModal === "CANCELLED"
                  ? "Reason for cancellation…"
                  : "Anything the customer should know at this stage…"
              }
              data-autofocus
            />
          </Field>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={statusPublic}
              onChange={(event) => setStatusPublic(event.target.checked)}
              className="mt-0.5 h-5 w-5 rounded-md border-2 border-line-strong accent-brand-700"
            />
            <span className="text-sm">
              <span className="font-medium text-ink">Show this update to the customer</span>
              <span className="mt-0.5 block text-ink-subtle">
                Uncheck to record an internal-only note against the repair.
              </span>
            </span>
          </label>
        </div>
      </Modal>

      {/* Reschedule modal */}
      <Modal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Reschedule appointment"
        description="Availability is re-checked, so a full slot will be rejected."
        dismissible={!busy}
        footer={
          <>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={reschedule} loading={busy} loadingLabel="Moving…">
              Move appointment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="New date" htmlFor="reschedule-date" required>
            <Input
              id="reschedule-date"
              type="date"
              value={rescheduleDate}
              min={toDateKey(new Date())}
              max={toDateKey(addDays(new Date(), 21))}
              onChange={(event) => setRescheduleDate(event.target.value)}
              data-autofocus
            />
          </Field>

          <Field label="New time slot" htmlFor="reschedule-slot" required>
            <Select
              id="reschedule-slot"
              value={rescheduleSlot}
              onChange={(event) => setRescheduleSlot(event.target.value)}
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      {/* Payment modal */}
      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record a payment"
        description="For payments taken in person. Online payments are captured by the payment provider."
        dismissible={!busy}
        footer={
          <>
            <Button variant="outline" onClick={() => setPaymentOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={recordPayment} loading={busy} loadingLabel="Recording…">
              Record payment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Amount" htmlFor="payment-amount" required hint="In whole rupees.">
            <Input
              id="payment-amount"
              type="number"
              inputMode="numeric"
              min={1}
              prefix="₹"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              data-autofocus
            />
          </Field>

          <Field label="Method" htmlFor="payment-method" required>
            <Select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABEL[method]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
