import { Icon } from "@/components/icons";
import { whatsappChatHref, whatsappDisplay, whatsappHref } from "@/lib/config";

/**
 * Floating WhatsApp button, on every public page.
 *
 * Prices are not published, so this is the main way to get a quote from
 * anywhere. Server-rendered with no client JavaScript. On small screens it sits
 * above the sticky booking bar so the two never overlap.
 *
 * #128C7E (WhatsApp's darker green) rather than #25D366: white on the bright
 * green is ~2:1, below the 3:1 WCAG minimum for a graphical control.
 */
export function WhatsAppButton() {
  if (!whatsappHref) return null;

  return (
    <a
      href={whatsappChatHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with us on WhatsApp at ${whatsappDisplay} (opens in a new tab)`}
      className="no-print group fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-[#128C7E] p-3.5 text-white shadow-xl ring-4 ring-white/70 transition-transform hover:scale-105 hover:bg-[#0f7a6e] focus-visible:outline-none focus-visible:ring-[#128C7E]/40 motion-reduce:transition-none motion-reduce:hover:scale-100 sm:right-6 lg:bottom-6 lg:px-5 dark:ring-black/40"
    >
      <Icon name="whatsapp" size={26} />
      <span className="hidden font-semibold lg:inline">Chat on WhatsApp</span>
    </a>
  );
}
