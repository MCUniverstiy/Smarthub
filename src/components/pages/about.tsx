"use client";

/*
 * =====================================================================
 * FILE: about.tsx — The About page (route: "about", URL: #/about)
 * =====================================================================
 * WHAT THIS FILE IS
 *   The "About Smarthub Connect" page. Tells visitors the company story,
 *   its four core values, its place in the MCM Group ecosystem, and gives a
 *   short team blurb.
 *
 * WHAT IT DOES
 *   Renders the <AboutPage /> component, composed of: a reusable PageHero,
 *   a STORY section (text + photo + TCSP license card), a VALUES grid
 *   (4 cards with icons), an MCM GROUP dark band (6 entity tiles), a TEAM
 *   section (photo + text), and a final CTABand.
 *
 * HOW IT FITS IN
 *   - Exported as `AboutPage` and rendered by RouterOutlet in src/app/page.tsx
 *     when the active route is "about".
 *   - All copy comes from pageContent[lang].pages.about; the 4 values icons
 *     are hard-coded Lucide icons paired by position with the values array.
 * =====================================================================
 */

import { useLang } from "@/lib/i18n/lang-context";
import { pageContent } from "@/lib/i18n/page-content";
import { PageHero } from "@/components/blocks/page-hero";
import { SectionHeading } from "@/components/blocks/section-heading";
import { CTABand } from "@/components/blocks/cta-band";
import { ShieldCheck, Users, Languages, HeartHandshake } from "lucide-react";
import Image from "next/image";
import { mcmEntities } from "@/lib/site-data";

// Lucide icon components paired by index with the 4 values from pageContent.
// If a 5th value were ever added, the fallback `?? ShieldCheck` keeps it safe.
const VALUE_ICONS = [ShieldCheck, Users, Languages, HeartHandshake];

/**
 * AboutPage — top-level page component for the /about route.
 *
 * Inputs: none (reads from the language context).
 * Returns: a React fragment with PageHero + 4 content sections + CTABand.
 *
 * Hooks: useLang() → { lang } (only `lang` is needed here; copy is in `p`).
 */
export function AboutPage() {
  const { lang } = useLang();
  // Shortcut to the about-page copy in the active language.
  const p = pageContent[lang].pages.about;

  return (
    <>
      {/* PAGE HERO: reusable <PageHero /> block. Renders a dark image banner
          with eyebrow pill, big H1 title, and optional lead text. The `height`
          prop controls vertical padding: sm/md/lg. */}
      <PageHero
        eyebrow={p.heroEyebrow}
        title={p.heroTitle}
        lead={p.heroLead}
        image="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80"
        height="lg"
      />

      {/* ===== STORY ===== */}
      {/* STORY SECTION: two-column layout — left (7 cols) has section heading +
          multi-paragraph body text; right (5 cols) has an office photo plus a
          TCSP licence card showing the regulator and licence number. */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              {/* SectionHeading: reusable block rendering an eyebrow pill + H2.
                  Optional props: align ("left"|"center"), lead, dark. */}
              <SectionHeading eyebrow={p.storyEyebrow} title={p.storyTitle} />
              {/* Story body is an array of paragraphs; we map each to a <p>. */}
              <div className="mt-6 space-y-4">
                {p.storyBody.map((para, i) => (
                  <p key={i} className="text-base leading-relaxed text-slate-600 sm:text-lg">
                    {para}
                  </p>
                ))}
              </div>
            </div>
            {/* Right column: tall office photo + a small licence-credential card. */}
            <div className="lg:col-span-5">
              {/* Office photo in a 4:5 portrait aspect ratio with strong shadow. */}
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl shadow-slate-900/10">
                <Image
                  src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"
                  alt="Wan Chai office space"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
              {/* TCSP licence credential card — hard-coded license number +
                  the issuing authority (Hong Kong Companies Registry). */}
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-8 w-8 text-teal-600" />
                  <div>
                    <div className="font-display text-sm font-bold text-slate-900">
                      TCSP Licensed · TC010264
                    </div>
                    <div className="text-xs text-slate-500">
                      Hong Kong Companies Registry
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== VALUES ===== */}
      {/* VALUES SECTION: centered SectionHeading + 4-card grid (sm:2, lg:4).
          Each card has a colored icon tile, title, and description. Icons are
          picked from VALUE_ICONS by index; a fallback covers any extras. */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow={p.valuesEyebrow}
            title={p.valuesTitle}
            align="center"
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Map each value to a card. The icon is chosen by position from
                VALUE_ICONS; if missing, fall back to ShieldCheck. */}
            {p.values.map((v, i) => {
              const Icon = VALUE_ICONS[i] ?? ShieldCheck;
              return (
                <div
                  key={i}
                  className="lift-card rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
                >
                  <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-600 ring-1 ring-teal-100">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900">
                    {v.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {v.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== MCM GROUP ===== */}
      {/* MCM GROUP SECTION: dark image-overlaid band. Left column has a dark-mode
          SectionHeading + body text explaining the group. Right column is a 2x3
          grid of 6 entity tiles; the "Smarthub" tile is highlighted with a ring
          and labeled "You are here", the rest are labeled "Sister entity". */}
      <section className="relative overflow-hidden bg-slate-900 py-20 text-white lg:py-28">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=2400&q=80"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-teal-900/75" />
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                eyebrow={p.groupEyebrow}
                title={p.groupTitle}
                dark
              />
              <p className="mt-6 text-base leading-relaxed text-slate-200 sm:text-lg">
                {p.groupBody}
              </p>
            </div>
            {/* 2x3 grid of MCM Group entity tiles. The Smarthub tile is visually
                highlighted to show the visitor where this company sits in the group. */}
            <div className="grid grid-cols-2 gap-4">
              {[
                "MCAH",
                "MCAM",
                "MCMWM",
                "MCF",
                "Smarthub",
                "MCU Institute",
              ].map((name, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur ${
                    name === "Smarthub" ? "ring-2 ring-teal-400/40" : ""
                  }`}
                >
                  <div className="font-display text-lg font-bold text-white">
                    {name}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {name === "Smarthub" ? "You are here" : "Sister entity"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TEAM ===== */}
      {/* TEAM SECTION: two-column layout with the photo on the left (desktop) and
          the text on the right. On mobile the order is flipped (text first) using
          `order-1` / `order-2` utilities so visitors read the team intro before
          seeing the picture. */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="order-2 lg:col-span-5 lg:order-1">
              <div className="relative aspect-square overflow-hidden rounded-3xl shadow-2xl shadow-slate-900/10">
                <Image
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
                  alt="Smarthub team at work"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:col-span-7 lg:order-2">
              <SectionHeading eyebrow={p.teamEyebrow} title={p.teamTitle} />
              <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
                {p.teamBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA band — reuses the homepage CTA copy from pageContent[lang].pages.home
          so the closing call-to-action stays consistent across pages. */}
      <CTABand
        title={pageContent[lang].pages.home.ctaTitle}
        lead={pageContent[lang].pages.home.ctaLead}
        buttonLabel={p.groupCta}
        buttonTo="contact"
      />
    </>
  );
}
