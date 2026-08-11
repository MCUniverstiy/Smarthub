# Supabase backend for room booking

This folder holds the database behind the booking form.

| File | What it is |
| --- | --- |
| `schema.sql` | The whole backend in one script. Paste it into the Supabase SQL editor and run it. |
| `tests/schema.test.mjs` | 54 assertions run against a real PostgreSQL 18. |
| `tests/race.test.mjs` | Proves two simultaneous bookings for one slot cannot both succeed. |
| `google-sheet-formatter.gs` | Apps Script that makes the existing Google Sheet readable. Optional — see below. |

---

## Why a database instead of the Google Form

The Google Form records answers. It does not *understand* them, and it has no
idea what is already in the sheet. So it will happily accept:

- two people booking **Meeting Room B at 10:00 on the same day**
- a booking for **tomorrow** when the rule is 7 working days' notice
- **20 people** in the Director Room, which holds 5
- a start time of **03:00**

Every one of those is now rejected by the database itself — not by JavaScript
that can be bypassed, and not by a human noticing it later in a spreadsheet.

The double-booking guarantee is the important one. It is an `EXCLUDE USING gist`
constraint, which means Postgres refuses the second overlapping row at the
storage layer. Two requests arriving in the same millisecond from two different
servers still cannot both win. `tests/race.test.mjs` demonstrates exactly that:
both callers check availability, both are told "free", both insert — and one
gets `23P01`.

---

## Running it

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Paste all of `schema.sql`, press **Run**. It takes a second or two.
3. New query again, paste all of [`enquiries.sql`](enquiries.sql), press
   **Run**. That is the contact form. It must go second, because it reuses
   the `staff` table and `is_staff()` function that `schema.sql` creates.
4. Make yourself staff so you can see the bookings. Create the login first
   under **Authentication → Users → Add user**, then run this. Full
   walkthrough in [`docs/staff-login.md`](../docs/staff-login.md).

   ```sql
   insert into public.staff (user_id, email)
   select id, email from auth.users where email = 'you@smarthubc.com'
   on conflict (user_id) do nothing
   returning user_id, email;
   ```

   **Check the result says `1 row`.** If it says `Success. No rows returned`,
   the email did not match any account — nothing was added and no error was
   raised. See the troubleshooting table in `docs/staff-login.md`.

5. Check it worked:

   ```sql
   select * from public.rooms order by sort_order;
   select public.earliest_booking_date();
   select count(*) from public.enquiries;   -- 0, but no error = table exists
   ```

Both scripts are **idempotent** — running them again is safe and will not
delete bookings or enquiries. Editing a rate in section 3 and re-running is the intended way to
change prices.

---

## What the website needs

Add these to `.env.local` and to Vercel's environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Both are in Supabase under **Project Settings → API Keys**. Step-by-step, with
screenshots of which key is which: [`docs/supabase-keys.md`](../docs/supabase-keys.md).

Older projects have an `anon` key (a long `eyJ...` JWT) instead of a
publishable key. Either works — set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in that
case. Supabase is removing the legacy `anon` key at the end of 2026.

This key is public — it ships inside the JavaScript bundle. That is fine and
expected, *because* of the row-level security in section 8: with that key you
can create a pending booking and read the room list, and nothing else. You
cannot list bookings, read a customer's email, or confirm your own booking.

There is a third key — **secret** (`sb_secret_...`), or **service_role** on
older projects — which bypasses all security. It is hidden until you click
"Reveal", which is a good rule of thumb: if you had to reveal it, it does not
belong in this website. Never put it in a `NEXT_PUBLIC_` variable. This site
does not need it at all.

---

## How the app talks to it

One call creates a booking. It returns the reference and the price:

