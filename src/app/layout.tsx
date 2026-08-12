/**
 * ROOT LAYOUT (Next.js App Router)
 * =================================================================
 * WHAT THIS FILE IS:
 *   The top-level shell that wraps EVERY page in the Next.js App Router.
 *   In Next.js 13+, any file named `layout.tsx` inside `app/` defines a
 *   layout that surrounds all pages in that folder and its subfolders.
 *   This `app/layout.tsx` is the *root* layout — it wraps everything.
 *
 * WHAT IT DOES:
 *   - Imports two web fonts (Plus Jakarta Sans for headings, DM Sans for body)
 *   - Imports the global stylesheet (`globals.css`) so Tailwind loads
 *   - Declares SEO `metadata` (title, description, OpenGraph, Twitter cards,
 *     favicons, etc.) that Next.js turns into <meta> tags in the <head>
 *   - Embeds JSON-LD structured data so Google understands we are a
 *     LocalBusiness / FinancialService in Hong Kong
 *   - Wraps the page content in <LangProvider> (so the trilingual dictionary
 *     is available everywhere) and renders the toast notifications <Toaster>
 *
 * HOW IT FITS IN THE BIGGER PICTURE:
 *   `src/app/page.tsx` is the actual page content (the `children` prop here).
 *   Anything you put in this layout shows up on every route of the site —
 *   which is why it's the perfect place for fonts, SEO, and global providers.
 */
import type { Metadata } from "next";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource-variable/dm-sans";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LangProvider } from "@/lib/i18n/lang-context";
import { companyFacts } from "@/lib/site-data";

/**
 * `metadata` is a Next.js convention. By exporting a `metadata` object from a
 * layout or page, Next.js automatically injects the right <meta> tags into the
 * HTML <head> at build time. This is great for SEO — search engines and social
 * media previews (Twitter cards, Facebook OpenGraph) read these tags.
 *
 * NOTE: companyFacts is imported from `src/lib/site-data.ts` so phone/email/
 * domain stay in ONE place. If the company moves or renames, you only update
 * site-data.ts and every meta tag updates too.
 */
export const metadata: Metadata = {
  // `default` is the title used when a page doesn't specify one.
  // `template` is applied as a suffix on pages that DO specify a title —
  // e.g. a page setting title "About" becomes "About · Smarthub Connect".
  title: {
    default: "Smarthub Connect — Hong Kong Corporate Services & Workspaces",
    template: "%s · Smarthub Connect",
  },
  // Short paragraph search engines show under the title in results.
  description:
    "Smarthub Connect Limited is a Hong Kong TCSP-licensed corporate services provider offering company incorporation, secretarial compliance, serviced offices, virtual offices and meeting rooms in Wan Chai.",
  // Keywords help some search engines and internal search tools.
  keywords: [
    "Hong Kong company incorporation",
    "TCSP",
    "Wan Chai office",
    "serviced office Hong Kong",
    "virtual office HK",
    "company secretary Hong Kong",
    "Smarthub Connect",
  ],
  authors: [{ name: companyFacts.legalName }],
  // Used to resolve RELATIVE URLs in metadata (e.g. og:image) to absolute.
  metadataBase: new URL(`https://${companyFacts.domain}`),
  // Tells search engines this URL is the canonical version, and that we
  // also serve English + Traditional + Simplified Chinese from the same URL.
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      "zh-Hant": "/",
      "zh-Hans": "/",
    },
  },
  // Multiple favicon sizes for different devices/browsers.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  // Link to the PWA manifest so Android/Chrome can offer "Add to Home screen".
  manifest: "/manifest.json",
  // OpenGraph = Facebook / LinkedIn / WhatsApp link previews.
  openGraph: {
    title: "Smarthub Connect — Hong Kong Corporate Services & Workspaces",
    description:
      "TCSP-licensed corporate services and Grade-A workspaces in Wan Chai, Hong Kong. Part of the MCM Group ecosystem.",
    url: `https://${companyFacts.domain}`,
    siteName: "Smarthub Connect",
    type: "website",
    images: ["/og-image.png"],
  },
  // Twitter "card" preview when someone tweets this URL.
  twitter: {
    card: "summary_large_image",
    title: "Smarthub Connect — Hong Kong Corporate Services & Workspaces",
    description: "TCSP-licensed corporate services and Grade-A workspaces in Wan Chai, Hong Kong.",
    images: ["/og-image.png"],
  },
  // Tells crawlers we DO want to be indexed and links DO want to be followed.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * JSON-LD structured data for LocalBusiness / FinancialService
 * ---------------------------------------------------------------
 * JSON-LD is a special <script> block in the <head> that Google reads to
 * understand WHAT kind of business this page is about (e.g. a LocalBusiness).
 * It powers "rich results" like the Google business panel showing address,
 * opening hours, phone number, etc. directly in search results.
 *
 * The @type array says we're BOTH a LocalBusiness AND a FinancialService.
 * All values come from `companyFacts` so there's a single source of truth.
 */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "FinancialService"],
  "@id": `https://${companyFacts.domain}/#business`,
  name: companyFacts.legalName,
  alternateName: companyFacts.shortName,
  url: `https://${companyFacts.domain}`,
  email: companyFacts.email,
  telephone: companyFacts.phone,
  faxNumber: undefined,
  // Postal address — used by Google Maps + local search.
  address: {
    "@type": "PostalAddress",
    streetAddress: "25/F, 88 Lockhart Road, Wan Chai",
    addressLocality: "Hong Kong",
    addressRegion: "HK",
    addressCountry: "HK",
  },
  // GPS coordinates — used for "near me" search and map pins.
  geo: {
    "@type": "GeoCoordinates",
    latitude: 22.2768,
    longitude: 114.1730,
  },
  // Opening hours split by day group — weekdays vs Saturday.
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "10:00",
      closes: "14:00",
    },
  ],
  areaServed: { "@type": "Country", name: "Hong Kong" },
  knowsLanguage: ["en", "zh-Hant", "zh-Hans"],
  foundingDate: companyFacts.founded,
  license: "TCSP TC010264",
  sameAs: [],
};

/**
 * RootLayout — the React component Next.js renders as the <html> tree.
 *
 * Inputs:
 *   `children` — the page content (i.e. `src/app/page.tsx`).
 *
 * Produces:
 *   The full <html> → <head> + <body> document. Inside <body>:
 *     - <LangProvider> wraps children so every component can call useLang()
 *       to read the current language and the translation dictionary `t`.
 *     - <Toaster /> renders toast notifications triggered anywhere via
 *       the `useToast()` hook.
 *
 * `suppressHydrationWarning` on <html> tells React not to warn when the
 * server-rendered HTML differs from the client (which can happen because
 * `LangProvider` may set a different `lang` attribute based on the user's
 * browser language on first paint).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD structured data injected as a raw script tag.
            `dangerouslySetInnerHTML` is required because React doesn't
            natively understand `type="application/ld+json"` script content. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {/* `font-sans antialiased` apply DM Sans + smoother font rendering.
          `bg-background text-foreground` apply the brand palette tokens
          defined in globals.css. */}
      <body className="font-sans antialiased bg-background text-foreground">
        <LangProvider>{children}</LangProvider>
        <Toaster />
      </body>
    </html>
  );
}
