"use client";

/*
 * =====================================================================
 * FILE: home.tsx — The Homepage (route: "home", URL: #/)
 * =====================================================================
 * WHAT THIS FILE IS
 *   This is the marketing homepage for Smarthub Connect Limited. It is the
 *   first thing visitors see when they land on the site.
 *
 * WHAT IT DOES
 *   Renders a single React component (<HomePage />) composed of several
 *   stacked <section> blocks that together tell the company's story and
 *   drive the visitor toward booking a consultation.
 *
 * HOW IT FITS IN
 *   - Exported as `HomePage` and imported by src/app/page.tsx, where a
 *     hash-based RouterOutlet renders it when the route is "home".
 *   - All visible text comes from translation dictionaries (useLang() +
 *     pageContent), so the same component serves English, Cantonese, and
 *     Mandarin users without code changes.
 *
 * SECTIONS IN ORDER
 *   1. HERO       — full-bleed image, gradient overlay, headline, CTAs,
 *                    trust badges, bottom stats strip
 *   2. INTRO BAND — short company intro with a 4-tile stats grid
 *   3. SERVICES PREVIEW — 4 service cards linking to /services
 *   4. BOOKING BAND — room booking promo with 3 quick-pick room tiles
 *   5. WHY HK PREVIEW — dark band teasing the Why-Hong-Kong page
 *   6. INSIGHTS PREVIEW — 3 article cards linking to /insights
 *   7. CTA BAND   — final call-to-action band (reusable <CTABand />)
 * =====================================================================
 */

