/**
 * Catalogue seed data.
 *
 * This is the *shape* of the business, not the business itself: an admin edits
 * every price, duration and warranty through the dashboard afterwards. Prices
 * here are generated from a base-per-tier table multiplied by a per-model index,
 * which keeps ~1,400 price rows consistent and adjustable from a few numbers.
 *
 * All figures are illustrative placeholder data for a demonstration deployment.
 */

import type { PartGrade } from "../src/lib/constants";

export type ServiceSeed = {
  name: string;
  shortDescription: string;
  description: string;
  symptoms: string[];
  iconKey: string;
  durationMinutes: number;
  warrantyMonths: number;
  sortOrder: number;
  grades: PartGrade[];
  /** Premium-grade price in whole rupees, by device tier. */
  base: { BUDGET: number; MID: number; FLAGSHIP: number };
};

export const SERVICES: ServiceSeed[] = [
  {
    name: "Screen Replacement",
    shortDescription: "Cracked glass, dead pixels, ghost touch or a display that stays black.",
    description:
      "A full display assembly replacement using colour- and brightness-matched panels. We transfer your original earpiece mesh and sensor housing wherever possible so Face ID, proximity sensing and true-tone behaviour keep working exactly as they did before the damage.",
    symptoms: [
      "Cracked or shattered glass",
      "Touch not responding in places",
      "Lines, blotches or dead pixels",
      "Screen stays black but the phone vibrates",
      "Display flickers or dims randomly",
    ],
    iconKey: "screen",
    durationMinutes: 60,
    warrantyMonths: 6,
    sortOrder: 1,
    grades: ["ORIGINAL", "PREMIUM", "STANDARD"],
    base: { BUDGET: 2199, MID: 4499, FLAGSHIP: 9999 },
  },
  {
    name: "Battery Replacement",
    shortDescription: "Fast drain, sudden shutdowns or a battery health warning.",
    description:
      "We fit a new cell with a fresh battery management chip, then run a calibrated charge cycle so your phone reports accurate health and percentage from day one. Old cells are collected for certified e-waste recycling.",
    symptoms: [
      "Battery drops several percent at a time",
      "Phone shuts down above 20%",
      "Battery health below 80%",
      "Device gets unusually hot while charging",
      "Swollen back panel or lifted screen",
    ],
    iconKey: "battery",
    durationMinutes: 45,
    warrantyMonths: 6,
    sortOrder: 2,
    grades: ["ORIGINAL", "PREMIUM", "STANDARD"],
    base: { BUDGET: 1499, MID: 2299, FLAGSHIP: 4499 },
  },
  {
    name: "Charging Port Repair",
    shortDescription: "Loose cable, slow charging or a port that only works at an angle.",
    description:
      "Most charging faults are lint compaction or a worn flex connector rather than a dead board. We start with a free ultrasonic port clean; if the flex is genuinely damaged we replace the charging assembly and re-test with fast-charge and data transfer.",
    symptoms: [
      "Cable has to be held at an angle",
      "Charges only sometimes",
      "Very slow charging",
      "Phone does not recognise the cable",
      "Port feels loose or gritty",
    ],
    iconKey: "charging",
    durationMinutes: 60,
    warrantyMonths: 6,
    sortOrder: 3,
    grades: ["PREMIUM", "STANDARD"],
    base: { BUDGET: 999, MID: 1599, FLAGSHIP: 2799 },
  },
  {
    name: "Back Glass Replacement",
    shortDescription: "Cracked rear panel, with wireless charging re-tested afterwards.",
    description:
      "Laser-separated rear glass removal that protects the wireless charging coil and NFC antenna underneath — the two components most commonly destroyed by heat-gun removal. Every repair is finished with a new adhesive gasket and a water-resistance re-seal.",
    symptoms: [
      "Cracked or shattered rear glass",
      "Glass lifting at the edges",
      "Wireless charging stopped working",
      "Sharp edges catching on pockets",
    ],
    iconKey: "backglass",
    durationMinutes: 90,
    warrantyMonths: 3,
    sortOrder: 4,
    grades: ["PREMIUM", "STANDARD"],
    base: { BUDGET: 1299, MID: 2299, FLAGSHIP: 4999 },
  },
  {
    name: "Rear Camera Repair",
    shortDescription: "Blurry photos, cracked lens glass or a camera that will not focus.",
    description:
      "Covers the main, ultra-wide and telephoto modules as well as the protective lens glass. We calibrate optical image stabilisation after fitting so low-light shots and video stabilisation behave normally.",
    symptoms: [
      "Photos are blurry or out of focus",
      "Cracked camera lens glass",
      "Camera app freezes or shows black",
      "Visible dust or specks in every photo",
      "Rattling sound when you shake the phone",
    ],
    iconKey: "camera",
    durationMinutes: 60,
    warrantyMonths: 6,
    sortOrder: 5,
    grades: ["ORIGINAL", "PREMIUM"],
    base: { BUDGET: 1499, MID: 2799, FLAGSHIP: 5999 },
  },
  {
    name: "Front Camera Repair",
    shortDescription: "Selfie camera not working, blurred, or Face ID failing.",
    description:
      "Front camera and sensor flex replacement. On devices with secure face authentication we take care to preserve the paired dot-projector assembly, and we tell you up front when a fault cannot be fixed without the manufacturer's calibration tooling.",
    symptoms: [
      "Front camera shows a black screen",
      "Selfies are blurry or hazy",
      "Face unlock stopped working",
      "Screen does not dim during calls",
    ],
    iconKey: "selfie",
    durationMinutes: 45,
    warrantyMonths: 6,
    sortOrder: 6,
    grades: ["PREMIUM", "STANDARD"],
    base: { BUDGET: 999, MID: 1899, FLAGSHIP: 3799 },
  },
  {
    name: "Speaker Repair",
    shortDescription: "Muffled, crackling or completely silent audio.",
    description:
      "Covers both the earpiece and the loudspeaker. Blocked mesh is cleaned first at no charge; genuine driver failure is fixed by replacing the speaker module and re-sealing the acoustic chamber so volume returns to factory levels.",
    symptoms: [
      "Callers sound muffled or distant",
      "Crackling or buzzing at high volume",
      "No sound from the loudspeaker",
      "Sound only works on speakerphone",
    ],
    iconKey: "speaker",
    durationMinutes: 45,
    warrantyMonths: 6,
    sortOrder: 7,
    grades: ["PREMIUM", "STANDARD"],
    base: { BUDGET: 899, MID: 1499, FLAGSHIP: 2599 },
  },
  {
    name: "Microphone Repair",
    shortDescription: "Callers cannot hear you, or recordings come out silent.",
    description:
      "Modern phones use three or four microphones for calls, video and noise cancellation. We test each one individually, identify which has failed and replace only the affected assembly.",
    symptoms: [
      "Callers say they cannot hear you",
      "Voice notes record silence",
      "Voice assistant does not respond",
      "Audio only works with earphones",
    ],
    iconKey: "microphone",
    durationMinutes: 45,
    warrantyMonths: 6,
    sortOrder: 8,
    grades: ["PREMIUM", "STANDARD"],
    base: { BUDGET: 849, MID: 1399, FLAGSHIP: 2399 },
  },
  {
    name: "Water Damage Treatment",
    shortDescription: "Liquid exposure — ultrasonic board cleaning and corrosion treatment.",
    description:
      "A full teardown, ultrasonic clean of the logic board and corrosion treatment of affected connectors. Liquid damage is the one repair nobody can guarantee: we diagnose first, tell you honestly what we think the odds are, and you only pay if you approve the work.",
    symptoms: [
      "Phone fell in water or was rained on",
      "Screen shows water marks or discoloration",
      "Device will not power on after a spill",
      "Charging port shows corrosion",
      "Random restarts after liquid exposure",
    ],
    iconKey: "water",
    durationMinutes: 240,
    warrantyMonths: 1,
    sortOrder: 9,
    grades: ["PREMIUM"],
    base: { BUDGET: 1499, MID: 2499, FLAGSHIP: 3999 },
  },
  {
    name: "Button Repair",
    shortDescription: "Power, volume or mute switch that sticks or does nothing.",
    description:
      "Replacement of the power, volume or alert-slider flex assembly, including the tactile domes underneath. We also check the frame for the impact damage that usually causes a button to jam in the first place.",
    symptoms: [
      "Power button needs a hard press",
      "Volume keys do nothing",
      "Button is stuck down",
      "Mute switch does not toggle",
    ],
    iconKey: "button",
    durationMinutes: 45,
    warrantyMonths: 6,
    sortOrder: 10,
    grades: ["PREMIUM", "STANDARD"],
    base: { BUDGET: 799, MID: 1299, FLAGSHIP: 2199 },
  },
  {
    name: "Software & OS Repair",
    shortDescription: "Boot loops, failed updates, severe lag or a locked-up system.",
    description:
      "Firmware restore, boot-loop recovery and clean OS reinstallation. We attempt a full data-preserving repair first and always tell you before any step that would erase content. We do not remove activation locks or bypass account security.",
    symptoms: [
      "Phone restarts in a loop",
      "Stuck on the manufacturer logo",
      "Update failed midway",
      "Apps crash constantly",
      "Severe lag after an update",
    ],
    iconKey: "software",
    durationMinutes: 60,
    warrantyMonths: 1,
    sortOrder: 11,
    grades: ["PREMIUM"],
    base: { BUDGET: 599, MID: 899, FLAGSHIP: 1299 },
  },
  {
    name: "Full Diagnostic",
    shortDescription: "Free 30-point hardware and software health check.",
    description:
      "A complete 30-point inspection covering battery health, charging, all cameras, every microphone and speaker, sensors, connectivity, storage health and frame integrity. You get a written report and a firm quote before anything is opened — and it is free whether or not you proceed.",
    symptoms: [
      "Not sure what is wrong",
      "Buying or selling a used phone",
      "Multiple small problems at once",
      "Want battery health verified",
    ],
    iconKey: "diagnostic",
    durationMinutes: 30,
    warrantyMonths: 0,
    sortOrder: 12,
    grades: ["PREMIUM"],
    base: { BUDGET: 0, MID: 0, FLAGSHIP: 0 },
  },
];

