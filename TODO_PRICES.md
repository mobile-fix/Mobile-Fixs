# Prices still to fill

Public prices were taken off the site on purpose (commit 5a43e1d, "Remove public
pricing"). The only rupee figures in the codebase are the seed formula's
base prices in `prisma/seed-data.ts`, which are generated from tier
multipliers and have never been confirmed by the owner. So no price is
published. The three city pages show "Firm quote in 10 minutes" in the price slot until real figures are supplied.

| Where it shows | File | What's needed |
|---|---|---|
| `/screen-repair/delhi` — price band | `src/lib/city-pages.ts` (`PARTS.screen.priceBand`) | From–to price for a screen replacement, e.g. budget phone to flagship |
| `/battery-repair/delhi` — price band | `src/lib/city-pages.ts` (`PARTS.battery.priceBand`) | From–to price for a battery replacement |
| `/phone-repair/delhi` — price band | `src/lib/city-pages.ts` (`PARTS.phone.priceBand`) | From–to price across common part replacements |
| LocalBusiness JSON-LD `priceRange` | `src/config/business.ts` (`priceRange`) | A price-range string such as `₹₹`, or a band like `₹999–₹14,999` |
