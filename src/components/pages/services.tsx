"use client";

/*
 * =====================================================================
 * FILE: services.tsx — The Services page (route: "services", URL: #/services)
 * =====================================================================
 * WHAT THIS FILE IS
 *   The detailed services catalog. Lists the 4 core Smarthub Connect
 *   services (Company Incorporation, Registered Office, Workspace, Meeting
 *   Rooms) in alternating image/text rows, plus a pricing teaser card and a
 *   closing CTA.
 *
 * WHAT IT DOES
 *   Renders <ServicesPage /> — a PageHero, then for each of the 4 services
 *   a two-column row with an image on one side and the description, feature
 *   checklist, and a "Get started" CTA on the other. Every other row flips
 *   the image to the opposite side for visual rhythm. Ends with a pricing
 *   teaser card and a CTABand.
 *
 * HOW IT FITS IN
 *   - Exported as `ServicesPage`, rendered by RouterOutlet in src/app/page.tsx
 *     when route === "services".
 *   - Service copy comes from t.services.items (an array of 4 translated
 *     objects with tag, title, desc, features[]). Page-level copy comes from
 *     pageContent[lang].pages.services.
 * =====================================================================
 */

import { useLang } from "@/lib/i18n/lang-context";
import { pageContent } from "@/lib/i18n/page-content";
import { PageHero } from "@/components/blocks/page-hero";
import { SectionHeading } from "@/components/blocks/section-heading";
import { CTABand } from "@/components/blocks/cta-band";
import { RoomRates } from "@/components/blocks/room-rates";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Briefcase, Building2, Wifi, Presentation } from "lucide-react";
import Image from "next/image";
import { RouterLink } from "@/lib/router";

// One stock photo per service, indexed by position. Used in the alternating rows.
const SERVICE_IMAGES = [
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1400&q=80",
];

// One Lucide icon per service, indexed by position. Shown as a badge on the image.
const SERVICE_ICONS = [Briefcase, Building2, Wifi, Presentation];

/**
 * ServicesPage — top-level page component for the /services route.
 *
 * Inputs: none (reads from the language context).
 * Returns: a React fragment with PageHero + alternating services list +
 *   pricing teaser + CTABand.
 *
 * Hooks: useLang() → { t, lang }. `t` provides the services items array;
 *   `lang` is used to read page-level copy from pageContent.
 */
export function ServicesPage() {
  const { t, lang } = useLang();
  // Shortcut to page-level copy (hero, section CTA labels, pricing teaser text).
  const p = pageContent[lang].pages.services;

  return (
    <>
      {/* PAGE HERO: medium-height dark image banner with eyebrow, H1, and lead. */}
      <PageHero
        eyebrow={p.heroEyebrow}
        title={p.heroTitle}
        lead={p.heroLead}
        image="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80"
        height="md"
      />

      {/* ===== DETAILED SERVICES (alternating image/text) ===== */}
      {/* DETAILED SERVICES SECTION: maps over t.services.items (4 entries). Each
          entry renders as a two-column row. The `flip = i % 2 === 1` flag flips
          the image to the right on odd rows (1st and 3rd rows have image left,
          2nd and 4th have image right) for a zig-zag visual rhythm. */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="space-y-24 lg:space-y-32">
            {t.services.items.map((svc, i) => {
              // Pick the icon for this service; fallback to Briefcase if missing.
              const Icon = SERVICE_ICONS[i] ?? Briefcase;
              // Flip the image to the right on odd-indexed rows (2nd, 4th, ...).
              const flip = i % 2 === 1;
              // The last service ("Meeting & Event Space") is bookable online,
              // so its CTA points at the booking funnel rather than the
              // generic enquiry form.
              const isBookable = i === t.services.items.length - 1;
              return (
                <div
                  key={i}
                  className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
                >
                  {/* Image column — order is swapped to the right when `flip` is true. */}
                  <div className={flip ? "lg:order-2" : ""}>
                    <div className="relative aspect-[5/4] overflow-hidden rounded-3xl shadow-2xl shadow-slate-900/10">
                      <Image
                        src={SERVICE_IMAGES[i]}
                        alt={svc.title}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
                      {/* Number badge */}
                      <div className="absolute left-5 top-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 backdrop-blur">
                        <Icon className="h-6 w-6 text-teal-600" />
                      </div>
                    </div>
                  </div>

                  {/* Text column — order is swapped to the left when `flip` is true. */}
                  <div className={flip ? "lg:order-1" : ""}>
                    {/* Tag pill above the service title. */}
                    <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      {svc.tag}
                    </span>
                    <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
                      {svc.title}
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
                      {svc.desc}
                    </p>
                    {/* Feature checklist — 2-column grid of checked items. */}
                    <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                      {svc.features.map((f, j) => (
                        <li
                          key={j}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-100">
                            <Check className="h-2.5 w-2.5 text-teal-700" />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                    {/* CTA row. The "Meeting & Event Space" service (last in
                        the list) is self-service, so it sends visitors to the
                        booking page instead of the generic enquiry form; the
                        enquiry link stays available as a secondary action. */}
                    <div className="mt-7 flex flex-wrap gap-3">
                      {isBookable ? (
                        <>
                          <Button
                            asChild
                            className="bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
                          >
                            <RouterLink to="book">
                              {t.booking.bookAllCta}
                              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </RouterLink>
                          </Button>
                          <Button asChild variant="outline" className="border-slate-200">
                            <RouterLink to="contact">{p.detailCta}</RouterLink>
                          </Button>
                        </>
                      ) : (
                        <Button
                          asChild
                          className="bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
                        >
                          <RouterLink to="contact">
                            {p.detailCta}
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </RouterLink>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== BOOKABLE ROOM RATES ===== */}
      {/* Shows the live hourly/daily rates for the six bookable spaces. Each
          row deep-links into #/book with that room preselected, turning the
          "Meeting & Event Space" service above into a one-click action. */}
      <section className="bg-white pb-20 lg:pb-24">
        <div className="mx-auto max-w-5xl px-6">
          <RoomRates />
        </div>
      </section>

      {/* ===== PRICING TEASER ===== */}
      {/* PRICING TEASER SECTION: a single white card on a soft gradient.
          Left side has a heading + body; right side has a large button linking
          to /pricing. Designed to nudge visitors from "what we do" to "what it costs". */}
      <section className="bg-gradient-to-br from-teal-50 via-white to-rose-50 py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5 sm:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h3 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                  {p.pricingTeaserTitle}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-slate-600">
                  {p.pricingTeaserBody}
                </p>
              </div>
              <div className="lg:justify-self-end">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/25"
                >
                  <RouterLink to="pricing">
                    {p.pricingTeaserCta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </RouterLink>
                </Button>
              </div>
            </div>
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