export type ModelSeed = {
  name: string;
  tier: "BUDGET" | "MID" | "FLAGSHIP";
  /** Multiplier applied to the tier base price. */
  index: number;
  year: number;
  aliases?: string;
};

export type BrandSeed = {
  name: string;
  logoKey: string;
  sortOrder: number;
  /** When false, no price rows are generated — exercises the estimate path. */
  priced: boolean;
  models: ModelSeed[];
};

export const BRANDS: BrandSeed[] = [
  {
    name: "Apple",
    logoKey: "apple",
    sortOrder: 1,
    priced: true,
    models: [
      { name: "iPhone 16 Pro Max", tier: "FLAGSHIP", index: 1.3, year: 2024, aliases: "A3296" },
      { name: "iPhone 16 Pro", tier: "FLAGSHIP", index: 1.22, year: 2024 },
      { name: "iPhone 16", tier: "FLAGSHIP", index: 1.1, year: 2024 },
      { name: "iPhone 15 Pro Max", tier: "FLAGSHIP", index: 1.22, year: 2023, aliases: "A2849" },
      { name: "iPhone 15 Pro", tier: "FLAGSHIP", index: 1.15, year: 2023 },
      { name: "iPhone 15", tier: "FLAGSHIP", index: 1.05, year: 2023 },
      { name: "iPhone 14 Pro", tier: "FLAGSHIP", index: 1.08, year: 2022 },
      { name: "iPhone 14", tier: "FLAGSHIP", index: 0.98, year: 2022 },
      { name: "iPhone 13", tier: "FLAGSHIP", index: 0.9, year: 2021 },
      { name: "iPhone 12", tier: "FLAGSHIP", index: 0.82, year: 2020 },
      { name: "iPhone SE (3rd Gen)", tier: "MID", index: 0.95, year: 2022, aliases: "SE 2022" },
    ],
  },
  {
    name: "Samsung",
    logoKey: "samsung",
    sortOrder: 2,
    priced: true,
    models: [
      { name: "Galaxy S24 Ultra", tier: "FLAGSHIP", index: 1.28, year: 2024, aliases: "SM-S928B" },
      { name: "Galaxy S24 Plus", tier: "FLAGSHIP", index: 1.12, year: 2024 },
      { name: "Galaxy S24", tier: "FLAGSHIP", index: 1.05, year: 2024, aliases: "SM-S921B" },
      { name: "Galaxy S23 Ultra", tier: "FLAGSHIP", index: 1.18, year: 2023 },
      { name: "Galaxy S23", tier: "FLAGSHIP", index: 0.98, year: 2023 },
      { name: "Galaxy Z Flip 5", tier: "FLAGSHIP", index: 1.4, year: 2023, aliases: "foldable" },
      { name: "Galaxy A55", tier: "MID", index: 1.0, year: 2024 },
      { name: "Galaxy A35", tier: "MID", index: 0.9, year: 2024 },
      { name: "Galaxy A15", tier: "BUDGET", index: 1.0, year: 2024 },
      { name: "Galaxy M14", tier: "BUDGET", index: 0.92, year: 2023 },
    ],
  },
  {
    name: "Google",
    logoKey: "google",
    sortOrder: 3,
    priced: true,
    models: [
      { name: "Pixel 9 Pro", tier: "FLAGSHIP", index: 1.2, year: 2024 },
      { name: "Pixel 9", tier: "FLAGSHIP", index: 1.08, year: 2024 },
      { name: "Pixel 8 Pro", tier: "FLAGSHIP", index: 1.12, year: 2023 },
      { name: "Pixel 8", tier: "FLAGSHIP", index: 1.0, year: 2023 },
      { name: "Pixel 7a", tier: "MID", index: 1.05, year: 2023 },
      { name: "Pixel 6a", tier: "MID", index: 0.92, year: 2022 },
    ],
  },
  {
    name: "OnePlus",
    logoKey: "oneplus",
    sortOrder: 4,
    priced: true,
    models: [
      { name: "OnePlus 12", tier: "FLAGSHIP", index: 1.05, year: 2024 },
      { name: "OnePlus 12R", tier: "MID", index: 1.15, year: 2024 },
      { name: "OnePlus 11", tier: "FLAGSHIP", index: 0.98, year: 2023 },
      { name: "OnePlus Nord 4", tier: "MID", index: 1.0, year: 2024 },
      { name: "OnePlus Nord CE 4", tier: "MID", index: 0.88, year: 2024 },
    ],
  },
  {
    name: "Xiaomi",
    logoKey: "xiaomi",
    sortOrder: 5,
    priced: true,
    models: [
      { name: "Xiaomi 14", tier: "FLAGSHIP", index: 1.0, year: 2024 },
      { name: "Redmi Note 13 Pro Plus", tier: "MID", index: 1.05, year: 2024 },
      { name: "Redmi Note 13", tier: "MID", index: 0.9, year: 2024 },
      { name: "Redmi 13C", tier: "BUDGET", index: 0.95, year: 2023 },
      { name: "POCO X6 Pro", tier: "MID", index: 0.98, year: 2024, aliases: "Poco" },
    ],
  },
  {
    name: "Motorola",
    logoKey: "motorola",
    sortOrder: 6,
    priced: true,
    models: [
      { name: "Edge 50 Pro", tier: "MID", index: 1.1, year: 2024, aliases: "Moto Edge" },
      { name: "Edge 40", tier: "MID", index: 1.0, year: 2023 },
      { name: "Moto G84", tier: "MID", index: 0.88, year: 2023 },
      { name: "Moto G34", tier: "BUDGET", index: 0.95, year: 2024 },
    ],
  },
  {
    name: "Vivo",
    logoKey: "vivo",
    sortOrder: 7,
    priced: true,
    models: [
      { name: "X100", tier: "FLAGSHIP", index: 1.02, year: 2024 },
      { name: "V30", tier: "MID", index: 1.05, year: 2024 },
      { name: "V29", tier: "MID", index: 0.98, year: 2023 },
      { name: "Y28", tier: "BUDGET", index: 0.92, year: 2024 },
    ],
  },
  {
    name: "Oppo",
    logoKey: "oppo",
    sortOrder: 8,
    priced: true,
    models: [
      { name: "Find X7", tier: "FLAGSHIP", index: 1.05, year: 2024 },
      { name: "Reno 12 Pro", tier: "MID", index: 1.08, year: 2024 },
      { name: "Reno 11", tier: "MID", index: 0.98, year: 2024 },
      { name: "A79", tier: "BUDGET", index: 0.95, year: 2023 },
    ],
  },
  {
    name: "Realme",
    logoKey: "realme",
    sortOrder: 9,
    priced: true,
    models: [
      { name: "GT 6", tier: "MID", index: 1.1, year: 2024 },
      { name: "12 Pro Plus", tier: "MID", index: 1.0, year: 2024 },
      { name: "12x", tier: "BUDGET", index: 0.9, year: 2024 },
      { name: "Narzo 70", tier: "BUDGET", index: 0.95, year: 2024 },
    ],
  },
  {
    name: "Nothing",
    logoKey: "nothing",
    sortOrder: 10,
    priced: true,
    models: [
      { name: "Phone (2a)", tier: "MID", index: 1.0, year: 2024 },
      { name: "Phone (2)", tier: "FLAGSHIP", index: 1.0, year: 2023 },
    ],
  },
  {
    // Intentionally unpriced: selecting one of these exercises the estimate path
    // and the "confirmed after diagnosis" messaging.
    name: "Other",
    logoKey: "other",
    sortOrder: 99,
    priced: false,
    models: [
      { name: "Other Android Device", tier: "MID", index: 1, year: 2023 },
      { name: "Other iOS Device", tier: "FLAGSHIP", index: 1, year: 2023 },
    ],
  },
];

