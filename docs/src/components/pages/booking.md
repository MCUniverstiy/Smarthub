# File: booking.tsx

## What This File Does

`booking.tsx` is the **Room Booking page**. It exports a `BookingPage` component that turns the team's existing Google Form ("Application for SmartHub Room Booking") into a branded, trilingual, validated booking experience on our own site — while still recording every request in that same Google Form, so the response sheet and email alerts the office relies on keep working exactly as before.

## Where It Lives in the Project

- **Path:** `src/components/pages/booking.tsx`
- **Route:** `book` → URL `#/book`
- **Deep link:** `#/book?room=<roomId>` preselects a room (e.g. `#/book?room=event-space`)
- Imported by `src/app/page.tsx`; rendered by `RouterOutlet` when `route === "book"`.

## What It Produces

The visitor sees, top to bottom:

1. **PageHero** — medium-height banner with eyebrow, H1 and lead.
2. **How booking works** — three numbered cards setting expectations (lead time, confirmation, invoicing).
3. **Room catalogue** — six selectable photo cards showing emoji, name, blurb, capacity and rate. Clicking one selects it, writes `?room=<id>` into the URL, and scrolls down to the form.
4. **Booking form + live summary** — a two-column layout. Left: the form (contact details → date/time → room, headcount, payment). Right: a sticky summary card with a running price estimate plus the policy notice.
5. **FAQ** — six question/answer pairs in a Radix accordion.
6. **Google Forms escape hatch** — a card linking to the original form for anyone who prefers it.

On successful submission the whole page is replaced by a **confirmation screen** repeating the booked details.

## Key Concepts

- **Database first, then the Google Form** — when Supabase is configured (see `src/lib/supabase.ts`), submit calls `createBooking()` before anything else. The database is the only party that knows what everyone else has booked, so it decides. If it refuses — typically because the slot was taken while the visitor was filling in the form — the error is shown against the relevant field and **nothing is written to the Google Form**, so the sheet never collects a booking the office cannot honour. If it accepts, or if Supabase is unconfigured or unreachable, the Google Form POST proceeds as before. A booking recorded in the database counts as success even if the Google POST is blocked.
- **Live availability** — with a database configured, choosing a room and a date loads `getBusySlots()` and greys out the times that are already taken, listing the booked spans above the pickers. For the hot desk (sold per seat, not exclusively) it shows seats remaining instead. `busyFor` stores the results alongside the room+date key they were fetched for, so a slow response for a previously-selected room is ignored during render rather than needing an effect to clear it — this also keeps `loadingBusy` derived rather than stored, satisfying `react-hooks/set-state-in-effect`.
- **Booking reference** — only the database issues one (`SH-2608-4KQ9TW`). The success screen shows the row when present.
- **Google Form bridge** — the form does not POST to our own backend. `submitToGoogleForm()` (in `src/lib/booking-data.ts`) POSTs `entry.<id>=<value>` pairs to the Google Form's `/formResponse` endpoint, which records a response identical to one submitted on docs.google.com. Google sends no CORS headers, so the request uses `mode: "no-cors"` and returns an opaque response — we treat "the request left the browser without throwing" as success.
- **Prefill fallback** — if that POST throws (offline, corporate proxy, blocked network), `status` becomes `"fallback"` and we show `buildPrefillUrl(payload)`: a normal Google Form link with every answer already filled in. The visitor finishes in one click and never retypes anything.
- **Single source of truth for rooms** — room names, capacities, rates, photos and the exact Google Form option strings all live in `src/lib/booking-data.ts`. The booking page, the `<RoomRates />` block (used on Pricing and Services) and the homepage booking band all read from it, so prices can't drift between pages.
- **Client-side rule enforcement** — `validate()` encodes the rules printed on the Google Form so bad requests never reach the team: ≥ 7 working days' notice (weekends skipped by `addWorkingDays`), weekdays only, start 9:00–17:00, end 10:00–18:00, end after start, and attendees within the selected room's capacity.
- **`fill()` templating** — translated strings use named placeholders (`"Up to {n} people"`, `"{room} holds up to {n} people."`) rather than string concatenation, because word order differs between English and Chinese.
- **Lazy state initialiser for deep links** — the `?room=` query is read inside `useState(() => ...)` rather than in a `useEffect`. This avoids a second render pass and satisfies the `react-hooks/set-state-in-effect` lint rule.
- **`window.history.replaceState` on room click** — updates the URL without pushing a history entry and without firing `hashchange` (which would reset the scroll position mid-click).
- **Disabled end-time slots** — once a start time is chosen, every end-time option at or before it is `disabled`, so an invalid window can't be selected in the first place.

## Section-by-Section Breakdown

### Imports & state
Reads `{ t, lang }` from `useLang()`, with `b = t.booking` as the shortcut to this page's copy. State: `form` (all field values), `errors` (field → translated message), `status` (`idle` | `sending` | `success` | `fallback`), `submitted` (frozen copy for the confirmation screen), `prefillUrl`.

### `minDate` / `startOptions` / `endOptions`
All `useMemo`'d so the date input's `min` attribute and the two time dropdowns stay stable while the visitor types.

### `chooseRoom(id)`
Called by the catalogue cards: selects the room, rewrites the URL, scrolls to the form.

### `validate()`
Returns a `{ field: message }` object. Empty means valid. Every message comes from `b.errors` so it is translated.

### `onSubmit(event)`
Validate → build the `BookingSubmission` → remember the prefill URL → POST → show the success screen (and reset the form) or the fallback banner (keeping the answers).

### Success screen
An early `return` before the main page JSX. Shows a green confirmation card, a read-only recap table, and two CTAs (book again / WhatsApp).

### Helper components
- `Field` — label + required asterisk + control + hint/error row.
- `ErrorText` — the small red validation line.
- `SummaryRow` — one label/value row in the summary and confirmation tables.

## Gotchas

- **Never edit `formValue` strings casually.** The option text in `ROOMS[].formValue` and `PAYMENT_METHODS[].formValue` must match the Google Form's choices character for character (including the spaces around the slashes and the Traditional/Simplified variants). If they don't, Google silently discards that answer and the response row arrives with a blank room or payment method.
- **The POST is fire-and-forget.** Because of `no-cors` we cannot read Google's status code. A `true` return means "the browser sent it", not "Google accepted it". This is why the confirmation copy says the team will confirm by email rather than claiming the room is reserved.
- **If the form is ever recreated**, update `GOOGLE_FORM.id` (or set `NEXT_PUBLIC_BOOKING_FORM_ID`) *and* every `entry.<id>` in `booking-data.ts`. Get the new ids from the form's "Get pre-filled link" option.
- **Public holidays aren't modelled.** `addWorkingDays()` only skips Saturdays and Sundays. HK public holidays change yearly, and the team confirms availability manually anyway.
