/**
 * Content for the city landing pages:
 *   /screen-repair/[city]   /battery-repair/[city]   /phone-repair/[city]
 *
 * One template (src/components/city/CityPartPage.tsx) renders all three; what
 * differs is here. Each part has its own intro and its own FAQs — none are
 * shared between pages, so no page is a copy of another with a word swapped.
 *
 * Turnaround and warranty figures come from the catalogue defaults in
 * prisma/seed-data.ts and the grade rules in src/lib/constants.ts
 * (screen 60 min, battery 45 min; 6-month base warranty, +6 for original
 * parts, −3 for standard). Prices are deliberately "₹—" — see TODO_PRICES.md.
 */

export type CityFaq = { question: string; answer: string };

export type PartKey = "screen" | "battery" | "phone";

export type PartContent = {
  /** "Screen" → H1 "Screen replacement in Delhi — at your door". */
  part: string;
  /** The URL segment: /screen-repair/delhi. */
  routeSegment: string;
  metaDescription: string;
  intro: string[];
  priceBand: string;
  turnaround: string;
  warranty: string;
  /** Catalogue service pages to link to for detail. */
  serviceLinks: Array<{ href: string; label: string }>;
  /** schema.org Service.serviceType */
  serviceType: string;
  faqs: CityFaq[];
};

export type CityContent = { slug: string; name: string };

export const CITIES: Record<string, CityContent> = {
  delhi: { slug: "delhi", name: "Delhi" },
};

export const CITY_SLUGS = Object.keys(CITIES);

