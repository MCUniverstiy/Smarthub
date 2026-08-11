# Smarthub Connect — Website

Multi-page, trilingual (English / 繁體中文 / 简体中文) marketing site for **Smarthub Connect Limited** — a Hong Kong TCSP-licensed corporate services and workspace provider based in Wan Chai.

Built with Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui. Design inspired by [corient.com](https://corient.com/us/en).

---

## 🚀 Want to deploy this to Vercel?

**Read [DEPLOYMENT.md](./DEPLOYMENT.md)** — it's a step-by-step guide for pushing to GitHub and going live on Vercel. No prior deployment experience needed.

**Quick start:**
1. Push code to GitHub (private repo)
2. Go to https://vercel.com/new → import the repo
3. Add env var `NEXT_PUBLIC_FORMSPREE_ENDPOINT` (get one at https://formspree.io)
4. Click Deploy
5. Add your custom domain in Vercel → Settings → Domains

---

## ⚠️ BEFORE LAUNCH — MUST DO

These items require the boss's input or external service setup. None of them can be done from code alone.

| Item | Where to update | Current placeholder |
|---|---|---|
| **Real TCSP licence number** | `src/lib/site-data.ts` → `tcspLicence` | `TC010264` (verify on [cr.gov.hk](https://www.cr.gov.hk)) |
| **Real phone number** | `src/lib/site-data.ts` → `phone` | `+852 2383 3283` |
| **Real WhatsApp number** | `src/lib/site-data.ts` → `whatsapp`, `whatsappUrl` | `+852 5501 3516` |
| **Real email** | `src/lib/site-data.ts` → `email` | `info@smarthubc.com` |
| **Real office address** | `src/lib/site-data.ts` → `address`, `addressZh`, `addressCn` | `25/F, 88 Lockhart Road, Wan Chai` |
| **Real stats** | `src/lib/site-data.ts` → `heroStats`, `sectionStats` | `25+`, `1,200+`, `98%`, `6` etc. (all fabricated) |
| **Real pricing** | `src/lib/i18n/translations.ts` → `pricing.tiers`, `pricing.workspace` | Made-up HK market rates |
| **Verify room rates** | `src/lib/booking-data.ts` → `ROOMS` | Copied from the live Google Form — confirm they're current, and keep the form's own "Room Information" text in sync |
| **Real room photos** | `src/lib/booking-data.ts` → `ROOMS[].image` | Unsplash stock photos |
| **Run the booking database** | Paste `supabase/schema.sql` into the Supabase SQL editor | Not run yet — without it the site still works, but the Google Form cannot prevent double bookings |
| **Supabase env vars** | `.env.local` + Vercel — where to find the keys: [`docs/supabase-keys.md`](docs/supabase-keys.md) | Unset (booking falls back to Google Form only) |
| **Create a staff login** | Supabase → Authentication → Users, then `insert into public.staff` — step-by-step in [`docs/staff-login.md`](docs/staff-login.md) | None yet — `#/admin` shows "no access" until one exists |
| **Real Formspree ID** | `src/components/pages/contact.tsx` line 56 | `your-form-id` |
| **Real newsletter provider** | `src/components/pages/insights.tsx` → `onSubscribe` | Just flips button label |
| **Real images** | All `images.unsplash.com` URLs across `src/components/pages/*` | Stock photos |
| **Real insights articles** | `src/lib/i18n/translations.ts` → `insights.items` + `page-content.ts` → `insights.featured` | Titles + excerpts only |
| **Verify MCM Group entity names** | `src/components/pages/about.tsx` lines 127–133 | MCAH / MCAM / MCMWM / MCF / Smarthub / MCU Institute |
| **Point real domain** | Vercel project settings | `smarthubc.com` |
| **Add analytics** | `src/app/layout.tsx` | None yet (add Plausible or Vercel Analytics script) |

---

## File Structure

```
my-project/
├── public/                          # Static assets served as-is
│   ├── favicon.ico                  # Multi-size favicon (16/32/48)
│   ├── favicon-16.png               # 16x16 PNG favicon
│   ├── favicon-32.png               # 32x32 PNG favicon
│   ├── favicon-48.png               # 48x48 PNG favicon
│   ├── favicon-64.png               # 64x64 PNG favicon
│   ├── apple-touch-icon.png         # 180x180 iOS home screen icon
│   ├── icon-192.png                 # 192x192 PWA icon
│   ├── icon-512.png                 # 512x512 PWA icon
│   ├── og-image.png                 # 1200x630 Open Graph image (social sharing)
│   ├── og-image.svg                 # SVG source for OG image
│   ├── manifest.json                # PWA web manifest
│   ├── robots.txt                   # Crawler instructions
│   ├── sitemap.xml                  # XML sitemap (all 11 routes)
│   └── logo.svg                     # Original scaffold logo (unused)
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # Root layout: fonts, metadata, JSON-LD, LangProvider
│   │   ├── page.tsx                 # Main page: RouterProvider + Navbar + RouterOutlet + Footer
│   │   ├── globals.css              # Tailwind + brand palette + animations + a11y styles
│   │   └── api/route.ts             # (Unused scaffold API route)
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (40+ files, auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── accordion.tsx
│   │   │   ├── sheet.tsx            # Mobile nav drawer
│   │   │   └── ... (don't edit unless necessary)
│   │   │
│   │   ├── blocks/                  # Reusable section-level building blocks
│   │   │   ├── page-hero.tsx        # Image hero with eyebrow/title/lead (used on every subpage)
│   │   │   ├── section-heading.tsx  # Eyebrow + h2 + optional lead, left or center aligned
│   │   │   └── cta-band.tsx         # Full-width gradient CTA band at bottom of pages
│   │   │
│   │   ├── pages/                   # Page-level components (one per route)
│   │   │   ├── home.tsx             # #/ — Hero, intro, services preview, why-HK preview, insights preview, CTA
│   │   │   ├── about.tsx            # #/about — Story, values, MCM Group, team
│   │   │   ├── services.tsx         # #/services — 4 services, alternating image/text, pricing teaser
│   │   │   ├── why-hk.tsx           # #/why-hong-kong — 6 benefits, stats band, image band
│   │   │   ├── pricing.tsx          # #/pricing — 3 tiers, workspace add-ons, FAQ accordion
│   │   │   ├── insights.tsx         # #/insights — Featured article, 5-card grid, newsletter
│   │   │   ├── contact.tsx          # #/contact — Info + working form + Google Map embed
│   │   │   ├── legal.tsx            # #/privacy, #/terms, #/complaints, #/disclosures (reusable)
│   │   │   └── not-found.tsx        # #/anything-else — 404 page
│   │   │
│   │   ├── sections/                # Global UI that appears on every page
│   │   │   ├── navbar.tsx           # Sticky glass nav with language switcher + mobile sheet
│   │   │   ├── footer.tsx           # 5-column footer with explore/legal/connect + CTA strip
│   │   │   ├── whatsapp-float.tsx   # Floating WhatsApp button (pulse stops after 3.5s)
│   │   │   ├── back-to-top.tsx      # Floating arrow button (appears after 600px scroll)
│   │   │   ├── cookie-consent.tsx   # Cookie banner (remembers choice in localStorage)
│   │   │   └── language-switcher.tsx# EN / 繁 / 简 dropdown
│   │   │
│   │   └── language-switcher.tsx    # (Alias — same as sections/language-switcher)
│   │
│   └── lib/                         # Business logic + config
│       ├── i18n/
│       │   ├── translations.ts      # Base dictionary (nav, hero, services, pricing, contact, footer) — 3 languages
│       │   ├── page-content.ts      # Page-specific content (heroes, body copy, FAQs) — 3 languages
│       │   ├── extra-content.ts     # Footer CTA, cookie banner, legal pages, 404, hardcoded labels — 3 languages
│       │   └── lang-context.tsx     # React Context: merges all 3 files + detects browser lang + persists to localStorage
│       │
│       ├── router.tsx               # Custom hash router (12 routes, scroll-to-top, RouterLink component)
│       ├── site-data.ts             # 📍 SINGLE SOURCE OF TRUTH for company facts (phone, email, address, stats)
│       ├── db.ts                    # Prisma client (unused, scaffold)
│       └── utils.ts                 # cn() class merge helper
│
├── scripts/
│   └── generate-icons.py            # Python script that regenerates all PNG icons + OG image
│
├── package.json                     # Dependencies + scripts
├── next.config.ts                   # Next.js config (image optimization, allowedDevOrigins)
├── tailwind.config.ts               # Tailwind config
├── tsconfig.json                    # TypeScript config
└── README.md                        # This file
```

---

## What Each File Does (the important ones)

### Core routing & state

- **`src/lib/router.tsx`** — Custom hash router. URLs look like `smarthubc.com/#/about`. Provides `<RouterProvider>`, `useRouter()` hook, and `<RouterLink to="about">` component. Auto-scrolls to top on route change. Falls back to 404 for unknown routes.
- **`src/lib/i18n/lang-context.tsx`** — React Context that merges all 3 translation files into one `t` object. Detects browser language on first load (繁體 for HK/TW/MO, 简体 for other zh, English otherwise), persists choice to `localStorage`.

### Single source of truth

- **`src/lib/site-data.ts`** — 📍 **Edit this file to update company facts everywhere.** Contains `companyFacts` (phone, email, address, TCSP licence, etc.) and `heroStats` / `sectionStats` (the numbers shown on home + about + stats band). When the boss gives you real numbers, change them HERE ONLY and they propagate everywhere.

- **`src/lib/booking-data.ts`** — 📍 **Edit this file to update rooms, capacities and hourly rates.** Also holds the booking rules (7 working days' notice, 9am–5pm starts, 10am–6pm ends) and the Google Form bridge (form id + `entry.<id>` numbers). The booking page, the rate table on Pricing/Services, and the homepage booking band all read from here.

### Translations (4 files merged at runtime)

- **`src/lib/i18n/translations.ts`** — Base UI strings: nav, hero, services, pricing tiers, contact form labels, footer. ~980 lines.
- **`src/lib/i18n/page-content.ts`** — Per-page content: hero eyebrows/titles/leads, story paragraphs, value cards, FAQ items. ~700 lines.
- **`src/lib/i18n/extra-content.ts`** — Things that were hardcoded English before: footer CTA, cookie banner, 404, legal pages (privacy/terms/complaints/disclosures — full HK PDPO-compliant text).
- **`src/lib/i18n/booking-content.ts`** — Every string on the room-booking page: hero, the 3-step strip, room labels, form fields + hints, validation messages, confirmation screen, policy notices, FAQ.

### Pages (one component per route)

- **`src/components/pages/home.tsx`** — Full-bleed hero, intro band with stats, 4-card services preview, Why HK preview on dark image, 3-card insights preview, CTA band.
- **`src/components/pages/about.tsx`** — Story (3-paragraph narrative), 4 value cards, MCM Group ecosystem (shows all 6 sister entities with "You are here" on Smarthub), team section.
- **`src/components/pages/services.tsx`** — 4 services in alternating image/text editorial blocks (Corient-style), pricing teaser card, CTA.
- **`src/components/pages/why-hk.tsx`** — 6 benefit cards with watermark numbers, teal HK stats band, full-bleed HK image band, dark CTA.
- **`src/components/pages/pricing.tsx`** — 3 pricing tiers (Starter/Professional/Enterprise) with "Most Popular" highlight, 6 workspace add-ons grid, 6-item FAQ accordion.
- **`src/components/pages/insights.tsx`** — Featured article (large 2-col card), 5-article grid (cards wrapped in `<a>` for full-card click), newsletter signup card.
- **`src/components/pages/booking.tsx`** — 🆕 **Room booking page** (`#/book`). Six selectable room cards, a validated booking form with a live price estimate, and a confirmation screen. Submits into the team's existing Google Form (see "Room booking" below). Deep-linkable: `#/book?room=event-space` preselects a room.
- **`src/components/pages/admin.tsx`** — 🆕 **Staff booking inbox** (`#/admin`). Internal tool: sign in, see bookings grouped by date, Confirm / Decline / Cancel. Not linked from anywhere; protected by row level security, not by being unlisted.
- **`src/components/pages/contact.tsx`** — Contact info column + working form with honeypot, real error handling, service preselect from URL (`#/contact?service=Serviced+Office`), Google Maps iframe embed.
- **`src/components/pages/legal.tsx`** — One reusable component for all 4 legal pages (privacy/terms/complaints/disclosures). Takes a `which` prop.
- **`src/components/pages/not-found.tsx`** — 404 page with big gradient "404", home button, back button.

### Global UI (every page)

- **`src/components/sections/navbar.tsx`** — Sticky glass nav with scroll shadow. Logo, 7 nav links (active highlighted, including "Book a Room"), language switcher, "Book a Room" primary CTA + "Get Started" secondary, mobile Sheet menu.
- **`src/components/sections/footer.tsx`** — 5-column footer: brand + tagline + TCSP badge / Explore links / Legal links / Connect info. Plus top CTA strip with WhatsApp button.
- **`src/components/sections/whatsapp-float.tsx`** — Floating green WhatsApp button bottom-right. Pulse animation stops after 3.5s so it's not annoying.
- **`src/components/sections/back-to-top.tsx`** — Dark floating arrow button bottom-right (above WhatsApp). Appears after scrolling 600px. Smooth-scrolls to top.
- **`src/components/sections/cookie-consent.tsx`** — Bottom-right cookie banner. Shows on first visit, stores choice in `localStorage` under `smarthub-cookie-consent`. "Accept all" / "Necessary only" buttons.
- **`src/components/language-switcher.tsx`** — Dropdown with EN / 繁 / 简. Globe icon.

### Reusable blocks

- **`src/components/blocks/page-hero.tsx`** — Image hero with eyebrow pill, large title, optional lead. Used on every subpage. Has `height` prop (sm/md/lg) and `align` prop (left/center).
- **`src/components/blocks/section-heading.tsx`** — Eyebrow + h2 + optional lead, left or center aligned. Has `dark` prop for use on dark backgrounds.
- **`src/components/blocks/cta-band.tsx`** — Full-width gradient CTA band with title, lead, button. Teal or dark variant.
- **`src/components/blocks/room-rates.tsx`** — Rate table for the six bookable rooms (name / capacity / rate), each row deep-linking to `#/book?room=<id>`. Table on desktop, stacked cards on mobile. Used on Pricing and Services. Reads `src/lib/booking-data.ts`.

### Static assets

- **`public/robots.txt`** — Allows all crawlers, points to sitemap.
- **`public/sitemap.xml`** — Lists all 12 routes (8 main + 4 legal).
- **`public/manifest.json`** — PWA manifest for installability.
- **`public/favicon*.{ico,png}`** — Favicon set (16/32/48/64).
- **`public/apple-touch-icon.png`** — 180x180 iOS icon.
- **`public/icon-{192,512}.png`** — PWA icons.
- **`public/og-image.png`** — 1200x630 social sharing image (regenerate via `python3 scripts/generate-icons.py`).

---

## 🗓️ Room booking (how it connects to the Google Form)

The booking page at **`#/book`** is a proper on-site booking experience — but it does **not** replace the team's Google Form. It submits *into* it, so every request still lands in the same Google Sheet and triggers the same email notifications as before. Nobody in the office has to change how they work.

### The flow

```
Visitor picks a room + slot on smarthubc.com/#/book
        │
        ├─ validated in the browser (7 working days, 9–5 / 10–6, capacity)
        │
        ├─ Supabase: request_booking()  ◀── decides, because it knows
        │     │                              what everyone else booked
        │     ├─ refused (slot taken) ─▶ error shown, NOTHING sent to the form
        │     └─ accepted ─▶ reference SH-2608-4KQ9TW
        │
        └─ POST entry.<id>=<value> ──▶ Google Form /formResponse
                                              │
                                              └─▶ existing Responses sheet + email alert
```

Supabase is **optional**. If the env vars are unset, or the database is
unreachable, the middle step is skipped and the page behaves exactly as it did
before — a booking in the sheet beats a lost enquiry. Set it up with
`supabase/schema.sql`; see [`supabase/README.md`](supabase/README.md).

### Staff inbox

With the database running, the office can work at **`#/admin`** instead of in
the spreadsheet: bookings grouped by date, colour-coded by status, one-click
Confirm / Decline / Cancel. Declining releases the slot immediately.

The page is not in the navbar, footer or sitemap — but that is convenience, not
security. Row level security is what protects the data: a stranger who guesses
the URL and signs up still sees an empty list, because every policy calls
`is_staff()`.

Creating the first staff login is a two-step job (make the account, then grant
the staff pass). Walkthrough: [`docs/staff-login.md`](docs/staff-login.md).

### What the website adds on top of the raw form

| | Google Form alone | The `#/book` page |
|---|---|---|
| Branding | Google's | Smarthub's, in the site's design |
| Language | All 3 stacked in every label | Follows the site's EN / 繁 / 简 switcher |
| Room info | A wall of text to scroll past | Six photo cards with capacity + rate |
| Price | Visitor works it out | Live estimate as they pick a slot |
| Bad dates | Accepted, caught later by staff | Blocked before submitting |
| Over capacity | Accepted, caught later by staff | Blocked before submitting |
| Deep links | — | `#/book?room=event-space` preselects a room |

The original form is still linked at the bottom of the page for anyone who prefers it.

### Where things live

| What | File |
|---|---|
| Rooms, capacities, rates | `src/lib/booking-data.ts` → `ROOMS` |
| Booking rules (lead time, hours) | `src/lib/booking-data.ts` → `BOOKING_RULES` |
| Google Form id + entry ids | `src/lib/booking-data.ts` → `GOOGLE_FORM` |
| All booking page text (3 languages) | `src/lib/i18n/booking-content.ts` |
| The page itself | `src/components/pages/booking.tsx` |
| Rate table used on other pages | `src/components/blocks/room-rates.tsx` |
| Database schema (rooms, rules, RLS) | `supabase/schema.sql` |
| Database client + error mapping | `src/lib/supabase.ts` |
| Staff inbox page | `src/components/pages/admin.tsx` |
| Google Sheet formatter | `supabase/google-sheet-formatter.gs` |

### Changing a rate or a room

Edit `ROOMS` in `src/lib/booking-data.ts`. The booking page, the rate tables on Pricing and Services, and the homepage booking band all update together.

If the database is running, change the matching row in section 3 of `supabase/schema.sql` and re-run the script — it is idempotent, and `supabase/tests/schema.test.mjs` asserts the two stay in sync.

⚠️ Also update the **"Room Information"** description block inside the Google Form itself — that text is maintained in Google and the code can't reach it.

### ⚠️ If the Google Form is ever recreated

A new form means a new id **and** new question ids. To reconnect:

1. Open the new form → **⋮ menu → Get pre-filled link** → fill in dummy answers → **Get link**.
2. The link contains every `entry.<number>` — copy them into `GOOGLE_FORM.entry` in `src/lib/booking-data.ts`.
3. Copy the new form id (the long `1FAIpQLS…` part of the URL) into `GOOGLE_FORM.id`, or set `NEXT_PUBLIC_BOOKING_FORM_ID` in Vercel.
4. Make sure the multiple-choice option text in `ROOMS[].formValue` and `PAYMENT_METHODS[].formValue` matches the new form **character for character** — Google silently discards answers that don't match exactly.

### Known limitation

Google Forms sends no CORS headers, so the browser can't read Google's reply. The submission is fire-and-forget: we know the request left the browser, not that Google accepted it. That's why the confirmation copy promises an email confirmation rather than claiming the room is reserved. If the request fails outright, the page shows a **pre-filled Google Form link** so the visitor finishes in one click without retyping.

---

## How to Run

```bash
# Install dependencies (already done)
bun install

# Run dev server (auto-started in sandbox)
bun run dev

# Lint
bun run lint

# Build for production
bun run build

# Regenerate icons (after editing brand colors)
python3 scripts/generate-icons.py
```

---

## What Was Fixed (audit items completed)

### Deleted dead code
- Removed 8 unused single-page section files: `hero.tsx`, `about.tsx`, `services.tsx`, `why-hk.tsx`, `pricing.tsx`, `stats.tsx`, `insights.tsx`, `contact.tsx` from `src/components/sections/`.

### Fixed all hardcoded English
- Footer CTA strip ("Ready to set up in Hong Kong?" etc.) → now translated
- Why HK image band ("Hong Kong is open for business.") → now translated
- Insights labels (Featured, Read article, All Articles, Read more) → now translated
- Pricing FAQ eyebrow → now translated
- Contact Google Maps button label → now translated
- All extracted to `src/lib/i18n/extra-content.ts`

### Built 4 legal pages (required for TCSP compliance)
- Privacy Policy (PDPO-compliant, mentions Formspree US data transfer)
- Terms of Use
- Complaints Procedure (TCSP Code requirement, with Companies Registry escalation)
- Disclosures (lists all MCM Group entities + licence verification)
- All 4 fully translated EN/繁/简, all linked from footer.

### Built 404 page
- Unknown hash routes now show a proper 404 with gradient "404", home button, back button.

### Wired contact form properly
- Added honeypot field (`_gotcha`) to block spam bots
- Removed the "fall back to fake success" code — real errors now show a real error message with email fallback
- Added proper `<label htmlFor>` associations for accessibility
- Added `autoComplete` attributes for browser autofill
- Service dropdown now preselects from URL query (`#/contact?service=Serviced+Office`)
- Pricing CTA buttons deep-link to contact with the right service preselected

### Added SEO basics
- `sitemap.xml` with all 11 routes
- `robots.txt` with sitemap reference
- `manifest.json` for PWA
- JSON-LD `LocalBusiness` + `FinancialService` structured data in `<head>` (address, hours, geo, licence)
- Open Graph image (1200x630 PNG, regenerable)
- Full favicon set (16/32/48/64 .png + .ico + 180 apple-touch + 192/512 PWA)
- `metadataBase` + canonical URL + hreflang alternates in layout

### Added accessibility
- Skip-to-content link (visible on keyboard focus)
- Global keyboard focus styles (`:focus-visible` outlines on all interactive elements)
- Proper `<label htmlFor>` + `<input id>` associations on contact form
- ARIA labels on icon-only buttons (WhatsApp, back-to-top, cookie close)
- `aria-hidden` on decorative SVGs
- `role="dialog"` + `aria-label` on cookie banner

### Added UX polish
- Back-to-top button (appears after 600px scroll)
- WhatsApp pulse stops after 3.5s (was infinite before)
- Insight cards wrapped in `<a>` for full-card click (was only "Read more" clickable)
- Cookie consent banner with localStorage persistence

### Self-hosted fonts (was Google Fonts CDN — blocked in mainland China)
- Installed `@fontsource-variable/plus-jakarta-sans` and `@fontsource-variable/dm-sans`
- Removed `<link>` to `fonts.googleapis.com` from layout
- Fonts now bundled and served from the same origin

### Single source of truth for stats
- All company facts (phone, email, address, TCSP number, stats numbers) now live in `src/lib/site-data.ts`
- Update once → propagates everywhere (navbar, footer, hero, about, contact, legal pages)

---

## What Still Needs Doing (requires boss or external service)

See the table at the top of this README. Summary:

1. **Verify company facts** — TCSP number, phone, WhatsApp, email, address, entity names
2. **Replace pricing numbers** with real rate card
3. **Replace stats** with real numbers (or remove if unverifiable)
4. **Replace all 40+ Unsplash images** with real Smarthub photos
5. **Set up Formspree** account and replace `your-form-id` in `contact.tsx` line 56
6. **Set up newsletter provider** (Mailchimp / ConvertKit / Loops) and wire up `insights.tsx`
7. **Write 3+ real Insights articles** (or remove the page until you have them)
8. **Point `smarthubc.com`** at the Vercel project
9. **Add analytics** (Plausible or Vercel Analytics script in `layout.tsx`)
10. **Consider WhatsApp Business API** (Wati / Twilio) instead of personal WhatsApp link
