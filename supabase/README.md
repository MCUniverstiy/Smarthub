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
3. Make yourself staff so you can see the bookings (sign up in the app first,
   or invite yourself under Authentication → Users):

   ```sql
   insert into public.staff (user_id, email)
   select id, email from auth.users where email = 'you@smarthubc.com';
   ```

4. Check it worked:

   ```sql
   select * from public.rooms order by sort_order;
   select public.earliest_booking_date();
   ```

The script is **idempotent** — running it again is safe and will not delete
bookings. Editing a rate in section 3 and re-running is the intended way to
change prices.

---

## What the website needs

Add these to `.env.local` and to Vercel's environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon / public key>
```

Both are in Supabase under **Project Settings → API**.

The anon key is public — it ships inside the JavaScript bundle. That is fine
and expected, *because* of the row-level security in section 8: with that key
you can create a pending booking and read the room list, and nothing else. You
cannot list bookings, read a customer's email, or confirm your own booking.

There is a third key, the **service role** key, which bypasses all security.
Never put it in a `NEXT_PUBLIC_` variable. It is only for server-side code.

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
