import { Analytics } from "@/components/site/Analytics";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { JsonLd } from "@/components/site/JsonLd";
import { StickyBookBar } from "@/components/site/StickyBookBar";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { businessSchema, websiteSchema } from "@/lib/structured-data";

/**
 * Public site shell.
 *
 * Also emits the business and website structured data once, at the layout
 * level, so every marketing page carries it without each page repeating the
 * markup. Page-level schema points back at the business by its @id.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <JsonLd data={{ "@graph": [businessSchema(), websiteSchema()] }} />

      <div className="flex min-h-dvh flex-col">
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>

      <StickyBookBar />
      <WhatsAppButton />
      {/* Public pages only: staff traffic in /admin must not reach ad audiences. */}
      <Analytics />
    </>
  );
}
