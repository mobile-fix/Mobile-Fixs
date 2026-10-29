/**
 * Copy for the /repair/<brand> landing pages.
 *
 * Search engines devalue pages that differ only by a swapped brand name, so each
 * brand carries its own intro and its own FAQs. The text is deliberately general:
 * it describes what is true of the brand's phones as a class (display tech, how
 * the software reacts to a repair) and never makes claims we cannot back up —
 * no "authorised", no "genuine parts", no repair counts, no prices.
 *
 * Keyed by the brand's catalogue slug. A brand that exists in the database but
 * not here still gets a page, built from `genericBrandContent`.
 */

export type BrandFaq = { question: string; answer: string };

export type BrandContent = {
  /** What people search for: "iPhone" for Apple, "Google Pixel" for Google. */
  displayName: string;
  /** The owner's name, for the trademark line. */
  trademarkName: string;
  /** Tail of the page title, after "<displayName> Repair —". */
  titleFocus?: string;
  /** Two or three short paragraphs of introduction. */
  intro: string[];
  /** Three to four brand-specific questions. */
  faqs: BrandFaq[];
};

export const DEFAULT_TITLE_FOCUS = "Screen, Battery & Charging Port";

/** Brands that have a logo in /public/logos. Others fall back to a letter tile. */
export const BRANDS_WITH_LOGO: ReadonlySet<string> = new Set([
  "apple",
  "samsung",
  "google",
  "oneplus",
  "xiaomi",
  "oppo",
  "vivo",
  "realme",
]);

/**
 * Catalogue brands that are a catch-all bucket rather than a real make. They stay
 * bookable but get no landing page — "Other repair" is not something anyone searches.
 */
const NON_LANDING_BRANDS: ReadonlySet<string> = new Set(["other"]);

export function hasBrandLandingPage(slug: string): boolean {
  return !NON_LANDING_BRANDS.has(slug);
}

