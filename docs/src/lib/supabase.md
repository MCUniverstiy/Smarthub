# `src/lib/supabase.ts`

## What This File Does

Connects the website to the booking database. It wraps the three functions
defined in `supabase/schema.sql` so the rest of the app never has to know
anything about Postgres error codes.

The point of having a database at all: the Google Form records answers but
cannot see what is already in the sheet, so it will happily accept two bookings
for the same room at the same time. The database refuses the second one — not
in JavaScript, which anyone can bypass, but with a constraint enforced at the
storage layer.

## Where It Lives

`src/lib/supabase.ts`. Imported by `src/components/pages/booking.tsx`, and by
nothing else.

## What It Produces

| Export | Purpose |
| --- | --- |
| `isSupabaseConfigured` | `true` when both env vars are set. Everything is gated on this. |
| `supabase` | The client, or `null` when unconfigured. |
| `createBooking(data)` | Records a booking. Returns a reference and price, or a typed error. |
| `getBusySlots(roomId, date)` | Times already taken, for greying out the pickers. |
| `checkAvailability(...)` | Courtesy pre-check before submitting. |
| `BookingErrorCode` | The reasons a booking can be refused. |
| `BusySlot` | `{ starts, ends, seats }`. |
| `isStaff()` | Asks the database whether the signed-in user may see bookings. |
| `fetchBookings()` | The staff inbox, from the `bookings_inbox` view. |
| `updateBookingStatus()` | Confirm / decline / cancel. |
| `signIn()` / `signOut()` | Staff authentication for `#/admin`. |
| `BOOKING_STATUSES`, `BookingStatus`, `InboxBooking` | Types for the admin page. |

## Key Concepts

### Two names for the same key

Supabase renamed the public key in 2025. Older projects have an `anon` key (a
long `eyJ...` JWT); projects created from November 2025 onwards only get a
`sb_publishable_...` key. They are functionally identical — both low-privilege,
both safe in the browser, both gated by RLS.

So the client reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` first and falls back
to `NEXT_PUBLIC_SUPABASE_ANON_KEY`, rather than making the user work out which
era their project belongs to. The legacy key is scheduled for removal at the
end of 2026, hence the ordering.

### It is optional on purpose

If the URL or both key variables are missing,
every function reports "unconfigured" and the booking page silently falls back
to the Google Form. The site never breaks because a database has not been set
up. This means the code can ship before the SQL has been run, and be switched
on later by adding two environment variables.

The check also rejects the placeholder value from `.env.example`, so a
half-finished setup does not count as configured.

### Sessions are persisted

The staff admin page signs people in, and they should not be logged out by a
page refresh — so `persistSession` is on, under the `smarthub-auth` storage
key. Members of the public booking a room never sign in, so they simply have no
session and nothing is stored for them.

### The staff helpers are not a second security layer

`fetchBookings`, `updateBookingStatus` and `isStaff` are ordinary calls made
with the same public anon key. They only return data because the caller has a
valid session belonging to a user listed in `public.staff`; row level security
enforces that server-side. A signed-in non-staff user gets an empty array, not
an error.

### The anon key is public, and that is fine

It ships inside the JavaScript bundle. Row level security (section 8 of
`schema.sql`) is what actually protects the data: with this key you may create
a pending booking and read the room list, and nothing else. You cannot list
bookings, read a customer's email, or confirm your own booking.

### Why an RPC instead of an insert

RLS forbids the public from reading the bookings table, but the browser still
needs the reference number and the price back. `request_booking` is a
`SECURITY DEFINER` function: it inserts the row and returns only those two safe
fields.

### Errors are classified, not parsed

The schema tags its own exceptions with a `hint` (`bookings_lead_time`,
`bookings_capacity`, …) precisely so `classifyError` can map them to a
`BookingErrorCode` without pattern-matching English text. The one exception is
SQLSTATE `23P01`, the exclusion violation, which is the double-booking case.

### Failing soft vs. failing loud

- `getBusySlots` returns `[]` on any error. A missing grey-out is cosmetic —
  the database still prevents the clash at submit time.
- `checkAvailability` returns `true` on any error, so a failed pre-check never
  blocks a booking the database might have accepted.
- `createBooking` returns its error, because that one matters.

## Section-by-Section Breakdown

1. **Client setup** — reads the env vars, exports `isSupabaseConfigured` and a
   client with `persistSession: false` (visitors are anonymous; there is no
   session worth keeping).
2. **Error translation** — `BookingErrorCode`, `BookingResult`, and
   `classifyError`.
3. **`createBooking`** — calls `request_booking`, unwraps the one-row result,
   catches thrown network errors separately from returned database errors.
4. **`getBusySlots`** — calls `room_busy_slots`, trims `HH:MM:SS` to `HH:MM`.
5. **`checkAvailability`** — calls `is_slot_available`.
