# MyMobiFix

A production-ready mobile phone repair platform: transparent public pricing, a six-step booking
flow, customer-facing repair tracking, and a role-based admin dashboard for running the business.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Prisma and SQLite (PostgreSQL-ready).

---

## Contents

- [Quick start](#quick-start)
- [What is in the box](#what-is-in-the-box)
- [Architecture](#architecture)
- [Database](#database)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Security](#security)
- [Accessibility](#accessibility)
- [SEO](#seo)
- [Testing](#testing)
- [Deployment](#deployment)
- [Switching to PostgreSQL](#switching-to-postgresql)
- [Design system](#design-system)

---

## Quick start

Requires **Node.js 20+**.

```bash
npm install
```

```bash
cp .env.example .env
```

Generate a session secret and paste it into `SESSION_SECRET` in `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Create the database, apply migrations and seed it:

```bash
npm run setup
```

Start the dev server:

```bash
npm run dev
```

Open <http://localhost:3000>. The admin dashboard is at `/admin`.

### Seeded accounts

The seed creates four staff accounts so the role model can be exercised immediately.
**Change every password before deploying anywhere real.**

| Email | Password | Role | Can do |
|---|---|---|---|
| `admin@mymobifix.com` | `ChangeMe!2024` | Owner | Everything |
| `manager@mymobifix.com` | `Manager!2024` | Manager | All except staff management |
| `tech1@mymobifix.com` | `Technician!2024` | Technician | Bookings only — no customers, analytics or pricing |
| `tech2@mymobifix.com` | `Technician!2024` | Technician | As above |

The owner account's credentials come from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

### Seeded data

11 brands · 57 device models · 12 repair services · ~1,265 price rows · 25 customers ·
96 bookings spread across 90 days · 12 published reviews.

All of it is clearly-labelled sample data. `USES_DEMO_DATA` in `src/lib/config.ts` drives the
visible "demonstration deployment" notices — set it to `false` once you are running on real data.

---

## What is in the box

### Customer experience

- **Landing hero** with a full-bleed video background, floating in-hero navbar and a seamless
  brand marquee. The marquee is pure CSS on `transform` (zero client JS); the hero copy is real
  DOM text that server-renders visible, so nothing above the fold depends on JavaScript.
- **Instant estimator** on the homepage — pick a device and fault, get an itemised price, repair
  time and warranty without entering a single personal detail.
- **Public price book** at `/pricing` — every device × service × part grade, searchable and
  filterable, with filters reflected in the URL so a view can be shared.
- **Six-step booking flow** — device → repair → service type → date/time → details → review.
  Live slot availability, per-step validation, and a running quote visible throughout.
- **Repair tracking** at `/track` — seven-stage timeline with timestamps, gated on repair ID *and*
  the phone number on the booking.
- **Service pages** for each repair type with symptoms, part-grade comparison and sample pricing.
- Light and dark themes, applied before first paint so there is no flash.

### Admin dashboard

- Operational dashboard: pipeline counts, revenue, today's appointments, integration status.
- Booking management: server-side search, filtering, sorting, pagination; status pipeline with
  enforced transitions; technician assignment; internal notes; rescheduling; payment recording.
- Catalogue and pricing management: brands, devices, services and prices — including bulk
  percentage adjustments and copying a whole price book onto a new device.
- Customer directory with repair history and lifetime value.
- Analytics with trend, breakdown and donut charts (hand-drawn SVG — no charting library).
- Contact-message inbox with a read/resolved workflow.

---

## Architecture

```text
Browser
   │  fetch() with the standard { ok, data | error } envelope
   ▼
API layer            src/app/api/**/route.ts
   │  parse · validate (Zod) · authorise · rate limit · map errors to HTTP
   ▼
Business logic       src/server/services/*.service.ts
   │  the only place that knows the domain rules
   ▼
Data access          Prisma  →  SQLite / PostgreSQL
```

Route handlers stay thin: they never contain business rules, and services never touch HTTP.

```text
src/
├── app/
│   ├── (site)/              Public marketing site, booking flow, tracking
│   ├── admin/
│   │   ├── login/           Unauthenticated
│   │   └── (dashboard)/     Auth-guarded layout wraps every page beneath it
│   ├── api/                 REST API — public + /api/admin/*
│   ├── sitemap.ts robots.ts manifest.ts
│   └── error.tsx global-error.tsx not-found.tsx
├── components/
│   ├── ui/                  Design-system primitives (Button, Modal, Toast, form controls…)
│   ├── icons/               ~70 inline SVG icons on a shared 24×24 grid
│   ├── site/ home/ booking/ pricing/ track/ contact/ admin/
├── lib/                     Constants, validation, auth, errors, HTTP, money, utils
├── server/services/         Business logic
└── middleware.ts            Edge redirect for /admin (convenience only)
```

### Key design decisions

**Pricing is data, never code.** Every price lives in a `RepairPrice` row keyed by
(model × service × part grade). An admin changing a price in the dashboard changes the public quote
immediately — this is covered by an end-to-end test.

**The server is the pricing authority.** `POST /api/bookings` accepts *selections only* — there is
no price field in the payload. The service re-runs the same `buildQuote()` the estimator used and
stores that result, so a tampered request cannot buy a discounted repair.

**Status transitions are enforced server-side.** `STATUS_TRANSITIONS` in `src/lib/constants.ts` is
a transition graph. A repair cannot skip quality control or be revived after cancellation, whether
the request comes from the UI or from curl.

**Snapshots on bookings.** `deviceBrandName`, `serviceName`, `unitPrice` and friends are copied onto
the booking at creation. A catalogue rename years later must not rewrite a past repair record.

**Scheduling lives in one place.** `Appointment` is the only table with a scheduled date, so
"today's appointments" is one indexed range scan and nothing can drift out of sync.

**Unpriced devices degrade honestly.** If a model has no price row, the quote is derived from tier
averages and flagged `isEstimate`, and the UI labels it "confirmed after diagnosis" — rather than
either failing or presenting a guess as a firm price.

---

## Database

Thirteen models, all with indexes on the columns actually queried:

| Model | Purpose |
|---|---|
| `User` | Staff accounts (Owner / Manager / Technician) |
| `Session` | Server-side sessions, so tokens can be revoked instantly |
| `Customer` | Repair customers; phone is the natural key. No login |
| `DeviceBrand`, `DeviceModel` | Device catalogue |
| `RepairService` | Repair types with default duration and warranty |
| `RepairPrice` | Price per (model × service × part grade) — the pricing source of truth |
| `Booking`, `BookingItem` | A repair job and its line items, with snapshotted values |
| `RepairStatusHistory` | Append-only audit trail; drives the public tracker |
| `Appointment` | Authoritative scheduling record |
| `Payment` | Payments against a booking |
| `Review` | Customer reviews, verified against completed bookings |
| `ContactMessage` | Contact-form enquiries |
| `Setting` | Admin-editable business settings (service fees, booking window, slot capacity) |

Money is stored as whole-rupee `Int`. Conversion to a gateway minor unit happens only at the
payment boundary (`toMinorUnits()` in `src/lib/money.ts`).

Enum-like columns are plain `String`, validated at the application boundary. This keeps the schema
portable between SQLite and PostgreSQL with no model changes.

---

## Environment variables

Every variable is documented in [`.env.example`](./.env.example). Summary:

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | **Yes** | Connection string. Defaults to a local SQLite file |
| `SESSION_SECRET` | **Yes** | Min 32 chars. Signs the admin session JWT (HS256) |
| `SESSION_MAX_AGE` | No | Session lifetime in seconds (default 28800 = 8h) |
| `SEED_ADMIN_EMAIL` / `_PASSWORD` / `_NAME` | No | Bootstrap owner account for `db:seed` |
| `NEXT_PUBLIC_SITE_URL` | Yes in prod | Canonical URLs, sitemap, CSRF origin check |
| `NEXT_PUBLIC_BRAND_NAME`, `_SUPPORT_PHONE`, `_SUPPORT_EMAIL`, `_WHATSAPP_NUMBER`, `_BUSINESS_HOURS`, `_BUSINESS_ADDRESS` | No | Public contact details |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL` | No | Contact-page map. Without it, a labelled placeholder renders |
| `SMTP_*` | No | Transactional email |
| `SMS_*`, `WHATSAPP_API_*` | No | SMS / WhatsApp notifications |
| `PAYMENT_*` | No | Online payment provider |

**Integrations are honest about their state.** When a provider's credentials are absent the app
logs a clearly-labelled "skipped" record and reports `sent: false` — it never claims to have sent a
message it did not send. The admin dashboard shows which channels are live. To wire a provider up,
implement its single `deliver*` function in `src/server/services/notification.service.ts`; the
channel selection, templating and call sites stay unchanged.

`.env` is gitignored. Never commit it.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next.js lint |
| `npm run setup` | generate + migrate + seed (first-time setup) |
| `npm run db:migrate` | Create and apply a migration |
| `npm run db:deploy` | Apply migrations without prompting (production) |
| `npm run db:seed` | Seed the database (idempotent) |
| `npm run db:reset` | Drop, re-migrate and re-seed |

---

## Security

- **Passwords** — bcrypt, cost factor 12. A login attempt against an unknown email still performs a
  dummy comparison, so response timing does not reveal which accounts exist.
- **Sessions** — a signed JWT (HS256, `jose`) in an httpOnly, SameSite=Lax, Secure-in-production
  cookie. The token carries only a session id; every request loads the live `Session` + `User` rows,
  so revocation, deactivation and role changes take effect immediately.
- **Authorisation** — a capability matrix (`PERMISSIONS`) checked server-side via
  `requirePermission()` on every admin route and page. Hiding a nav link is presentation only and is
  never what keeps anyone out.
- **CSRF** — three independent layers: SameSite=Lax cookies, an `Origin`/`Referer` check against the
  deployment host, and a required `X-Requested-With` header that a cross-origin form post cannot set.
- **Rate limiting** — login (5 per 5 min, by IP *and* by email), bookings, tracking lookups and
  contact submissions. In-memory by default; swap `hit()` in `src/lib/rate-limit.ts` for Redis on
  multi-instance deployments.
- **Injection** — Prisma parameterises every query. React escapes all interpolated output. The only
  `dangerouslySetInnerHTML` uses are `JSON.stringify` of literal objects we construct.
- **Input validation** — Zod on the server for every write. Client validation uses the same schemas,
  purely for feedback.
- **Enumeration** — tracking returns one generic message for both "no such reference" and "phone
  does not match", and is rate limited.
- **Data minimisation** — the tracking endpoint returns only customer-facing fields. Internal notes,
  technician names, IMEI and staff identities never cross that boundary. Verified by test.
- **Headers** — CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy` and
  `Permissions-Policy`, set in `next.config.ts`. API responses are `no-store`.
- **Secrets** — `src/lib/env.ts` imports `server-only`, so the build fails if a secret is ever
  reachable from a client component.

---

## Accessibility

Targets WCAG 2.2 AA.

- Semantic HTML first; ARIA only where semantics run out.
- One `<h1>` per page, and a logical heading order (verified by audit script).
- Every form control has a real `<label for>`; errors are linked with `aria-describedby` and
  `aria-invalid`, and announced with `role="alert"`.
- Every icon-only button has an `aria-label`; decorative icons are `aria-hidden`.
- A single high-contrast focus ring across the product; focus is never removed, only hidden for
  pointer users via `:focus-visible`.
- Modal implements the full WAI-ARIA dialog pattern: focus moves in, Tab is trapped, Escape closes,
  background scroll is locked, focus returns to the trigger.
- Tabs implement roving-tabindex arrow-key navigation.
- Async regions use `aria-live`; toasts route errors to `assertive` and confirmations to `polite`.
- Charts carry text summaries and a "view as data table" alternative.
- `prefers-reduced-motion` removes movement while keeping state changes.
- Colour is never the only signal — status badges pair colour with an icon and a text label.
- Touch targets are ≥44px outside dense admin tables; body text is ≥16px on mobile.

---

## SEO

- Per-page titles and descriptions sized for search results, with a title template.
- Canonical URLs on every indexable page; `noindex` on admin, the booking flow and confirmations.
- Structured data: `LocalBusiness` (site-wide), `Service` (each service page), `ItemList`,
  `FAQPage`, `HowTo`, and `BreadcrumbList` alongside every visible breadcrumb.
- `sitemap.xml` generated from the live catalogue, so a new service appears without a code change.
- `robots.txt` and a web app manifest with shortcuts.
- Open Graph and Twitter card metadata.
- Semantic headings, clean URLs, and real crawlable content — pricing is HTML, not an image.

---

## Testing

Three verification scripts live in the scratchpad during development; the checks they perform are
documented here so they can be re-created or promoted into a test runner.

**Public API journey (48 checks)** — catalogue reads, quoting, the estimate fallback for unpriced
devices, availability, booking creation, server-side price authority, the duplicate guard,
validation failures, tracking (including the wrong-phone and malformed-reference paths), auth
rejection, CSRF blocking, the contact honeypot, and pricing pagination.

**Admin journey (55 checks)** — login and session handling, dashboard and analytics reads, filters
and search, status-transition enforcement (including rejecting illegal jumps), internal notes
staying internal, technician assignment, payments, catalogue CRUD, price cloning, an admin price
edit reaching the public quote, per-role authorisation for all three roles, and session revocation
on logout.

**Static audit** — every public page checked for exactly one `<h1>`, labelled controls, named
buttons, alt text, valid JSON-LD, canonical URLs and metadata length; a sweep of all internal links;
and verification of the security headers.

Before shipping a change:

```bash
npm run typecheck && npm run build
```

---

## Deployment

### Any Node host

```bash
npm ci
npm run build
npm run db:deploy
npm start
```

Set at minimum `DATABASE_URL`, `SESSION_SECRET` and `NEXT_PUBLIC_SITE_URL` in the host's environment.
The app listens on `PORT` (default 3000).

### Vercel

1. Import the repository.
2. Add the environment variables above. **`NEXT_PUBLIC_SITE_URL` must be the real deployed origin** —
   it backs canonical URLs and the CSRF origin check.
3. Set the build command to `prisma generate && prisma migrate deploy && next build`.
4. Use a hosted PostgreSQL database (see below). SQLite will not work on serverless — the filesystem
   is ephemeral and not shared between instances.

### Docker

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json prisma ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

### Production checklist

- [ ] `SESSION_SECRET` is a fresh 32+ character random value, not the development one
- [ ] Every seeded staff password changed
- [ ] `DATABASE_URL` points at PostgreSQL with backups configured
- [ ] `NEXT_PUBLIC_SITE_URL` is the real origin (HTTPS)
- [ ] `USES_DEMO_DATA` set to `false` and the sample reviews/bookings cleared
- [ ] Real contact details set via `NEXT_PUBLIC_SUPPORT_*`
- [ ] Legal pages (`/terms`, `/privacy`, `/warranty`) reviewed by a lawyer — they ship as templates
      and say so
- [ ] Notification and payment providers configured, or knowingly left off
- [ ] Rate limiting moved to Redis if running more than one instance

---

## Switching to PostgreSQL

The schema is written to be portable. Change only the datasource block in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/mymobifix?schema=public" npx prisma migrate dev --name init-postgres
```

No model changes are needed: the schema avoids Prisma `enum` and native array types precisely so
this migration is a two-line change. One caveat — `prisma/seed.ts` filters existing rows manually
before `createMany` because SQLite has no `skipDuplicates`; on PostgreSQL you can simplify that to
`createMany({ skipDuplicates: true })`.

---

## Design system

Generated with [UI/UX Pro Max](https://www.npmjs.com/package/uipro-cli)
(`uipro init --ai claude`) and persisted to `design-system/mymobifix/MASTER.md`.

**Direction:** "Soft UI Evolution" — trust navy, premium gold, generous space and layered soft
shadows. Depth establishes hierarchy; it is never decoration.

| Token | Light | Dark |
|---|---|---|
| Brand (primary) | `#0f172a` | `#1e3a8a` |
| Accent (CTA) | `#ca8a04` | `#ecb31f` |
| Canvas | `#f9fafb` | `#070b14` |
| Surface | `#ffffff` | `#0f1626` |
| Ink | `#0f172a` | `#f1f5f9` |

**Typography:** Outfit (display) + Inter (body), self-hosted via `next/font` — no external request,
no render-blocking stylesheet, no layout shift.

**Colour architecture:** static palette scales live in Tailwind's `@theme`; semantic role tokens
(`canvas`, `surface`, `ink`, `line`…) are CSS custom properties defined once per theme. Components
only ever reference role tokens, so the whole product themes from about 24 declarations. Every
foreground/background pairing meets WCAG AA in both themes.

**Icons:** ~70 inline SVGs on a shared 24×24 grid, `currentColor` stroked. No emoji, no icon font,
no network request.

**Interaction:** hover states change colour and shadow, never geometry, so nothing shifts under the
pointer. Transitions are 150–300 ms on `transform`/`opacity`/colour only.

---

## Licence

Private project.
