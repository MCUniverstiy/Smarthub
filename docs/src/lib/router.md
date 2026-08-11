# File: router.tsx

## What This File Does

This is a **custom hash router** built from scratch — it does NOT use Next.js's built-in file-based routing. The entire site lives at a single URL `/`, and this router swaps page content based on the URL hash (the `#...` part of a URL like `/#/about` or `/#/pricing`). It defines the 14 possible routes, exposes a `RouterProvider` to hold the current route state, listens for `hashchange` events so the browser back/forward buttons work, scrolls to top on route change, and provides a `<RouterLink>` component for navigation.

## Where It Lives in the Project

```
/home/z/my-project/src/lib/router.tsx
```

## What It Produces

- A `Route` TypeScript union type (the 14 possible routes)
- `RouterProvider` — wraps the app to provide route state via React Context
- `useRouter()` hook — lets any component read the current route or call `navigate()`
- `RouterLink` component — a router-aware `<a>` element for navigation
- `routeHref()` helper — builds a hash href like `#/about#team` or `#/book?room=meeting-a` from a Route + optional anchor + optional query
- `hashQuery()` helper — reads the query string out of the current hash URL (e.g. `#/book?room=event-space` → `room=event-space`)

## Key Concepts

- **Hash router** — A client-side routing strategy that uses the URL hash (`#`) for navigation. The page never reloads — only the `#` changes, and JavaScript decides what to render. Cheaper to host (works on any static host) but doesn't get unique URLs per page (the part before `#` is always `/`).
- **How it differs from Next.js routing** — Next.js file-based routing makes each file in `app/` a real URL (`app/about/page.tsx` → `/about`), and the server returns different HTML per URL. Our hash router serves the SAME HTML for every URL — only the `#` changes.
- **TypeScript union type** — `type Route = "home" | "about" | ...` says `route` must be one of these 13 literal strings. The compiler catches typos like `navigate("abuot")` at build time.
- **React Context** — A way to share state across many components without prop drilling. `RouterProvider` holds the route state; any descendant can call `useRouter()` to read it.
- **`hashchange` event** — Browser fires this whenever the URL hash changes. Listening to it lets us update the UI when the user clicks back/forward or edits the URL.
- **Single source of truth** — `navigate()` only sets `window.location.hash`; the actual state update happens via the `hashchange` listener. This avoids state desync.
- **Progressive enhancement** — `RouterLink` still sets a real `href` so the link works without JS, but `preventDefault()` + `navigate()` makes it smoother when JS is available.

## Section-by-Section Breakdown

### 1. `Route` union type (lines 5–17)
A TypeScript union listing the 14 possible route names (including `book` for the room-booking page). The compiler will catch typos at build time.

### 2. `ROUTE_MAP` (lines 19–32)
Lookup table translating URL strings (the part after `#`) into Route names. `""` and `"/"` both map to `"home"` so an empty hash shows the home page.

### 3. `REVERSE_MAP` (lines 34–47)
Lookup table translating Route names back into URL strings. Used by `navigate()` and `routeHref()` to build the URL hash.

### 4. `parseHash()` function (lines 49–58)
Reads `window.location.hash`, strips the leading `#`, takes the first path segment, and looks it up in `ROUTE_MAP`. Returns `"not-found"` if the hash doesn't match any route. Returns `"home"` on the server (no `window`).

### 5. `RouterContextValue` type + `RouterContext` (lines 60–65)
TypeScript type describing the context value (`route` + `navigate`), and the actual React Context object. Starts as `null` when no provider is mounted.

### 6. `RouterProvider` component (lines 67–103)
The React Context Provider. State:
- `route` — initialized once by calling `parseHash()`, then updated via `hashchange` listener

Effects:
- Subscribes to `hashchange` so back/forward buttons work
- On every route change, scrolls to top — UNLESS there's a secondary anchor like `#/about#team`, in which case it scrolls smoothly to that element

`navigate(r)` — sets `window.location.hash`, which triggers the `hashchange` listener, which calls `setRoute`. Single source of truth.

### 7. `useRouter()` hook (lines 105–109)
Returns the current context value. Throws a clear error if used outside a `<RouterProvider>`.

### 8. `routeHref()` helper (lines 112–115)
Builds a hash href string like `"#/about"` or `"#/about#team"` from a Route + optional anchor.

### 9. `RouterLink` component (lines 118–149)
A router-aware `<a>` element:
- Sets `href` via `routeHref()` so the link works without JS (progressive enhancement)
- `onClick`: if user is holding cmd/ctrl/shift (open in new tab), let the browser handle it. Otherwise `preventDefault()` and call `navigate(to)`.
- Accepts `className`, `children`, `onClick`, and any other valid `<a>` attributes (except `href` which is computed, and `onClick` which is handled).

## How It Connects to Other Files

**Imports from:**
- `react` — `createContext`, `useContext`, `useEffect`, `useState`, `useCallback`

**Exports:**
- `Route` (type)
- `RouterProvider` (component)
- `useRouter` (hook)
- `routeHref` (helper function)
- `RouterLink` (component)

**Imported by:**
- `src/app/page.tsx` — wraps the app in `<RouterProvider>` and uses `<RouterOutlet />` to pick the page
- `src/components/sections/navbar.tsx` — uses `<RouterLink>` for nav menu items
- `src/components/sections/footer.tsx` — uses `<RouterLink>` for footer links
- Various page components that need to navigate programmatically

## Common Beginner Questions

**Q: Why use a hash router instead of Next.js's built-in routing?**
A: A hash router is simpler and cheaper to host — it works on any static file host with no server configuration. The tradeoff is that URLs look like `/#/about` instead of `/about`, and you don't get per-page server-rendered HTML (which affects SEO slightly, though we compensate with strong metadata + JSON-LD).

**Q: Why does `navigate()` only set `window.location.hash` and not call `setRoute()` directly?**
A: To keep a single source of truth. The URL hash is the truth; the React state mirrors it. If we did both, we'd risk them getting out of sync (e.g. state updates but URL doesn't). By using only the hash + a `hashchange` listener, the URL and state can never disagree.

**Q: What's the secondary anchor thing (`#/about#team`)?**
A: It's a way to deep-link to a section within a page. The first `#` starts the route hash (`/about`); the second `#` adds an element ID (`team`). The scroll effect detects this and scrolls smoothly to the `#team` element instead of jumping to the top.
