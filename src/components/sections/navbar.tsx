"use client";

/**
 * ============================================================================
 * FILE: navbar.tsx — Top Navigation Bar
 * ============================================================================
 * WHAT IT IS:
 *   The sticky navigation bar shown at the top of every page on the website.
 *
 * WHAT IT DOES:
 *   - Renders a thin "top bar" (desktop only) with phone, WhatsApp, email and
 *     the TCSP licence badge.
 *   - Renders the main sticky header containing: logo, 7 nav links (desktop),
 *     the language switcher, a "Get Started" CTA button, and a hamburger
 *     button that opens a slide-in Sheet drawer (mobile only).
 *   - Listens to the page scroll position and toggles a "glass" background
 *     effect after the user scrolls down 10px.
 *   - Highlights the nav link whose route matches the current route.
 *
 * HOW IT FITS IN:
 *   This is a "section" component — meaning it is a major page region.
 *   It is rendered once in src/app/page.tsx (or wherever the app shell is
 *   composed) and persists across all client-side route changes. It uses the
 *   global LangProvider (for translated text) and RouterProvider (for the
 *   current route + navigation) contexts.
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/lang-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Menu, Phone, MessageCircle, ArrowRight } from "lucide-react";
import { RouterLink, useRouter, Route } from "@/lib/router";

/**
 * Navbar — the top navigation component.
 *
 * Inputs: none (it reads everything it needs from the lang + router contexts).
 * Produces: the full top-bar + sticky header DOM that appears at the top of
 * every page.
 */