/** Illustrative reviews for the demo deployment — clearly labelled in the UI. */
export const DEMO_REVIEWS = [
  {
    authorName: "Ananya R.",
    rating: 5,
    title: "Screen done while I had lunch",
    body: "Booked an at-home slot for a cracked iPhone display. The technician arrived within the window, showed me the replacement panel still sealed, and finished in under an hour. The price on the invoice matched the estimate exactly.",
    deviceLabel: "iPhone 14",
  },
  {
    authorName: "Rohit M.",
    rating: 5,
    title: "Honest diagnosis, no upsell",
    body: "I was convinced my charging port was dead. They cleaned it out, showed me the lint, and charged nothing. Most places would have replaced the whole flex. That is why I will come back.",
    deviceLabel: "OnePlus 11",
  },
  {
    authorName: "Priya S.",
    rating: 5,
    title: "Battery health back to 100%",
    body: "My S23 was shutting down at 30%. New battery fitted, calibrated, and they walked me through the settings that were draining it. Two months on and it holds a full day easily.",
    deviceLabel: "Galaxy S23",
  },
  {
    authorName: "Karthik V.",
    rating: 4,
    title: "Great work, slight delay",
    body: "Back glass replacement on a Pixel 8 Pro. The finish is flawless and wireless charging still works. It took about 30 minutes longer than quoted, but they messaged me proactively rather than leaving me guessing.",
    deviceLabel: "Pixel 8 Pro",
  },
  {
    authorName: "Meera J.",
    rating: 5,
    title: "Tracking made the difference",
    body: "Sent my phone in for water damage and honestly expected the worst. Being able to watch it move through diagnosis and quality check on the tracking page removed all the anxiety. It came back working.",
    deviceLabel: "Redmi Note 13",
  },
  {
    authorName: "Devansh P.",
    rating: 5,
    title: "Pickup and delivery is the way",
    body: "They collected the phone from my office, repaired it the same afternoon and dropped it back before I left. I did not have to move once. Charging port and speaker both sorted.",
    deviceLabel: "Galaxy A55",
  },
  {
    authorName: "Sneha K.",
    rating: 4,
    title: "Clear pricing up front",
    body: "What I liked most is that the website gave me a real number before I committed. Every other place said bring it in and we will see. The final bill was the same as the online estimate.",
    deviceLabel: "iPhone 13",
  },
  {
    authorName: "Arjun T.",
    rating: 5,
    title: "Repaired in front of me",
    body: "Watching the whole repair happen on my own dining table is a very different experience from handing your phone to a counter and hoping. Tools were proper, parts were sealed, work was tidy.",
    deviceLabel: "Vivo V30",
  },
  {
    authorName: "Fatima N.",
    rating: 5,
    title: "Warranty claim handled instantly",
    body: "A speaker started buzzing six weeks after the repair. They replaced it under warranty with no argument and no charge. That is the part most repair shops get wrong.",
    deviceLabel: "Moto G84",
  },
  {
    authorName: "Vikram B.",
    rating: 4,
    title: "Solid job on an older phone",
    body: "Nobody else wanted to touch a five-year-old iPhone 12. They sourced the part, quoted fairly and got it running again. Saved me from an upgrade I did not want to make yet.",
    deviceLabel: "iPhone 12",
  },
  {
    authorName: "Ishita G.",
    rating: 5,
    title: "Free diagnostic is genuinely free",
    body: "Took my Nothing Phone in for a full check before selling it. Got a written 30-point report, no charge and no pressure to book anything. Very professional.",
    deviceLabel: "Phone (2a)",
  },
  {
    authorName: "Sameer A.",
    rating: 5,
    title: "Fixed what two shops could not",
    body: "Intermittent restarts that nobody could reproduce. They kept it for a day, found a corroded connector from an old spill, cleaned and re-seated it. Rock solid since.",
    deviceLabel: "OnePlus Nord 4",
  },
];

