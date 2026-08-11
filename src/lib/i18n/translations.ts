/**
 * BASE TRANSLATION DICTIONARY (English / Traditional Chinese / Simplified Chinese)
 * =================================================================
 * WHAT THIS FILE IS:
 *   The BASE translation dictionary for the entire Smarthub Connect site.
 *   Holds the short UI strings for the navigation, hero, services,
 *   pricing, contact, footer, etc. in all 3 supported languages.
 *
 *   ⚠️ This file is the BASE only. The full runtime dictionary is built
 *   by `buildDict()` in `./lang-context.tsx`, which merges this file with
 *   `./page-content.ts` (long-form page text) and `./extra-content.ts`
 *   (cookie banner, legal, not-found, etc.). Components read the merged
 *   dictionary via `useLang().t` — they never import this file directly.
 *
 * STRUCTURE:
 *   `translations` is a plain object with 3 top-level keys — one per
 *   language: `en`, `"zh-HK"`, `"zh-CN"`. Each language has the SAME set
 *   of section keys (meta, nav, topbar, hero, about, services, whyhk,
 *   pricing, stats, insights, contact, footer). Each section holds the
 *   strings for one part of the UI.
 *
 *   `as const` at the end tells TypeScript to infer literal types
 *   (e.g. "Starter" instead of `string`), giving better autocomplete.
 *
 * TOP-LEVEL SECTION KEYS (what each controls):
 *   meta       — page <title> + meta description (used by some pages'
 *                Next.js metadata and as JSON-LD fallback)
 *   nav        — top navigation bar labels + CTA button text
 *   topbar     — slim utility strip above navbar (phone, WhatsApp, email,
 *                TCSP licence badge)
 *   hero       — homepage hero: eyebrow, title (split into title +
 *                titleAccent for styling), lead, 2 CTAs, 4 stat items
 *   about      — About page: eyebrow, title, body, body2, 4 bullet points
 *   services   — Services page: 4 service items (each with tag, title,
 *                desc, features list) + a CTA label
 *   whyhk      — "Why Hong Kong" page: eyebrow, title, lead, 6 cards
 *   pricing    — Pricing page: 3 tiers (Starter/Professional/Enterprise,
 *                each with name, price, features list, popular flag) +
 *                6 workspace add-ons + disclaimer
 *   stats      — mid-page stats band: section title + 6 stat items
 *   insights   — Insights/blog page: eyebrow, title, lead, 3 articles
 *   contact    — Contact page: form labels + service options + contact info
 *   footer     — site-wide footer: tagline, link labels, legal note,
 *                copyright
 *
 * HOW TO ADD A NEW STRING:
 *   1. Add it under the SAME section key in all 3 languages (en, zh-HK,
 *      zh-CN). TypeScript will error if you forget one.
 *   2. Use it in a component: `const { t } = useLang(); t.hero.title`
 *
 * HOW TO ADD A NEW LANGUAGE:
 *   1. Add the new code to the `Lang` union type below
 *   2. Add an entry to the `LANGS` array below
 *   3. Add a new top-level key (e.g. `ja: {...}`) to `translations`
 *      mirroring the structure of `en`
 *   4. Repeat for page-content.ts and extra-content.ts
 *   5. Update `detectInitialLang()` in lang-context.tsx to detect it
 * =================================================================
 */

// `Lang` — union type listing the 3 language codes supported by the site.
// Used throughout the codebase to ensure type-safe language switching
// (e.g. `setLang("zh-HK")` is valid; `setLang("zh-TW")` would error).
export type Lang = "en" | "zh-HK" | "zh-CN";

// LANGS — array describing each language for the Language Switcher UI.
// `code`  is the Lang union value (used internally)
// `label` is the full native name (shown in the dropdown)
// `short` is the 1-character label shown on the switcher button (EN / 繁 / 简)
export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "en", label: "English", short: "EN" },
  { code: "zh-HK", label: "繁體中文", short: "繁" },
  { code: "zh-CN", label: "简体中文", short: "简" },
];

// Dict type is now defined in lang-context.tsx (merged from all sources).
// Keep `translations` here as the base; the full Dict is built at runtime
// in lang-context.tsx by `buildDict()`, which merges this file with
// page-content.ts and extra-content.ts.

