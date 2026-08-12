"use client";

/**
 * MAIN PAGE — Home / App Entry
 * =================================================================
 * WHAT THIS FILE IS:
 *   The single page that Next.js renders at the URL `/`. Because this
 *   project uses a CUSTOM HASH ROUTER (see `src/lib/router.tsx`) instead
 *   of Next.js's built-in file-based routing, there is ONE page file and
 *   it swaps content inside based on the URL hash.
 *
 * WHAT IT DOES:
 *   - Wraps the whole UI in `<RouterProvider>` so any nested component
 *     can read the current route via `useRouter()`
 *   - Renders the global chrome: Navbar (top), Footer (bottom), WhatsApp
 *     floating button, Back-to-Top button, and Cookie Consent banner
 *   - Renders a `<RouterOutlet>` — a switch statement that picks the
 *     right page component (Home/About/Services/etc.) based on the
 *     current route
 *   - Renders a skip link for keyboard / screen-reader users
 *
 * HOW IT FITS IN THE BIGGER PICTURE:
 *   This is the `children` passed into `RootLayout` (see layout.tsx).
 *   All actual page content lives in `src/components/pages/*.tsx`. This
 *   file is just the conductor: it picks which page component to show
 *   based on the hash router's state.
 *
 * WHY "use client"?
 *   The hash router depends on `window.location.hash`, which only exists
 *   in the browser. The "use client" directive tells Next.js to render
 *   this component on the client side (after hydration) so it can read
 *   the URL hash and respond to hashchange events.
 */

import { RouterProvider, useRouter, RouterLink } from "@/lib/router";
import { useLang } from "@/lib/i18n/lang-context";
// Global site chrome (visible on every route):
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { WhatsAppFloat } from "@/components/sections/whatsapp-float";
import { CookieConsent } from "@/components/sections/cookie-consent";
import { BackToTop } from "@/components/sections/back-to-top";
// Per-route page components (the actual content for each "page"):
import { HomePage } from "@/components/pages/home";
import { AboutPage } from "@/components/pages/about";
import { ServicesPage } from "@/components/pages/services";
import { WhyHKPage } from "@/components/pages/why-hk";
import { PricingPage } from "@/components/pages/pricing";
import { InsightsPage } from "@/components/pages/insights";
import { BookingPage } from "@/components/pages/booking";
import { AdminPage } from "@/components/pages/admin";
import { ContactPage } from "@/components/pages/contact";
import { PartnershipPage } from "@/components/pages/partnership";
import { LegalPage } from "@/components/pages/legal";
import { NotFoundPage } from "@/components/pages/not-found";

/**
 * RouterOutlet — the SWITCH that picks which page component to render.
 *
 * This is the heart of the custom routing system. `useRouter()` returns
 * the current `route` value (a union type like "home" | "about" | ...).
 * The switch statement maps each possible route to a page component.
 *
 * Why a switch instead of a routing table library?
 *   It's the simplest possible router. Each case is one route. The
 *   `LegalPage` component is reused for 4 different legal routes via a
 *   `which` prop ("privacy" | "terms" | "complaints" | "disclosures").
 *
 * Inputs: none (reads from `useRouter()` context)
 * Returns: JSX of the matching page component (or `<HomePage />` as a
 * fallback default).
 */
function RouterOutlet() {
  const { route } = useRouter();

  switch (route) {
    case "home":
      return <HomePage />;
    case "about":
      return <AboutPage />;
    case "services":
      return <ServicesPage />;
    case "why-hk":
      return <WhyHKPage />;
    case "pricing":
      return <PricingPage />;
    case "insights":
      return <InsightsPage />;
    case "book":
      return <BookingPage />;
    // Internal staff tool. Deliberately absent from the navbar,
    // footer and sitemap — reachable only by typing #/admin.
    case "admin":
      return <AdminPage />;
    case "partnership":
      return <PartnershipPage />;
    case "contact":
      return <ContactPage />;
    // The four legal routes all share the LegalPage component, passing
    // a `which` prop so it knows which legal document to render.
    case "privacy":
      return <LegalPage which="privacy" />;
    case "terms":
      return <LegalPage which="terms" />;
    case "complaints":
      return <LegalPage which="complaints" />;
    case "disclosures":
      return <LegalPage which="disclosures" />;
    case "not-found":
      return <NotFoundPage />;
    // Safety net: if somehow route is undefined, show the home page.
    default:
      return <HomePage />;
  }
}

/**
 * SkipLink — accessibility helper for keyboard and screen-reader users.
 *
 * This is a hidden link at the top of the page that becomes visible ONLY
 * when focused (via Tab key). Clicking it jumps focus to #main-content
 * so keyboard users can skip past the navbar and dive straight into page
 * content. This is a WCAG (Web Content Accessibility Guidelines) requirement.
 *
 * Inputs: none (reads `t` from `useLang()` for the localized label)
 * Returns: an <a> element styled with the `.skip-link` class (CSS in
 * globals.css positions it offscreen until focused).
 */
function SkipLink() {
  const { t } = useLang();
  return (
    <a href="#main-content" className="skip-link">
      {t.skipToContent}
    </a>
  );
}

/**
 * Home — the default export Next.js renders for the `/` route.
 *
 * Composes the full page chrome:
 *   <RouterProvider>   ← provides route state to all children
 *     <SkipLink />     ← a11y skip-to-content link
 *     <Navbar />       ← top navigation bar (logo, links, language switcher)
 *     <main>           ← wraps the active page content
 *       <RouterOutlet />  ← the switch that picks which page to render
 *     </main>
 *     <Footer />       ← site footer with links + contact info
 *     <WhatsAppFloat />← floating WhatsApp chat button (bottom-right)
 *     <BackToTop />    ← floating "scroll to top" button
 *     <CookieConsent /><← cookie consent banner (appears on first visit)
 *
 * The wrapping <div> uses `flex min-h-screen flex-col` so the footer
 * sticks to the bottom even on short pages, and `bg-white` ensures the
 * background is always crisp white.
 */
export default function Home() {
  return (
    <RouterProvider>
      <div className="flex min-h-screen flex-col bg-white">
        <SkipLink />
        <Navbar />
        {/* `flex-1` makes <main> grow to fill available vertical space,
            pushing <Footer> to the bottom on short pages. */}
        <main id="main-content" className="flex-1">
          <RouterOutlet />
        </main>
        <Footer />
        <WhatsAppFloat />
        <BackToTop />
        <CookieConsent />
      </div>
    </RouterProvider>
  );
}
