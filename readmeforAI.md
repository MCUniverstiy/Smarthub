# readmeforAI.md

Orientation for an AI coding agent working in this repository. Read this
before touching anything. `README.md` is for humans deploying the site; this
file is about how the code actually behaves and where it will bite you.

---

## 1. What this is

A trilingual (English / 繁體中文 / 简体中文) marketing and room-booking site for
**Smarthub Connect Limited**, a TCSP-licensed corporate services and workspace
provider in Wan Chai, Hong Kong.

Next.js 16 (App Router, Turbopack) · React · TypeScript · Tailwind CSS 4 ·
shadcn/ui · Supabase (Postgres) · deployed on Vercel.

```
npm run dev     # localhost:3000
npm run build   # must pass before you commit
npm run lint    # eslint .
```

There is **no unit test suite for the frontend.** The only tests are
`supabase/tests/*.mjs`, which need a real PostgreSQL 18 and do not run in a
normal sandbox. Your verification loop is therefore: `tsc --noEmit`, then
`npm run build`, then load the page and look at it.

Use `./node_modules/.bin/tsc --noEmit`. Plain `npx tsc` may fetch an ancient
unrelated `tsc` package if `node_modules` is cold.

---

## 2. The five things that will trip you up

Read this section even if you read nothing else.

### 2.1 It is a hash router inside a single Next.js page

The whole site is served from `/` and `src/lib/router.tsx` swaps components
based on `window.location.hash` (`#/about`, `#/book?room=meeting-b`, `#/admin`).
Files in `src/app/` are **not** the routes; `src/app/page.tsx` just mounts
`<RouterProvider>` and `<RouterOutlet/>`.

Consequences:

- Adding a page means editing the `Route` union and the lookup tables in
  `router.tsx`, not creating a folder in `src/app/`.
- `src/middleware.ts` bounces bare paths like `/about` onto `/#/about` for
  bookmarks and emails. It deliberately ignores non-GET requests — a POST to
  `/partnership` used to crash the app.
- `curl` of any URL returns the **home page** HTML. The admin page will never
  appear in server-rendered output. Don't conclude a page is broken because
  curl didn't show it.
- `/partnership` also exists as a real Next.js route (`src/app/partnership/page.tsx`)
  for SEO. Both paths must keep working.

### 2.2 There are TWO room systems, and confusing them breaks bookings

| | `public.rooms` | `public.global_listings` |
|---|---|---|
| What | The 6 Wan Chai rooms we own | Partner offices: China, Singapore, Cyprus |
| Schema | `supabase/schema.sql` line ~84 | `supabase/global-office-platform.sql` line ~28 |
| Booking | Real engine: availability, overlap prevention, auto-quoting | Enquiry only — someone emails back |
| Bookings table | `public.bookings` (FK `room_id` → `rooms`) | `public.global_booking_requests` |
| Reference format | `SH-...` | `GO-...` |
| Admin tab | "Hong Kong rooms" | "Partner offices" |
| Frontend module | `src/lib/hong-kong-rooms.ts` | `src/lib/global-office.ts` |

A published `global_listings` row for Hong Kong must **never** replace or
shadow a `public.rooms` row. That bug existed and was fixed: it hid real
bookable rooms behind listings that have no availability checking.

Also distinct, and also easy to conflate: `public.sfo_enquiries` is the
partnership pipeline (someone applying to list their office). SFO (single
family office) and the business centre are **two different products** — do not
write copy or code that treats them as one thing.

### 2.3 Every user-facing string needs three languages

`Lang = "en" | "zh-HK" | "zh-CN"`. Copy lives in:

- `src/lib/i18n/translations.ts` — most page copy, nav labels
- `src/lib/i18n/page-content.ts` — hero/section content per page
- `src/lib/i18n/booking-content.ts` — booking flow (**including** `navLabel`
  and `ctaShort`, which are *not* in `translations.ts` — a common wrong guess)
- `src/lib/i18n/extra-content.ts` — the remainder

If you add a string in English only, you have shipped a bug. Note that the
partnership page is currently English-only; that is a known gap, not a licence
to add more.

Chinese text is wider. A navbar that fits in English can overflow in 繁體中文.
This has already caused one production overlap bug.

### 2.4 The site must work with no database

Supabase is optional. `isSupabaseConfigured` gates everything, and when it is
false the booking form falls back to submitting the **external Google Form**.
So:

- Never let a component render empty because a fetch failed. Seed from the
  hardcoded constant, then swap in database data. `src/lib/hong-kong-rooms.ts`
  is the reference implementation of this pattern — `fetchHongKongRooms()`
  never throws and never returns an empty array.
- `src/lib/booking-data.ts` `ROOMS` is the fallback catalogue **and** the
  Google Form value map. The `formValue` strings
  (`"Meeting Room A / 會議室 A / 会议室 A"`) must match the Google Form
  character-for-character or the fallback silently drops the room. Do not
  "tidy" them.
- `ROOMS` therefore cannot be deleted even though the database is now the
  source of truth for display.

### 2.5 The booking engine enforces rules in Postgres, not JavaScript

`supabase/schema.sql` holds constraints you cannot bypass from the client, and
should not try to duplicate loosely in the UI:

- Start 09:00–17:00, end 10:00–18:00, 30-minute steps, `end > start`
- `during` is a `[)` range, so back-to-back bookings are legal
- `EXCLUDE USING gist` prevents double booking of exclusive rooms at the
  storage layer; the loser gets SQLSTATE `23P01`
- The hot desk is non-exclusive: advisory lock plus a seat sum over
  `pending|confirmed`