const BRAND_CONTENT: Record<string, BrandContent> = {
  apple: {
    displayName: "iPhone",
    trademarkName: "Apple",
    intro: [
      "iPhones are tightly integrated devices, so a repair is more than swapping a part. The display, the sensors around it and the software all have to work together afterwards. We tell you what to expect for your model before we start.",
      "The most common iPhone jobs are cracked screens, batteries that no longer last a day, and charging ports that stop gripping the cable. We handle all three, along with camera, speaker and water-damage problems. Pick the model below and message us on WhatsApp with what is wrong.",
    ],
    faqs: [
      {
        question: "Will Face ID and True Tone still work after an iPhone screen replacement?",
        answer:
          "Face ID sits in the notch or Dynamic Island, not in the display itself, so it is normally unaffected by a screen replacement. True Tone is different: the calibration data is paired with the original display, so on some models True Tone may be unavailable after a replacement. Tell us your model and we will explain what to expect before the repair.",
      },
      {
        question: "My iPhone battery drains fast. Do I need a new battery?",
        answer:
          "Check Settings, Battery, Battery Health & Charging. A low maximum capacity figure, or an unexpected shutdown on a charge that looked healthy, usually points to an ageing battery. After a replacement, iOS may show a notice about the battery in that same screen, which is a software message rather than a fault.",
      },
      {
        question: "Is my iPhone still water resistant after it has been opened?",
        answer:
          "Water resistance depends on seals that are disturbed whenever the phone is opened, so you should not rely on the original rating after any repair. Keep it away from water and treat it as a normal, non-waterproof phone.",
      },
      {
        question: "Does the iPhone charging port fix depend on the model?",
        answer:
          "Yes. Older models listed here use Lightning and newer ones use USB-C, and the port is part of a small assembly at the bottom of the phone. Lint packed into the port is a very common cause of slow or unreliable charging, so we check for that first.",
      },
    ],
  },

  samsung: {
    displayName: "Samsung",
    trademarkName: "Samsung",
    titleFocus: "Screen Replacement, Battery & Charging Port",
    intro: [
      "Samsung Galaxy phones, from the Galaxy S and Z series down to the A and M series, mostly use AMOLED displays. They look excellent, but an impact can damage the panel underneath even when the glass looks fine.",
      "We repair screens, batteries, charging ports, cameras, speakers and back glass on Galaxy phones. Select your model below and send us the problem on WhatsApp, with a photo if you can.",
    ],
    faqs: [
      {
        question: "My Samsung screen shows green or purple lines. Can it be repaired?",
        answer:
          "Coloured lines, black patches or ink-like spots on an AMOLED display usually mean the panel itself is damaged, and the fix is a display replacement. These faults often appear after a drop or pressure on the screen, and they tend to spread, so it is worth having it checked early.",
      },
      {
        question: "Can you replace the screen on a Samsung with curved edges?",
        answer:
          "Several Galaxy models use displays that curve over the sides of the frame. These are more delicate to fit than a flat screen. Tell us your exact model and we will confirm what the repair involves.",
      },
      {
        question: "What about Samsung foldables like the Galaxy Z Flip?",
        answer:
          "Foldables have an inner folding display and a separate cover screen, and the hinge area is easily damaged. We assess each one individually before suggesting a repair, so message us with your model and a clear photo of the damage.",
      },
      {
        question: "My Samsung battery looks swollen. Is that dangerous?",
        answer:
          "A swollen battery can push the screen or back panel out of shape, and you should stop charging the phone and avoid pressing on it. Bring it to us or message us on WhatsApp so the battery can be replaced.",
      },
    ],
  },

  google: {
    displayName: "Google Pixel",
    trademarkName: "Google",
    intro: [
      "Google Pixel phones are known for their cameras and their clean software, and most repairs are the usual wear-and-tear ones: cracked screens, tired batteries and charging ports. Send us your exact model so we can confirm what the repair involves.",
      "Choose your Pixel below and send us the problem on WhatsApp. We will let you know what the repair involves.",
    ],
    faqs: [
      {
        question: "Does the Pixel fingerprint sensor still work after a screen replacement?",
        answer:
          "Many Pixel models have the fingerprint sensor under the display. After a screen replacement the sensor can behave differently, and you may need to delete your old fingerprints and enrol them again in Settings. Tell us your model and we will explain what to expect.",
      },
      {
        question: "My Pixel camera photos look blurry. Is the camera broken?",
        answer:
          "Newer Pixels have a raised camera bar with its own cover glass. A crack there, or a smudged or fogged lens, can blur photos even when the camera itself is fine. We inspect the glass first, then the camera module.",
      },
      {
        question: "Is a Pixel battery replacement worth it on an older model?",
        answer:
          "If the phone otherwise works well and still gets software updates, a new battery is usually the cheapest way to get a full day of use back. Ask us on WhatsApp and we can advise based on your model.",
      },
    ],
  },

  oneplus: {
    displayName: "OnePlus",
    trademarkName: "OnePlus",
    titleFocus: "Screen Replacement, Battery & Charging Port",
    intro: [
      "OnePlus phones are built around speed: bright AMOLED screens and fast charging. That also means two repairs come up more than any other, a damaged screen and a battery or charging port that has worn down under years of fast charging.",
      "We repair OnePlus flagship and Nord models. Pick yours below, and send the details on WhatsApp for a screen replacement or any other repair.",
    ],
    faqs: [
      {
        question: "My OnePlus screen has a green line. Is that a screen replacement job?",
        answer:
          "A coloured vertical line on an AMOLED display is most often a panel fault, and the fix is a replacement display. It can show up after a drop, but also with age. Send us a photo on WhatsApp and we will tell you what we think before you book.",
      },
      {
        question: "Can you do a OnePlus screen replacement if the glass is not cracked?",
        answer:
          "Yes. If the display shows lines, dead patches or touch problems, the screen needs replacing whether or not the glass is broken, because the display and the glass are usually fitted as one unit.",
      },
      {
        question: "My OnePlus is not fast charging any more. What should I check?",
        answer:
          "First try a different cable and the original charger, as fast charging depends on both. If it still charges slowly, dust in the port, a worn port or an ageing battery are the usual causes, and we can test each one.",
      },
    ],
  },

  xiaomi: {
    displayName: "Xiaomi, Redmi & POCO",
    trademarkName: "Xiaomi",
    intro: [
      "Xiaomi sells phones under three names in India: Xiaomi, Redmi and POCO. They are popular because they give a lot for the money, and the repairs we see most are cracked screens, batteries that no longer last and charging ports that wear out.",
      "Find your model below, whichever of the three names is on the box, and message us on WhatsApp with the problem.",
    ],
    faqs: [
      {
        question: "Do you repair Redmi and POCO phones as well as Xiaomi?",
        answer:
          "Yes. Redmi and POCO phones are made by Xiaomi, and we list the models we handle below. If yours is not shown, message us on WhatsApp with the model name and we will let you know.",
      },
      {
        question: "My Redmi charges slowly or only at a certain angle. What is wrong?",
        answer:
          "That is a typical sign of a worn USB-C port or lint packed inside it. We clean the port first and, if the connector itself is loose, replace the charging port assembly.",
      },
      {
        question: "Should I back up my Xiaomi before it is repaired?",
        answer:
          "Yes, if you can. Back up photos and contacts, and make sure you know your Xiaomi account and Google account details. A software repair may ask you to sign in again afterwards.",
      },
    ],
  },

  motorola: {
    displayName: "Motorola",
    trademarkName: "Motorola",
    intro: [
      "Motorola phones, such as the Moto G and Edge series, are everyday phones, and cracked screens, tired batteries and worn charging ports account for most repairs.",
      "Select your Moto model below and send us the problem on WhatsApp, and we will tell you what the repair involves.",
    ],
    faqs: [
      {
        question: "Can you repair a cracked Moto G or Motorola Edge screen?",
        answer:
          "Yes. Screen replacement is among the most common Motorola repairs. The Edge series has curved-edge displays on some models, which are more delicate to fit, so tell us your exact model.",
      },
      {
        question: "Is a water-repellent Motorola protected from water damage?",
        answer:
          "A water-repellent coating helps against splashes. It is not the same as being waterproof, and a phone that has been dropped in water can still be damaged. If yours got wet, switch it off and do not charge it. Bring it in as soon as you can.",
      },
      {
        question: "My Motorola battery gets hot and drains quickly. What should I do?",
        answer:
          "A battery that heats up and drains fast is ageing. Stop using it while it charges if it gets hot, and get it checked. A replacement battery is usually the fix.",
      },
    ],
  },

  vivo: {
    displayName: "Vivo",
    trademarkName: "Vivo",
    intro: [
      "Vivo phones are common across India, from the budget Y series to the camera-focused V and X series. Screens and back glass are the parts that most often get damaged.",
      "We repair screens, batteries, charging ports and cameras on the Vivo models listed below. Choose yours and send the details on WhatsApp.",
    ],
    faqs: [
      {
        question: "Does the in-display fingerprint sensor work after a Vivo screen replacement?",
        answer:
          "Many Vivo V and X series phones read your fingerprint through the screen. After a display replacement you may need to register your fingerprints again, and how well it works can depend on the replacement panel. We explain this before the repair.",
      },
      {
        question: "My Vivo has curved screen edges. Can it be repaired?",
        answer:
          "Yes, but curved displays need more care than flat ones, and the display is usually replaced as a whole unit. Tell us your model on WhatsApp so we can confirm.",
      },
      {
        question: "My Vivo camera will not open or shows a black screen. Is that hardware?",
        answer:
          "Sometimes it is software and a restart or app reset fixes it. If the camera still fails afterwards, the camera module or its connector may be at fault, which we can diagnose.",
      },
    ],
  },

  oppo: {
    displayName: "Oppo",
    trademarkName: "Oppo",
    intro: [
      "Oppo phones, from the Reno and Find series down to the A series, are popular for their cameras and fast charging. The repairs we see most are damaged screens and batteries or charging ports that have worn from heavy daily use.",
      "Pick your model below and message us on WhatsApp with what has gone wrong. We will tell you what we can do.",
    ],
    faqs: [
      {
        question: "Can you replace the screen on an Oppo Reno or Find phone?",
        answer:
          "Yes. Several Reno and Find models have curved displays and in-display fingerprint sensors, so tell us the exact model. After a replacement you may need to enrol your fingerprints again.",
      },
      {
        question: "Why has my Oppo stopped fast charging?",
        answer:
          "Fast charging depends on the charger, the cable, the port and the battery all working together. We start with the cheap checks, a clean port and a different cable, and move on to the charging port and battery if needed.",
      },
      {
        question: "My Oppo screen flickers or touch is not working in places. Is it the display?",
        answer:
          "Flickering and dead touch patches are most often a display or display-connector fault, and sometimes follow a drop that left no visible mark. A quick inspection tells us which it is.",
      },
    ],
  },

  realme: {
    displayName: "Realme",
    trademarkName: "Realme",
    intro: [
      "Realme phones, from the Narzo and number series to the GT range, are popular value-for-money picks. Because they are used heavily, the most common repairs are cracked screens, tired batteries and charging port faults.",
      "Choose your Realme model below and send us the problem on WhatsApp.",
    ],
    faqs: [
      {
        question: "My Realme battery drains fast even on standby. Do I need a new battery?",
        answer:
          "Fast drain on standby can be a battery that has lost capacity or a software issue such as a misbehaving app. If it has dropped sharply and the phone is a couple of years old, the battery is the likely cause, and we can test it.",
      },
      {
        question: "My Realme will not charge unless I hold the cable in position. What is wrong?",
        answer:
          "That usually means a worn or dirty charging port. We clean it first, and if the connector is damaged, replace the charging port.",
      },
      {
        question: "Do you repair Realme phones with a cracked display but a working touch screen?",
        answer:
          "Yes. A cracked screen that still works can fail suddenly, as cracks let in dust and moisture and spread. Replacing it earlier usually avoids further damage.",
      },
    ],
  },

  nothing: {
    displayName: "Nothing Phone",
    trademarkName: "Nothing",
    titleFocus: "Screen, Back Glass & Battery",
    intro: [
      "Nothing phones are known for the transparent back panel and the Glyph lights behind it. Both make repairs a little different from a typical Android phone, so we check what is wrong before we open anything.",
      "We handle screens, batteries and charging ports on the Nothing models listed below. Send us your model and the problem on WhatsApp.",
    ],
    faqs: [
      {
        question: "Can you repair the back of a Nothing Phone if the transparent glass is cracked?",
        answer:
          "Message us a photo and your model. The back panel sits over the Glyph lights, so the repair needs care to keep them working properly, and we will say what is involved before you decide.",
      },
      {
        question: "My Glyph lights have stopped working. Is it the hardware?",
        answer:
          "Start with a restart, and check the Glyph settings are switched on. If the lights still do not work, it may be a fault with the light strips or their connectors, which we can look at.",
      },
      {
        question: "Can you replace the Nothing Phone screen?",
        answer:
          "Yes. Cracked screens, lines on the display and unresponsive touch are all common faults we can look at. Tell us your model on WhatsApp.",
      },
    ],
  },
};

