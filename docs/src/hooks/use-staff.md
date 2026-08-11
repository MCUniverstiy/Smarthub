# `src/hooks/use-staff.ts`

## What This File Does

Answers one question for the UI: **is a member of the team signed in right
now?** Used to show staff-only shortcuts — currently the "Booking inbox" link
in the footer — without showing them to the public.

## Where It Lives

`src/hooks/use-staff.ts`. Used by `src/components/sections/footer.tsx`.

## What It Produces

`useIsStaff(): boolean` — `false` for the public, `true` for a signed-in user
who has a row in `public.staff`.

## Key Concepts

### This is not security

It decides what to **render**, nothing more. Anyone can flip the returned value
in their browser's devtools and make the link appear — and it gains them
nothing, because `#/admin` loads its data through row level security. A
non-staff visitor who forces the link to appear and clicks it gets an empty
page, because every policy on `bookings` calls `is_staff()` in the database.

The server is the boundary. This hook is cosmetics.

### Why hide the link at all, then?

A permanent public link would advertise the admin door to every visitor and
every search-engine crawler for no benefit to them. Showing it only to people
who are already signed in gives the office the convenience without the
advertisement.

### Free when unconfigured

If Supabase is not set up the hook returns `false` immediately and never
touches the network, so sites running on the Google Form alone are unaffected.
It also skips the `is_staff()` round trip entirely when there is no session,
which is the common case for public visitors.

### Reacts to sign-in and sign-out

It subscribes to `onAuthStateChange`, so the footer link appears the moment
sign-in succeeds and disappears on sign out — no page refresh needed.

## Section-by-Section Breakdown

1. **`check()`** — reads the session; if there is none, sets `false` without
   calling the database. Otherwise defers to `isStaff()`.
2. **The effect** — defers the first check to a microtask so no state update
   happens synchronously in the effect body
   (`react-hooks/set-state-in-effect`), subscribes to auth changes, and cleans
   up both the timer and the subscription on unmount. A `cancelled` flag stops
   a slow reply updating an unmounted footer.