import { useLang } from "@/lib/i18n/lang-context";
import { pageContent } from "@/lib/i18n/page-content";
import { RouterLink } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { CTABand } from "@/components/blocks/cta-band";
import { ArrowRight, CalendarDays, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { heroStats } from "@/lib/site-data";
import { ROOMS, formatHKD } from "@/lib/booking-data";
import Image from "next/image";

// Four stock photos (one per service card) used in the SERVICES PREVIEW grid.
// Indexed by position so the i-th service card always shows the same image.
const SERVICE_IMAGES = [
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
];

// Three stock photos for the INSIGHTS PREVIEW article cards.
const INSIGHT_IMAGES = [
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
];

/**
 * HomePage — top-level page component for the homepage route.
 *
 * Inputs: none (it reads everything from the language context).
 * Returns: a React fragment containing all homepage <section> blocks.
 *
 * Hooks used:
 *   - useLang() returns { t, lang } where:
 *       • lang is the active language code ("en" | "zh-HK" | "zh-CN")
 *       • t is the full translation dictionary for that language,
 *         including arrays of service/insight items.
 *   - pageContent[lang].pages.home (`p`) is the page-specific copy:
 *       headlines, eyebrows, CTAs, leads, etc.
 *   - heroStats[lang] is the 4-item stats array shown in the hero strip
 *     and the intro band.
 */
export function HomePage() {
  // Pull the active language and the translation dictionary from context.
  const { t, lang } = useLang();
  // `p` is a shortcut to this page's translated copy (headlines, eyebrows, CTAs).
  const p = pageContent[lang].pages.home;
  // `stats` is the array of {num, label} stat tiles shown in two places.
  const stats = heroStats[lang];

  return (
    <>
      {/* ===== HERO (full-bleed, Corient-style) ===== */}
      {/* HERO SECTION: a full-height banner with a Wan Chai skyline photo,
          a dark gradient overlay, the company headline, two CTA buttons,
          trust badges, and a bottom stats strip. */}
      <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-slate-900">
        {/* Background layer: full-bleed image + gradient overlay + soft glow.
            `priority` tells Next.js to preload this image (it's above the fold).
            `fill` + `sizes="100vw"` let the browser pick the right resolution. */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=2400&q=80"
            alt="Hong Kong Wan Chai skyline at dusk"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Dark-to-teal gradient so white text is readable on top of the photo. */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-teal-900/60" />
          {/* Decorative blurred glow for visual depth. */}
          <div className="absolute -bottom-32 left-1/2 h-96 w-[120%] -translate-x-1/2 rounded-full bg-teal-500/20 blur-3xl" />
        </div>

        {/* Hero content column: eyebrow pill, headline, lead text, CTAs, badges. */}
        <div className="mx-auto w-full max-w-7xl px-6 py-24">
          <div className="max-w-3xl">
            {/* Eyebrow pill with an animated pulse dot — small label above the H1. */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-teal-100 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-teal-300" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-300" />
              </span>
              {p.heroEyebrow}
            </div>

            {/* H1 headline: main title + an accent word with a teal gradient fill. */}
            <h1 className="font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              {p.heroTitle}{" "}
              <span className="bg-gradient-to-r from-teal-300 via-teal-200 to-emerald-200 bg-clip-text text-transparent">
                {p.heroAccent}
              </span>
            </h1>

            {/* Lead paragraph below the headline — sets the value proposition. */}
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-200">
              {p.heroLead}
            </p>

            {/* Two CTA buttons: primary "Explore services" (RouterLink → /services)
                and secondary "Get in touch" (RouterLink → /contact).
                `asChild` lets the Button component render the RouterLink as its root
                element so the link keeps button styling. */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="btn-shimmer bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-xl shadow-teal-500/30 hover:from-teal-400 hover:to-teal-500"
              >
                <RouterLink to="services">
                  {p.heroCta1}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </RouterLink>
              </Button>
              {/* Secondary hero CTA — sends visitors straight to the room
                  booking funnel (#/book) rather than the generic contact
                  form, since booking a space is the fastest way to see the
                  office and the site's main self-service action. */}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white backdrop-blur hover:bg-white/15"
              >
                <RouterLink to="book">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {t.booking.ctaShort}
                </RouterLink>
              </Button>
            </div>

            {/* Trust badges: small inline credentials that build credibility.
                These are static (hard-coded) — license #, address, group membership. */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-300">
              <div className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-300" />
                <span>TCSP TC010264</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-300" />
                <span>25/F, 88 Lockhart Road, Wan Chai</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-300" />
                <span>MCM Group Member</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip pinned to the bottom of the hero — only on large screens.
            Maps over the 4-item `stats` array to render {num, label} tiles. */}
        <div className="absolute bottom-0 left-0 right-0 z-10 hidden border-t border-white/10 bg-slate-950/40 backdrop-blur lg:block">
          <div className="mx-auto grid max-w-7xl grid-cols-4 px-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`px-6 py-5 ${
                  i !== 0 ? "border-l border-white/10" : ""
                }`}
              >
                <div className="font-display text-2xl font-bold text-white xl:text-3xl">
                  {stat.num}
                </div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INTRO BAND ===== */}
      {/* INTRO BAND SECTION: white background, two-column layout — left side has
          the company intro copy + a "Learn more" button to /about; right side
          has a 2x2 stats grid built from the same `stats` array. */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left column (7 of 12 grid cols): eyebrow, headline, paragraph, CTA. */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                {p.introEyebrow}
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {p.introTitle}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
                {p.introBody}
              </p>
              <div className="mt-8">
                <Button
                  asChild
                  variant="outline"
                  className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
                >
                  <RouterLink to="about">
                    {p.introCta}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </RouterLink>
                </Button>
              </div>
            </div>

            {/* Stats column (5 of 12 grid cols): 2x2 grid of stat tiles.
                The `gap-px` + `bg-slate-200` trick draws thin divider lines
                between tiles without needing extra borders. */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white p-6">
                    <div className="font-display text-3xl font-bold text-teal-600 sm:text-4xl">
                      {stat.num}
                    </div>
                    <div className="mt-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES PREVIEW ===== */}
      {/* SERVICES PREVIEW SECTION: a heading row + a 4-card grid. Each card
          is a RouterLink to /services and shows a service image, title,
          short description, and a "Learn more" affordance. */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                {p.servicesEyebrow}
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {p.servicesTitle}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
                {p.servicesLead}
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="shrink-0 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
            >
              <RouterLink to="services">
                {p.servicesCta}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </RouterLink>
            </Button>
          </div>

          {/* 4-column responsive grid of service preview cards.
              `t.services.items` is an array of {title, desc, ...} translated
              per language; we map over it and pair each with SERVICE_IMAGES[i]. */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {t.services.items.map((svc, i) => (
              <RouterLink
                key={i}
                to="services"
                className="lift-card group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={SERVICE_IMAGES[i]}
                    alt={svc.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                  <span className="absolute bottom-3 left-3 right-3 font-display text-base font-bold text-white">
                    {svc.title}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
                    {svc.desc}
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700">
                    {p.servicesCta}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </RouterLink>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ROOM BOOKING BAND ===== */}
      {/* A dedicated strip promoting the self-service room booking funnel.
          The three room chips deep-link straight to #/book?room=<id>, so a
          visitor can go from the homepage to a preselected booking form in
          one click. Room data comes from booking-data.ts, the same source
          the booking page and the Google Form bridge use. */}
      <section className="border-y border-slate-100 bg-gradient-to-br from-teal-50 via-white to-emerald-50/40 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                {t.booking.homeEyebrow}
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                {t.booking.homeTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                {t.booking.homeLead}
              </p>
              <div className="mt-7">
                <Button
                  asChild
                  size="lg"
                  className="btn-shimmer bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
                >
                  <RouterLink to="book">
                    {t.booking.homeCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </RouterLink>
                </Button>
              </div>
            </div>

            {/* Quick-pick tiles for the three most-requested spaces. */}
            <div className="lg:col-span-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {ROOMS.filter((r) =>
                  ["meeting-a", "hot-desk", "event-space"].includes(r.id)
                ).map((room) => (
                  <RouterLink
                    key={room.id}
                    to="book"
                    query={{ room: room.id }}
                    className="lift-card group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {room.emoji}
                    </span>
                    <span className="mt-3 font-display text-sm font-bold text-slate-900">
                      {room.name[lang]}
                    </span>
                    <span className="mt-1 text-xs text-slate-500">
                      {room.capacity} pax
                    </span>
                    <span className="mt-3 text-sm font-bold text-teal-700">
                      {formatHKD(room.rate)}
                      {room.unit === "hour" ? t.booking.perHour : t.booking.perDay}
                    </span>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700">
                      {t.booking.bookCta}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </RouterLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY HK PREVIEW ===== */}
      {/* WHY-HONG-KONG PREVIEW: dark section with a Hong Kong image overlay.
          Left column has a heading + CTA button to /why-hk; right column shows
          the first 4 cards from t.whyhk.cards as a 2x2 glass-tile grid. */}
      <section className="relative overflow-hidden bg-slate-900 py-20 text-white lg:py-28">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=2400&q=80"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-teal-900/80" />
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-200">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                {p.whyhkEyebrow}
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                {p.whyhkTitle}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-200 sm:text-lg">
                {p.whyhkLead}
              </p>
              <div className="mt-8">
                <Button
                  asChild
                  className="bg-white text-slate-900 hover:bg-slate-100"
                >
                  <RouterLink to="why-hk">
                    {p.whyhkCta}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </RouterLink>
                </Button>
              </div>
            </div>
            {/* Right column: 2x2 grid of glass-style cards showing the first
                4 benefits of doing business in HK (teaser for /why-hk page). */}
            <div className="grid grid-cols-2 gap-4">
              {t.whyhk.cards.slice(0, 4).map((c, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <h3 className="font-display text-base font-bold text-white">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== INSIGHTS PREVIEW ===== */}
      {/* INSIGHTS PREVIEW SECTION: heading row + 3-column grid of article cards.
          Each card shows a hero image, category pill, date, title, and excerpt.
          Maps over t.insights.items and pairs with INSIGHT_IMAGES[i]. */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                {p.insightsEyebrow}
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                {p.insightsTitle}
              </h2>
            </div>
            <Button
              asChild
              variant="outline"
              className="shrink-0 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
            >
              <RouterLink to="insights">
                {p.insightsCta}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </RouterLink>
            </Button>
          </div>

          {/* 3-column responsive grid of insight article cards. */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {t.insights.items.map((item, i) => (
              <article
                key={i}
                className="lift-card group flex flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={INSIGHT_IMAGES[i]}
                    alt={item.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-700 backdrop-blur">
                    {item.cat}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    {item.date}
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold leading-snug text-slate-900 transition group-hover:text-teal-700">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600 line-clamp-3">
                    {item.excerpt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BAND ===== */}
      {/* Final call-to-action band — a reusable <CTABand /> component that
          renders a teal gradient panel with a headline, lead text, and a
          button linking to /contact. */}
      <CTABand
        title={p.ctaTitle}
        lead={p.ctaLead}
        buttonLabel={p.ctaButton}
        buttonTo="contact"
      />
    </>
  );
}
