-- Data-only migration (5 Nov 2026): align service copy already stored in the
-- database with prisma/seed-data.ts after the hardware-replacement copy sweep.

-- Full Diagnostic is a hardware check.
UPDATE "repair_services"
SET "shortDescription" = 'Free 30-point hardware check.'
WHERE "slug" = 'full-diagnostic'
  AND "shortDescription" = 'Free 30-point hardware and software health check.';

-- Front camera symptom wording.
UPDATE "repair_services"
SET "symptoms" = REPLACE("symptoms", 'Face unlock stopped working', 'Face recognition stopped working')
WHERE "symptoms" LIKE '%Face unlock stopped working%';