export const translations = {
  // ----------------------------------------------------------------
  // ENGLISH (en) — base/reference language. The other two languages
  // below mirror this exact structure (same section keys, same array
  // lengths); only the string values differ.
  // ----------------------------------------------------------------
  en: {
    // meta — page <title> + meta description. Used by some pages' Next.js
    // metadata export and as a JSON-LD fallback.
    meta: {
      title: "Smarthub Connect — Hong Kong Corporate Services & Workspaces",
      description:
        "Smarthub Connect Limited is a Hong Kong TCSP-licensed corporate services provider offering company incorporation, secretarial compliance, serviced offices, virtual offices and meeting rooms in Wan Chai.",
    },
    // nav — top navigation bar labels. Used by `src/components/sections/navbar.tsx`.
    // `cta` is the "Get Started" button; `call` and `whatsapp` are quick-contact buttons.
    nav: {
      about: "About",
      services: "Services",
      whyhk: "Why Hong Kong",
      pricing: "Pricing",
      insights: "Insights",
      contact: "Contact",
      cta: "Get Started",
      call: "+852 2383 3283",
      whatsapp: "WhatsApp",
    },
    // topbar — slim utility strip above the navbar (phone, WhatsApp,
    // email, TCSP licence badge). Used by the Navbar component's top row.
    topbar: {
      phone: "+852 2383 3283",
      whatsapp: "WhatsApp 5501 3516",
      email: "info@smarthubc.com",
      licence: "TCSP Licensed · TC010264",
    },
    // hero — homepage hero section: eyebrow tag, big headline (split
    // into `title` + `titleAccent` so the accent can be styled differently),
    // lead paragraph, two CTAs (primary + secondary), and 4 inline stat
    // items. Used by `src/components/pages/home.tsx`.
    hero: {
      eyebrow: "Hong Kong · Est. Wan Chai",
      title: "Your gateway to",
      titleAccent: "Hong Kong business.",
      lead: "Smarthub Connect is a TCSP-licensed corporate services provider and workspace operator in the heart of Wan Chai — everything you need to incorporate, comply and grow under one roof.",
      ctaPrimary: "Explore Services",
      ctaSecondary: "Book a Tour",
      stats: [
        { num: "25+", label: "Years in Hong Kong" },
        { num: "1,200+", label: "Companies Served" },
        { num: "TC010264", label: "TCSP Licensed" },
        { num: "24/7", label: "Access Available" },
      ],
    },
    // about — About-page content: eyebrow, title, two body paragraphs
    // (`body`, `body2`), and 4 bullet `points[]` (each with title + text).
    // Used by `src/components/pages/about.tsx`.
    about: {
      eyebrow: "About Smarthub Connect",
      title: "One partner for incorporation, compliance and workspace.",
      body: "Since 2001, Smarthub Connect has helped entrepreneurs, family offices and multinational firms set up and operate in Hong Kong. As a TCSP-licensed trust and company service provider, we handle incorporation, ongoing secretarial work, accounting, audit and tax — then back it with Grade-A serviced offices, virtual offices and meeting rooms at 25/F, 88 Lockhart Road, Wan Chai.",
      body2:
        "We are part of the MCM Group ecosystem, which means clients can seamlessly access wealth management, fintech and professional education through our sister entities — but Smarthub itself stays focused on what it does best: keeping your Hong Kong operation compliant, professional and always office-ready.",
      points: [
        {
          title: "TCSP Licensed",
          text: "Licensed by the Hong Kong Companies Registry as a Trust & Company Service Provider (TC010264).",
        },
        {
          title: "Wan Chai Grade-A Office",
          text: "Real offices, real address — 25/F, 88 Lockhart Road, two minutes from MTR.",
        },
        {
          title: "Part of MCM Group",
          text: "Integrated with wealth, fintech and education — one relationship, full ecosystem.",
        },
        {
          title: "Bilingual Team",
          text: "English, Cantonese and Mandarin spoken daily. We chat with you in your language.",
        },
      ],
    },
    // services — Services-page content: eyebrow, title, lead, an array
    // of 4 service `items[]` (each with tag, title, desc, and a features
    // list of 6 bullets), and a CTA button label. Used by
    // `src/components/pages/services.tsx`.
    services: {
      eyebrow: "What We Do",
      title: "Four services. One address.",
      lead:
        "Whether you are a startup incorporating your first Hong Kong company or a family office running a BVI holding structure, Smarthub Connect has a service line built for you.",
      items: [
        {
          tag: "Corporate",
          title: "Company Incorporation & TCSP",
          desc:
            "Hong Kong, BVI, Cayman and Singapore company formation. Annual secretarial, registered address, nominee director, compliance filings and corporate bank account openings.",
          features: [
            "HK limited company formation",
            "BVI / Cayman offshore incorporation",
            "Annual company secretarial",
            "Registered address & mail handling",
            "Bank account opening support",
            "TCSP compliance filings",
          ],
        },
        {
          tag: "Workspaces",
          title: "Serviced Offices",
          desc:
            "Fully-furnished private offices, dedicated desks and hot desks in our Wan Chai Grade-A floor. 24/7 access, fast WiFi, IT support, reception and pantry included.",
          features: [
            "1–10 pax private offices",
            "Dedicated & hot desks",
            "24/7 keycard access",
            "Enterprise-grade WiFi",
            "Reception & mail handling",
            "Free pantry & coffee",
          ],
        },
        {
          tag: "Virtual",
          title: "Virtual Office",
          desc:
            "Use our Wan Chai address as your registered business address without renting a physical office. Mail scanning, call answering and meeting room hours bundled in.",
          features: [
            "Registered business address",
            "Mail receipt & scanning",
            "Call answering service",
            "5 hrs meeting room/month",
            "Dedicated phone number",
            "Corporate letter signing",
          ],
        },
        {
          tag: "Meetings",
          title: "Meeting & Event Space",
          desc:
            "Boardrooms, training rooms and event space for hire by the hour or day. Projector, video conferencing, catering and IT support all available on request.",
          features: [
            "4–20 pax boardrooms",
            "Training & event space",
            "Video conferencing",
            "Projector & AV equipment",
            "Catering on request",
            "Hourly or daily booking",
          ],
        },
      ],
      cta: "Enquire about this service",
    },
    // whyhk — "Why Hong Kong" page: eyebrow, title, lead, and 6 `cards[]`
    // (each with title + text). Used by `src/components/pages/why-hk.tsx`.
    whyhk: {
      eyebrow: "Why Hong Kong",
      title: "The world's most business-friendly city.",
      lead:
        "Hong Kong ranks consistently in the top 5 globally for ease of doing business. With 0% profits tax on offshore income, free capital movement, and a common-law legal system, it remains the preferred hub for Asian family offices and multinational regional HQs.",
      cards: [
        {
          title: "Low & Simple Tax",
          text: "16.5% corporate profits tax, no GST, no VAT, no capital gains tax. Offshore claims enjoy 0%.",
        },
        {
          title: "Free Capital Flow",
          text: "No foreign exchange controls. Move money in and out of Hong Kong freely, in any currency.",
        },
        {
          title: "Common Law System",
          text: "Independent judiciary, English-language contracts, strong IP protection and predictable regulation.",
        },
        {
          title: "Gateway to China",
          text: "Closer Economic Partnership Arrangement (CEPA) gives Hong Kong companies preferential access to mainland China.",
        },
        {
          title: "Strategic Location",
          text: "5-hour flight radius covers half the world's population. Direct links to all major Asian capitals.",
        },
        {
          title: "Talented Workforce",
          text: "Bilingual (English/Chinese) professionals across finance, law, accounting and technology.",
        },
      ],
    },
    // pricing — Pricing-page content: eyebrow, title, lead, disclaimer,
    // 3 pricing `tiers[]` (Starter / Professional / Enterprise, each with
    // name, tagline, price, period, desc, features list, CTA, popular flag),
    // plus a workspace add-ons section (`workspaceTitle` + `workspace[]`
    // array of 6 items: name, price, desc). Used by
    // `src/components/pages/pricing.tsx`.
    pricing: {
      eyebrow: "Pricing",
      title: "Transparent Hong Kong market rates.",
      lead:
        "Indicative monthly and annual pricing based on Hong Kong market research as of 2026. Final quotes depend on your structure and requirements — book a free consultation for a tailored proposal.",
      disclaimer:
        "* All prices in HKD. Setup fees and government levies billed at cost. Discounts available for annual prepayment.",
      tiers: [
        {
          name: "Starter",
          tagline: "For first-time founders",
          price: "8,800",
          period: "one-off",
          desc: "Hong Kong company incorporation + first year secretarial.",
          features: [
            "HK Ltd company incorporation",
            "1 year company secretarial",
            "Registered address (1 year)",
            "Bank account opening support",
            "BR & CI delivered",
            "Email support",
          ],
          cta: "Get Started",
          popular: false,
        },
        {
          name: "Professional",
          tagline: "For operating SMEs",
          price: "1,980",
          period: "/ month",
          desc: "Full TCSP compliance + Wan Chai virtual office + meeting room hours.",
          features: [
            "Annual secretarial & compliance",
            "Registered address + mail scanning",
            "Call answering service",
            "10 hrs meeting room/month",
            "Accounting & audit coordination",
            "Quarterly compliance review",
            "Priority WhatsApp support",
          ],
          cta: "Most Popular",
          popular: true,
        },
        {
          name: "Enterprise",
          tagline: "For regional HQs & family offices",
          price: "Custom",
          period: "",
          desc: "Dedicated private office + multi-jurisdiction structuring.",
          features: [
            "Private office (4–10 pax)",
            "HK + BVI/Cayman structure",
            "Full accounting & tax filing",
            "Unlimited meeting room hours",
            "Dedicated relationship manager",
            "Cross-border compliance",
            "24/7 priority support",
          ],
          cta: "Contact Sales",
          popular: false,
        },
      ],
      workspaceTitle: "Workspace Add-ons",
      workspace: [
        { name: "Hot Desk", price: "HK$1,800/mo", desc: "Flexible daily workspace, no fixed seat." },
        { name: "Dedicated Desk", price: "HK$4,800/mo", desc: "Your own desk in a shared suite." },
        { name: "Private Office (1–2 pax)", price: "from HK$9,800/mo", desc: "Fully furnished, lockable." },
        { name: "Private Office (4–6 pax)", price: "from HK$22,000/mo", desc: "Premium Wan Chai views." },
        { name: "Meeting Room", price: "HK$280/hour", desc: "8-pax boardroom with AV." },
        { name: "Day Pass", price: "HK$380/day", desc: "Drop-in for the day." },
      ],
    },
    // stats — mid-page stats band: section title + 6 stat `items[]`
    // (each with `num` + `label`). Used by the homepage stats band.
    // (Note: the same stats also appear in `src/lib/site-data.ts` as
    // `sectionStats` for places that need them outside the dictionary.)
    stats: {
      title: "Numbers that matter.",
      items: [
        { num: "25+", label: "Years in Hong Kong" },
        { num: "1,200+", label: "Companies Incorporated" },
        { num: "98%", label: "Client Retention" },
        { num: "6", label: "Languages Spoken" },
        { num: "24/7", label: "Office Access" },
        { num: "5 min", label: "From Wan Chai MTR" },
      ],
    },
    // insights — Insights/blog page: eyebrow, title, lead, 3 article
    // `items[]` (each with cat, date, title, excerpt), and a CTA label.
    // Used by `src/components/pages/insights.tsx`.
    insights: {
      eyebrow: "Insights",
      title: "What we're watching.",
      lead: "Practical Hong Kong corporate and workspace commentary from our team — no fluff.",
      items: [
        {
          cat: "Corporate",
          date: "Q3 2026 · 6 min read",
          title: "New TCSP Licence Renewal Requirements in 2026 — What Has Changed",
          excerpt:
            "The Companies Registry has tightened annual renewal checks. Here is what every licensed TCSP and their clients need to file before 31 March.",
        },
        {
          cat: "Tax",
          date: "Q3 2026 · 8 min read",
          title: "Hong Kong Offshore Tax Claim — Documentation the IRD Will Actually Accept",
          excerpt:
            "A practical walkthrough of the evidence package that consistently passes IRD offshore claims audit, with a sample memo template.",
        },
        {
          cat: "Workspaces",
          date: "Q2 2026 · 5 min read",
          title: "Serviced Office vs. Traditional Lease — True Cost Comparison for HK SMEs",
          excerpt:
            "We break down the real 3-year cost of a 4-person team in Wan Chai: serviced vs. traditional, including hidden fees.",
        },
      ],
      cta: "View all insights",
    },
    // contact — Contact-page content: eyebrow, title, lead, `form` object
    // (field labels, service options array, submit/sending/success states,
    // placeholder text), and `info` object (address/phone/whatsapp/email/
    // hours labels + values). Used by `src/components/pages/contact.tsx`.
    contact: {
      eyebrow: "Get in Touch",
      title: "Book a free consultation.",
      lead:
        "Tell us about your business and what you need. A real human from our Wan Chai office will get back to you within one business day.",
      form: {
        firstName: "First name",
        lastName: "Last name",
        email: "Email",
        phone: "Phone (with country code)",
        service: "Service of interest",
        services: [
          "Company Incorporation & TCSP",
          "Serviced Office",
          "Virtual Office",
          "Meeting Room Hire",
          "Other / Not sure yet",
        ],
        message: "How can we help?",
        submit: "Send Enquiry",
        sending: "Sending…",
        success: "✓ Message received — we'll be in touch within 1 business day.",
        placeholder: "Briefly describe what you're setting up, your timeline, and any questions.",
      },
      info: {
        addressLabel: "Office",
        address: "25/F, 88 Lockhart Road, Wan Chai, Hong Kong",
        phoneLabel: "Phone",
        whatsappLabel: "WhatsApp",
        emailLabel: "Email",
        hoursLabel: "Hours",
        hours: "Mon–Fri 9:00–18:30 · Sat 10:00–14:00",
      },
    },
    // footer — site-wide footer: tagline, 3 column headings (explore,
    // legal, connect), `links` object with all 10 link labels (about,
    // services, whyhk, pricing, insights, contact, privacy, terms,
    // complaints, disclosures), legal `note` text, and copyright `rights`.
    // Used by `src/components/sections/footer.tsx`. Note: the LangProvider
    // merges this base footer with extra footer fields from extra-content.ts.
    footer: {
      tagline:
        "Hong Kong's corporate services and workspace partner — TCSP-licensed, Wan Chai-based, part of the MCM Group ecosystem.",
      explore: "Explore",
      legal: "Legal",
      connect: "Connect",
      links: {
        about: "About",
        services: "Services",
        whyhk: "Why Hong Kong",
        pricing: "Pricing",
        insights: "Insights",
        contact: "Contact",
        privacy: "Privacy Policy",
        terms: "Terms of Use",
        complaints: "Complaints Procedure",
        disclosures: "Disclosures",
        inbox: "Booking inbox",
      },
      note:
        "Smarthub Connect Limited is a Hong Kong Trust & Company Service Provider licensee (TC010264) and a member of the MCM Group of companies. This website is for informational purposes only and does not constitute an offer or solicitation in any jurisdiction where such would be unlawful.",
      rights: "All rights reserved.",
    },
  },

  // ----------------------------------------------------------------
  // TRADITIONAL CHINESE (zh-HK) — Hong Kong / Cantonese traditional script.
  // Mirrors the `en` block's structure exactly: same section keys, same
  // array lengths. Only the string values are translated.
  // ----------------------------------------------------------------
  "zh-HK": {
    meta: {
      title: "Smarthub Connect — 香港企業服務與工作空間",
      description:
        "Smarthub Connect Limited 為香港持牌信託及公司服務供應商 (TCSP TC010264)，於灣仔提供公司成立、秘書合規、服務式辦公室、虛擬辦公室及會議室租賃。",
    },
    nav: {
      about: "關於我們",
      services: "服務",
      whyhk: "為何香港",
      pricing: "收費",
      insights: "資訊",
      contact: "聯絡",
      cta: "立即開始",
      call: "+852 2383 3283",
      whatsapp: "WhatsApp",
    },
    topbar: {
      phone: "+852 2383 3283",
      whatsapp: "WhatsApp 5501 3516",
      email: "info@smarthubc.com",
      licence: "TCSP 持牌 · TC010264",
    },
    hero: {
      eyebrow: "香港 · 灣仔立足",
      title: "您進軍",
      titleAccent: "香港商業的門戶。",
      lead: "Smarthub Connect 是持牌 TCSP 企業服務供應商與工作空間營運商，位處灣仔核心地段——成立、合規與擴展，一站搞定。",
      ctaPrimary: "探索服務",
      ctaSecondary: "預約參觀",
      stats: [
        { num: "25+", label: "扎根香港年數" },
        { num: "1,200+", label: "服務公司數目" },
        { num: "TC010264", label: "TCSP 持牌" },
        { num: "24/7", label: "全天候通行" },
      ],
    },
    about: {
      eyebrow: "關於 Smarthub Connect",
      title: "成立、合規、辦公空間——一個夥伴搞掂。",
      body: "自 2001 年起，Smarthub Connect 協助創業家、家族辦公室與跨國企業在香港設立與營運。我們是持牌信託及公司服務供應商 (TCSP TC010264)，提供公司成立、秘書、會計、審計與稅務服務，並於灣臣駱克道 88 號 25 樓設有甲級服務式辦公室、虛擬辦公室及會議室。",
      body2:
        "我們屬於 MCM Group 生態系統，客戶可無縫接軌財富管理、金融科技與專業教育等姊妹公司服務——但 Smarthub 始終專注於最擅長的領域：確保您的香港業務合規、專業、辦公無憂。",
      points: [
        {
          title: "TCSP 持牌",
          text: "獲香港公司註冊處發出信託及公司服務提供者牌照 (TC010264)。",
        },
        {
          title: "灣仔甲級寫字樓",
          text: "真實辦公室、真實地址——灣臣駱克道 88 號 25 樓，港鐵兩分鐘即達。",
        },
        {
          title: "MCM Group 一員",
          text: "與財富管理、金融科技、教育整合——一個關係、完整生態。",
        },
        {
          title: "雙語團隊",
          text: "日常使用英語、粵語及普通話——以您的語言與您對話。",
        },
      ],
    },
    services: {
      eyebrow: "我們做甚麼",
      title: "四項服務。一個地址。",
      lead: "無論您是初創公司首次在香港成立，還是家族辦公室運作 BVI 控股結構，Smarthub Connect 都有專為您而設的服務。",
      items: [
        {
          tag: "企業",
          title: "公司成立與 TCSP 服務",
          desc:
            "香港、BVI、開曼及新加坡公司成立。年度秘書、註冊地址、提名董事、合規申報及企業銀行開戶。",
          features: [
            "香港有限公司成立",
            "BVI / 開曼離岸成立",
            "年度公司秘書",
            "註冊地址與郵件處理",
            "銀行開戶支援",
            "TCSP 合規申報",
          ],
        },
        {
          tag: "工作空間",
          title: "服務式辦公室",
          desc:
            "灣仔甲級樓層的全新裝修私人辦公室、專屬座位與流動座位。24/7 通行、高速 WiFi、IT 支援、接待與茶水間一應俱全。",
          features: [
            "1–10 人私人辦公室",
            "專屬及流動座位",
            "24/7 智能卡通行",
            "企業級 WiFi",
            "接待及郵件處理",
            "免費茶水及咖啡",
          ],
        },
        {
          tag: "虛擬",
          title: "虛擬辦公室",
          desc:
            "使用我們的灣仔地址作為註冊業務地址，無需租用實體辦公室。包括郵件掃描、電話接聽及會議室時數。",
          features: [
            "註冊業務地址",
            "郵件收發與掃描",
            "電話接聽服務",
            "每月 5 小時會議室",
            "專屬電話號碼",
            "公司信件簽署",
          ],
        },
        {
          tag: "會議",
          title: "會議與活動空間",
          desc:
            "董事會議室、培訓室及活動空間，可按小時或日租用。投影機、視像會議、餐飲及 IT 支援可另行安排。",
          features: [
            "4–20 人董事會議室",
            "培訓及活動空間",
            "視像會議",
            "投影機及影音設備",
            "應要求提供餐飲",
            "按小時或按日預訂",
          ],
        },
      ],
      cta: "查詢此服務",
    },
    whyhk: {
      eyebrow: "為何選香港",
      title: "全球最友善的營商城市。",
      lead: "香港持續位列全球營商便利度前五。離岸收入 0% 利得稅、資金自由進出、普通法法制——依然是家族辦公室與跨國區域總部的首選樞紐。",
      cards: [
        {
          title: "低稅簡稅",
          text: "企業利得稅 16.5%，無 GST、無 VAT、無資本增值稅。離岸申索可享 0%。",
        },
        {
          title: "資金自由",
          text: "無外匯管制，資金可自由以任何貨幣進出香港。",
        },
        {
          title: "普通法制度",
          text: "獨立司法、英文合約、強力知識產權保障與可預測監管。",
        },
        {
          title: "中國門戶",
          text: "《內地與香港關於建立更緊密經貿關係的安排》(CEPA) 給予港資企業內地優惠待遇。",
        },
        {
          title: "策略位置",
          text: "5 小時飛行半徑覆蓋全球半數人口，直航所有主要亞洲首都。",
        },
        {
          title: "優秀人才",
          text: "中英雙語專業人才，涵蓋金融、法律、會計與科技。",
        },
      ],
    },
    pricing: {
      eyebrow: "收費",
      title: "透明的香港市場行情。",
      lead: "以下為 2026 年香港市場研究之參考收費。最終報價視乎您的架構與需求——預約免費諮詢以獲取度身訂造方案。",
      disclaimer: "* 所有價格以港幣計。設立費及政府徵費按成本實報。年付預繳可享折扣。",
      tiers: [
        {
          name: "入門",
          tagline: "首次創業者適用",
          price: "8,800",
          period: "一次過",
          desc: "香港公司成立 + 首年秘書服務。",
          features: [
            "香港有限公司成立",
            "一年公司秘書",
            "註冊地址 (一年)",
            "銀行開戶支援",
            "交付 BR 及 CI",
            "電郵支援",
          ],
          cta: "立即開始",
          popular: false,
        },
        {
          name: "專業",
          tagline: "營運中中小企",
          price: "1,980",
          period: "/ 月",
          desc: "全面 TCSP 合規 + 灣仔虛擬辦公室 + 會議室時數。",
          features: [
            "年度秘書及合規",
            "註冊地址 + 郵件掃描",
            "電話接聽服務",
            "每月 10 小時會議室",
            "會計及審計協調",
            "季度合規檢視",
            "WhatsApp 優先支援",
          ],
          cta: "最受歡迎",
          popular: true,
        },
        {
          name: "企業",
          tagline: "區域總部及家族辦公室",
          price: "自訂",
          period: "",
          desc: "專屬私人辦公室 + 跨司法管轄區架構。",
          features: [
            "私人辦公室 (4–10 人)",
            "香港 + BVI/開曼架構",
            "全面會計及報稅",
            "無限會議室時數",
            "專屬客戶經理",
            "跨境合規",
            "24/7 優先支援",
          ],
          cta: "聯絡銷售",
          popular: false,
        },
      ],
      workspaceTitle: "辦公空間附加項目",
      workspace: [
        { name: "流動座位", price: "HK$1,800/月", desc: "彈性每日工作空間，無固定座位。" },
        { name: "專屬座位", price: "HK$4,800/月", desc: "共享套房內您的專屬座位。" },
        { name: "私人辦公室 (1–2 人)", price: "由 HK$9,800/月", desc: "全套傢俬，可上鎖。" },
        { name: "私人辦公室 (4–6 人)", price: "由 HK$22,000/月", desc: "優質灣仔景觀。" },
        { name: "會議室", price: "HK$280/小時", desc: "8 人董事房，附影音設備。" },
        { name: "日票", price: "HK$380/日", desc: "即日 drop-in。" },
      ],
    },
    stats: {
      title: "重要的數字。",
      items: [
        { num: "25+", label: "扎根香港年數" },
        { num: "1,200+", label: "成立公司數目" },
        { num: "98%", label: "客戶續約率" },
        { num: "6", label: "可用語言" },
        { num: "24/7", label: "辦公室通行" },
        { num: "5 分鐘", label: "距灣仔港鐵" },
      ],
    },
    insights: {
      eyebrow: "資訊",
      title: "我們正在留意的事。",
      lead: "來自我們團隊的香港企業與工作空間實務評論——絕不灌水。",
      items: [
        {
          cat: "企業",
          date: "2026 Q3 · 6 分鐘閱讀",
          title: "2026 年 TCSP 牌照續期新規——有何改變",
          excerpt: "公司註冊處已收緊年度續期審查。以下是每間持牌 TCSP 及其客戶需於 3 月 31 日前遞交的項目。",
        },
        {
          cat: "稅務",
          date: "2026 Q3 · 8 分鐘閱讀",
          title: "香港離岸稅申索——稅局真正接受的文件",
          excerpt: "實戰拆解 consistently 通過稅局離岸申索審計的證據套件，附備忘錄範本。",
        },
        {
          cat: "工作空間",
          date: "2026 Q2 · 5 分鐘閱讀",
          title: "服務式辦公室 vs. 傳統租約——香港中小企真實成本比較",
          excerpt: "拆解灣仔 4 人團隊 3 年真實成本：服務式 vs. 傳統，包括隱藏費用。",
        },
      ],
      cta: "查看全部資訊",
    },
    contact: {
      eyebrow: "聯絡我們",
      title: "預約免費諮詢。",
      lead: "告訴我們您的業務及需求。我們灣仔辦公室的真人將於一個工作天內回覆。",
      form: {
        firstName: "名字",
        lastName: "姓氏",
        email: "電郵",
        phone: "電話 (含國家區號)",
        service: "感興趣的服務",
        services: [
          "公司成立與 TCSP",
          "服務式辦公室",
          "虛擬辦公室",
          "會議室租賃",
          "其他 / 尚未決定",
        ],
        message: "我們可以怎樣幫您？",
        submit: "發送查詢",
        sending: "發送中…",
        success: "✓ 已收到訊息——我們將於 1 個工作天內聯絡您。",
        placeholder: "簡述您正在籌備甚麼、時間表及任何問題。",
      },
      info: {
        addressLabel: "辦公室",
        address: "香港灣仔駱克道 88 號 25 樓",
        phoneLabel: "電話",
        whatsappLabel: "WhatsApp",
        emailLabel: "電郵",
        hoursLabel: "營業時間",
        hours: "週一至五 9:00–18:30 · 週六 10:00–14:00",
      },
    },
    footer: {
      tagline: "香港企業服務與工作空間夥伴——持牌 TCSP、立足灣仔、屬 MCM Group 生態系統一員。",
      explore: "探索",
      legal: "法律",
      connect: "聯繫",
      links: {
        about: "關於我們",
        services: "服務",
        whyhk: "為何香港",
        pricing: "收費",
        insights: "資訊",
        contact: "聯絡",
        privacy: "私隱政策",
        terms: "使用條款",
        complaints: "投訴程序",
        disclosures: "披露",
        inbox: "預訂管理",
      },
      note:
        "Smarthub Connect Limited 為香港持牌信託及公司服務供應商 (TC010264)，並為 MCM Group 集團成員。本網站僅供參考，不構成於任何不允許之司法管轄區的要約或招攬。",
      rights: "版權所有。",
    },
  },

  // ----------------------------------------------------------------
  // SIMPLIFIED CHINESE (zh-CN) — Mainland China simplified script.
  // Mirrors the `en` block's structure exactly: same section keys, same
  // array lengths. Only the string values are translated.
  // ----------------------------------------------------------------
  "zh-CN": {
    meta: {
      title: "Smarthub Connect — 香港企业服务与工作空间",
      description:
        "Smarthub Connect Limited 为香港持牌信托及公司服务供应商 (TCSP TC010264)，于湾仔提供公司成立、秘书合规、服务式办公室、虚拟办公室及会议室租赁。",
    },
    nav: {
      about: "关于我们",
      services: "服务",
      whyhk: "为何香港",
      pricing: "收费",
      insights: "资讯",
      contact: "联系",
      cta: "立即开始",
      call: "+852 2383 3283",
      whatsapp: "WhatsApp",
    },
    topbar: {
      phone: "+852 2383 3283",
      whatsapp: "WhatsApp 5501 3516",
      email: "info@smarthubc.com",
      licence: "TCSP 持牌 · TC010264",
    },
    hero: {
      eyebrow: "香港 · 立足湾仔",
      title: "您进军",
      titleAccent: "香港商业的门户。",
      lead: "Smarthub Connect 是持牌 TCSP 企业服务供应商与工作空间运营商，位于湾仔核心地段——成立、合规与扩展，一站搞定。",
      ctaPrimary: "探索服务",
      ctaSecondary: "预约参观",
      stats: [
        { num: "25+", label: "扎根香港年数" },
        { num: "1,200+", label: "服务公司数目" },
        { num: "TC010264", label: "TCSP 持牌" },
        { num: "24/7", label: "全天候通行" },
      ],
    },
    about: {
      eyebrow: "关于 Smarthub Connect",
      title: "成立、合规、办公空间——一个伙伴搞定。",
      body: "自 2001 年起，Smarthub Connect 协助创业者、家族办公室与跨国企业在香港设立与运营。我们是持牌信托及公司服务供应商 (TCSP TC010264)，提供公司成立、秘书、会计、审计与税务服务，并于湾仔骆克道 88 号 25 楼设有甲级服务式办公室、虚拟办公室及会议室。",
      body2:
        "我们属于 MCM Group 生态系统，客户可无缝接轨财富管理、金融科技与专业教育等姊妹公司服务——但 Smarthub 始终专注於最擅长的领域：确保您的香港业务合规、专业、办公无忧。",
      points: [
        {
          title: "TCSP 持牌",
          text: "获香港公司注册处发出信托及公司服务提供者牌照 (TC010264)。",
        },
        {
          title: "湾仔甲级写字楼",
          text: "真实办公室、真实地址——湾仔骆克道 88 号 25 楼，地铁两分钟即达。",
        },
        {
          title: "MCM Group 一员",
          text: "与财富管理、金融科技、教育整合——一个关系、完整生态。",
        },
        {
          title: "双语团队",
          text: "日常使用英语、粤语及普通话——以您的语言与您对话。",
        },
      ],
    },
    services: {
      eyebrow: "我们做什么",
      title: "四项服务。一个地址。",
      lead: "无论您是初创公司首次在香港成立，还是家族办公室运作 BVI 控股结构，Smarthub Connect 都有专为而设的服务。",
      items: [
        {
          tag: "企业",
          title: "公司成立与 TCSP 服务",
          desc:
            "香港、BVI、开曼及新加坡公司成立。年度秘书、注册地址、提名董事、合规申报及企业银行开户。",
          features: [
            "香港有限公司成立",
            "BVI / 开曼离岸成立",
            "年度公司秘书",
            "注册地址与邮件处理",
            "银行开户支援",
            "TCSP 合规申报",
          ],
        },
        {
          tag: "工作空间",
          title: "服务式办公室",
          desc:
            "湾仔甲级楼层的全新装修私人办公室、专属座位与流动座位。24/7 通行、高速 WiFi、IT 支援、接待与茶水间一应俱全。",
          features: [
            "1–10 人私人办公室",
            "专属及流动座位",
            "24/7 智能卡通行",
            "企业级 WiFi",
            "接待及邮件处理",
            "免费茶水及咖啡",
          ],
        },
        {
          tag: "虚拟",
          title: "虚拟办公室",
          desc:
            "使用我们的湾仔地址作为注册业务地址，无需租用实体办公室。包括邮件扫描、电话接听及会议室时数。",
          features: [
            "注册业务地址",
            "邮件收发与扫描",
            "电话接听服务",
            "每月 5 小时会议室",
            "专属电话号码",
            "公司信件签署",
          ],
        },
        {
          tag: "会议",
          title: "会议与活动空间",
          desc:
            "董事会议室、培训室及活动空间，可按小时或日租用。投影机、视像会议、餐饮及 IT 支援可另行安排。",
          features: [
            "4–20 人董事会议室",
            "培训及活动空间",
            "视像会议",
            "投影机及影音设备",
            "应要求提供餐饮",
            "按小时或按日预订",
          ],
        },
      ],
      cta: "查询此服务",
    },
    whyhk: {
      eyebrow: "为何选香港",
      title: "全球最友善的营商城市。",
      lead: "香港持续位列全球营商便利度前五。离岸收入 0% 利得税、资金自由进出、普通法法制——依然是家族办公室与跨国区域总部的首选枢纽。",
      cards: [
        {
          title: "低税简税",
          text: "企业利得税 16.5%，无 GST、无 VAT、无资本增值税。离岸申索可享 0%。",
        },
        {
          title: "资金自由",
          text: "无外汇管制，资金可自由以任何货币进出香港。",
        },
        {
          title: "普通法制度",
          text: "独立司法、英文合约、强力知识产权保障与可预测监管。",
        },
        {
          title: "中国门户",
          text: "《内地与香港关于建立更紧密经贸关系的安排》(CEPA) 给予港资企业内地优惠待遇。",
        },
        {
          title: "策略位置",
          text: "5 小时飞行半径覆盖全球半数人口，直航所有主要亚洲首都。",
        },
        {
          title: "优秀人才",
          text: "中英双语专业人才，涵盖金融、法律、会计与科技。",
        },
      ],
    },
    pricing: {
      eyebrow: "收费",
      title: "透明的香港市场行情。",
      lead: "以下为 2026 年香港市场研究的参考收费。最终报价视乎您的架构与需求——预约免费咨询以获取量身定做方案。",
      disclaimer: "* 所有价格以港币计。设立费及政府征费按成本实报。年付预缴可享折扣。",
      tiers: [
        {
          name: "入门",
          tagline: "首次创业者适用",
          price: "8,800",
          period: "一次过",
          desc: "香港公司成立 + 首年秘书服务。",
          features: [
            "香港有限公司成立",
            "一年公司秘书",
            "注册地址 (一年)",
            "银行开户支援",
            "交付 BR 及 CI",
            "电邮支援",
          ],
          cta: "立即开始",
          popular: false,
        },
        {
          name: "专业",
          tagline: "营运中中小企业",
          price: "1,980",
          period: "/ 月",
          desc: "全面 TCSP 合规 + 湾仔虚拟办公室 + 会议室时数。",
          features: [
            "年度秘书及合规",
            "注册地址 + 邮件扫描",
            "电话接听服务",
            "每月 10 小时会议室",
            "会计及审计协调",
            "季度合规检视",
            "WhatsApp 优先支援",
          ],
          cta: "最受欢迎",
          popular: true,
        },
        {
          name: "企业",
          tagline: "区域总部及家族办公室",
          price: "自订",
          period: "",
          desc: "专属私人办公室 + 跨司法管辖区架构。",
          features: [
            "私人办公室 (4–10 人)",
            "香港 + BVI/开曼架构",
            "全面会计及报税",
            "无限会议室时数",
            "专属客户经理",
            "跨境合规",
            "24/7 优先支援",
          ],
          cta: "联系销售",
          popular: false,
        },
      ],
      workspaceTitle: "办公空间附加项目",
      workspace: [
        { name: "流动座位", price: "HK$1,800/月", desc: "弹性每日工作空间，无固定座位。" },
        { name: "专属座位", price: "HK$4,800/月", desc: "共享套房内您的专属座位。" },
        { name: "私人办公室 (1–2 人)", price: "由 HK$9,800/月", desc: "全套家具，可上锁。" },
        { name: "私人办公室 (4–6 人)", price: "由 HK$22,000/月", desc: "优质湾仔景观。" },
        { name: "会议室", price: "HK$280/小时", desc: "8 人董事房，附影音设备。" },
        { name: "日票", price: "HK$380/日", desc: "即日 drop-in。" },
      ],
    },
    stats: {
      title: "重要的数字。",
      items: [
        { num: "25+", label: "扎根香港年数" },
        { num: "1,200+", label: "成立公司数目" },
        { num: "98%", label: "客户续约率" },
        { num: "6", label: "可用语言" },
        { num: "24/7", label: "办公室通行" },
        { num: "5 分钟", label: "距湾仔地铁" },
      ],
    },
    insights: {
      eyebrow: "资讯",
      title: "我们正在留意的事。",
      lead: "来自我们团队的香港企业与工作空间实务评论——绝不灌水。",
      items: [
        {
          cat: "企业",
          date: "2026 Q3 · 6 分钟阅读",
          title: "2026 年 TCSP 牌照续期新规——有何改变",
          excerpt: "公司注册处已收紧年度续期审查。以下是每间持牌 TCSP 及其客户需于 3 月 31 日前递交的项目。",
        },
        {
          cat: "税务",
          date: "2026 Q3 · 8 分钟阅读",
          title: "香港离岸税申索——税局真正接受的文件",
          excerpt: "实战拆解 consistently 通过税局离岸申索审计的证据套装，附备忘录范本。",
        },
        {
          cat: "工作空间",
          date: "2026 Q2 · 5 分钟阅读",
          title: "服务式办公室 vs. 传统租约——香港中小企业真实成本比较",
          excerpt: "拆解湾仔 4 人团队 3 年真实成本：服务式 vs. 传统，包括隐藏费用。",
        },
      ],
      cta: "查看全部资讯",
    },
    contact: {
      eyebrow: "联系我们",
      title: "预约免费咨询。",
      lead: "告诉我们您的业务及需求。我们湾仔办公室的真人将于一个工作天内回复。",
      form: {
        firstName: "名字",
        lastName: "姓氏",
        email: "电邮",
        phone: "电话 (含国家区号)",
        service: "感兴趣的服务",
        services: [
          "公司成立与 TCSP",
          "服务式办公室",
          "虚拟办公室",
          "会议室租赁",
          "其他 / 尚未决定",
        ],
        message: "我们可以怎样帮您？",
        submit: "发送查询",
        sending: "发送中…",
        success: "✓ 已收到讯息——我们将于 1 个工作天内联络您。",
        placeholder: "简述您正在筹备什么、时间表及任何问题。",
      },
      info: {
        addressLabel: "办公室",
        address: "香港湾仔骆克道 88 号 25 楼",
        phoneLabel: "电话",
        whatsappLabel: "WhatsApp",
        emailLabel: "电邮",
        hoursLabel: "营业时间",
        hours: "周一至五 9:00–18:30 · 周六 10:00–14:00",
      },
    },
    footer: {
      tagline: "香港企业服务与工作空间伙伴——持牌 TCSP、立足湾仔、属 MCM Group 生态系统一员。",
      explore: "探索",
      legal: "法律",
      connect: "联系",
      links: {
        about: "关于我们",
        services: "服务",
        whyhk: "为何香港",
        pricing: "收费",
        insights: "资讯",
        contact: "联系",
        privacy: "隐私政策",
        terms: "使用条款",
        complaints: "投诉程序",
        disclosures: "披露",
        inbox: "预订管理",
      },
      note:
        "Smarthub Connect Limited 为香港持牌信托及公司服务供应商 (TC010264)，并为 MCM Group 集团成员。本网站仅供参考，不构成于任何不允许之司法管辖区的要约或招揽。",
      rights: "版权所有。",
    },
  },
} as const;
