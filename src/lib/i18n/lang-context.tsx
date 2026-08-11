"use client";

/**
 * LANGUAGE CONTEXT — Trilingual i18n Provider
 * =================================================================
 * WHAT THIS FILE IS:
 *   A React Context provider that holds the currently-selected language
 *   (English / Traditional Chinese / Simplified Chinese) and the merged
 *   translation dictionary. It's the central nervous system for the
 *   site's trilingual support.
 *
 * WHAT IT DOES:
 *   - `buildDict(lang)` — merges strings from 3 translation modules
 *     (translations.ts + page-content.ts + extra-content.ts) into one
 *     big dictionary object, customised per language
 *   - `detectInitialLang()` — on first load, checks localStorage for a
 *     saved preference, then falls back to the browser's preferred
 *     language (`navigator.language`), then defaults to English
 *   - `LangProvider` — wraps the app, holds `lang` state, persists
 *     language changes to localStorage, sets `<html lang>` for
 *     accessibility/SEO, and exposes the dictionary via context
 *   - `useLang()` — hook every component calls to read `lang`, `setLang`,
 *     and the dictionary `t`
 *
 * HOW IT FITS IN THE BIGGER PICTURE:
 *   `src/app/layout.tsx` wraps the whole app in `<LangProvider>`. Any
 *   component anywhere in the tree can then call `useLang()` to get
 *   the current language and dictionary. The Language Switcher
 *   component calls `setLang("zh-HK")` etc. to switch languages,
 *   and every component re-renders with the new strings instantly.
 *
 * WHY "use client"?
 *   The provider uses `window.localStorage` and `window.navigator`,
 *   which only exist in the browser. The directive tells Next.js to
 *   render this component on the client side after hydration.
 * =================================================================
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
// `Lang` is the union type "en" | "zh-HK" | "zh-CN".
// `translations` is the BASE dictionary (nav, hero, services, etc.).
import { Lang, translations } from "./translations";
// `pageContent` holds the big per-page text content (home, about, services...).
import { pageContent } from "./page-content";
// `extraContent` holds the supplementary strings (cookie banner, legal,
// footer extras, not-found, why-hk extras, etc.).
import { extraContent } from "./extra-content";
// `bookingContent` holds every string for the room-booking page (#/book).
import { bookingContent } from "./booking-content";

/**
 * buildDict — merge all three translation sources into ONE dictionary
 * for the given language.
 *
 * Why merge? The translations are split across 3 files to keep each
 * one manageable. `translations.ts` is the base (nav, hero, etc.),
 * `page-content.ts` is the long-form page content, and `extra-content.ts`
 * has the supplementary UI strings. We fuse them here so consumers
 * can read `t.hero.title`, `t.pages.home.about.body`, `t.cookie.accept`
 * etc. from a single object.
 *
 * Inputs:
 *   `lang` — one of "en" | "zh-HK" | "zh-CN"
 *
 * Returns:
 *   A merged dictionary object. The exact shape is inferred by
 *   TypeScript via `ReturnType<typeof buildDict>` (exported as `Dict`).
 *
 * Note: the `footer` key is special — we merge the base footer with
 * the extra footer fields using object spread so both contribute.
 */
// Merge base translations with page-content and extra-content
function buildDict(lang: Lang) {
  return {
    ...translations[lang],          // base strings (nav, hero, services, etc.)
    pages: pageContent[lang].pages, // big per-page text content
    // Footer is merged (base + extra) so both sources contribute fields
    footer: { ...translations[lang].footer, ...extraContent[lang].footer },
    cookie: extraContent[lang].cookie,             // cookie consent banner
    backToTop: extraContent[lang].backToTop,       // "back to top" button label
    skipToContent: extraContent[lang].skipToContent, // a11y skip-link label
    notFound: extraContent[lang].notFound,         // 404 page strings
    whyHkExtra: extraContent[lang].whyHk,          // why-hk page extras
    insightsExtra: extraContent[lang].insights,    // insights page extras
    pricingExtra: extraContent[lang].pricing,      // pricing page extras
    contactExtra: extraContent[lang].contact,      // contact page extras
    legal: extraContent[lang].legal,               // legal page strings
    booking: bookingContent[lang],                 // room-booking page (#/book)
  };
}

/**
 * Dict — the full type of the merged dictionary.
 *
 * `ReturnType<typeof buildDict>` asks TypeScript to compute the type
 * from the function's return value, so we don't have to retype every
 * key by hand. Anywhere in the codebase that uses `t` gets full
 * autocomplete + type checking.
 */
export type Dict = ReturnType<typeof buildDict>;

