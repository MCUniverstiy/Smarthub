"use client";

/**
 * ============================================================================
 * FILE: footer.tsx — Page Footer
 * ============================================================================
 * WHAT IT IS:
 *   The big dark footer that appears at the bottom of every page.
 *
 * WHAT IT DOES:
 *   - Renders a top "CTA strip" with a WhatsApp prompt and a gradient
 *     "WhatsApp Us" button.
 *   - Renders a 5-column grid (on large screens) with:
 *       Col 1–2 (span 2): brand logo + tagline + TCSP licence badge.
 *       Col 3:            Explore links (the 6 main pages).
 *       Col 4:            Legal links (privacy / terms / complaints / disclosures).
 *       Col 5:            Connect info (address / phone / WhatsApp / email).
 *   - Renders a legal note paragraph, copyright line, and a group-member /
 *     domain badge row.
 *
 * HOW IT FITS IN:
 *   This is a "section" component mounted once at the bottom of the app
 *   shell. It uses the lang context (for translated strings) and the
 *   `companyFacts` object from `src/lib/site-data.ts` (for the single
 *   source of truth on phone, email, address, licence, etc.).
 * ============================================================================
 */

import { useLang } from "@/lib/i18n/lang-context";
import { Phone, Mail, MessageCircle, MapPin, ShieldCheck, CalendarDays } from "lucide-react";
import { RouterLink, Route } from "@/lib/router";
import { companyFacts } from "@/lib/site-data";
import { useIsStaff } from "@/hooks/use-staff";

/**
 * Footer — the bottom-of-page footer component.
 *
 * Inputs: none (reads `t` from the lang context and `companyFacts` from
 *         site-data).
 * Produces: the full footer DOM — CTA strip + 5-column grid + bottom bar.
 */
