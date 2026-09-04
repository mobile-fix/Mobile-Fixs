import type { Metadata } from "next";

import { LegalList, LegalPage, LegalSection } from "@/components/site/LegalPage";
import { contactConfig, siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What personal data MyMobiFix collects when you book a repair, why we collect it, how long we keep it, who we share it with, and the rights you have over it.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="1 September 2026"
      intro={`What ${siteConfig.name} collects, why, how long we keep it and what you can ask us to do with it. We collect the minimum needed to complete your repair.`}
    >
      <LegalSection heading="What we collect">
        <p>We collect only what a repair actually requires.</p>
        <LegalList
          items={[
            "Name, phone number and (optionally) email address — to confirm your appointment and let you track the repair.",
            "Address and PIN code — only when you choose pickup or an at-home repair, because we cannot come to you otherwise.",
            "Device details: brand, model, the fault, and optionally the IMEI so we can order the correct part.",
            "Your repair history with us, so a warranty claim can be verified.",
            "Contact-form enquiries, so we can reply to them.",
          ]}
        />
        <p>
          We do not require an account, and customers never set a password. Tracking a repair uses
          your repair ID together with the phone number on the booking.
        </p>
      </LegalSection>

      <LegalSection heading="What we do not collect">
        <LegalList
          items={[
            "Content from your device — photos, messages, contacts, files.",
            "Payment card numbers. Where online payment is enabled, card details go directly to the payment provider and never reach our servers.",
            "Location data beyond the address you type in yourself.",
            "Advertising or cross-site tracking identifiers.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Why we hold it">
        <p>
          To perform the repair you asked for, to contact you about it, to honour warranty claims,
          and to meet tax and accounting obligations. We do not sell personal data, and we do not use
          it for advertising.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <LegalList
          items={[
            "Booking and repair records: for the warranty period plus the statutory retention period for financial records.",
            "Contact enquiries: 24 months from the last message in the thread.",
            "Staff session records: automatically purged shortly after expiry.",
            "IMEI numbers: kept with the repair record so a warranty claim can be matched to the right device.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Who we share it with">
        <p>
          Only where it is needed to deliver the service, and only the minimum required in each case:
        </p>
        <LegalList
          items={[
            "The technician assigned to your repair.",
            "Our SMS, email or WhatsApp provider, to send booking and status notifications.",
            "Our payment provider, where online payment is used.",
            "Authorities, where we are legally required to disclose.",
          ]}
        />
        <p>
          Notification and payment providers are configured per deployment. Where none is configured,
          no third party receives your data at all.
        </p>
      </LegalSection>

      <LegalSection heading="How we protect it">
        <LegalList
          items={[
            "Traffic is encrypted in transit over HTTPS.",
            "Staff passwords are stored as bcrypt hashes, never in a readable form.",
            "Staff sessions are server-side and can be revoked immediately.",
            "Access to customer records is restricted by role, and every repair status change is recorded against the staff member who made it.",
            "Input is validated and sanitised on the server, not only in the browser.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          We use one essential cookie, and only for staff: a signed session cookie for the admin
          dashboard. It is httpOnly, SameSite=Lax and secure in production. Customers browsing or
          booking are not given a tracking cookie, and there are no third-party analytics or
          advertising cookies — which is why this site has no cookie consent banner to dismiss.
        </p>
        <p>
          Your light or dark theme preference is stored in your browser&rsquo;s local storage. It
          never leaves your device and is not sent to us.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>You can ask us to:</p>
        <LegalList
          items={[
            "Tell you what we hold about you and provide a copy.",
            "Correct anything inaccurate.",
            "Delete your records, where no legal obligation requires us to keep them.",
            "Stop sending you notifications.",
          ]}
        />
        <p>
          Email {contactConfig.email} with your request. We respond within 30 days and will verify
          your identity first, using the phone number on your bookings.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Privacy questions or complaints: {contactConfig.email}, or write to us at{" "}
          {contactConfig.address}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
