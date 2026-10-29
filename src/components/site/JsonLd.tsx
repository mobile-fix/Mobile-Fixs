/**
 * Inline JSON-LD.
 *
 * Some schema text comes from the database (service names and descriptions an
 * admin can edit). Escaping "<" stops a stray "</script>" in that text from
 * closing the tag early and turning data into markup.
 */
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
