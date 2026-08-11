# `src/components/pages/admin.tsx`

## What This File Does

The staff booking inbox at **`#/admin`**. It is the office's replacement for
squinting at the Google Sheet: bookings grouped by date, colour-coded by
status, with one-click Confirm / Decline / Cancel.

## Where It Lives

`src/components/pages/admin.tsx`, exported as `AdminPage` and rendered by
`case "admin"` in `src/app/page.tsx`.

It is **deliberately absent from the navbar, the footer and `sitemap.xml`**.
The only way to reach it is by typing `#/admin`. That is a convenience, not a
security measure — see below.

## What It Produces

A gated page with four states:

| State | When | What is shown |
| --- | --- | --- |
| No database | `NEXT_PUBLIC_SUPABASE_*` unset | How to run `supabase/schema.sql` |
| Checking | On load, while the session is read | A spinner |
| Signed out | No Supabase session | Email + password sign-in |
| Not staff | Signed in, but no `public.staff` row | "This account has no access" |
| Inbox | Signed in and staff | The bookings list |

## Key Concepts

### Hiding the page is not the security

The URL being unlisted means nothing. What actually protects the data is row
level security in the database: every policy on `bookings` calls `is_staff()`,
so a stranger who guesses the URL, signs up and signs in still gets an **empty
list**. The gate in this component only decides what to *render*; the database
decides what to *return*.

### The two-step gate

`evaluate()` runs on mount and on every auth state change:

1. `supabase.auth.getSession()` — signed in at all?
2. `isStaff()` — an RPC, so the *database* answers, not the client.

Only when both pass does it load the inbox. Subscribing to
`onAuthStateChange` means signing in or out updates the page without a reload.

### Two inboxes, one page

The page has a tab switcher: **Bookings** and **Enquiries**. They are separate lists rather than one merged feed because they are different jobs — a booking holds a room at a specific hour and is time-critical, an enquiry is a message that needs a reply. Bookings open first for that reason.

Both are loaded together in one `Promise.all` when the page mounts, so switching tabs never triggers another wait. Each tab carries an amber count of the items needing attention (`pending` bookings, `new` enquiries), so neither queue rots unnoticed while the other is on screen.

Enquiries come from `enquiries_inbox` and move through `new` → `in-progress` → `replied` → `closed`, plus `spam`. Marking something spam sets a status rather than deleting it, so the pattern stays visible. The **Reply** button is a `mailto:` pre-addressed with the reference in the subject line, since the office answers by email anyway.

Each card shows a language badge (繁體 / 简体) when the visitor was not reading the English site, so the reply goes out in the right language.

### Optimistic status updates

Clicking Confirm updates the row on screen immediately, then calls the
database. If the update is refused, the previous list is restored and the error
is shown. The office clicks these constantly, and a round-trip on every click
feels broken.

### Declining releases the slot

The exclusion constraint only counts `pending` and `confirmed` bookings, so
marking a booking declined or cancelled makes that time bookable again
immediately. The confirmation notice says so explicitly, because it is not
obvious from the button label.

### There is no clash warning, by design

There cannot be one. Overlapping bookings are impossible to store, so unlike
the Google Sheet (which needs `highlightClashes` in
`supabase/google-sheet-formatter.gs`) there is nothing to detect.

### English only

Every public page is trilingual. This is an internal tool for the Wan Chai
team, so it is not wired into the i18n dictionaries — that keeps three
translation files from growing for strings no customer will ever read.

## Section-by-Section Breakdown

1. **`STATUS_STYLES` / `STATUS_LABELS`** — the colour and wording per status.
2. **`prettyDate` / `prettyTime`** — display formatting for ISO dates and
   `HH:MM:SS` times.
3. **State** — `gate`, `bookings`, `filter`, plus the sign-in form fields.
4. **`load()`** — fetches the inbox; reused by the Refresh button.
5. **`evaluate()`** — the session + staff check described above.
6. **The effect** — defers `evaluate` to a microtask so no state update happens
   synchronously in the effect body, and unsubscribes on unmount.
7. **`setStatus()`** — the optimistic update with rollback.
8. **`grouped` / `counts`** — memoised grouping by date and per-status tallies
   for the filter chips.
9. **The four gate renders**, then the inbox itself.
10. **`Shell`** — a plain frame with no marketing hero.