export function Footer() {
  // Pull translated strings (links, headings, legal note, etc.) from the
  // global language context.
  const { t } = useLang();

  /**
   * True only when a signed-in member of the team is browsing. Used to
   * reveal the booking-inbox shortcut below. This is presentation only:
   * the inbox itself is protected by row level security, so forcing this
   * value true in devtools reveals a link and nothing else.
   */
  const isStaff = useIsStaff();

  /**
   * "Explore" links — the 7 main site pages (including room booking). Each item pairs a `Route`
   * (used by RouterLink for navigation) with a translated `label`.
   * Declared inside the component so labels re-render on language change.
   */
  const exploreLinks: { to: Route; label: string }[] = [
    { to: "about", label: t.footer.links.about },
    { to: "services", label: t.footer.links.services },
    { to: "why-hk", label: t.footer.links.whyhk },
    { to: "pricing", label: t.footer.links.pricing },
    { to: "partnership", label: "Partnership" },
    { to: "book", label: t.booking.navLabel },
    { to: "insights", label: t.footer.links.insights },
    { to: "contact", label: t.footer.links.contact },
    // Staff-only shortcut. Absent for every public visitor, and absent
    // entirely when the site runs without a database.
    ...(isStaff
      ? [{ to: "admin" as Route, label: t.footer.links.inbox }]
      : []),
  ];

  /**
   * "Legal" links — the 4 compliance/policy pages. Same shape as above.
   */
  const legalLinks: { to: Route; label: string }[] = [
    { to: "privacy", label: t.footer.links.privacy },
    { to: "terms", label: t.footer.links.terms },
    { to: "complaints", label: t.footer.links.complaints },
    { to: "disclosures", label: t.footer.links.disclosures },
  ];

  // The JSX below produces:
  //   <footer>
  //     1. Top CTA strip (WhatsApp prompt + button)
  //     2. Main 5-column grid (brand / explore / legal / connect)
  //     3. Legal note paragraph
  //     4. Copyright + group badge row
  //   </footer>
  return (
    <footer className="bg-[#148f8a] text-white/65">
      {/* ============== TOP CTA STRIP ============== */}
      {/* A subtle teal-tinted gradient strip with a WhatsApp icon, a short
          prompt and a gradient "WhatsApp Us" button. The button is a plain
          <a> that opens WhatsApp in a new tab using companyFacts.whatsappUrl. */}
      <div className="border-b border-white/10 bg-[#148f8a]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          {/* Left: icon tile + two-line prompt (title + body) */}
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1ab5ad] text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-base font-bold text-white">
                {t.footer.ctaTitle}
              </div>
              <div className="text-xs text-slate-400">{t.footer.ctaBody}</div>
            </div>
          </div>
          {/* Right: gradient WhatsApp button — uses companyFacts.whatsappUrl
              so the number lives in one place (site-data.ts). */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Room booking — the self-service path, so it leads. */}
            <RouterLink
              to="book"
              className="inline-flex items-center gap-2 rounded-full bg-[#d4a94c] px-5 py-2.5 text-sm font-semibold text-[#148f8a] shadow-none transition hover:bg-[#e0bc68] focus:outline-none focus:ring-2 focus:ring-[#7ae2dc] focus:ring-offset-2 focus:ring-offset-[#148f8a]"
            >
              <CalendarDays className="h-4 w-4" />
              {t.booking.ctaShort}
            </RouterLink>
            {/* WhatsApp — for anything that needs a human. */}
            <a
              href={companyFacts.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#7ae2dc] focus:ring-offset-2 focus:ring-offset-[#148f8a]"
            >
              <MessageCircle className="h-4 w-4" />
              {t.footer.ctaButton}
            </a>
          </div>
        </div>
      </div>

      {/* ============== MAIN FOOTER GRID ============== */}
      {/* 5 columns on large screens (lg:grid-cols-5). Brand takes 2 cols,
          then Explore, Legal, and Connect each take 1 col. */}
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* ---------- BRAND COLUMN (spans 2 of 5) ---------- */}
          <div className="lg:col-span-2">
            {/* Logo — same look as the navbar logo but with a lighter teal
                tone suited to the dark background. */}
            <RouterLink to="home" className="flex items-center gap-2.5" aria-label="Smarthub Connect home">
              <img 
                src="/smarthub-logo.png" 
                alt="Smarthub Connect" 
                className="h-10 w-auto object-contain" 
              />
              <div className="flex flex-col leading-tight">
                <span className="font-display text-base font-bold text-white">
                  Smarthub<span className="text-teal-400"> Connect</span>
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Hong Kong · Wan Chai
                </span>
              </div>
            </RouterLink>
            {/* Tagline paragraph from translations. */}
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
              {t.footer.tagline}
            </p>

            {/* TCSP licence badge — pulls the licence number from
                companyFacts so it stays in sync with the rest of the site. */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
              <span className="font-semibold text-teal-300">
                TCSP Licensed · {companyFacts.tcspLicence}
              </span>
            </div>
          </div>

          {/* ---------- EXPLORE COLUMN ---------- */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.footer.explore}
            </h4>
            {/* Each link is a RouterLink so navigation is instant (no full
                page reload). Hover/focus turns the text teal. */}
            <ul className="mt-4 space-y-2.5 text-sm">
              {exploreLinks.map((l, i) => (
                <li key={i}>
                  <RouterLink to={l.to} className="transition hover:text-teal-400 focus:outline-none focus:text-teal-400">
                    {l.label}
                  </RouterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- LEGAL COLUMN ---------- */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.footer.legal}
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              {legalLinks.map((l, i) => (
                <li key={i}>
                  <RouterLink to={l.to} className="transition hover:text-teal-400 focus:outline-none focus:text-teal-400">
                    {l.label}
                  </RouterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- CONNECT COLUMN ---------- */}
          {/* Shows the real contact details from companyFacts. Each row is a
              clickable link (tel:, wa.me, mailto:) where appropriate. */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-300">
              {t.footer.connect}
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              {/* Address — not clickable, just text with a MapPin icon. */}
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                <span>{companyFacts.address}</span>
              </li>
              {/* Phone — tel: link, with whitespace stripped from the number. */}
              <li>
                <a href={`tel:${companyFacts.phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 transition hover:text-teal-400">
                  <Phone className="h-3.5 w-3.5 text-teal-400" />
                  {companyFacts.phone}
                </a>
              </li>
              {/* WhatsApp — opens chat in a new tab. Number is shown as
                  "WhatsApp 5501 3516" for readability. */}
              <li>
                <a
                  href={companyFacts.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 transition hover:text-teal-400"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-teal-400" />
                  WhatsApp 5501 3516
                </a>
              </li>
              {/* Email — mailto: link. */}
              <li>
                <a href={`mailto:${companyFacts.email}`} className="flex items-center gap-2.5 transition hover:text-teal-400">
                  <Mail className="h-3.5 w-3.5 text-teal-400" />
                  {companyFacts.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ============== LEGAL NOTE ============== */}
        {/* Small-print disclaimer paragraph above the bottom bar. */}
        <p className="mt-12 border-t border-white/5 pt-6 text-[11px] leading-relaxed text-slate-500">
          {t.footer.note}
        </p>

        {/* ============== BOTTOM BAR ============== */}
        {/* Copyright line on the left, group/domain badges on the right.
            The year is computed at render time with `new Date().getFullYear()`. */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <div>
            © {new Date().getFullYear()} {companyFacts.legalName}. {t.footer.rights}
          </div>
          <div className="flex items-center gap-4">
            {/* Green dot + "MCM Group Member" badge. */}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              MCM Group Member
            </span>
            {/* Domain name shown for trust. */}
            <span>{companyFacts.domain}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
