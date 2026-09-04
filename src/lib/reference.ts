import { randomInt } from "node:crypto";

/**
 * Customer-facing repair reference generator.
 *
 * Format: `MMF-XXXXXX` using a Crockford-style alphabet with I, L, O, U and 0/1
 * removed, so a reference read over the phone or copied from a printed slip
 * cannot be mistyped into a different valid code.
 *
 * 30^6 ≈ 729 million combinations; collisions are handled by a retry loop in the
 * booking service against the unique index on `bookings.reference`.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateBookingReference(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `MMF-${code}`;
}

/** Normalises user input so `mmf7k4q2m` and `MMF-7K4Q2M` both resolve. */
export function normaliseReference(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = cleaned.startsWith("MMF") ? cleaned.slice(3) : cleaned;
  return `MMF-${body}`;
}