/** Content for a brand that is in the catalogue but has no hand-written copy above. */
function genericBrandContent(brandName: string): BrandContent {
  return {
    displayName: brandName,
    trademarkName: brandName,
    intro: [
      `${brandName} phones come to us with the same handful of problems: cracked screens, batteries that no longer last the day, charging ports that stop working and water damage. We repair all of these, in store or at your door.`,
      `Choose your ${brandName} model below and send us the problem on WhatsApp, and we will tell you what the repair involves.`,
    ],
    faqs: [
      {
        question: `Can you repair my ${brandName} phone if my model is not listed?`,
        answer:
          "Possibly. Our list does not cover every model. Message us on WhatsApp with the exact model name and the problem, and we will tell you whether we can do it.",
      },
      {
        question: "What repairs do you do?",
        answer:
          "Screen replacement, battery replacement, charging port repair, camera, speaker and microphone faults, back glass and water-damage cleaning, along with software problems. The full list is on our services page.",
      },
      {
        question: "How do I find out what it will cost?",
        answer:
          "The cost depends on your model and the fault, so we quote on WhatsApp. Send your model and a short description or photo, and we will reply with a quote.",
      },
    ],
  };
}

export function getBrandContent(slug: string, brandName: string): BrandContent {
  return BRAND_CONTENT[slug] ?? genericBrandContent(brandName);
}

/** Title for a brand page, e.g. "iPhone Repair — Screen, Battery & Charging Port". */
export function brandTitle(content: BrandContent): string {
  return `${content.displayName} Repair — ${content.titleFocus ?? DEFAULT_TITLE_FOCUS}`;
}
