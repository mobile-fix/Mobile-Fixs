-- Ad-click attribution on bookings (gclid / gbraid / wbraid and UTM tags),
-- captured on landing by src/lib/attribution.ts. All nullable: bookings that
-- did not come from an ad simply leave them empty.
ALTER TABLE "bookings" ADD COLUMN "gclid" TEXT;
ALTER TABLE "bookings" ADD COLUMN "gbraid" TEXT;
ALTER TABLE "bookings" ADD COLUMN "wbraid" TEXT;
ALTER TABLE "bookings" ADD COLUMN "utmSource" TEXT;
ALTER TABLE "bookings" ADD COLUMN "utmMedium" TEXT;
ALTER TABLE "bookings" ADD COLUMN "utmCampaign" TEXT;
ALTER TABLE "bookings" ADD COLUMN "utmContent" TEXT;
