"use client";

/**
 * ============================================================================
 * FILE: page-hero.tsx — Reusable Page Hero Block
 * ============================================================================
 * WHAT IT IS:
 *   A reusable "hero" header section used at the top of every subpage
 *   (About, Services, Why HK, Pricing, Insights, Contact, etc.).
 *
 * WHAT IT DOES:
 *   - Renders a dark section with a full-bleed background image and a
 *     gradient overlay for legibility.
 *   - Overlays three text elements: an eyebrow pill (small label), a large
 *     <h1> title, and an optional lead paragraph.
 *   - Adds a decorative white "wave" SVG at the bottom that creates a
 *     smooth visual transition into the white page content below.
 *   - Accepts props so each page can customise the eyebrow text, title,
 *     lead, image, alignment, and height.
 *
 * HOW IT FITS IN:
 *   This is a "block" component — a reusable UI piece that pages compose
 *   together. Every subpage starts with `<PageHero .../>` followed by
 *   sections of content. Uses Next.js's built-in `<Image>` for optimised
 *   image loading.
 * ============================================================================
 */

import { ReactNode } from "react";

/**
 * PageHero — the reusable page hero block.
 *
 * Inputs (props):
 *   - eyebrow: string       — small label shown in the eyebrow pill.
 *   - title:   ReactNode    — the big <h1> title. Accepts ReactNode (not
 *                             just string) so callers can include spans
 *                             for accent colours, e.g. <span className="text-teal-300">Hong Kong</span>.
 *   - lead?:   string       — optional supporting paragraph below the title.
 *   - image:   string       — URL of the background image (typically a path
 *                             to an image in /public, e.g. "/images/about.jpg").
 *   - align?:  "left" | "center" — text alignment. Default "left".
 *   - height?: "sm" | "md" | "lg" — vertical padding preset. Default "md".
 *
 * Produces: a relative-positioned <section> with a background image, dark
 * gradient overlay, an eyebrow pill, an <h1>, an optional lead, and a
 * bottom wave divider.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  align = "left",
  height = "md",
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  image: string;
  align?: "left" | "center";
  height?: "sm" | "md" | "lg";
}) {
  /**
   * Map the `height` prop to a Tailwind padding class string. Larger
   * presets add more vertical padding, making the hero section taller.
   * `lg:` variants apply even larger padding on desktop viewports.
   */
  const heights = {
    sm: "py-20 lg:py-24",
    md: "py-24 lg:py-32",
    lg: "py-32 lg:py-40",
  };

  return (
    // `relative isolate` creates a new stacking context so absolutely
    // positioned children (the image and overlay) stay scoped to this
    // section. `overflow-hidden` clips the wave SVG cleanly at the edges.
    <section className={`relative isolate overflow-hidden bg-[#1ab5ad] ${heights[height]}`}>
      {/* The official site uses a confident solid-teal interior hero with
          two barely-there circular outlines rather than a photo overlay. */}
      <div aria-hidden className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full border border-white/15" />
      <div aria-hidden className="absolute -right-36 -top-36 h-[500px] w-[500px] rounded-full border border-white/10" />

      {/* ============== CONTENT CONTAINER ============== */}
      {/* `max-w-7xl px-6` is the standard site container width. When
          align="center", we add `text-center` and constrain the inner
          block to `max-w-3xl mx-auto` so the text doesn't span too wide. */}
      <div
        className={`mx-auto max-w-7xl px-6 ${
          align === "center" ? "text-center" : ""
        }`}
      >
        <div className={align === "center" ? "mx-auto max-w-3xl" : "max-w-3xl"}>
          {/* Eyebrow pill — a small uppercase label with a teal dot. The
              pill has a translucent teal background, a teal border, and
              `backdrop-blur` so the background image subtly shows through. */}
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-200 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-300" />
            {eyebrow}
          </span>
          {/* The <h1> title. Big and bold, with a tight line-height
              (leading-[1.1]) for visual impact. Responsive sizes scale
              from 4xl on mobile to 6xl on large screens. */}
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {/* Optional lead paragraph. Rendered only if `lead` was passed.
              When centered, `mx-auto` constrains its width. */}
          {lead && (
            <p
              className={`mt-6 text-base leading-relaxed text-slate-200 sm:text-lg ${
                align === "center" ? "mx-auto" : ""
              } max-w-2xl`}
            >
              {lead}
            </p>
          )}
        </div>
      </div>

      {/* ============== BOTTOM WAVE DIVIDER ============== */}
      {/* A decorative white SVG wave at the bottom edge of the hero. It
          creates a smooth visual transition into the white page content
          below. `preserveAspectRatio="none"` lets the SVG stretch to the
          full width without distortion. `aria-hidden` because it's purely
          decorative. */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
        <svg
          viewBox="0 0 1440 60"
          preserveAspectRatio="none"
          className="h-8 w-full fill-white sm:h-10"
          aria-hidden
        >
          <path d="M0,30 C360,60 720,0 1080,20 C1260,30 1380,28 1440,22 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  );
}
