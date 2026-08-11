"use client";

/*
 * =====================================================================
 * FILE: pricing.tsx — The Pricing page (route: "pricing", URL: #/pricing)
 * =====================================================================
 * WHAT THIS FILE IS
 *   The pricing page. Shows 3 subscription tiers (Starter, Professional,
 *   Enterprise), a workspace add-ons grid, and a FAQ accordion.
 *
 * WHAT IT DOES
 *   Renders <PricingPage /> — a PageHero, then a 3-column tier grid where the
 *   middle "Professional" tier is highlighted as "popular" (border, ring, and a
 *   star badge). Each tier card has a price, description, CTA button that
 *   deep-links to the contact form with the matching service preselected, and
 *   a feature checklist. Below: a workspace add-ons grid (3 columns of
 *   name+price+desc tiles), the bookable-room rate table (<RoomRates />,
 *   whose rows deep-link into the booking page) and a FAQ accordion built on
 *   Radix UI. Closes with a CTABand.
 *
 * HOW IT FITS IN
 *   - Exported as `PricingPage`, rendered by RouterOutlet when route === "pricing".
 *   - Tier and add-on data come from t.pricing.tiers / t.pricing.workspace
 *     (translated arrays). FAQ comes from p.faq. Deep-link CTA builds a
 *     #/contact?service=<encoded> URL that the contact page reads to preselect.
 * =====================================================================
 */

import { useLang } from "@/lib/i18n/lang-context";
import { pageContent } from "@/lib/i18n/page-content";
import { PageHero } from "@/components/blocks/page-hero";
import { SectionHeading } from "@/components/blocks/section-heading";
import { CTABand } from "@/components/blocks/cta-band";
import { RoomRates } from "@/components/blocks/room-rates";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Star, ArrowRight } from "lucide-react";
import { RouterLink } from "@/lib/router";

/**
 * PricingPage — top-level page component for the /pricing route.
 *
 * Inputs: none (reads from the language context).
 * Returns: a React fragment with PageHero + 3-tier grid + workspace add-ons +
 *   FAQ accordion + CTABand.
 *
 * Hooks: useLang() → { t, lang }.
 */
