import type { Metadata } from "next";

import { LegalList, LegalPage, LegalSection } from "@/components/site/LegalPage";
import { contactConfig, siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "The terms that apply when you book a mobile phone repair with MyMobiFix: quotes, your device and data, payment, cancellation, liability and warranty.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="1 September 2026"
      intro={`These terms apply when you book a repair with ${siteConfig.name}. They set out what we commit to, what we need from you, and what happens when something does not go to plan.`}
    >
      <LegalSection heading="1. Quotes">
        <p>
          We do not publish prices on this website. We give you a quote for your specific device,
          repair and part grade — on WhatsApp, by phone or after diagnosis — before any work begins.
        </p>
        <LegalList
          items={[
            "Diagnostics are free, whether or not you proceed with a repair.",
            "If diagnosis shows the fault differs from what was booked, we tell you the revised quote and wait for your approval before any work begins.",
            "You are never charged for work you did not approve.",
            "Quotes include the part, labour and applicable taxes. There is no fee for the doorstep visit or for pickup and drop; the quote covers the repair only.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="2. Your device">
        <p>
          You confirm that you own the device or are authorised to have it repaired, and that it is
          not reported lost or stolen. We do not remove activation locks, bypass account security, or
          work on devices we have reason to believe are not legitimately held.
        </p>
        <p>
          Devices left with us for more than 90 days after we notify you that a repair is complete or
          cannot proceed may be disposed of or recycled, after reasonable attempts to contact you on
          the details you provided.
        </p>
      </LegalSection>

      <LegalSection heading="3. Data and backups">
        <p>
          You are responsible for backing up your data before any repair. Most hardware repairs carry
          no data risk, but a device that is already failing can lose data for reasons unrelated to
          our work, and some faults cannot be diagnosed without a firmware operation that erases
          content.
        </p>
        <LegalList
          items={[
            "We tell you in advance before any step that would erase data.",
            "We do not browse, copy or extract personal content from devices.",
            "We ask for a passcode only where a repair genuinely cannot be verified without it, and we tell you why.",
            "We are not liable for data loss. Back up first.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="4. Appointments and cancellation">
        <p>
          Appointments are two-hour windows. We confirm a narrower arrival time on the morning of a
          doorstep appointment.
        </p>
        <LegalList
          items={[
            "Rescheduling and cancellation are free at any point before work begins.",
            "If nobody is available at a doorstep appointment, we will attempt to contact you and rebook. We may ask you to choose a firmer time if appointments are repeatedly missed.",
            "If we cannot attend as scheduled, we will tell you as early as possible and offer the next available slot.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="5. Payment">
        <p>
          Payment is due once the repair is complete and the device has been returned to you. We do
          not take payment up front for standard repairs.
        </p>
        <LegalList
          items={[
            "Accepted methods: UPI, credit and debit cards, and cash on handover.",
            "Online prepayment is available only where a payment provider is configured for this deployment.",
            "If a repair cannot be completed, no charge is made — including for parts already ordered.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="6. Parts">
        <p>
          We offer original, premium and standard parts and describe the difference plainly. You
          choose the grade; we fit what you chose. Removed components remain with us for
          recycling unless you ask for them back at the time of booking.
        </p>
        <p>
          Fitting a non-manufacturer part may affect any remaining manufacturer warranty on your
          device. We tell you this before proceeding, and it is your decision to make.
        </p>
      </LegalSection>

      <LegalSection heading="7. Liability">
        <p>
          We take responsibility for damage we cause. Our liability is limited to repairing or
          replacing the affected component, or refunding what you paid for the repair, whichever you
          prefer.
        </p>
        <LegalList
          items={[
            "We are not liable for pre-existing damage, including damage revealed only once a device is opened.",
            "We are not liable for data loss, or for indirect or consequential losses such as lost income or missed appointments.",
            "Some devices with prior water damage or previous third-party repair carry inherent risk. We tell you before starting when we believe this applies.",
          ]}
        />
        <p>
          Nothing in these terms limits any statutory rights you have as a consumer under applicable
          law.
        </p>
      </LegalSection>

      <LegalSection heading="8. Warranty">
        <p>
          Repairs are covered by our warranty policy, which forms part of these terms. The period
          depends on the part grade chosen and is stated on your booking confirmation.
        </p>
      </LegalSection>

      <LegalSection heading="9. Changes to these terms">
        <p>
          We may update these terms. The version in force is the one published on this page at the
          time you make a booking, and we keep a record of it against your repair.
        </p>
      </LegalSection>

      <LegalSection heading="10. Contact">
        <p>
          Questions about these terms: {contactConfig.email} or {contactConfig.phone}. Registered
          address: {contactConfig.address}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
