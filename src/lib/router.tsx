"use client";

/**
 * CUSTOM HASH ROUTER
 * =================================================================
 * WHAT THIS FILE IS:
 *   A tiny do-it-yourself router built on the URL hash (the `#...`
 *   part of a URL). It does NOT use Next.js's built-in file-based
 *   routing — instead, the entire site lives at `/` and the router
 *   swaps content based on the hash (e.g. `#/about`, `#/pricing`).
 *
 * WHAT IT DOES:
 *   - Defines a `Route` type union (the 14 possible routes)
 *   - Maintains two lookup tables: URL-string ↔ Route-name
 *   - Exposes `RouterProvider` to hold the current route state
 *   - Listens for `hashchange` events so back/forward buttons work
 *   - Scrolls to top on route change (or to a secondary anchor)
 *   - Exposes `useRouter()` so any component can read the current
 *     route or call `navigate("about")` to change pages
 *   - Provides a `<RouterLink to="about">` component that respects
 *     cmd+click (open in new tab)
 *
 * HOW IT FITS IN THE BIGGER PICTURE:
 *   `src/app/page.tsx` wraps the whole app in `<RouterProvider>` and
 *   uses `<RouterOutlet />` to pick which page component to render.
 *   Navbar links use `<RouterLink>` so clicking them updates the URL
 *   hash without a full page reload.
 *
 * WHY A HASH ROUTER INSTEAD OF NEXT.JS ROUTING?
 *   - Cheaper to host (static, no server rewrites needed)
 *   - Predictable client-side navigation
 *   - Single bundle for the whole marketing site
 *
 * HOW IT DIFFERS FROM A REAL NEXT.JS ROUTE:
 *   Next.js routing: each file in `app/` becomes a real URL
 *   (e.g. `app/about/page.tsx` → `/about`). The server returns
 *   different HTML for each URL. Our hash router serves the SAME
 *   HTML for every URL — only the `#` changes, and JavaScript
 *   decides what to render.
 * ================================================================= */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

/**
 * Route — the closed set of possible route names.
 *
 * This is a TypeScript "union type" — it says `route` must be one of
 * these 13 literal strings, nothing else. The compiler will catch
 * typos like `navigate("abuot")` at build time.
 *
 * The "not-found" route is what we set when the URL hash doesn't
 * match any known route.
 */
export type Route =
  | "home"
  | "about"
  | "services"
  | "why-hk"
  | "pricing"
  | "insights"
  | "book"
  | "contact"
  | "privacy"
  | "terms"
  | "complaints"
  | "disclosures"
  | "admin"
  | "not-found";

/**
 * ROUTE_MAP — translates a URL string (the part after `#`) into a
 * Route name. Used by `parseHash()` when reading the current URL.
 *
 * Note: `""` and `"/"` both map to "home" so an empty hash still
 * shows the home page.
 */
const ROUTE_MAP: Record<string, Route> = {
  "": "home",
  "/": "home",
  "/about": "about",
  "/services": "services",
  "/why-hong-kong": "why-hk",
  "/pricing": "pricing",
  "/insights": "insights",
  "/book": "book",
  "/contact": "contact",
  "/privacy": "privacy",
  "/terms": "terms",
  "/complaints": "complaints",
  "/disclosures": "disclosures",
  "/admin": "admin",
};

/**
 * REVERSE_MAP — translates a Route name back into a URL string.
 * Used by `navigate()` and `routeHref()` to build the URL hash to
 * push into `window.location.hash`.
 */
const REVERSE_MAP: Record<Route, string> = {
  home: "/",
  about: "/about",
  services: "/services",
  "why-hk": "/why-hong-kong",
  pricing: "/pricing",
  insights: "/insights",
  book: "/book",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
  complaints: "/complaints",
  disclosures: "/disclosures",
  admin: "/admin",
  "not-found": "/not-found",
};

