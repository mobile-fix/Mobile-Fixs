import "server-only";

import { serverEnv } from "@/lib/env";
import { STATUS_META, type RepairStatus } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import type { BookingDetail } from "./booking.service";

/**
 * Outbound customer notifications.
 *
 * This module is deliberately honest: when a provider's credentials are absent
 * it logs a clearly-labelled "skipped" record and returns `sent: false`. It never
 * reports success for a message that was not actually delivered.
 *
 * Wiring a real provider means implementing the single `deliver*` function for
 * it — the channel selection, templating and call sites above stay unchanged.
 */

export type DeliveryChannel = "EMAIL" | "SMS" | "WHATSAPP";

export type DeliveryResult = {
  channel: DeliveryChannel;
  sent: boolean;
  reason?: string;
  providerId?: string;
};

type Message = {
  to: string;
  subject: string;
  text: string;
};

// ── Channel adapters ────────────────────────────────────────────────────────

async function deliverEmail(message: Message): Promise<DeliveryResult> {
  if (!serverEnv.smtp.configured) {
    return skipped("EMAIL", "SMTP_HOST / SMTP_USER / SMTP_PASSWORD are not set");
  }

  // Integration point: instantiate your SMTP transport here, e.g.
  //   const transport = nodemailer.createTransport({ host, port, auth });
  //   const info = await transport.sendMail({ from, to, subject, text });
  //   return { channel: "EMAIL", sent: true, providerId: info.messageId };
  return skipped("EMAIL", "SMTP transport not implemented in this deployment");
}

async function deliverSms(message: Message): Promise<DeliveryResult> {
  if (!serverEnv.sms.configured) {
    return skipped("SMS", "SMS_PROVIDER / SMS_API_KEY are not set");
  }

  // Integration point: POST to your SMS gateway using serverEnv.sms.*
  return skipped("SMS", `SMS provider "${serverEnv.sms.provider}" adapter not implemented`);
}

async function deliverWhatsApp(message: Message): Promise<DeliveryResult> {
  if (!serverEnv.whatsapp.configured) {
    return skipped("WHATSAPP", "WHATSAPP_API_URL / WHATSAPP_API_TOKEN are not set");
  }

  // Integration point: POST to the WhatsApp Business Cloud API.
  return skipped("WHATSAPP", "WhatsApp adapter not implemented");
}

function skipped(channel: DeliveryChannel, reason: string): DeliveryResult {
  if (process.env.NODE_ENV !== "test") {
    console.info(`[notify] ${channel} skipped — ${reason}`);
  }
  return { channel, sent: false, reason };
}

async function dispatch(channel: DeliveryChannel, message: Message): Promise<DeliveryResult> {
  try {
    switch (channel) {
      case "EMAIL":
        return await deliverEmail(message);
      case "SMS":
        return await deliverSms(message);
      case "WHATSAPP":
        return await deliverWhatsApp(message);
    }
  } catch (error) {
    console.error(`[notify] ${channel} delivery threw`, error);
    return { channel, sent: false, reason: "Provider request failed" };
  }
}

type NotifiableCustomer = {
  phone: string;
  email: string | null;
  preferredContact: string;
};

/** Picks channels from the customer's stated preference, with sensible fallbacks. */
function channelsFor(customer: NotifiableCustomer): Array<{ channel: DeliveryChannel; to: string }> {
  const targets: Array<{ channel: DeliveryChannel; to: string }> = [];
  const { preferredContact, phone, email } = customer;

  if (preferredContact === "EMAIL" && email) targets.push({ channel: "EMAIL", to: email });
  else if (preferredContact === "WHATSAPP") targets.push({ channel: "WHATSAPP", to: phone });
  else targets.push({ channel: "SMS", to: phone });

  // Always mirror to email when we have one — customers keep the paper trail.
  if (email && !targets.some((target) => target.channel === "EMAIL")) {
    targets.push({ channel: "EMAIL", to: email });
  }
  return targets;
}

// ── Templates ───────────────────────────────────────────────────────────────

export async function notifyBookingCreated(booking: {
  reference: string;
  customer: { fullName: string; phone: string; email: string | null; preferredContact: string };
  deviceBrandName: string;
  deviceModelName: string;
  total: number;
  appointment: { scheduledFor: Date; slotLabel: string } | null;
}): Promise<DeliveryResult[]> {
  const when = booking.appointment
    ? `${formatDateTime(booking.appointment.scheduledFor)} (${booking.appointment.slotLabel})`
    : "to be confirmed";

  const text = [
    `Hi ${booking.customer.fullName},`,
    "",
    `Your MyMobiFix repair is booked.`,
    `Repair ID: ${booking.reference}`,
    `Device: ${booking.deviceBrandName} ${booking.deviceModelName}`,
    `Appointment: ${when}`,
    `Estimated total: ${formatMoney(booking.total)}`,
    "",
    `Track your repair any time with your Repair ID and phone number.`,
  ].join("\n");

  const targets = channelsFor(booking.customer);
  return Promise.all(
    targets.map((target) =>
      dispatch(target.channel, {
        to: target.to,
        subject: `Repair ${booking.reference} confirmed — MyMobiFix`,
        text,
      }),
    ),
  );
}

export async function notifyStatusChanged(
  booking: BookingDetail,
  fromStatus: RepairStatus,
): Promise<DeliveryResult[]> {
  const meta = STATUS_META[booking.status];
  const text = [
    `Hi ${booking.customer.fullName},`,
    "",
    `Repair ${booking.reference} is now: ${meta.label}.`,
    meta.description,
    "",
    `Device: ${booking.device.brandName} ${booking.device.modelName}`,
    `Previous status: ${STATUS_META[fromStatus].label}`,
  ].join("\n");

  const targets = channelsFor(booking.customer);
  return Promise.all(
    targets.map((target) =>
      dispatch(target.channel, {
        to: target.to,
        subject: `Repair ${booking.reference}: ${meta.label} — MyMobiFix`,
        text,
      }),
    ),
  );
}

/** Reported on the admin dashboard so operators know which channels are live. */
export function integrationStatus() {
  return {
    email: { configured: serverEnv.smtp.configured, provider: "SMTP" },
    sms: { configured: serverEnv.sms.configured, provider: serverEnv.sms.provider ?? "—" },
    whatsapp: { configured: serverEnv.whatsapp.configured, provider: "WhatsApp Cloud API" },
    payments: { configured: serverEnv.payments.configured, provider: serverEnv.payments.provider ?? "—" },
  };
}
