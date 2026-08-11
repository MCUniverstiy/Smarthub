# File: contact.tsx

## What This File Does
`contact.tsx` is the **Contact page**. It exports a `ContactPage` component that renders a two-column layout (contact info on the left, a working contact form on the right) plus a Google Maps embed below. The form posts to a Formspree endpoint (placeholder for now) **and** saves the enquiry to Supabase via `submitEnquiry`, supports four submit states (idle/sending/success/error), includes a hidden honeypot anti-spam field, and can preselect a service in its dropdown via a `?service=...` URL query string (used by the pricing page's deep-link CTAs).

## Where It Lives in the Project
- **Path:** `src/components/pages/contact.tsx`
- **Route:** `contact` → URL `#/contact` (also accepts `#/contact?service=<encoded>` for deep-linking)
- Imported by `src/app/page.tsx`; rendered by `RouterOutlet` when `route === "contact"`.

## What It Produces
The visitor sees, top to bottom:
1. **PageHero** — small-height dark image banner with eyebrow, H1, and lead.
2. **Info + form section** — two columns (info:form = 2:3 on large screens):
   - **Left (info):** an H2 heading, a short paragraph, and 5 contact info rows (address, phone, WhatsApp, email, hours). Each row has a teal icon tile, a small uppercase label, and the value (clickable where appropriate: tel:, https://wa.me/, mailto:).
   - **Right (form):** a card containing the contact form — first name, last name, email, phone, service dropdown, message, honeypot (hidden), submit button, optional error banner, and a privacy notice linking to `/privacy`.
3. **Map section** — a card with a header row (map title + "Open in Google Maps" button) and a 420px-tall Google Maps iframe embed.

## Key Concepts

- **`useLang()`** — returns `{ lang, setLang, t }`. Both `t` and `lang` are used.
- **`pageContent[lang].pages.contact`** (aliased `p`) — page-level copy (hero, `mapTitle`, `mapBody`).
- **`companyFacts`** — a single-source-of-truth object from `@/lib/site-data` holding phone, email, address, WhatsApp URL, etc. Used here so the contact info never drifts out of sync with the footer or other pages.
- **`useState` with a union type** — `status` is typed as `"idle" | "sending" | "success" | "error"`. TypeScript enforces that only those four strings can be passed to `setStatus`, preventing typos.
- **Lazy state initialization** — `useState(() => {...})` takes a function that runs only on the first render. Used here to parse the URL query string once (avoiding re-parsing on every render).
- **SSR guard** — `if (typeof window === "undefined") return undefined;` because Next.js renders components on the server first, where `window` doesn't exist. Without this guard, the page would crash during server-side rendering.
- **Honeypot anti-spam field** — a hidden form input named `_gotcha`. Humans never see it (CSS `hidden` + `aria-hidden` + `tabIndex={-1}`), so they leave it blank. Bots that auto-fill all form fields will populate it. On submit, the handler checks if `_gotcha` has a value; if so, it pretends success and silently aborts (never sends the data). This is a lightweight, no-CAPTCHA spam filter.
- **`FormData`** — a built-in browser API for reading all named form fields at once. `new FormData(form)` collects every input's value, which `fetch` can POST directly as a multipart body (no manual JSON serialization needed).
- **`async/await` + `try/catch`** — the `onSubmit` handler is async because it `await`s the fetch. The `try/catch` distinguishes HTTP errors (non-2xx response) from network errors (fetch threw).
- **Formspree** — a third-party form backend that accepts POSTs to `https://formspree.io/f/<form-id>` and emails the submissions. The endpoint here is a placeholder (`your-form-id`) that must be replaced before launch.
- **Service preselect from URL** — the `preselectedService` state initializer parses `window.location.hash` for a `?service=...` query string. The `Select` component's `defaultValue={preselectedService}` makes the dropdown start on that option. The pricing page builds these deep-link URLs.
- **`Select` (shadcn/ui)** — a styled wrapper around Radix UI's Select primitive. `defaultValue` sets the initial selection; `SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem` compose the dropdown.
- **`Button` disabled state** — `disabled={status === "sending" || status === "success"}` prevents double-submits while a request is in flight and locks the button after success.
- **Google Maps embed** — an `<iframe>` with `src="https://www.google.com/maps?q=...&output=embed"`. This is Google's free embed endpoint that requires no API key. `loading="lazy"` defers loading until the iframe is near the viewport.

## Section-by-Section Breakdown

### Imports & `ContactPage` component
- Block components (`PageHero`), `Button`, `Input`, `Textarea`, `Select` parts, `useState`, Lucide icons, `companyFacts`, `RouterLink`.
- Reads `{ t, lang }`, `p`, and sets up `status` + `preselectedService` state.

### `onSubmit` async function
- Prevents default, builds `FormData`, checks honeypot, sets status to "sending", saves the enquiry to Supabase, POSTs to Formspree, transitions to success/error. See the JSDoc comment in the file for the full flow.

### Two destinations, either one counts as success

The submit handler writes to two places. Formspree is what emails the office; Supabase is what keeps the enquiry as a searchable record the team can filter and mark as replied in `#/admin`.

The Supabase write is awaited **before** the Formspree POST, not after. Both are fast, so the ordering is not about speed — it is about which one survives a half-finished submit if the visitor closes the tab mid-request.

The status becomes `success` if **either** path worked. That matters because the Formspree endpoint is still a placeholder: without this, a working database write would still show the visitor an error and they would send the message twice. If neither works, the error message tells them to email directly.

Supabase failing is never fatal here — `submitEnquiry` returns a result object rather than throwing, and the call is additionally `.catch()`-guarded.

### `infoItems` array
- An array of 5 contact-info objects, each with `{ icon, label, value, href? }`. Built before the JSX so the render is just a `.map`.

### PageHero
- Small height (`height="sm"`).

### Info + form section (white)
- 5-column grid (`lg:grid-cols-5`): info = 2 cols, form = 3 cols.
- **Info column** — H2 (`t.contact.info.addressLabel`), paragraph (`p.mapBody`), then `.map` over `infoItems`. Each row: icon tile + label + value. If `item.href` exists, the value is wrapped in an `<a>` (with `target="_blank"` for http URLs).
- **Form column** — a `<form onSubmit={onSubmit}>` containing:
  - First/last name row (2 cols).
  - Email/phone row (2 cols).
  - Service `<Select>` with `defaultValue={preselectedService}`.
  - Message `<Textarea>`.
  - **Honeypot** — hidden `_gotcha` input.
  - **Submit `<Button>`** — disabled while sending/success. Renders different icon + label per `status`:
    - `sending` — spinner + "Sending..."
    - `success` — check icon + "Sent!"
    - `error` — alert icon + the normal submit label (so the user can retry)
    - `idle` — send icon + the normal submit label
  - **Error banner** (only when `status === "error"`) — a rose-tinted box with the error message and a `mailto:` link fallback.
  - **Privacy notice** — small text linking to `/privacy`.

### Map section (slate-50 background)
- A bordered card with a header row: left side has `p.mapTitle` + the address; right side has an "Open in Google Maps" outline button (links to `google.com/maps/search/?api=1&query=...`).
- Below: a `relative h-[420px]` container holding an absolutely-positioned `<iframe>` with the Google Maps embed URL.

## How It Connects to Other Files

- **Imports from:**
  - `@/lib/i18n/lang-context` → `useLang`
  - `@/lib/i18n/page-content` → `pageContent`
  - `@/components/blocks/page-hero` → `PageHero`
  - `@/components/ui/button` → `Button`
  - `@/components/ui/input` → `Input`
  - `@/components/ui/textarea` → `Textarea`
  - `@/components/ui/select` → `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
  - `react` → `useState`
  - `lucide-react` → 8 icons
  - `@/lib/site-data` → `companyFacts`
  - `@/lib/router` → `RouterLink`
- **Imported by:** `src/app/page.tsx`.
- **Router mapping:** URL `#/contact` (or `#/contact?service=...`) → route `"contact"`.
- **Deep-link integration:** receives `?service=<encoded>` URLs from `src/components/pages/pricing.tsx` (the tier CTA buttons).

## Common Beginner Questions

**Q: What is a honeypot field, and why use it instead of reCAPTCHA?**
A: A honeypot is a hidden form field that humans can't see but bots auto-fill. On submit, if it has a value, you know it's a bot and silently drop the submission. Honeypots are invisible to real users (no "I'm not a robot" checkbox), require no third-party script, and have no privacy concerns. The trade-off: sophisticated bots can learn to skip hidden fields, so it's less robust than reCAPTCHA — but it's a great lightweight first line of defense.

**Q: Why does the form status auto-revert to "idle" after a few seconds?**
A: So the success message disappears and the form becomes usable again (e.g., if the user wants to send a second message). The `setTimeout` calls reset `status` to `"idle"` after 5 seconds (success) or 4 seconds (honeypot fake-success). The error state does NOT auto-revert — it stays visible until the user retries.

**Q: How does the service preselect work end-to-end?**
A: On the pricing page, each tier's CTA button is `<a href="#/contact?service=Company%20Incorporation">`. When clicked, the URL changes (no full page reload). The contact page mounts, and its `preselectedService` state initializer reads `window.location.hash`, finds the `?service=` portion, URL-decodes the value, and returns it. The `<Select defaultValue={preselectedService}>` then starts with that option selected. The user sees the form with the right service already picked — a small but satisfying UX touch.