/**
 * LangContextValue — the shape of the context value consumers receive.
 *   - `lang`    : the current language code
 *   - `setLang` : function to switch language (also persists to localStorage)
 *   - `t`       : the merged dictionary for the current language
 */
type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
};

/**
 * LangContext — the React Context object. Holds a value of type
 * `LangContextValue | null` (null when no provider is mounted).
 */
const LangContext = createContext<LangContextValue | null>(null);

/**
 * STORAGE_KEY — the localStorage key where we remember the user's
 * language choice across sessions. Keeping it as a constant avoids
 * typos when reading/writing.
 */
const STORAGE_KEY = "smarthub-lang";

/**
 * detectInitialLang — figure out which language to use on first load.
 *
 * Order of preference:
 *   1. localStorage value (if previously set via setLang)
 *   2. Browser language (`navigator.language`) — if it starts with
 *      "zh", check whether it's Traditional (Hant/HK/TW/MO) or
 *      Simplified, and pick the matching variant
 *   3. Default to "en" if nothing matches or we're on the server
 *
 * The `try/catch` around localStorage is for environments where
 * localStorage is disabled (e.g. Safari private mode in older versions).
 *
 * Inputs: none (reads from `window.localStorage` + `window.navigator`)
 * Returns: a `Lang` value
 */
function detectInitialLang(): Lang {
  // SSR safety: if there's no window (server-side render), default to "en".
  if (typeof window === "undefined") return "en";
  try {
    // 1. Check localStorage for a saved preference.
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && ["en", "zh-HK", "zh-CN"].includes(stored)) return stored;
  } catch {}
  // 2. Fall back to browser language.
  const nav = window.navigator.language;
  if (nav?.toLowerCase().startsWith("zh")) {
    // Traditional Chinese variants: Hant (script tag), HK/TW/MO (region tags)
    if (nav.includes("Hant") || nav.includes("HK") || nav.includes("TW") || nav.includes("MO")) {
      return "zh-HK";
    }
    // Everything else starting with "zh" (zh-CN, zh-SG, etc.) → Simplified
    return "zh-CN";
  }
  // 3. Default to English.
  return "en";
}

/**
 * LangProvider — the React Context Provider that owns language state.
 *
 * Inputs:
 *   `children` — any React nodes (typically the whole app).
 *
 * State:
 *   `lang` — initialised once by calling `detectInitialLang()` on the
 *   client (or "en" on the server). Updated via `setLang`.
 *
 * Effects:
 *   - Whenever `lang` changes, sets `document.documentElement.lang` to
 *     "en" / "zh-Hant" / "zh-Hans". This is important for accessibility
 *     (screen readers use it to pick pronunciation rules) and SEO.
 *
 * `setLang(l)`:
 *   - Updates React state
 *   - Persists the choice to localStorage so it survives page reloads
 *
 * Returns:
 *   A `<LangContext.Provider>` element wrapping `children`. The context
 *   value includes `lang`, `setLang`, and the freshly-built dictionary
 *   `t` (rebuilt whenever `lang` changes).
 */
export function LangProvider({ children }: { children: React.ReactNode }) {
  // Initialise: on server use "en"; on client detect from storage/browser.
  const [lang, setLangState] = useState<Lang>(() =>
    typeof window === "undefined" ? "en" : detectInitialLang()
  );

  // Sync the <html lang> attribute so screen readers + search engines
  // know what language the page is in. Runs whenever `lang` changes.
  useEffect(() => {
    if (typeof document !== "undefined") {
      const htmlLang =
        lang === "en" ? "en" : lang === "zh-HK" ? "zh-Hant" : "zh-Hans";
      document.documentElement.lang = htmlLang;
    }
  }, [lang]);

  /**
   * setLang — public function to switch languages.
   *
   * 1. Updates React state (triggers re-render with new dictionary)
   * 2. Persists choice to localStorage so it survives reloads
   *
   * `useCallback` memoises so the function identity is stable across
   * renders (avoids unnecessary re-renders of consumers).
   */
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {}
  }, []);

  // The context value. `t` is rebuilt on every render of the provider
  // (i.e. whenever `lang` changes). Consumers re-render automatically.
  const value: LangContextValue = {
    lang,
    setLang,
    t: buildDict(lang),
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/**
 * useLang — the hook every component uses to read the current
 * language, switch languages, and access the translation dictionary.
 *
 * Throws a clear error if used outside a `<LangProvider>` (e.g. if
 * you forget to wrap your app in layout.tsx).
 *
 * Returns: `{ lang, setLang, t }`
 */
export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useLang must be used within a LangProvider");
  }
  return ctx;
}