/**
 * parseHash — read the current URL hash and return the matching Route.
 *
 * Steps:
 *   1. If we're on the server (no `window`), default to "home".
 *   2. Grab `window.location.hash` (e.g. "#/about") and strip the
 *      leading `#`. Result: "/about".
 *   3. Strip a leading slash if present. Result: "about".
 *   4. Drop any query string. `#/book?room=meeting-a` and
 *      `#/contact?service=Workspace` must still resolve to the "book" /
 *      "contact" routes — the pages themselves read the query string via
 *      `hashQuery()` below.
 *   5. Take only the FIRST path segment (ignore deep links).
 *   6. Look up the segment in ROUTE_MAP. If found, return it;
 *      otherwise return "not-found".
 *
 * Inputs: none (reads from `window.location.hash`)
 * Returns: a `Route` value (one of the 14 literals above)
 */
function parseHash(): Route {
  if (typeof window === "undefined") return "home";
  // Strip the leading "#" and everything from "?" onwards (the query
  // string) so deep-links with parameters still match a route.
  const raw = window.location.hash.replace(/^#/, "").split("?")[0];
  // strip leading slash
  const path = raw.startsWith("/") ? raw.slice(1) : raw;
  // take first segment only
  const seg = path.split("/")[0] || "";
  const mapped = ROUTE_MAP[seg === "" ? "/" : `/${seg}`];
  return mapped ?? "not-found";
}

/**
 * RouterContextValue — the shape of the context value every consumer
 * receives when calling `useRouter()`.
 *   - `route`     : the current Route name
 *   - `navigate`  : a function to change the route (with optional query)
 */
type RouterContextValue = {
  route: Route;
  /** Change route. Pass `query` to append a hash query string. */
  navigate: (r: Route, query?: Record<string, string>) => void;
};

/**
 * RouterContext — the React Context object itself.
 * It holds a value of type `RouterContextValue | null` (null when
 * no provider is mounted). We export it implicitly via the hook.
 */
const RouterContext = createContext<RouterContextValue | null>(null);

/**
 * RouterProvider — the React Context Provider that owns route state.
 *
 * Inputs:
 *   `children` — any React nodes that should have access to the
 *   router (typically the whole app).
 *
 * State:
 *   `route` — initialised once by reading the URL hash via
 *   `parseHash()`. Then updated whenever `hashchange` fires.
 *
 * Effects:
 *   1. Subscribes to `hashchange` so back/forward buttons work and
 *      so manual edits to the URL update the UI.
 *   2. On every route change, scrolls to the top of the page —
 *      UNLESS there's a secondary anchor like `#/about#team`, in
 *      which case it scrolls to that element instead.
 *
 * `navigate(r)`:
 *   Sets `window.location.hash` to the matching URL string. The
 *   actual state update happens via the `hashchange` listener
 *   (single source of truth — no separate setState call).
 *
 * Returns:
 *   A `<RouterContext.Provider>` element wrapping `children`.
 */
export function RouterProvider({ children }: { children: React.ReactNode }) {
  // useState initialiser reads the URL hash ONCE on mount.
  const [route, setRoute] = useState<Route>(() => parseHash());

  // Subscribe to hashchange events so the URL bar and back/forward
  // buttons keep the UI in sync.
  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Scroll to top on route change (unless there's a secondary anchor)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    // if hash has a secondary anchor like #/about#team, scroll to that
    const secondaryAnchor = hash.includes("#", 2) ? hash.split("#")[2] : null;
    if (secondaryAnchor) {
      const el = document.getElementById(secondaryAnchor);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [route]);

  /**
   * navigate — programmatically change the route.
   *
   * We set `window.location.hash`, which fires a `hashchange` event,
   * which triggers the listener above, which calls `setRoute`. We
   * don't call `setRoute` directly here so the URL is always the
   * single source of truth.
   */
  const navigate = useCallback((r: Route, query?: Record<string, string>) => {
    if (typeof window === "undefined") return;
    // Optional query string, e.g. navigate("book", { room: "meeting-a" })
    // produces "#/book?room=meeting-a". Pages read it with `hashQuery()`.
    const qs = query ? new URLSearchParams(query).toString() : "";
    const next = `#${REVERSE_MAP[r]}${qs ? `?${qs}` : ""}`;
    // Setting an identical hash does NOT fire `hashchange`, so update the
    // state directly in that case (e.g. re-clicking the current nav link).
    if (window.location.hash === next) {
      setRoute(parseHash());
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.hash = next;
    // state update will happen via hashchange listener
  }, []);

  return (
    <RouterContext.Provider value={{ route, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

/**
 * useRouter — the hook every component uses to read the current
 * route or call `navigate()`.
 *
 * Throws if used outside a `<RouterProvider>` so you get a clear
 * error instead of a silent undefined.
 */
export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within a RouterProvider");
  return ctx;
}

/**
 * routeHref — helper to build a hash href for a route.
 *
 * Inputs:
 *   `r`       — the Route name (e.g. "about")
 *   `anchor?` — optional secondary anchor (e.g. "team")
 *
 * Returns: a string like "#/about" or "#/about#team" that can be
 * used as an `<a href>` value. Useful for cases where you need
 * the href without rendering a `<RouterLink>` (e.g. for a button
 * styled as a link).
 */
/** Helper to build a hash href for a route */
export function routeHref(
  r: Route,
  anchor?: string,
  query?: Record<string, string>
): string {
  const qs = query ? new URLSearchParams(query).toString() : "";
  const base = `#${REVERSE_MAP[r]}${qs ? `?${qs}` : ""}`;
  return anchor ? `${base}#${anchor}` : base;
}

/**
 * hashQuery — read the query string of the CURRENT hash URL.
 *
 * Our router keeps everything after `#`, so a deep link looks like
 * `https://smarthubc.com/#/book?room=event-space`. `URLSearchParams`
 * can't see that (it's not the real `location.search`), so we slice the
 * hash ourselves.
 *
 * Inputs: none (reads `window.location.hash`)
 * Returns: `URLSearchParams` — empty on the server or when there's no
 * query string, so callers can always call `.get()` safely.
 *
 * Example:
 *   const room = hashQuery().get("room"); // "event-space" | null
 */
export function hashQuery(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash;
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return new URLSearchParams();
  // Stop at a secondary anchor (e.g. "#/book?room=x#form") if present.
  return new URLSearchParams(hash.slice(qIndex + 1).split("#")[0]);
}

/**
 * RouterLink — a router-aware <a> element.
 *
 * Why not just use a plain <a href="#/about">?
 *   - Plain <a> would cause a tiny scroll jump because the browser
 *     treats `#/about` as a fragment identifier.
 *   - We also want to fire `navigate()` so the URL/state update is
 *     explicit and consistent.
 *
 * Behavior:
 *   - `onClick`: if the user is holding cmd/ctrl/shift (open in new
 *     tab), let the browser handle it. Otherwise preventDefault and
 *     call `navigate(to)` for smooth client-side routing.
 *   - The `href` is still set via `routeHref()` so the link works
 *     even without JS (progressive enhancement) and so right-click
 *     "copy link" works.
 *
 * Props:
 *   - `to`       — required Route name
 *   - `anchor?`  — optional secondary anchor (e.g. "team")
 *   - `query?`   — optional hash query params, e.g. `{ room: "meeting-a" }`
 *                  which renders `#/book?room=meeting-a`
 *   - `className?`, `children`, `onClick?` — standard anchor props
 *   - `...rest`  — any other valid <a> attributes except `href`
 *                  (which is computed) and `onClick` (handled here)
 */
/** Link component for router-aware navigation */
export function RouterLink({
  to,
  anchor,
  query,
  className,
  children,
  onClick,
  ...rest
}: {
  to: Route;
  anchor?: string;
  query?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick">) {
  const { navigate } = useRouter();
  return (
    <a
      href={routeHref(to, anchor, query)}
      className={className}
      onClick={(e) => {
        // allow cmd+click to open in new tab
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        navigate(to, query);
        onClick?.();
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
