/**
 * SITE-WIDE BUSINESS DATA — SINGLE SOURCE OF TRUTH
 * =================================================================
 * WHAT THIS FILE IS:
 *   The ONE place to update Smarthub Connect's company facts and
 *   marketing statistics. Everything else (hero, about, stats band,
 *   why-hk page, footer, layout.tsx metadata, JSON-LD) reads from
 *   here — so updating a phone number or address in ONE spot
 *   automatically propagates across the whole site.
 *
 * WHAT IT DOES:
 *   - Exports `heroStats` — 4 big stats shown in the hero section,
 *     localised per language (en / zh-HK / zh-CN)
 *   - Exports `sectionStats` — 6 stats shown in the mid-page stats
 *     band, also localised per language
 *   - Exports `companyFacts` — the canonical contact + identity
 *     info (legal name, phone, WhatsApp, email, address, hours,
 *     founding year, TCSP licence number, domain)
 *
 * HOW IT FITS IN THE BIGGER PICTURE:
 *   - `src/app/layout.tsx` imports `companyFacts` for SEO metadata
 *     and JSON-LD structured data
 *   - `src/components/pages/home.tsx` imports `heroStats` + `companyFacts`
 *   - `src/components/pages/about.tsx` imports `companyFacts`
 *   - `src/components/sections/footer.tsx` imports `companyFacts`
 *   - `src/components/sections/whatsapp-float.tsx` imports `companyFacts`
 *   - `src/components/pages/contact.tsx` imports `companyFacts`
 *
 * !!! IMPORTANT !!!
 * These numbers are PLACEHOLDERS pending verification by the Smarthub team.
 * Replace each value with the real, verifiable figure before launch.
 * Misleading marketing claims violate the TCSP Code of Practice.
 * =================================================================
 */

import { Lang } from "./i18n/translations";

/**
 * StatItem — the shape of a single statistic shown on the page.
 *   - `num`   : the big bold number/label (e.g. "25+", "TC010264")
 *   - `label` : the small caption underneath (e.g. "Years in Hong Kong")
 */
export type StatItem = { num: string; label: string };

/**
 * heroStats — the 4 hero-section stats shown right under the main heading.
 *
 * This is a `Record<Lang, StatItem[]>` — an object keyed by language code,
 * each holding an array of 4 StatItems. We provide all 3 languages so the
 * numbers stay the same but the captions translate.
 *
 * Used by: `src/components/pages/home.tsx` (hero section).
 */
export const heroStats: Record<Lang, StatItem[]> = {
  en: [
    { num: "25+", label: "Years in Hong Kong" },
    { num: "1,200+", label: "Companies Served" },
    { num: "TC010264", label: "TCSP Licensed" },
    { num: "24/7", label: "Access Available" },
  ],
  "zh-HK": [
    { num: "25+", label: "扎根香港年數" },
    { num: "1,200+", label: "服務公司數目" },
    { num: "TC010264", label: "TCSP 持牌" },
    { num: "24/7", label: "全天候通行" },
  ],
  "zh-CN": [
    { num: "25+", label: "扎根香港年数" },
    { num: "1,200+", label: "服务公司数目" },
    { num: "TC010264", label: "TCSP 持牌" },
    { num: "24/7", label: "全天候通行" },
  ],
};

/**
 * sectionStats — the 6 mid-page stats shown in the stats band section.
 *
 * Same shape as heroStats but with 6 items instead of 4 (adds retention
 * rate, languages spoken, and MTR distance).
 *
 * Used by: `src/components/pages/home.tsx` (stats band) and possibly
 * `src/components/pages/about.tsx`.
 */
export const sectionStats: Record<Lang, StatItem[]> = {
  en: [
    { num: "25+", label: "Years in Hong Kong" },
    { num: "1,200+", label: "Companies Incorporated" },
    { num: "98%", label: "Client Retention" },
    { num: "6", label: "Languages Spoken" },
    { num: "24/7", label: "Office Access" },
    { num: "5 min", label: "From Wan Chai MTR" },
  ],
  "zh-HK": [
    { num: "25+", label: "扎根香港年數" },
    { num: "1,200+", label: "成立公司數目" },
    { num: "98%", label: "客戶續約率" },
    { num: "6", label: "可用語言" },
    { num: "24/7", label: "辦公室通行" },
    { num: "5 分鐘", label: "距灣仔港鐵" },
  ],
  "zh-CN": [
    { num: "25+", label: "扎根香港年数" },
    { num: "1,200+", label: "成立公司数目" },
    { num: "98%", label: "客户续约率" },
    { num: "6", label: "可用语言" },
    { num: "24/7", label: "办公室通行" },
    { num: "5 分钟", label: "距湾仔地铁" },
  ],
};

/**
 * companyFacts — the canonical contact + identity info.
 *
 * This is the SINGLE PLACE to update company information. If Smarthub
 * moves office, change `address` here and the footer, contact page,
 * navbar, JSON-LD, and SEO metadata all update automatically.
 *
 * Field reference:
 *   - `legalName`   : full legal entity name — used in JSON-LD, footer
 *   - `shortName`   : friendly brand name — used in navbar, hero
 *   - `tcspLicence` : HK Companies Registry licence number
 *   - `phone`       : main office phone — used in navbar, footer, contact
 *   - `whatsapp`    : WhatsApp number for chat button
 *   - `whatsappUrl` : pre-built wa.me URL for floating WhatsApp button
 *   - `email`       : general enquiries email
 *   - `address`     : English postal address — used in footer, contact, JSON-LD
 *   - `addressZh`   : Traditional Chinese address (灣仔)
 *   - `addressCn`   : Simplified Chinese address (湾仔)
 *   - `domain`      : site domain (no protocol) — used for SEO/OG URLs
 *   - `hours`       : English opening hours
 *   - `hoursZh`     : Traditional Chinese opening hours
 *   - `hoursCn`     : Simplified Chinese opening hours
 *   - `founded`     : year founded — used in JSON-LD, about page
 */
// Company facts — UPDATE THESE BEFORE LAUNCH
export const companyFacts = {
  legalName: "Smarthub Connect Limited",
  shortName: "Smarthub Connect",
  tcspLicence: "TC010264",
  phone: "+852 2383 3283",
  whatsapp: "+852 5501 3516",
  whatsappUrl: "https://wa.me/85255013516",
  email: "info@smarthubc.com",
  address: "25/F, 88 Lockhart Road, Wan Chai, Hong Kong",
  addressZh: "香港灣仔駱克道 88 號 25 樓",
  addressCn: "香港湾仔骆克道 88 号 25 楼",
  domain: "smarthubc.com",
  hours: "Mon–Fri 9:00–18:30 · Sat 10:00–14:00",
  hoursZh: "週一至五 9:00–18:30 · 週六 10:00–14:00",
  hoursCn: "周一至五 9:00–18:30 · 周六 10:00–14:00",
  founded: "2001",
};