export const PARTS: Record<PartKey, PartContent> = {
  screen: {
    part: "Screen",
    routeSegment: "screen-repair",
    metaDescription:
      "Cracked or dead phone screen replaced in person at your Delhi address. iPhone, Samsung and Android. No visit fee, 3–12 month warranty, pay on handover.",
    intro: [
      "Cracked glass, lines across the display, touch that stops responding in one corner, or a screen that stays black while the phone still vibrates. A technician brings the replacement display assembly to your home or office and fits it there, usually within the hour.",
      "You choose the part grade before anything is opened, see the firm price for your exact model, and pay only once the new screen is working in your hand.",
    ],
    priceBand: "₹—",
    turnaround: "About 60 minutes at your address; allow up to 90 minutes.",
    warranty: "3 to 12 months on the part and labour — 3 standard, 6 premium, 12 original.",
    serviceLinks: [{ href: "/services/screen-replacement", label: "Screen replacement in detail" }],
    serviceType: "Mobile phone screen replacement",
    faqs: [
      {
        question: "Will Face ID, True Tone and the proximity sensor still work after the screen is replaced?",
        answer:
          "We move your original earpiece mesh and sensor housing onto the new display wherever the model allows, so Face ID, proximity sensing and True Tone keep behaving as they did before the damage. Every one of them is tested before you pay.",
      },
      {
        question: "What is the difference between an original, premium and standard screen?",
        answer:
          "Original is the manufacturer's own part with the longest warranty, 12 months. Premium is a high-grade equivalent matched for colour and brightness, with 6 months. Standard restores full function at the lowest cost, with 3 months. You see all three prices for your model and choose.",
      },
      {
        question: "Do you replace only the cracked glass, or the whole display?",
        answer:
          "The whole display assembly — glass, touch layer and panel together. That is the part the warranty covers, and it means a crack that has already reached the panel underneath is fixed too.",
      },
      {
        question: "My screen is black but the phone still rings. Is it the screen?",
        answer:
          "Very often, yes — it is one of the most common display faults. The technician confirms the cause before anything is replaced. If the screen turns out not to be the problem, no fix, no fee applies.",
      },
      {
        question: "Does a screen replacement touch the photos and data on my phone?",
        answer:
          "No. The display is swapped without touching storage. A backup before any hardware job is still sensible, and at handover you check the display and touch yourself before you pay.",
      },
    ],
  },

  battery: {
    part: "Battery",
    routeSegment: "battery-repair",
    metaDescription:
      "Phone battery replaced in person at your Delhi address. iPhone, Samsung and Android. About 45 minutes, no visit fee, 3–12 month warranty, pay on handover.",
    intro: [
      "Battery dropping several percent at a time, shutting down at 20%, running hot on the charger, or a health reading below 80%. A technician brings a new cell to your home or office and fits it there in about 45 minutes.",
      "The new battery is run through a calibration charge so the percentage and health reading are accurate from day one, and battery health is checked before and after the swap.",
    ],
    priceBand: "₹—",
    turnaround: "About 45 minutes at your address; allow up to 75 minutes.",
    warranty: "3 to 12 months on the cell and labour — 3 standard, 6 premium, 12 original.",
    serviceLinks: [{ href: "/services/battery-replacement", label: "Battery replacement in detail" }],
    serviceType: "Mobile phone battery replacement",
    faqs: [
      {
        question: "How do I know it is the battery and not the charger?",
        answer:
          "The usual signs are a percentage that falls in jumps, the phone switching off with charge still showing, a battery health figure under 80%, or the phone getting unusually hot while charging. The technician measures battery health and charge rate before replacing anything.",
      },
      {
        question: "My battery is swollen and the screen is lifting. Is that dangerous?",
        answer:
          "It needs attention soon. A swollen cell can push the display out of its frame and should not be pressed or punctured. Stop charging it overnight, do not try to flatten the screen back down, and mention the swelling when you book.",
      },
      {
        question: "Will my iPhone show a battery message after the replacement?",
        answer:
          "On recent iPhones, iOS can show a battery service message after any battery change that is not registered with Apple, and the health percentage may not display. The new battery works normally. We tell you before you book whether your model is affected.",
      },
      {
        question: "What happens to my old battery?",
        answer:
          "We take it away with us. Old cells go to e-waste recycling, not into household rubbish, because a damaged lithium cell is a fire risk.",
      },
      {
        question: "How long should the new battery last?",
        answer:
          "A healthy new cell should give you a full day of normal use again. If it loses capacity abnormally fast within the warranty period, we replace it again at no cost.",
      },
    ],
  },

  phone: {
    part: "Phone part",
    routeSegment: "phone-repair",
    metaDescription:
      "Screen, battery, charging port, back glass and camera replacement in person at your Delhi address. iPhone, Samsung and Android. No visit fee, pay on handover.",
    intro: [
      "Most phone faults come down to one worn or broken part: the screen, the battery, the charging port, the back glass, a camera, a speaker or a microphone. A technician brings that part to your home or office, replaces it in front of you and tests the phone before you pay.",
      "Prefer not to wait? Choose free pickup and drop instead — same technicians, same parts, same warranty.",
    ],
    priceBand: "₹—",
    turnaround: "45 to 90 minutes for most parts at your address; back glass takes around 90.",
    warranty: "Up to 12 months on the part and labour, depending on the part and grade you choose.",
    serviceLinks: [
      { href: "/services/screen-replacement", label: "Screen replacement" },
      { href: "/services/battery-replacement", label: "Battery replacement" },
      { href: "/services/charging-port-repair", label: "Charging port" },
      { href: "/services/back-glass-replacement", label: "Back glass" },
      { href: "/services/rear-camera-repair", label: "Rear camera" },
      { href: "/services", label: "All parts we replace" },
    ],
    serviceType: "Mobile phone component replacement",
    faqs: [
      {
        question: "Which parts can you replace at my address?",
        answer:
          "Screens, batteries, charging ports, back glass, front and rear cameras, speakers, microphones and buttons are all done on site. Water damage is the exception: it needs a full teardown and cleaning, so it takes several hours and is usually better done by pickup and drop.",
      },
      {
        question: "Do I have to be at home while the part is replaced?",
        answer:
          "Only if you choose the at-home visit, which is free. If you would rather not wait, choose free pickup and drop: we collect the phone, replace the part and bring it back to the same address.",
      },
      {
        question: "Do I pay anything if the phone cannot be fixed?",
        answer:
          "No. If the part cannot be replaced, or the replacement would cost more than the phone is worth, the technician puts it back together, explains what they found and charges nothing. There is no visit fee either way.",
      },
      {
        question: "Do you handle phone unlocking or fixes over the phone?",
        answer:
          "Unlocking and remote fixes are not what we do; we replace hardware. Everything we do is done in person, by a technician holding your phone.",
      },
      {
        question: "Are you an authorised service centre for any brand?",
        answer:
          "No. MyMobiFix is an independent repair company. We work on iPhone, Samsung, Google, OnePlus, Xiaomi, Oppo, Vivo, Realme and Nothing phones, but we are not affiliated with or authorised by any of those brands.",
      },
    ],
  },
};

/** Brands in the device grid. Each links to its /repair/<slug> page. */
export const DEVICE_GRID: Array<{ slug: string; label: string; logo: boolean }> = [
  { slug: "apple", label: "iPhone", logo: true },
  { slug: "samsung", label: "Samsung", logo: true },
  { slug: "google", label: "Google Pixel", logo: true },
  { slug: "oneplus", label: "OnePlus", logo: true },
  { slug: "xiaomi", label: "Xiaomi", logo: true },
  { slug: "oppo", label: "Oppo", logo: true },
  { slug: "vivo", label: "Vivo", logo: true },
  { slug: "realme", label: "Realme", logo: true },
  { slug: "nothing", label: "Nothing", logo: false },
];