/** Demo customer names used to generate historic bookings. */
export const DEMO_CUSTOMERS = [
  "Ananya Reddy",
  "Rohit Malhotra",
  "Priya Sharma",
  "Karthik Venkatesh",
  "Meera Joshi",
  "Devansh Patel",
  "Sneha Kulkarni",
  "Arjun Thakur",
  "Fatima Noor",
  "Vikram Bose",
  "Ishita Gupta",
  "Sameer Ahmed",
  "Nandini Rao",
  "Aditya Nair",
  "Ritika Chawla",
  "Harsh Vardhan",
  "Divya Menon",
  "Yash Agarwal",
  "Pooja Bhatt",
  "Nikhil Saxena",
  "Tanvi Desai",
  "Rahul Iyer",
  "Kavya Pillai",
  "Manish Chopra",
  "Aisha Khan",
];

export const CITIES = [
  { city: "Gurugram", state: "Haryana", postalCode: "122003" },
  { city: "New Delhi", state: "Delhi", postalCode: "110001" },
  { city: "Noida", state: "Uttar Pradesh", postalCode: "201301" },
  { city: "Bengaluru", state: "Karnataka", postalCode: "560001" },
  { city: "Mumbai", state: "Maharashtra", postalCode: "400001" },
  { city: "Pune", state: "Maharashtra", postalCode: "411001" },
  { city: "Hyderabad", state: "Telangana", postalCode: "500001" },
];
