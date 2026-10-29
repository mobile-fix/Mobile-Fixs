import type { Metadata } from "next";

import { LegalList, LegalPage, LegalSection } from "@/components/site/LegalPage";
import { contactConfig, displayAddress, siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What personal data MyMobiFix collects when you book a repair or visit the site, why, how long we keep it, who we share it with, and your rights over it.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="29 October 2026"
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
            "Basic visit and ad-performance data through Google Analytics 4, Google Ads and the Meta Pixel — see “Analytics and advertising” below.",
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
            "The contents of your booking or contact form in our analytics and advertising tools — those tools only ever see that a form was submitted, never what you typed.",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Why we hold it">
        <p>
          To perform the repair you asked for, to contact you about it, to honour warranty claims,
          and to meet tax and accounting obligations. We do not sell personal data, and we do not use
          the details you give us in a booking or enquiry to target you with ads. Separately,
          anonymous visit and click data helps us measure our own advertising — see “Analytics and
          advertising” below.
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
            "Google and Meta, for the analytics and advertising measurement described below.",
            "Authorities, where we are legally required to disclose.",
          ]}
        />
        <p>
          We use notification and payment providers only where they are needed for your booking, and
          share only the minimum they need.
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
          booking are not given a login cookie. The analytics and advertising tools described in
          the next section set their own cookies or use similar technologies, such as local
          storage and tracking pixels.
        </p>
        <p>
          Your light or dark theme preference is stored in your browser&rsquo;s local storage. It
          never leaves your device and is not sent to us.
        </p>
      </LegalSection>

      <LegalSection heading="Analytics and advertising">
        <p>
          To understand how people use this site and whether our ads are working, we use three
          third-party tools. They use cookies or similar technologies to recognise a browser
          between visits:
        </p>
        <LegalList
          items={[
            "Google Analytics 4 — measures visits, the pages viewed and how visitors reach the site.",
            "Google Ads conversion tracking — records when a visit that began with one of our ads leads to a booking, a WhatsApp chat or a call.",
            "Meta Pixel — records the same kind of events so we can measure and improve ads shown on Facebook and Instagram.",
          ]}
        />
        <p>What these tools receive:</p>
        <LegalList
          items={[
            "The pages you view and how you arrived at them.",
            "Clicks on our WhatsApp and call links.",
            "The fact that a booking or contact form was submitted, as an event. The details you typed into the form are not sent to these tools.",
            "Technical information your browser shares automatically, such as device type, browser, approximate location from your IP address and a cookie or advertising identifier.",
          ]}
        />
        <p>
          This data is processed by Google and Meta under their own privacy policies. They may use it
          to measure and improve their own services and advertising, and may combine it with other
          information they hold about you if you are signed in to their services.
        </p>
        <p>You can opt out at any time:</p>
        <LegalList
          items={[
            "Block or delete cookies and site data in your browser settings.",
            "Install the Google Analytics opt-out browser add-on (tools.google.com/dlpage/gaoptout).",
            "Manage personalised advertising from Google at adssettings.google.com.",
            "Manage ad preferences from Meta in your Facebook or Instagram account settings under Ad Preferences.",
          ]}
        />
        <p>
          The site works the same whether or not you opt out. Messaging or calling us does not
          depend on these tools.
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
          Privacy questions or complaints: {contactConfig.email}
          {displayAddress ? <>, or write to us at {displayAddress}</> : null}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
