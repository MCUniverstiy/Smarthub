# File: booking-data.ts

## What This File Does

`booking-data.ts` is the **single source of truth for room booking**. It holds the room catalogue (capacity, rate, photo), the booking rules (lead time, opening hours), the date/time and price helpers, and the plumbing that connects our on-site booking form to the team's existing Google Form.

## Where It Lives in the Project

```
src/lib/booking-data.ts
```

Read by:
- `src/components/pages/booking.tsx` — the booking page (`#/book`)
- `src/components/blocks/room-rates.tsx` — the rate table on Pricing + Services
- `src/components/pages/home.tsx` — the homepage booking band's quick-pick tiles

## What It Produces

| Export | What it is |
|---|---|
| `GOOGLE_FORM` | Form id + the `entry.<id>` number for every question |
| `googleFormViewUrl` / `googleFormEmbedUrl` | Public links to the form |
| `BOOKING_RULES` | Lead time, earliest/latest start and end hours, minute steps |
| `ROOMS` | The six bookable spaces (`Room[]`) |
| `getRoom(id)` | Look up a room, `undefined` if unknown |
| `PAYMENT_METHODS` | Bank transfer + FPS, with their exact Google Form text |
| `addWorkingDays`, `earliestBookingDate`, `isWeekend`, `parseISODate`, `toISODate` | Date maths |
| `timeOptions`, `minutesOf`, `formatTime12` | Time-slot helpers |
| `estimateCost`, `formatHKD` | Price maths and currency formatting |
| `buildFormParams`, `buildPrefillUrl`, `submitToGoogleForm` | The Google Form bridge |

## Key Concepts

- **Why bridge to a Google Form instead of replacing it?** The office already runs on the form's response sheet and email notifications. Posting into the same form means the website gets a proper branded booking experience while the back-office workflow is untouched — nobody has to learn a new tool or migrate old responses.
- **Entry IDs** — every Google Form question has a numeric id. Posting `entry.<id>=<value>` to `/formResponse` records a response exactly as if the user clicked Submit on Google. Date questions expand into `_year` / `_month` / `_day`; time questions into `_hour` / `_minute`.
- **Where the IDs came from** — the live form's HTML contains a `FB_PUBLIC_LOAD_DATA_` blob listing every question and its id. The same values are visible via the form's "Get pre-filled link" feature.
- **`no-cors` submission** — Google serves no CORS headers, so `submitToGoogleForm()` uses `mode: "no-cors"`. The POST happens, but the browser hands back an opaque response with no status code. A resolved promise therefore means "the request left the browser", not "Google accepted it".
- **Prefill as a safety net** — `buildPrefillUrl()` returns a normal Google Form URL with `?entry.x=value&…&usp=pp_url`. The booking page shows it if the silent POST throws, so a blocked network never costs the visitor their answers.
- **Environment override** — `NEXT_PUBLIC_BOOKING_FORM_ID` can replace the baked-in form id at deploy time without a code change (useful if the form is recreated). The `entry.<id>` numbers still have to be updated in this file.
- **Billing model** — hourly rooms are billed per *started* hour (`Math.ceil(hours) * rate`), so 10:00–12:30 is charged as 3 hours. The Hot Desk has `unit: "day"`, so any same-day window costs exactly one day rate.
- **Working-day maths** — `addWorkingDays()` skips Saturdays and Sundays only. Hong Kong public holidays are deliberately not modelled: they change every year, and the team confirms real availability by hand.

## The Room Catalogue

| Room | Capacity | Rate |
|---|---|---|
| 🏢 Meeting Room A | 10 | HK$500/hour |
| 💻 Hot Desk | 30 | HK$350/day |
| 🏢 Meeting Room B | 10 | HK$800/hour |
| 🎤 Event Space | 30 | HK$1,000/hour |
| 🏢 Meeting Room C | 6 | HK$300/hour |
| 👔 Director Room | 5 | HK$300/hour |

These match the "Room Information" block printed on the Google Form. Change them here and every page updates.

## Gotchas

- **`formValue` strings are load-bearing.** `ROOMS[].formValue` and `PAYMENT_METHODS[].formValue` must match the Google Form's multiple-choice options character for character — including the spaces around the slashes and both Chinese script variants (`"Meeting Room A / 會議室 A / 会议室 A"`). A single mismatched character makes Google drop that answer, and the response row arrives with a blank room.
- **Editing rates here does not edit the Google Form.** The form's "Room Information" description block is plain text maintained inside Google. If prices change, update both.
- **If the form is recreated**, every `entry.<id>` changes. Update `GOOGLE_FORM.entry` from the new form's pre-filled link.
- **`RoomId` values appear in URLs** (`#/book?room=meeting-a`) — renaming one breaks any link already shared. Add new ids rather than renaming old ones.
