/**
 * FAQ content.
 *
 * Kept as data rather than markup so the same answers feed the FAQ page, the
 * homepage preview and the FAQPage structured data without drifting apart.
 */

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  category: "Repairs" | "Booking" | "Warranty" | "Payment" | "Tracking";
};

export const FAQS: FaqEntry[] = [
  {
    id: "how-long",
    category: "Repairs",
    question: "How long does a repair take?",
    answer:
      "Most common repairs — screens, batteries, charging ports, speakers — take 45 to 90 minutes and are done while you wait or while our technician is at your address. Back glass replacement takes around 90 minutes because of the adhesive cure. Water damage is the exception: it needs a full teardown and ultrasonic clean, so allow up to 4 hours plus drying time. Message us on WhatsApp with your model and we will confirm the exact time for your job.",
  },
  {
    id: "warranty",
    category: "Warranty",
    question: "Do you provide a warranty?",
    answer:
      "Yes, on every repair. The length depends on the part grade you choose: 12 months on original (OEM) parts, 6 months on premium parts and 3 months on standard parts. The warranty covers the part we fitted and the workmanship. It does not cover new physical damage, liquid ingress after the repair, or faults in a component we did not touch. Water damage treatment carries a 1-month functional warranty because the outcome depends on corrosion we cannot fully predict.",
  },
  {
    id: "appointment",
    category: "Booking",
    question: "Do I need an appointment?",
    answer:
      "For a store visit you can walk in during opening hours, but booking a slot means the part is reserved and a technician is free when you arrive, so you are not waiting. For pickup and at-home repairs an appointment is required — we need to know where to send someone and when. Same-day slots are usually available if you book at least 90 minutes ahead.",
  },
  {
    id: "pickup",
    category: "Booking",
    question: "Do you offer pickup and delivery?",
    answer:
      "Yes. Pickup and delivery collects your device, repairs it at our lab and returns it to the same address, for a flat convenience fee. At-home repair sends a technician with the parts and tools to fix it in front of you, which is the better choice if you do not want to be without your phone at all. Both are chosen when you book, and any pickup fee is confirmed in your quote on WhatsApp before you agree.",
  },
  {
    id: "cannot-repair",
    category: "Repairs",
    question: "What happens if my phone cannot be repaired?",
    answer:
      "You pay nothing. Diagnostics are free, and we quote before opening anything. If we find during the repair that the fault is unfixable or would cost more than the device is worth, we stop, put it back together, explain exactly what we found and return it at no charge. This is most common with severe liquid damage and board-level faults, and we will tell you the odds honestly before we start.",
  },
  {
    id: "parts-warranty",
    category: "Warranty",
    question: "Are replacement parts covered by warranty?",
    answer:
      "Yes — the part and the labour are both covered for the full warranty period of the grade you chose. If a replaced screen develops dead pixels, a new battery degrades abnormally fast, or a fitted charging port stops working, bring it back and we replace it again at no cost. Claims are handled with the same turnaround as an original repair, not sent away for weeks.",
  },
  {
    id: "tracking",
    category: "Tracking",
    question: "How can I track my repair?",
    answer:
      "Every booking gets a repair ID that looks like MMF-7K4Q2M. Enter it with the phone number you booked with on the Track Repair page and you will see exactly which stage your device is at — booking received, device received, diagnosis, repair in progress, quality check, ready, completed — with a timestamp for each. No account or app is required.",
  },
  {
    id: "payment",
    category: "Payment",
    question: "What payment methods are supported?",
    answer:
      "You pay after the repair is complete and you are happy with it — never up front. We accept UPI, credit and debit cards, and cash at the point of handover. We do not ask for any payment before the work is done.",
  },
  {
    id: "data",
    category: "Repairs",
    question: "Is my data safe during a repair?",
    answer:
      "We do not need your passcode for the vast majority of repairs, and we will tell you in advance on the rare occasions we do (usually to verify a fixed camera or Face ID afterwards). We never browse, copy or extract personal content. Back up before any repair as a matter of course — most hardware repairs carry no data risk, but a device that is already failing can lose data for reasons unrelated to the work.",
  },
  {
    id: "genuine-parts",
    category: "Repairs",
    question: "What is the difference between original, premium and standard parts?",
    answer:
      "Original (OEM) parts are manufacturer components with identical specification to what left the factory — the highest cost and the longest warranty. Premium parts are high-grade equivalents, colour and brightness matched, and are what most customers choose. Standard parts restore full function at the lowest cost with a shorter warranty. Ask for a quote on WhatsApp and we will give you the price for each grade side by side, so you can compare the real difference rather than guess.",
  },
  {
    id: "cancel",
    category: "Booking",
    question: "Can I cancel or reschedule my booking?",
    answer:
      "Yes, free of charge. Call or message us with your repair ID and we will move your slot or cancel it. Because nothing is charged until the repair is complete, cancelling costs you nothing at any point before work begins.",
  },
  {
    id: "areas",
    category: "Booking",
    question: "Which areas do you cover for doorstep repairs?",
    answer:
      "Doorstep coverage depends on your location. When you enter your PIN code during booking we confirm whether at-home and pickup options are available there; if they are not, a store visit is still offered. Message us on WhatsApp to check your area — we use those requests to decide where to expand.",
  },
];

export const FAQ_CATEGORIES = ["Repairs", "Booking", "Warranty", "Payment", "Tracking"] as const;

/** Google-compatible FAQPage structured data built from the same source. */
export function faqStructuredData(entries: FaqEntry[] = FAQS) {
  return {
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}