- 7-working-day lead time applies **only** to `source='website'`, so staff can
  override
- Price is computed by trigger from `rooms.rate`: `day` → flat, otherwise
  `ceil(hours) * rate`

If you change a rate anywhere other than `public.rooms`, the advertised price
and the charged price will disagree.

---

## 3. Layout

```
src/
  app/            Next shell only: layout, globals.css, page.tsx, /partnership, /api
  components/
    pages/        One file per hash route. The real application code.
    sections/     navbar, footer, cookie-consent, whatsapp-float, back-to-top
    blocks/       Reusable chunks: page-hero, room-rates, cta-band, section-heading
    ui/           shadcn/ui primitives — generated, don't hand-edit
  lib/
    booking-data.ts     ROOMS fallback + Google Form config + time/price helpers
    hong-kong-rooms.ts  DB-backed room catalogue (merge, fetch, hook, save)
    global-office.ts    Partner-office CRUD
    supabase.ts         Client, bookings, enquiries, deletes
    router.tsx          Hash router
    site-data.ts        Company facts: address, phone, licence number
    i18n/               Translations + language context
  hooks/          use-staff (is a staff member signed in), use-mobile, use-toast
  middleware.ts   Bare-path → hash redirect

supabase/         One .sql file per feature. All idempotent, all run by hand
                  in the Supabase SQL editor. See supabase/README.md.
docs/             Per-file prose docs mirroring src/. docs/pre-merge-audit.md
                  and docs/global-office-sfo-platform-architecture.md are the
                  useful ones.
examples/, mini-services/, download/   Not part of the site.
```

---

## 4. Database conventions

- **Migrations are hand-run.** There is no migration runner. Every file in
  `supabase/` is pasted into the Supabase SQL editor by the owner. Write
  accordingly: `create ... if not exists`, `add column if not exists`,
  `drop policy if exists` before `create policy`, and seed with
  `on conflict do update` or a `where col = ''` guard so a re-run never
  clobbers edited data.
- **Tell the owner when a file needs running.** Code that depends on a new
  column must degrade gracefully until then. `saveHongKongRoom()` shows the
  pattern: try the full payload, detect a missing-column error, retry with
  core columns only.
- **RLS is not the whole story.** A policy decides *which rows*; the role also
  needs a table-level `GRANT`. `schema.sql` granted only `select` on `rooms`,
  so staff edits failed with "permission denied" until
  `hong-kong-rooms-admin.sql` added `grant select, update`.
- **Re-running `deletes.sql` clobbers `restore_deleted`'s `global_booking`
  branch.** Re-apply `delete-global-booking.sql` afterwards.
- `delete-sfo-enquiry.sql` deletes partnership applications only. It will
  never delete a booking. Don't reach for it when a `GO-` row is stuck — use
  `select * from public.delete_global_booking('<ref>', '<reason>');`, because
  `global_booking_requests.listing_id` is `on delete restrict`.

---

## 5. Known noise — do not "fix" these

- `examples/websocket/*.ts(x)` throws `TS2307` for `socket.io` /
  `socket.io-client`. Pre-existing, unrelated to the site. Filter it out of
  `tsc` output.
- Two `react-hooks/set-state-in-effect` eslint errors exist on `main`:
  `admin.tsx` (`loadGlobalOffices` effect) and `booking.tsx` (~line 239,
  `setGlobalListingId("")`). They predate current work. **Verify your change
  adds no new ones** by stashing and re-running eslint — don't silence the old
  ones as a drive-by.
- `The "middleware" file convention is deprecated` build warning. Known; the
  codemod is a separate decision.
- `next-env.d.ts` and `*.tsbuildinfo` are gitignored. Don't commit them.

---

## 6. House style

The codebase has an unusual and deliberate documentation style: **long
explanatory header comments** that say what a file is, what it is *not*, why it
exists, and how it fits the whole. Comments explain *why*, in plain English,
for a reader who is not a specialist. SQL files carry the same treatment,
including a "check it worked" section at the bottom.

Match it. A terse patch in this repo looks wrong.

Other conventions:

- Commit messages: a short imperative subject, then prose explaining the
  problem and the reasoning. Not bullet-point changelogs of the diff.
- User-facing text is plain and non-technical. The admin dashboard is used by
  non-engineers: "Show on the website and accept bookings", not
  "is_active toggle".
- Currency is HKD via `formatHKD`. Don't hand-format money.
- Prefer editing an existing file over adding one.

---

## 7. Before you say you're done

1. `./node_modules/.bin/tsc --noEmit` — clean, ignoring `examples/websocket`.
2. `npm run build` — passes.
3. `npx eslint <changed files>` — no *new* errors (see §5).
4. Load the page. If you changed anything data-driven, confirm it still
   renders **with Supabase unconfigured**, which is the sandbox default.
5. If you added or changed SQL, say explicitly which file the owner must run
   and what breaks until they do.
6. Trilingual check: did any English-only string sneak in?

---

## 8. Current open items

- The partnership page is English-only (no `sfo` keys in `src/lib/i18n/*`).
- `partnership.tsx` hardcodes `SAMPLE_GLOBAL_OFFICES`, mixing a Hong Kong room
  with a Singapore SFO listing and **no type discriminator** — the root of the
  two-systems confusion described in §2.2. Separating the SFO pipeline from
  the business-centre listings is scoped but not started.
- `convert_sfo_enquiry_to_listing` inserts `rate = 0`; proposed for retirement.
- Placeholder company data (licence number, stats, some photos) is still in
  `src/lib/site-data.ts` and flagged in the `README.md` pre-launch table.