```ts
const { data, error } = await supabase.rpc("request_booking", {
  p_full_name: form.fullName,
  p_email:     form.email,
  p_phone:     form.phone,
  p_company:   form.company,
  p_br_number: form.brNumber,
  p_room_id:   form.roomId,
  p_date:      form.date,       // 'YYYY-MM-DD'
  p_start:     form.startTime,  // 'HH:MM'
  p_end:       form.endTime,
  p_attendees: form.attendees,
  p_payment:   form.payment,    // 'bank-transfer' | 'fps'
});
// data[0] -> { reference: 'SH-2608-4KQ9TW', total: 1600.00, hours: 2.00 }
```

To grey out times that are already taken:

```ts
const { data: busy } = await supabase.rpc("room_busy_slots", {
  p_room: roomId, p_date: date,
});
// [{ starts: '10:00:00', ends: '12:00:00', seats: 4 }]
```

`room_busy_slots` deliberately returns only times and seat counts — no names,
no emails — so it is safe to call from the browser.

### Turning an error into a message

| What came back | What to tell the person |
| --- | --- |
| `error.code === '23P01'` | That slot has just been taken — please pick another time. |
| `hint = 'bookings_capacity'` | That room is too small for this many people. |
| `hint = 'bookings_lead_time'` | Bookings need 7 working days' notice. |
| `hint = 'bookings_seats_sold_out'` | The hot desk is full for that day. |
| `hint = 'bookings_rate_limit'` | You have several requests pending already. |
| `hint = 'bookings_time_order'` | The end time must be after the start time. |
| constraint `bookings_start_window` | Start times run from 9:00 to 17:00. |
| constraint `bookings_end_window` | End times run from 10:00 to 18:00. |

---

## Keeping it in sync with the site

`schema.sql` section 3 mirrors `ROOMS` in `src/lib/booking-data.ts`, and
`add_working_days()` mirrors `addWorkingDays()`. The test suite asserts both
match, so if someone changes a rate in one place the tests fail.

```bash
npm install --no-save @electric-sql/pglite
node supabase/tests/schema.test.mjs
node supabase/tests/race.test.mjs
```

These run a genuine PostgreSQL 18 compiled to WebAssembly — no server, no
Docker, no connection to your live project. Safe to run anywhere.

---

## The booking page sends to both

`src/components/pages/booking.tsx` now does this on submit:

1. **Database first.** It knows what everyone else has booked, so it decides.
   If it refuses — the slot went while the visitor was typing — the form says
   so and *nothing is written to the Google Form*. Otherwise the sheet would
   collect a booking you can never honour.
2. **Then the Google Form.** Every accepted booking still lands in the sheet,
   so your existing notifications and workflow carry on untouched.

If Supabase is not configured, step 1 is skipped entirely and the page behaves
exactly as it did before. The same is true if the database is unreachable: a
booking in the sheet beats a lost enquiry. So you can deploy this now and turn
the database on later by adding the two env vars.

Two things the database makes possible that the form could not:

- **Taken times are greyed out** in the time pickers, with the already-booked
  spans listed above them. For the hot desk it shows seats remaining instead,
  because that space is sold per seat.
- **Every booking gets a reference** like `SH-2608-4KQ9TW`, shown on the
  confirmation screen and stored in the database.

---

## The staff inbox (`#/admin`)

Once the SQL is run and you have added yourself to `public.staff`, the office
can work from the site instead of the spreadsheet. Go to **`/#/admin`** and sign
in with the Supabase Auth account you added.

Bookings are grouped by date and colour-coded by status, with one-click
**Confirm**, **Decline** and **Cancel**. Declining or cancelling releases the
slot immediately — the exclusion constraint only counts pending and confirmed
bookings, so that time becomes bookable again straight away.

Once signed in, a **Booking inbox** link appears in the site footer so nobody
has to remember the URL. It renders only for signed-in staff and vanishes on
sign out, so the public never sees it — before your first sign-in you type
`/#/admin` yourself.

That hiding is convenience, not security. What actually protects the data is
row level security: a stranger who guesses the URL, signs up and signs in still
gets an **empty list**, because every policy on `bookings` calls `is_staff()`.
Forcing the footer link to appear in devtools achieves nothing for the same
reason.

