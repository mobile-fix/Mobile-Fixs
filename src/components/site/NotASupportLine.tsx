import { Icon, type IconName } from "@/components/icons";

/**
 * "Why this isn't a support line" — three plain statements of what the service
 * physically is. Shared by the homepage and the city landing pages so the
 * wording is identical everywhere.
 */
const POINTS: Array<{ icon: IconName; title: string; body: string }> = [
  {
    icon: "home",
    title: "Someone physically turns up.",
    body: "A technician with the part and the tools, at your address, at a time you chose. Nothing happens over a chat window.",
  },
  {
    icon: "wrench",
    title: "The part is replaced, not reconfigured.",
    body: "Glass, cell, port, camera. Hardware only — no remote fixes.",
  },
  {
    icon: "eye",
    title: "Done in front of you.",
    body: "At-home jobs happen on your table. No back room, no swapped parts, nothing to take on trust.",
  },
];

export function NotASupportLine({
  className,
  headingLevel = "h2",
}: {
  className?: string;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <section className={className} aria-labelledby="not-support-heading">
      <Heading
        id="not-support-heading"
        className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl"
      >
        Why this isn&rsquo;t a support line
      </Heading>
      <ul className="mt-6 grid gap-5 md:grid-cols-3">
        {POINTS.map((point) => (
          <li key={point.title} className="rounded-2xl border border-line bg-surface p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300">
              <Icon name={point.icon} size={20} />
            </span>
            <h3 className="mt-4 font-display text-base font-bold text-ink">{point.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{point.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