export function Navbar() {
  // Pull the translation dictionary `t` from the global language context.
  // `t.nav.about`, `t.topbar.phone`, etc. give us strings in EN / 繁 / 简.
  const { t } = useLang();
  // Pull the current route name (e.g. "about", "services", "home") so we can
  // highlight the matching nav link.
  const { route } = useRouter();
  // Tracks whether the user has scrolled past 10px. When true, we add a
  // stronger "glass" background to the sticky header for readability.
  const [scrolled, setScrolled] = useState(false);
  // Tracks whether the mobile Sheet (slide-in drawer) is currently open.
  const [open, setOpen] = useState(false);

  /**
   * Scroll listener effect.
   * - Adds a passive scroll listener that flips `scrolled` to true once the
   *   window scroll position passes 10px.
   * - `passive: true` tells the browser we won't call preventDefault, which
   *   keeps scrolling smooth on mobile.
   * - We call onScroll() once on mount so the state is correct if the page
   *   is loaded already scrolled (e.g. on a refresh).
   * - The cleanup return removes the listener when the component unmounts.
   */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Build the array of 7 primary nav links (including "Book a Room",
   * which is the site's main self-service conversion path).
   * Each item has a `to` (a Route union value used by our router) and a
   * `label` (the translated string shown to the user).
   * Declared inside the component so the labels re-translate when the user
   * switches language.
   */
  const navLinks: { to: Route; label: string }[] = [
    { to: "about", label: t.nav.about },
    { to: "services", label: t.nav.services },
    { to: "why-hk", label: t.nav.whyhk },
    { to: "pricing", label: t.nav.pricing },
    { to: "partnership", label: "Partnership" },
    { to: "book", label: t.booking.navLabel },
    { to: "insights", label: t.nav.insights },
    { to: "contact", label: t.nav.contact },
  ];

  // The JSX below returns two stacked pieces wrapped in a Fragment (<>):
  //   1) A dark top utility bar (phone/WhatsApp/email/licence) — desktop only.
  //   2) The main sticky glass header (logo + nav + actions + mobile menu).
  return (
    <>
      {/* ============== TOP UTILITY BAR (desktop only, lg:block) ============== */}
      {/* Hidden on mobile to save space. Shows contact methods + licence badge. */}
      <div className="hidden border-b border-[#ebf2f1] bg-white text-[#4a5e5d] lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs">
          {/* Left side: clickable phone, WhatsApp and email links */}
          <div className="flex items-center gap-5">
            {/* tel: link opens the device phone dialer */}
            <a
              href="tel:+85223833283"
              className="inline-flex items-center gap-1.5 transition hover:text-[#148f8a]"
            >
              <Phone className="h-3 w-3" />
              {t.topbar.phone}
            </a>
            {/* wa.me link opens WhatsApp in a new tab */}
            <a
              href="https://wa.me/85255013516"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition hover:text-[#148f8a]"
            >
              <MessageCircle className="h-3 w-3" />
              {t.topbar.whatsapp}
            </a>
            {/* mailto: link opens the user's email client */}
            <a href={`mailto:${t.topbar.email}`} className="transition hover:text-[#148f8a]">
              {t.topbar.email}
            </a>
          </div>
          {/* Right side: TCSP licence badge as a small pill */}
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-[#e2f7f5] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#148f8a]">
              {t.topbar.licence}
            </span>
          </div>
        </div>
      </div>

      {/* ============== MAIN STICKY HEADER ============== */}
      {/* `sticky top-0` keeps it pinned to the top of the viewport while
          scrolling. The `glass-nav` / `scrolled` classes (defined in
          globals.css) control the translucent background + shadow. */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-nav scrolled" : "glass-nav"
        }`}
      >
        {/* Centered content row: max-w-7xl container with logo on the left
            and nav/actions on the right. */}
        {/* max-w-7xl matches the utility bar above and every page section,
            so the logo lines up with the content below it. It is also what
            keeps the row from overflowing: the nav links are nowrap, so a
            narrower container forced the centred nav to spill sideways over
            the logo and the language switcher. */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
          {/* ---------- LOGO ---------- */}
          {/* Uses RouterLink so clicking it navigates to the home route
              without a full page reload. The "S" tile is a CSS gradient square. */}
          <RouterLink to="home" className="flex shrink-0 items-center gap-2.5" aria-label="Smarthub Connect home">
            <img 
              src="/smarthub-logo.png"
              alt="Smarthub Connect"
              className="h-16 w-auto object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-semibold text-[#1a2d2c]">
                Smarthub<span className="text-[#148f8a]"> Connect</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#7a8e8d]">
                Hong Kong · Wan Chai
              </span>
            </div>
          </RouterLink>

          {/* ---------- DESKTOP NAV LINKS (lg:flex, hidden below) ---------- */}
          {/* Each link is highlighted with teal background when its `to`
              matches the current `route`. The `route` value comes from our
              custom hash-based router. */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0 xl:ml-8 xl:flex">
            {navLinks.map((link) => (
              <RouterLink
                key={link.to}
                to={link.to}
                className={`relative whitespace-nowrap px-2 py-2 text-[13px] font-medium transition after:absolute after:bottom-0 after:left-2 after:h-0.5 after:w-0 after:bg-[#d4a94c] after:transition-all hover:after:w-[calc(100%-16px)] ${
                  route === link.to
                    ? "text-[#148f8a] after:w-[calc(100%-16px)]"
                    : "text-[#1a2d2c] hover:text-[#148f8a]"
                }`}
              >
                {link.label}
              </RouterLink>
            ))}
          </nav>

          {/* ---------- RIGHT SIDE ACTIONS ---------- */}
          {/* Contains the language switcher, the "Get Started" CTA button
              (hidden on very small screens), and the hamburger menu button. */}
          <div className="relative z-10 flex shrink-0 items-center gap-1.5">
            {/* Language dropdown — EN / 繁 / 简 */}
            <LanguageSwitcher />
            {/* Primary CTA button. `asChild` makes the Button component merge
                its styles into the child RouterLink so we get a clickable
                link that looks like a button. Hidden on the smallest screens
                (sm:inline-flex) because the mobile menu has its own CTA. */}
            {/* Primary CTA — "Book a Room". Room booking is the site's main
                self-service action, so it gets the solid gradient button
                while the softer "Get Started" enquiry link sits beside it. */}
            <Button
              asChild
              size="sm"
              variant="outline"
              className="hidden whitespace-nowrap border-[#1ab5ad] text-[#148f8a] hover:bg-[#e2f7f5] 2xl:inline-flex"
            >
              <RouterLink to="contact">{t.nav.cta}</RouterLink>
            </Button>
            <Button
              asChild
              size="sm"
              className="hidden whitespace-nowrap bg-[#e04a3c] text-white shadow-none hover:bg-[#e8665a] sm:inline-flex"
            >
              <RouterLink to="book">
                {t.booking.ctaShort}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </RouterLink>
            </Button>

            {/* ---------- MOBILE MENU (Sheet drawer) ---------- */}
            {/* The Sheet is a shadcn/ui slide-in panel. It is only visible on
                screens below `lg` (the hamburger trigger has `lg:hidden`).
                `open`/`onOpenChange` make this a controlled component so we
                can close it programmatically when a link is tapped. */}
            <Sheet open={open} onOpenChange={setOpen}>
              {/* The trigger is the hamburger button. `asChild` lets us use
                  our own button element instead of the default. */}
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 xl:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              {/* The slide-in panel. `side="right"` means it slides in from
                  the right edge of the screen. */}
              <SheetContent side="right" className="w-[320px] sm:w-[380px]">
                {/* Sheet header: small logo + company name. SheetTitle is
                    required for accessibility (gives the dialog a name). */}
                <SheetTitle className="mb-6 flex items-center gap-2">
                  <img 
                    src="/smarthub-logo.png"
                    alt="Smarthub Connect"
                    className="h-9 w-auto object-contain"
                  />
                  <span className="font-display text-lg font-bold">Smarthub Connect</span>
                </SheetTitle>
                {/* Vertical list of nav links. SheetClose asChild wraps each
                    link so tapping it closes the drawer automatically. */}
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.to}>
                      <RouterLink
                        to={link.to}
                        className={`rounded-lg px-4 py-3 text-base font-medium transition ${
                          route === link.to
                            ? "bg-teal-50 text-teal-700"
                            : "text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                        }`}
                      >
                        {link.label}
                      </RouterLink>
                    </SheetClose>
                  ))}
                </nav>
                {/* Quick contact list (phone + WhatsApp) shown below the nav. */}
                <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-6">
                  <a
                    href="tel:+85223833283"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Phone className="h-4 w-4 text-teal-600" />
                    {t.topbar.phone}
                  </a>
                  <a
                    href="https://wa.me/85255013516"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <MessageCircle className="h-4 w-4 text-teal-600" />
                    {t.topbar.whatsapp}
                  </a>
                </div>
                {/* Full-width CTA button at the bottom of the drawer. */}
                {/* Drawer CTAs: book a room (primary) + general enquiry. */}
                <SheetClose asChild>
                  <Button
                    asChild
                    className="mt-4 w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white"
                  >
                    <RouterLink to="book">
                      {t.booking.ctaShort}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </RouterLink>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-2 w-full border-teal-200 text-teal-700"
                  >
                    <RouterLink to="contact">{t.nav.cta}</RouterLink>
                  </Button>
                </SheetClose>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
