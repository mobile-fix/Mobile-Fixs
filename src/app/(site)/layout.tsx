import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { StickyBookBar } from "@/components/site/StickyBookBar";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { contactConfig, siteConfig } from "@/lib/config";

/**
 * Public site shell.
 *
 * Also emits the LocalBusiness structured data once, at the layout level, so
 * every marketing page carries it without each page repeating the markup.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.url}/#business`,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: contactConfig.phone,
    email: contactConfig.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contactConfig.address,
      addressCountry: "IN",
    },
    openingHours: "Mo-Sa 09:00-20:00",
    areaServed: { "@type": "Country", name: "India" },
    makesOffer: [
      "Screen Replacement",
      "Battery Replacement",
      "Charging Port Repair",
      "Back Glass Replacement",
      "Camera Repair",
      "Water Damage Treatment",
    ].map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service, serviceType: "Mobile Phone Repair" },
    })),
  };

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <script
        type="application/ld+json"
        // Serialised from a literal object we control — no user input reaches it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="flex min-h-dvh flex-col">
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </div>

      <StickyBookBar />
      <WhatsAppButton />
    </>
  );
}
