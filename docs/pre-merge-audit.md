# Pre-merge audit

Audit of PR #1 before merging. Dated 11 August 2026.

**Verdict: nothing blocks the merge.** The code is safe to ship. What follows
is split into things that need a human decision, things to do before real
customers use it, and things that are fine.

---

## 🔴 Blockers — must be resolved by a person, not by code

### 1. The placeholder company data is still fabricated

This is the biggest risk in the whole PR, and it predates the booking work.
`src/lib/site-data.ts` and the pricing pages contain **made-up numbers**:

| What | Current value | Risk |
| --- | --- | --- |
| TCSP licence number | `TC010264` | **Publishing a false licence number is a regulatory problem in Hong Kong.** Verify on [cr.gov.hk](https://www.cr.gov.hk) |
| Phone | `+852 2383 3283` | Goes on every page and in the legal pages |
| Address | `25/F, 88 Lockhart Road, Wan Chai` | Same |
| Stats | `25+`, `1,200+`, `98%` | Invented. "98% success rate" is an advertising claim |
| Pricing tiers | Made-up HK market rates | Customers may hold you to them |

None of this is caused by this PR, but merging publishes it. See the
"BEFORE LAUNCH" table in `README.md`.

### 2. Two phone numbers and two emails are in play

The site uses `+852 2383 3283` and `info@smarthubc.com`. The Google Form
advertises `+852 5501 3516` and `communication@smarthubc.com`. Both appear on
the live site depending on which page you land on. Decide which is canonical.

---

## 🟡 Do before real customers use the booking form

### 3. Nothing tells the office a booking arrived — except the Google Form

There is no email trigger, webhook or notification in the database. Confirmed:
the only triggers on `bookings` are `bookings_prepare_trg`,
`bookings_touch_trg` and `bookings_rate_limit_trg`.

Right now this is fine, **because every accepted booking is still mirrored into
the Google Form**, which sends the alert the office already relies on. But that
means:

> **Do not turn off the Google Form mirroring until you have replaced the
> notification.** If you remove it, bookings will land silently in the database
> and nobody will know until someone opens `#/admin`.

Options when you are ready: a Supabase Database Webhook → email service, or a
scheduled Edge Function that digests the day's new bookings.

### 4. Bookings made by phone or on the old form are invisible to the database

The database can only prevent clashes it knows about. A booking taken over the
phone, or submitted directly on the Google Form by someone with the old link,
does not exist in Postgres — so the website would happily sell that slot again.

**Workaround, tested and working:** staff can block a slot manually by
inserting with `source='phone'` (which also bypasses the 7-working-day rule).
Once that row exists, the website is correctly refused with `23P01`.

The clean fix is to stop sharing the raw Google Form link and let the website
be the only front door.

### 5. Backups

Supabase's free tier keeps limited backups. Bookings are customer commitments;
losing them is worse than losing marketing copy. Check
**Database → Backups** and consider a paid tier or a scheduled `pg_dump`.

### 6. Turn off public signups

Anyone can currently create an account on your Supabase project. They see no
bookings — RLS stops that, verified below — but there is no reason to allow it.

**Project Settings → Authentication → "Allow new users to sign up" → off.**

---

## 🟢 Verified safe — audited, not assumed

All of the following were executed against real PostgreSQL 18 (PGlite), not
reasoned about.

### Security

| Probe (as the public `anon` key) | Result |
| --- | --- |
| `select * from bookings` | **denied** (42501) |
| `select * from bookings_inbox` | **denied** |
| `select * from staff` | **denied** |
| `count(*) from bookings` | **denied** |
| `update bookings set status='confirmed'` | **denied** |
| `delete from bookings` | **denied** |
| `insert into staff` (self-promotion) | **denied** |
| `insert into rooms` | **denied** |
| `room_busy_slots()` | times only — no name, email or phone |

A **signed-in but non-staff** user gets **0 rows** from `bookings` and
`bookings_inbox`, and their update affects 0 rows. No error, no data.

The booking RPC works correctly for anonymous visitors — confirmed separately
after a false alarm during the audit (a poisoned session state in the test
script, not a real fault).

### Data integrity

Rejected as expected: negative attendees, zero attendees, empty name, a booking
dated in the past, and a 200-character name.

### Correctness

- **No off-by-one on the lead time.** The date the site advertises as earliest
  (`earliest_booking_date()`) is genuinely bookable.
- **No reference collisions** in 2,000 generated references.
- **Cancelling frees the slot** and the replacement gets a distinct reference.
- **Timezone handling works** — `today_hk()` computes Hong Kong's date
  regardless of the server running in UTC.

### Repository hygiene

- No secrets in any commit; `.env.local` is gitignored.
- No `service_role` / secret key reference anywhere in `src/`.
- `tsc` clean, `next build` passes, 70 schema assertions + the concurrency test
  pass.
- `eslint` reports 2 errors, both **pre-existing** in shadcn scaffold files
  (`carousel.tsx`, `use-mobile.ts`) and untouched by this PR.

---

## ⚙️ Housekeeping

- **Run `bun install`.** `@supabase/supabase-js` was added with npm because bun
  is not available in the dev sandbox, and the generated `package-lock.json`
  was deleted to avoid fighting `bun.lock`. The lockfile needs updating.
- **Prisma is now dead weight.** `prisma/schema.prisma` still says
  `provider = "sqlite"` with scaffold `User`/`Post` models, and `src/lib/db.ts`
  is an unused client. Harmless, but it will confuse the next developer.
  Consider removing both, plus the `db:*` scripts and the `postinstall`.
- **Room photos are Unsplash stock.** Fine for launch, worth replacing.

---

## Decisions worth revisiting

- **The hot desk is sold by the seat** (30 seats, overlapping bookings allowed
  until full) rather than as one exclusive space. One word to flip in section 3
  of `supabase/schema.sql` if that is wrong.
- **Bookings arrive `pending`** and hold the slot while you decide, matching the
  form's "subject to availability and confirmation" wording.
- **The rate limit is 5 pending requests per email per 24 hours.** Generous for
  a real customer, tight enough to stop a script.
