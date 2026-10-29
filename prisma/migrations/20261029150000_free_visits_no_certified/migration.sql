-- Data-only migration: brings an already-seeded database in line with the
-- business as it actually runs (29 Oct 2026).
--
-- Pickup & drop and at-home visits are free. A stored service_fees row (the
-- seed used to write 199 / 299) would override the new zero defaults in
-- src/lib/constants.ts, so remove it and let the defaults apply.
DELETE FROM "settings" WHERE "key" = 'service_fees';

-- "Certified" recycling is not a claim the business has confirmed. The seed
-- text no longer says it; fix the copy already stored in the database.
UPDATE "repair_services"
SET "description" = REPLACE("description", 'certified e-waste recycling', 'e-waste recycling')
WHERE "description" LIKE '%certified e-waste recycling%';