export function PricingPage() {
  const { t, lang } = useLang();
  // Page-level copy (hero, FAQ title, FAQ items).
  const p = pageContent[lang].pages.pricing;

  return (
    <>
      {/* PAGE HERO: medium-height dark image banner with eyebrow, H1, and lead. */}
      <PageHero
        eyebrow={p.heroEyebrow}
        title={p.heroTitle}
        lead={p.heroLead}
        image="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=2400&q=80"
        height="md"
      />

      {/* ===== TIERS ===== */}
      {/* TIERS SECTION: 3-column grid of pricing-tier cards. The middle tier is
          marked `popular: true` in the data and gets extra emphasis: a teal
          border + ring, a slight upward translate, and a star badge floating
          above the card. */}
      <section className="bg-gradient-to-b from-white via-teal-50/30 to-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {t.pricing.tiers.map((tier, i) => {
              // `popular` flag from the tier data drives all the highlight styling.
              const isPopular = tier.popular;
              return (
                <div
                  key={i}
                  className={`relative flex flex-col rounded-3xl border bg-white p-7 shadow-sm transition hover:shadow-xl ${
                    isPopular
                      ? "border-teal-500 ring-2 ring-teal-500/30 lg:-translate-y-3"
                      : "border-slate-200"
                  }`}
                >
                  {/* "Most popular" badge — only on the popular tier. Floats above the card top edge. */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                      <Star className="h-3 w-3 fill-current" />
                      {tier.cta}
                    </div>
                  )}

                  <div className="mb-1.5 font-display text-xl font-bold text-slate-900">
                    {tier.name}
                  </div>
                  <p className="text-xs font-medium text-slate-500">{tier.tagline}</p>

                  {/* Price row — shows HK$ prefix for numeric prices, hides it for "Custom". */}
                  <div className="mt-5 flex items-baseline gap-1.5">
                    {tier.price !== "Custom" && tier.price !== "自訂" && (
                      <span className="text-base font-semibold text-slate-500">HK$</span>
                    )}
                    <span className="font-display text-4xl font-bold text-slate-900">
                      {tier.price}
                    </span>
                    {tier.period && (
                      <span className="text-sm font-medium text-slate-500">{tier.period}</span>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-slate-600">{tier.desc}</p>

                  {/* CTA button — a plain <a> (not RouterLink) because it builds a
                      deep-link URL with a query string (#/contact?service=...).
                      The encoded service value is read by the contact page to
                      preselect the matching option in the service dropdown. */}
                  <Button
                    asChild
                    className={`mt-6 w-full ${
                      isPopular
                        ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    <a
                      href={`#/contact?service=${encodeURIComponent(tier.name === "Starter" || tier.name === "入門" || tier.name === "入门"
                        ? t.contact.form.services[0]
                        : tier.name === "Professional" || tier.name === "專業" || tier.name === "专业"
                        ? t.contact.form.services[0]
                        : t.contact.form.services[4]
                      )}`}
                    >
                      {isPopular ? t.nav.cta : tier.cta}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </a>
                  </Button>

                  {/* Divider before the feature list. */}
                  <div className="my-6 h-px bg-slate-100" />

                  {/* Feature checklist — popular tier uses filled teal check circles, others use lighter teal. */}
                  <ul className="flex-1 space-y-3">
                    {tier.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            isPopular ? "bg-teal-500" : "bg-teal-100"
                          }`}
                        >
                          <Check
                            className={`h-2.5 w-2.5 ${isPopular ? "text-white" : "text-teal-700"}`}
                          />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Monthly workspace add-ons — a bordered card containing a 3-column
              grid of smaller add-on tiles (name, price pill, description).
              These are the MONTHLY memberships; the by-the-hour room rates
              live in the <RoomRates /> block below. */}
          <div className="mt-14 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/40 px-6 py-5">
              <h3 className="font-display text-xl font-bold text-slate-900">
                {t.pricing.workspaceTitle}
              </h3>
            </div>
            <div className="grid gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
              {t.pricing.workspace.map((w, i) => (
                <div key={i} className="bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-display text-sm font-bold text-slate-900">{w.name}</h4>
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
                      {w.price}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bookable rooms — the live rate card. Every row deep-links to
              #/book?room=<id>, so a visitor comparing prices is one click
              away from requesting that exact room. Data comes from
              booking-data.ts (the same source the booking form uses). */}
          <div className="mt-8">
            <RoomRates />
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">{t.pricing.disclaimer}</p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      {/* FAQ SECTION: centered SectionHeading + a Radix Accordion. The accordion
          is `type="single" collapsible` so only one item can be open at a time
          and any item can be closed (toggling its own trigger). Each item is a
          question/answer pair from p.faq. */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading eyebrow={t.pricingExtra.faqEyebrow} title={p.faqTitle} align="center" />
          <div className="mt-12">
            {/* Radix UI Accordion (wrapped by shadcn/ui). `type="single"` means
                only one item opens at a time; `collapsible` lets you close it again.
                The `data-[state=open]:...` classes restyle the border/ring when open. */}
            <Accordion type="single" collapsible className="w-full">
              {p.faq.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="rounded-2xl border border-slate-200 bg-white px-6 mb-3 shadow-sm data-[state=open]:border-teal-200 data-[state=open]:ring-1 data-[state=open]:ring-teal-200"
                >
                  <AccordionTrigger className="text-left font-display text-base font-bold text-slate-900 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-slate-600">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA band — reuses homepage CTA copy for consistency. */}
      <CTABand
        title={pageContent[lang].pages.home.ctaTitle}
        lead={pageContent[lang].pages.home.ctaLead}
        buttonLabel={pageContent[lang].pages.home.ctaButton}
        buttonTo="contact"
      />
    </>
  );
}
