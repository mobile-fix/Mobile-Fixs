import type { Metadata } from "next";

import { LegalList, LegalPage, LegalSection } from "@/components/site/LegalPage";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/primitives";
import { PART_GRADES, PART_GRADE_META } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Phone Repair Warranty Policy",
  description:
    "What the MyMobiFix repair warranty covers, how long it lasts for each part grade, what is excluded, and how to make a claim.",
  path: "/warranty",
});

export default function WarrantyPage() {
  return (
    <LegalPage
      title="Warranty Policy"
      updated="1 September 2026"
      intro="Every repair we carry out is covered against failure of the part we fitted and of our workmanship. Here is exactly what that means, how long it lasts and how to claim."
    >
      <Card className="p-6">
        <h2 className="font-display text-lg font-bold text-ink">Cover by part grade</h2>
        <p className="mt-2 text-sm text-ink-muted">
          The warranty period follows the part grade you chose at booking.
        </p>
        <dl className="mt-5 space-y-4">
          {PART_GRADES.map((grade) => {
            const meta = PART_GRADE_META[grade];
            const base = 6;
            const months = Math.max(0, base + meta.warrantyBonusMonths);
            return (
              <div key={grade} className="flex items-start justify-between gap-4 border-b border-line pb-4 last:border-0 last:pb-0">
                <div>
                  <dt className="font-semibold text-ink">{meta.label}</dt>
                  <dd className="mt-0.5 text-sm text-ink-muted">{meta.description}</dd>
                </div>
                <dd className="tabular shrink-0 font-display text-lg font-bold text-ink">
                  {months} mo
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-4 text-xs text-ink-subtle">
          Typical periods shown for a standard repair. Some services differ — water damage treatment
          carries a 1-month functional warranty, and back glass replacement 3 months. The exact
          period for your repair is shown in your quote and on your booking confirmation.
        </p>
      </Card>

      <LegalSection heading="What is covered">
        <p>
          The warranty covers failure of the component we supplied and fitted, and of the work we
          performed, under normal use. If a covered fault appears within the warranty period we
          repair or replace it at no charge, including labour.
        </p>
        <LegalList
          items={[
            "The replacement part failing or degrading abnormally",
            "Faults caused by our workmanship, including reassembly and sealing",
            "Functions that worked before the repair and stopped working because of it",
            "Adhesive or gasket failure on a seal we applied",
          ]}
        />
      </LegalSection>

      <LegalSection heading="What is not covered">
        <p>
          A repair warranty is not an insurance policy. New damage, and faults in components we never
          touched, fall outside it.
        </p>
        <LegalList
          items={[
            "New physical damage — drops, impacts, crushing or bending after the repair",
            "Liquid ingress occurring after the repair, including on devices we have re-sealed",
            "Faults in a component unrelated to the work carried out",
            "Damage caused by a third party opening the device after our repair",
            "Software problems, data loss, or issues introduced by an operating system update",
            "Normal battery capacity decline within manufacturer tolerance",
            "Devices previously repaired elsewhere where prior work caused the fault",
          ]}
        />
      </LegalSection>

      <LegalSection heading="Water damage treatment">
        <p>
          Liquid damage is the one repair nobody can guarantee. Corrosion continues invisibly after
          the initial exposure and can cause a component to fail weeks later, so water damage
          treatment carries a 1-month functional warranty covering only the specific faults resolved
          at the time of the repair. We tell you our honest assessment of the odds before we start,
          and you only pay if you approve the work.
        </p>
      </LegalSection>

      <LegalSection heading="How to make a claim">
        <p>
          Claims are handled at the same speed as an original repair — we do not send devices away
          for weeks.
        </p>
        <ol className="ml-5 list-decimal space-y-2">
          <li>Contact us with your repair ID and a description of the fault.</li>
          <li>
            We book you into the next available slot, at your address or by free pickup and drop, at no charge.
          </li>
          <li>
            We verify the fault is covered. If it is, we repair or replace it free. If it is not, we
            tell you why and quote the repair before doing anything.
          </li>
        </ol>
        <p>
          A warranty repair does not restart the warranty period; cover continues from the date of
          the original repair.
        </p>
      </LegalSection>

      <LegalSection heading="Transfer and proof">
        <p>
          The warranty attaches to the device, not to the person, so it survives a private sale. Your
          repair ID is the proof — the new owner can quote it in the same way. We keep the repair
          record for the full warranty period and beyond.
        </p>
      </LegalSection>

      <div className="flex flex-wrap gap-3 border-t border-line pt-8">
        <ButtonLink href="/contact" iconRight="arrow-right">
          Start a warranty claim
        </ButtonLink>
        <ButtonLink href="/track" variant="outline" iconLeft="search">
          Find your repair ID
        </ButtonLink>
      </div>
    </LegalPage>
  );
}