To create a staff login: Supabase → Authentication → Users → Add user, then run
the `insert into public.staff` snippet above with that email.

---

## The contact form goes to the database too

`enquiries.sql` adds the same treatment for the contact page. The table is
much simpler than `bookings` because an enquiry reserves nothing — there is
no clash checking, no capacity, no lead time. It is a message with a status.

The security model is identical, and it is the part that matters: the public
may `INSERT` and nothing else. Without that, anyone holding the publishable
key could download every message you have ever received, complete with the
sender's email address and phone number.

**Formspree keeps running.** It is what actually emails the office, and
nothing in this replaces that. What the table adds is a record you can search
and filter — an email inbox cannot tell you how many enquiries came in last
month, which service people ask about most, or whether anyone replied.

| Piece | What it is |
| --- | --- |
| `public.enquiries` | The table. Reference numbers look like `EN-2608-4F2B91`. |
| `submit_enquiry(...)` | The RPC the website calls. Returns the reference. |
| `public.enquiries_inbox` | Staff-only view, newest first. Powers the Enquiries tab in `#/admin`. |
| Statuses | `new` → `in-progress` → `replied` → `closed`, plus `spam`. |

Spam is a status rather than a delete, so the pattern stays visible.

The form also records which language the visitor was reading the site in, so
the team knows whether to reply in English, 繁體 or 简体. That shows as a
small badge on the enquiry card.

Rate limit: 5 unanswered enquiries per email address per 24 hours. Answering
one clears the count, since only `new` enquiries are counted.

### Getting told when one arrives

Storing an enquiry is not the same as noticing it. Bookings are covered — the
booking page still posts to the Google Form, so that email still lands. The
contact form has no such alert, so **somebody has to open `#/admin`**.

If that is not good enough, run [`notify-email.sql`](notify-email.sql). It
sends the alert from the database itself using `pg_net`, which means:

- No form service in the middle, and no 50-a-month ceiling. Resend's free
  tier is 3,000 emails/month.
- The API key lives in Supabase Vault, encrypted, not in the file.
- The request is asynchronous and wrapped in an exception handler, so a
  dead email provider cannot slow down or roll back the enquiry itself.
- `reply_to` is set to the visitor, so the team just hits reply.

It is entirely optional and safe to skip — without the Vault secrets the
trigger returns early and does nothing.

---

## Making the Google Sheet readable

`google-sheet-formatter.gs` is an Apps Script that formats the response sheet:
colour-coded rooms, a Status dropdown (New / Confirmed / Awaiting payment /
Declined / Cancelled) with colour coding, frozen header, sane column widths,
a Summary tab, and **clashing bookings painted red**.

Install:

1. Open the response spreadsheet → **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with this file, save.
3. Choose the `beautify` function in the toolbar and press **Run**. Approve the
   permission prompt.
4. Reload the sheet — there is now a **SmartHub** menu.

To have it run on every submission: Triggers (clock icon) → Add Trigger →
function `onFormSubmit`, source "From spreadsheet", type "On form submit".

It only adds formatting plus two columns at the far right (Status, Internal
notes) that the form will never overwrite. Your data is not touched.

The clash highlighting uses the same `[)` rule as the database, so back-to-back
bookings are not flagged. But note what it is: the sheet finding out about a
double booking *after* it happened. Only the database can stop one.

---

## Two things worth deciding

**The hot desk is sold by the seat.** All the meeting rooms are exclusive: one
booking holds the whole room. The hot desk has 30 seats, so the schema lets
bookings overlap until the seats run out. If you would rather rent the hot desk
area as a single exclusive space, set `is_exclusive = true` for it in section 3.

**Bookings arrive as `pending`.** Nothing is confirmed automatically, matching
the form's "subject to availability and confirmation" wording. A pending
booking still holds the slot, so nobody else can take it while you decide.
Declining or cancelling releases it immediately.
