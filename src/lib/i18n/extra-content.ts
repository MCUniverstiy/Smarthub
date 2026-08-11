// ============================================================================
// FILE: extra-content.ts
// WHAT IT IS: Additional translations that were originally hardcoded English
//             in component code, plus the 4 legal pages, 404 page, cookie
//             banner, and other "extra" UI text — in all 3 languages.
// WHAT IT DOES: Provides an `extraContent` object that gets merged into the
//               main translation dictionary at runtime by lang-context.tsx.
//               This file exists because the original site had English-only
//               strings scattered in component files. We extracted them here
//               so they can be translated.
// HOW IT FITS: translations.ts = UI labels (nav, buttons, form fields).
//               page-content.ts = page body copy (heroes, story, FAQs).
//               extra-content.ts = legal pages + cookie + 404 + footer CTA.
//               lang-context.tsx merges all 3 into one `t` object.
// ============================================================================

// Exported as `extraContent` — imported by lang-context.tsx
// Accessed in components via: t.footer.ctaTitle, t.legal.privacy.title, etc.
export const extraContent = {
  // ===== ENGLISH =====
  en: {
    // --- Footer CTA strip text ---
    // Used by: src/components/sections/footer.tsx (the top CTA band)
    footer: {
      ctaTitle: "Ready to set up in Hong Kong?",
      ctaBody: "Talk to a real human in Wan Chai today.",
      ctaButton: "WhatsApp Us",
    },

    // --- Cookie consent banner text ---
    // Used by: src/components/sections/cookie-consent.tsx
    cookie: {
      title: "We use cookies",
      body: "We use essential cookies to make this site work, and analytics cookies to understand how you use it. You can choose which to enable.",
      acceptAll: "Accept all",
      necessaryOnly: "Necessary only",
      learnMore: "Learn more",
    },

    // --- Misc UI labels ---
    backToTop: "Back to top",           // Used by: back-to-top.tsx
    skipToContent: "Skip to main content", // Used by: page.tsx (accessibility skip link)

    // --- 404 page text ---
    // Used by: src/components/pages/not-found.tsx
    notFound: {
      title: "Page not found",
      body: "The page you're looking for doesn't exist or has moved. Let's get you back on track.",
      cta: "Back to home",
    },

    // --- Why HK page image band text ---
    // Used by: src/components/pages/why-hk.tsx (the full-bleed image section)
    whyHk: {
      bandTitle: "Hong Kong is open for business.",
      bandBody: "Be part of Asia's most international financial centre.",
    },

    // --- Insights page labels ---
    // Used by: src/components/pages/insights.tsx
    insights: {
      featuredBadge: "Featured",      // Pink badge on the featured article
      readArticle: "Read article",     // CTA on featured article
      allArticles: "All Articles",     // Section heading eyebrow
      readMore: "Read more",           // CTA on grid article cards
    },

    // --- Pricing page FAQ eyebrow ---
    // Used by: src/components/pages/pricing.tsx
    pricing: {
      faqEyebrow: "FAQ",
    },

    // --- Contact page extra labels ---
    // Used by: src/components/pages/contact.tsx
    contact: {
      mapsButton: "Google Maps",         // Button linking to Google Maps
      formError: "Something went wrong. Please try again or email us directly.",
      privacyNotice: "We respect your privacy. Read our",
      privacyLink: "Privacy Policy",
      honeypotLabel: "Leave this field empty", // Hidden anti-spam field
    },

    // --- LEGAL PAGES ---
    // Used by: src/components/pages/legal.tsx
    // 4 documents: privacy, terms, complaints, disclosures
    // Each has: title, updated date, intro paragraph, and sections[] array
    // Each section has: h (heading) and p (paragraph)
    legal: {
      privacy: {
        title: "Privacy Policy",
        updated: "Last updated: July 2026",
        intro:
          "This Privacy Policy explains how Smarthub Connect Limited (\u201cwe\u201d, \u201cus\u201d) collects, uses, and protects your personal data when you visit smarthubc.com. We are committed to compliance with the Hong Kong Personal Data (Privacy) Ordinance (PDPO), Cap. 486.",
        sections: [
          {
            h: "1. Data We Collect",
            p: "When you submit our contact form, we collect: your name, email address, phone number, the service you're interested in, and any information you provide in the message field. We also collect technical data automatically: IP address, browser type, pages visited, and time spent (via our analytics provider, if enabled).",
          },
          {
            h: "2. Purpose of Collection",
            p: "Your personal data is used solely to: respond to your enquiry, provide the services you request, send you relevant updates (only if you opt in via our newsletter), meet our legal and regulatory obligations as a TCSP licensee, and improve our website and services.",
          },
          {
            h: "3. Data Transfer Outside Hong Kong",
            p: "Our contact form is processed by Formspree (a third-party service based in the United States). By submitting the form, you consent to your data being transferred to and stored in the United States. Our analytics provider (if enabled) may also store data outside Hong Kong. We only transfer data to jurisdictions that provide adequate protection under PDPO Section 33.",
          },
          {
            h: "4. Data Retention",
            p: "We retain enquiry form data for 24 months from the date of submission, after which it is permanently deleted unless you become a client (in which case the data is retained per our client records policy, typically 7 years per TCSP Code of Practice).",
          },
          {
            h: "5. Your Rights",
            p: "Under PDPO, you have the right to: request access to your personal data, request correction of inaccurate data, request that we stop using your data for direct marketing, and complain to the Privacy Commissioner for Personal Data if you believe we have violated the PDPO. To exercise any of these rights, email info@smarthubc.com.",
          },
          {
            h: "6. Cookies",
            p: "We use only essential cookies by default (required for the site to function). If you accept analytics cookies, we use a privacy-friendly analytics provider that does not track you across other websites. You can change your cookie preference at any time via the cookie banner.",
          },
          {
            h: "7. Contact",
            p: "If you have any questions about this Privacy Policy or how we handle your data, contact us at: Smarthub Connect Limited, 25/F, 88 Lockhart Road, Wan Chai, Hong Kong. Email: info@smarthubc.com. Phone: +852 2383 3283.",
          },
        ],
      },
      terms: {
        title: "Terms of Use",
        updated: "Last updated: July 2026",
        intro:
          "These Terms of Use govern your access to and use of smarthubc.com. By accessing this website, you agree to be bound by these Terms. If you do not agree, please do not use the website.",
        sections: [
          {
            h: "1. Information Only",
            p: "This website is provided for general informational purposes only. It does not constitute legal, tax, accounting, or investment advice, and should not be relied upon as such. Nothing on this website constitutes an offer or solicitation to provide any service in any jurisdiction where such offer would be unlawful.",
          },
          {
            h: "2. No Client Relationship",
            p: "Visiting this website or submitting an enquiry does not create a client, advisory, or any other professional relationship between you and Smarthub Connect Limited. A formal engagement letter is required before any service is provided.",
          },
          {
            h: "3. Intellectual Property",
            p: "All content on this website \u2014 including text, graphics, logos, images, and software \u2014 is the property of Smarthub Connect Limited or its licensors and is protected by Hong Kong and international copyright laws. You may not reproduce, distribute, or create derivative works without our prior written consent.",
          },
          {
            h: "4. Third-Party Links",
            p: "This website may contain links to third-party websites. We are not responsible for the content, privacy practices, or accuracy of those websites. Visiting linked sites is at your own risk.",
          },
          {
            h: "5. Limitation of Liability",
            p: "To the maximum extent permitted by law, Smarthub Connect Limited shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of, or inability to use, this website.",
          },
          {
            h: "6. Governing Law",
            p: "These Terms are governed by the laws of the Hong Kong Special Administrative Region. Any dispute arising from these Terms shall be resolved in the courts of Hong Kong.",
          },
          {
            h: "7. Changes",
            p: "We may update these Terms from time to time. The \u201cLast updated\u201d date above reflects the most recent revision. Continued use of the website after changes constitutes acceptance of the updated Terms.",
          },
        ],
      },
      complaints: {
        title: "Complaints Procedure",
        updated: "Last updated: July 2026",
        intro:
          "Smarthub Connect Limited is a licensed Trust and Company Service Provider (TCSP, licence no. TC010264) regulated by the Hong Kong Companies Registry. We are committed to providing high-quality service and to handling complaints promptly, fairly, and transparently.",
        sections: [
          {
            h: "1. How to Make a Complaint",
            p: "You may submit a complaint in writing by: email to info@smarthubc.com (subject line: \u201cComplaint\u201d); post to Complaints Officer, Smarthub Connect Limited, 25/F, 88 Lockhart Road, Wan Chai, Hong Kong; or in person at our office during business hours. Please include: your name and contact details, the nature of the complaint, the date(s) of the incident, the names of any staff involved (if known), and the outcome you are seeking.",
          },
          {
            h: "2. Acknowledgement",
            p: "We will acknowledge receipt of your complaint in writing within 3 business days. The acknowledgement will include the name and contact details of the staff member handling your complaint.",
          },
          {
            h: "3. Investigation",
            p: "Your complaint will be investigated by a senior member of staff who was not directly involved in the matter. We aim to complete investigations within 30 business days. If the investigation will take longer, we will contact you with an updated timeline and the reason for the delay.",
          },
          {
            h: "4. Response",
            p: "Once the investigation is complete, we will provide you with a written response that includes: a summary of your complaint, the findings of our investigation, any action we have taken or will take, and your right to escalate if you are not satisfied.",
          },
          {
            h: "5. Escalation",
            p: "If you are not satisfied with our response, you may escalate your complaint to the Hong Kong Companies Registry, which regulates TCSP licensees. Contact details: Companies Registry, 14th Floor, Queensway Government Offices, 66 Queensway, Hong Kong. Website: www.cr.gov.hk.",
          },
          {
            h: "6. Confidentiality",
            p: "All complaints are handled in strict confidence. Information about your complaint will only be shared with staff who need to know in order to investigate and respond. We do not retaliate against any client who makes a complaint in good faith.",
          },
        ],
      },
      disclosures: {
        title: "Disclosures",
        updated: "Last updated: July 2026",
        intro:
          "Smarthub Connect Limited is part of the MCM Group of companies. This page lists the legal entities referenced on this website and their respective regulatory licences. Each entity is a separate legal person and is not liable for the obligations of any other group entity.",
        sections: [
          {
            h: "Smarthub Connect Limited",
            p: "Hong Kong Trust and Company Service Provider licensee (TCSP licence no. TC010264). Provides corporate incorporation, company secretarial, registered address, serviced office, virtual office, and meeting room services. Registered office: 25/F, 88 Lockhart Road, Wan Chai, Hong Kong.",
          },
          {
            h: "MCM Group Ecosystem",
            p: "Smarthub Connect is part of the MCM Group, which includes Money Concepts (Asia) Holdings Limited, Money Concepts Asset Management Limited, Money Concepts Wealth Management Limited, MC Fintech Solutions Limited, and MCU Institute Limited. Services referenced on this website as available through MCM Group sister entities are provided by those entities under their own licences and engagement terms, not by Smarthub Connect Limited.",
          },
          {
            h: "Licence Verification",
            p: "Smarthub Connect Limited's TCSP licence can be verified on the Hong Kong Companies Registry website at www.cr.gov.hk. Other MCM Group entities hold their own regulatory licences (SFC Types 1, 4, 9; IA Registered Insurance Broker; MPFA Registered Intermediary), which can be verified on the relevant regulators' public registers.",
          },
          {
            h: "No Offer or Solicitation",
            p: "This website is for informational purposes only and does not constitute an offer or solicitation to provide any service in any jurisdiction where such offer would be unlawful. In particular, this website is not directed at any person in the United States, the European Union, or any other jurisdiction where regulatory licensing is required and not held by the relevant MCM Group entity.",
          },
          {
            h: "Accuracy of Information",
            p: "We endeavour to keep information on this website accurate and up to date. However, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, or reliability of any information. Pricing shown is indicative only and is subject to change without notice.",
          },
        ],
      },
    },
  },

  // ===== TRADITIONAL CHINESE (繁體中文) =====
  // Structure mirrors the English section above — same keys, Chinese values.
  "zh-HK": {
    footer: {
      ctaTitle: "準備好喺香港設立？",
      ctaBody: "今日就同灣仔真人傾下。",
      ctaButton: "WhatsApp 我哋",
    },
    cookie: {
      title: "我哋用 cookies",
      body: "我哋用必要 cookies 令網站運作，另用分析 cookies 了解您點樣使用。您可以揀啟用邊啲。",
      acceptAll: "全部接受",
      necessaryOnly: "只係必要",
      learnMore: "了解更多",
    },
    backToTop: "返頂部",
    skipToContent: "跳到主要內容",
    notFound: {
      title: "搵唔到頁面",
      body: "您搵緊嘅頁面唔存在或已搬遷。等我哋帶您返去。",
      cta: "返首頁",
    },
    whyHk: {
      bandTitle: "香港歡迎您嘅業務。",
      bandBody: "成為亞洲最國際化金融中心一員。",
    },
    insights: {
      featuredBadge: "精選",
      readArticle: "閱讀文章",
      allArticles: "全部文章",
      readMore: "閱讀更多",
    },
    pricing: {
      faqEyebrow: "常見問題",
    },
    contact: {
      mapsButton: "Google 地圖",
      formError: "發生錯誤。請再試一次或直接電郵我哋。",
      privacyNotice: "我哋尊重您嘅私隱。閱讀我哋嘅",
      privacyLink: "私隱政策",
      honeypotLabel: "請將此欄留空",
    },
    legal: {
      privacy: {
        title: "私隱政策",
        updated: "最後更新：2026 年 7 月",
        intro:
          "本私隱政策說明 Smarthub Connect Limited（\u201c我哋\u201d）喺您瀏覽 smarthubc.com 時如何收集、使用同保護您嘅個人資料。我哋致力遵守香港《個人資料（私隱）條例》(PDPO) 第 486 章。",
        sections: [
          {
            h: "1. 我哋收集嘅資料",
            p: "當您提交聯絡表格時，我哋會收集：您嘅姓名、電郵、電話、感興趣嘅服務同訊息內。我哋亦會自動收集技術資料：IP 位址、瀏覽器類型、到訪頁面同停留時間（如已啟用分析服務）。",
          },
          {
            h: "2. 收集目的",
            p: "您嘅個人資料只用於：回覆您嘅查詢、提供您要求嘅服務、發送相關最新資訊（須經我哋嘅電子報訂閱）、履行我哋作為 TCSP 持牌者嘅法律同監管義務，同改善我哋嘅網站同服務。",
          },
          {
            h: "3. 香港境外資料傳輸",
            p: "我哋嘅聯絡表格由 Formspree（一家位於美國嘅第三方服務）處理。提交表格即表示您同意您嘅資料被傳輸到美國並儲存於當地。我哋嘅分析服務（如啟用）亦可能將資料儲存於香港境外。我哋只會將資料傳輸到 PDPO 第 33 條下提供足夠保障嘅司法管轄區。",
          },
          {
            h: "4. 資料保留",
            p: "我哋會將查詢表格資料自提交日起保留 24 個月，之後永久刪除，除非您成為我哋嘅客戶（屆時資料會按照我哋嘅客戶紀錄政策保留，通常為 TCSP 操守準則要求嘅 7 年）。",
          },
          {
            h: "5. 您嘅權利",
            p: "根據 PDPO，您有權：要求查閱您嘅個人資料、要求更正不準確資料、要求我哋停止將您嘅資料用於直銷，同埋向個人資料私隱專員投訴（如您認為我哋違反 PDPO）。要行使任何權利，請電郵 info@smarthubc.com。",
          },
          {
            h: "6. Cookies",
            p: "我哋預設只用必要 cookies（網站運作所需）。如您接受分析 cookies，我哋會用一個私隱友善、唔會跨網站追蹤您嘅分析服務。您可以隨時透過 cookie 橫幅更改偏好。",
          },
          {
            h: "7. 聯絡",
            p: "如對本私隱政策或我哋如何處理您嘅資料有任何疑問，請聯絡：Smarthub Connect Limited，香港灣仔駱克道 88 號 25 樓。電郵：info@smarthubc.com。電話：+852 2383 3283。",
          },
        ],
      },
      terms: {
        title: "使用條款",
        updated: "最後更新：2026 年 7 月",
        intro:
          "本使用條款管轄您對 smarthubc.com 嘅存取同使用。存取本網站即表示您同意受本條款約束。如您不同意，請勿使用本網站。",
        sections: [
          {
            h: "1. 僅供參考",
            p: "本網站僅作一般資訊用途。唔構成法律、稅務、會計或投資建議，亦不應依賴作此用途。本網站任何內容唔構成喺任何不允許嘅司法管轄區提供服務嘅要約或招攬。",
          },
          {
            h: "2. 無客戶關係",
            p: "瀏覽本網站或提交查詢唔會構成您與 Smarthub Connect Limited 之間嘅客戶、顧問或任何專業關係。提供任何服務前必須簽訂正式委聘信。",
          },
          {
            h: "3. 知識產權",
            p: "本網站所有內容——包括文字、圖像、標誌、圖片同軟件——屬 Smarthub Connect Limited 或其特許人所有，受香港同國際版權法保護。未經我哋事先書面同意，您唔得複製、分發或創作衍生作品。",
          },
          {
            h: "4. 第三方連結",
            p: "本網站可能包含第三方網站連結。我哋對呢啲網站嘅內容、私隱做法或準確性概不負責。瀏覽連結網站風險自負。",
          },
          {
            h: "5. 責任限制",
            p: "喺法律允許嘅最大範圍內，Smarthub Connect Limited 對因您使用或無法使用本網站而引起嘅任何直接、間接、附帶、後果或懲罰性損害概不負責。",
          },
          {
            h: "6. 管轄法律",
            p: "本條款受香港特別行政區法律管轄。因本條款引起嘅任何爭議會喺香港法院解決。",
          },
          {
            h: "7. 變更",
            p: "我哋可能不時更新本條款。上方嘅「最後更新」日期反映最近修訂。更改後繼續使用本網站即表示接受更新後嘅條款。",
          },
        ],
      },
      complaints: {
        title: "投訴程序",
        updated: "最後更新：2026 年 7 月",
        intro:
          "Smarthub Connect Limited 為香港持牌信託及公司服務供應商 (TCSP，牌照號碼 TC010264)，受香港公司註冊處規管。我哋致力提供高質素服務，並迅速、公平、透明咁處理投訴。",
        sections: [
          {
            h: "1. 點樣投訴",
            p: "您可以書面提交投訴：電郵至 info@smarthubc.com（主旨：「投訴」）；郵寄至 Complaints Officer, Smarthub Connect Limited, 香港灣仔駱克道 88 號 25 樓；或營業時間內親臨我哋辦公室。請附上：您嘅姓名同聯絡資料、投訴性質、事件日期、涉及員工姓名（如有）同您希望嘅結果。",
          },
          {
            h: "2. 確認",
            p: "我哋會喺 3 個工作天內書面確認收到您嘅投訴。確認會包括處理您投訴嘅員工姓名同聯絡資料。",
          },
          {
            h: "3. 調查",
            p: "您嘅投訴會由一名冇直接牽涉事件嘅高級員工調查。我哋目標喺 30 個工作天內完成調查。如需更長時間，我哋會聯絡您提供更新時間表同原因。",
          },
          {
            h: "4. 回覆",
            p: "調查完成後，我哋會向您提供書面回覆，包括：您嘅投訴摘要、調查結果、我哋已採取或將採取嘅行動，同埋您唔滿意時嘅上訴權利。",
          },
          {
            h: "5. 上訴",
            p: "如您對我哋嘅回覆唔滿意，可向規管 TCSP 持牌者嘅香港公司註冊處上訴。聯絡資料：Companies Registry, 14th Floor, Queensway Government Offices, 66 Queensway, Hong Kong。網站：www.cr.gov.hk。",
          },
          {
            h: "6. 保密",
            p: "所有投訴均嚴格保密。您投訴嘅資料只會同需要知道以調查同回覆嘅員工分享。我哋唔會對真誠投訴嘅客戶作出報復。",
          },
        ],
      },
      disclosures: {
        title: "披露",
        updated: "最後更新：2026 年 7 月",
        intro:
          "Smarthub Connect Limited 為 MCM Group 公司集團成員。本頁列出本網站提及嘅法律實體同佢哋各自嘅監管牌照。每個實體均為獨立法人，唔對任何其他集團實體嘅義務負責。",
        sections: [
          {
            h: "Smarthub Connect Limited",
            p: "香港持牌信託及公司服務供應商 (TCSP 牌照號碼 TC010264)。提供公司成立、公司秘書、註冊地址、服務式辦公室、虛擬辦公室同會議室服務。註冊辦事處：香港灣仔駱克道 88 號 25 樓。",
          },
          {
            h: "MCM Group 生態系統",
            p: "Smarthub Connect 為 MCM Group 一員，集團包括 Money Concepts (Asia) Holdings Limited、Money Concepts Asset Management Limited、Money Concepts Wealth Management Limited、MC Fintech Solutions Limited 同 MCU Institute Limited。本網站提及透過 MCM Group 姊妹公司提供嘅服務，由該等實體喺佢哋自己嘅牌照同委聘條款下提供，而唔係由 Smarthub Connect Limited 提供。",
          },
          {
            h: "牌照核實",
            p: "Smarthub Connect Limited 嘅 TCSP 牌照可喺香港公司註冊處網站 www.cr.gov.hk 核實。其他 MCM Group 實體持有各自嘅監管牌照（SFC 第 1、4、9 類；IA 註冊保險經紀；MPFA 註冊中介人），可喺相關監管機構嘅公共登記冊核實。",
          },
          {
            h: "非要約或招攬",
            p: "本網站僅供參考，唔構成喺任何不允許嘅司法管轄區提供任何服務嘅要約或招攬。特別係，本網站唔針對美國、歐盟或任何需要監管牌照而相關 MCM Group 實體未持有嘅司法管轄區嘅任何人。",
          },
          {
            h: "資訊準確性",
            p: "我哋努力確保本網站資訊準確同最新。但我哋對任何資訊嘅完整性、準確性或可靠性不作任何明示或暗示嘅陳述或保證。所示收費僅供參考，可隨時更改而不作另行通知。",
          },
        ],
      },
    },
  },

  // ===== SIMPLIFIED CHINESE (简体中文) =====
  // Structure mirrors the English section above — same keys, Chinese values.
  "zh-CN": {
    footer: {
      ctaTitle: "准备好在香港设立？",
      ctaBody: "今天就与湾仔真人谈谈。",
      ctaButton: "WhatsApp 我们",
    },
    cookie: {
      title: "我们使用 cookies",
      body: "我们使用必要 cookies 令网站运作，另用分析 cookies 了解您如何使用。您可以选择启用哪些。",
      acceptAll: "全部接受",
      necessaryOnly: "只必要",
      learnMore: "了解更多",
    },
    backToTop: "返回顶部",
    skipToContent: "跳到主要内容",
    notFound: {
      title: "找不到页面",
      body: "您正在寻找的页面不存在或已搬迁。让我们带您回去。",
      cta: "返回首页",
    },
    whyHk: {
      bandTitle: "香港欢迎您的业务。",
      bandBody: "成为亚洲最国际化金融中心一员。",
    },
    insights: {
      featuredBadge: "精选",
      readArticle: "阅读文章",
      allArticles: "全部文章",
      readMore: "阅读更多",
    },
    pricing: {
      faqEyebrow: "常见问题",
    },
    contact: {
      mapsButton: "Google 地图",
      formError: "发生错误。请再试一次或直接电邮我们。",
      privacyNotice: "我们尊重您的隐私。阅读我们的",
      privacyLink: "隐私政策",
      honeypotLabel: "请将此栏留空",
    },
    legal: {
      privacy: {
        title: "隐私政策",
        updated: "最后更新：2026 年 7 月",
        intro:
          "本隐私政策说明 Smarthub Connect Limited（\u201c我们\u201d）在您浏览 smarthubc.com 时如何收集、使用与保护您的个人资料。我们致力遵守香港《个人资料（隐私）条例》(PDPO) 第 486 章。",
        sections: [
          {
            h: "1. 我们收集的资料",
            p: "当您提交联络表格时，我们会收集：您的姓名、电邮、电话、感兴趣的服务与讯息内容。我们也会自动收集技术资料：IP 位址、浏览器类型、到访页面与停留时间（如已启用分析服务）。",
          },
          {
            h: "2. 收集目的",
            p: "您的个人资料只用于：回复您的查询、提供您要求的服务、发送相关最新资讯（须经我们的电子报订阅）、履行我们作为 TCSP 持牌者的法律与监管义务，与改善我们的网站与服务。",
          },
          {
            h: "3. 香港境外资料传输",
            p: "我们的联络表格由 Formspree（一家位于美国的第三方服务）处理。提交表格即表示您同意您的资料被传输到美国并储存于当地。我们的分析服务（如启用）亦可能将资料储存于香港境外。我们只会将资料传输到 PDPO 第 33 条下提供足够保障的司法管辖区。",
          },
          {
            h: "4. 资料保留",
            p: "我们会将查询表格资料自提交日起保留 24 个月，之后永久删除，除非您成为我们的客户（届时资料会按照我们的客户纪录政策保留，通常为 TCSP 操守准则要求的 7 年）。",
          },
          {
            h: "5. 您的权利",
            p: "根据 PDPO，您有权：要求查阅您的个人资料、要求更正不准确资料、要求我们停止将您的资料用于直销，以及向个人资料隐私专员投诉（如您认为我们违反 PDPO）。要行使任何权利，请电邮 info@smarthubc.com。",
          },
          {
            h: "6. Cookies",
            p: "我们预设只用必要 cookies（网站运作所需）。如您接受分析 cookies，我们会用一个隐私友善、不会跨网站追踪您的分析服务。您可以随时透过 cookie 横幅更改偏好。",
          },
          {
            h: "7. 联络",
            p: "如对本隐私政策或我们如何处理您的资料有任何疑问，请联络：Smarthub Connect Limited，香港湾仔骆克道 88 号 25 楼。电邮：info@smarthubc.com。电话：+852 2383 3283。",
          },
        ],
      },
      terms: {
        title: "使用条款",
        updated: "最后更新：2026 年 7 月",
        intro:
          "本使用条款管辖您对 smarthubc.com 的存取与使用。存取本网站即表示您同意受本条款约束。如您不同意，请勿使用本网站。",
        sections: [
          {
            h: "1. 仅供参考",
            p: "本网站仅作一般资讯用途。不构成法律、税务、会计或投资建议，亦不应依赖作此用途。本网站任何内容不构成在任何不允许的司法管辖区提供服务的要约或招揽。",
          },
          {
            h: "2. 无客户关系",
            p: "浏览本网站或提交查询不会构成您与 Smarthub Connect Limited 之间的客户、顾问或任何专业关系。提供任何服务前必须签订正式委聘信。",
          },
          {
            h: "3. 知识产权",
            p: "本网站所有内容——包括文字、图像、标志、图片与软件——属 Smarthub Connect Limited 或其特许人所有，受香港与国际版权法保护。未经我们事先书面同意，您不得复制、分发或创作衍生作品。",
          },
          {
            h: "4. 第三方连结",
            p: "本网站可能包含第三方网站连结。我们对这些网站的内容、隐私做法或准确性概不负责。浏览连结网站风险自负。",
          },
          {
            h: "5. 责任限制",
            p: "在法律允许的最大范围内，Smarthub Connect Limited 对因您使用或无法使用本网站而引起的任何直接、间接、附带、后果或惩罚性损害概不负责。",
          },
          {
            h: "6. 管辖法律",
            p: "本条款受香港特别行政区法律管辖。因本条款引起的任何争议会在香港法院解决。",
          },
          {
            h: "7. 变更",
            p: "我们可能不时更新本条款。上方的「最后更新」日期反映最近修订。更改后继续使用本网站即表示接受更新后的条款。",
          },
        ],
      },
      complaints: {
        title: "投诉程序",
        updated: "最后更新：2026 年 7 月",
        intro:
          "Smarthub Connect Limited 为香港持牌信托及公司服务供应商 (TCSP，牌照号码 TC010264)，受香港公司注册处规管。我们致力提供高质素服务，并迅速、公平、透明地处理投诉。",
        sections: [
          {
            h: "1. 如何投诉",
            p: "您可以书面提交投诉：电邮至 info@smarthubc.com（主旨：「投诉」）；邮寄至 Complaints Officer, Smarthub Connect Limited, 香港湾仔骆克道 88 号 25 楼；或营业时间内亲临我们办公室。请附上：您的姓名与联络资料、投诉性质、事件日期、涉及员工姓名（如有）与您希望的结果。",
          },
          {
            h: "2. 确认",
            p: "我们会在 3 个工作天内书面确认收到您的投诉。确认会包括处理您投诉的员工姓名与联络资料。",
          },
          {
            h: "3. 调查",
            p: "您的投诉会由一名没有直接牵涉事件的高级员工调查。我们目标在 30 个工作天内完成调查。如需更长时间，我们会联络您提供更新时间表与原因。",
          },
          {
            h: "4. 回覆",
            p: "调查完成后，我们会向您提供书面回覆，包括：您的投诉摘要、调查结果、我们已采取或将采取的行动，以及您不满意时的上诉权利。",
          },
          {
            h: "5. 上诉",
            p: "如您对我们的回覆不满意，可向规管 TCSP 持牌者的香港公司注册处上诉。联络资料：Companies Registry, 14th Floor, Queensway Government Offices, 66 Queensway, Hong Kong。网站：www.cr.gov.hk。",
          },
          {
            h: "6. 保密",
            p: "所有投诉均严格保密。您投诉的资料只会与需要知道以调查与回覆的员工分享。我们不会对真诚投诉的客户作出报复。",
          },
        ],
      },
      disclosures: {
        title: "披露",
        updated: "最后更新：2026 年 7 月",
        intro:
          "Smarthub Connect Limited 为 MCM Group 公司集团成员。本页列出本网站提及的法律实体与他们各自的监管牌照。每个实体均为独立法人，不对任何其他集团实体的义务负责。",
        sections: [
          {
            h: "Smarthub Connect Limited",
            p: "香港持牌信托及公司服务供应商 (TCSP 牌照号码 TC010264)。提供公司成立、公司秘书、注册地址、服务式办公室、虚拟办公室与会议室服务。注册办事处：香港湾仔骆克道 88 号 25 楼。",
          },
          {
            h: "MCM Group 生态系统",
            p: "Smarthub Connect 为 MCM Group 一员，集团包括 Money Concepts (Asia) Holdings Limited、Money Concepts Asset Management Limited、Money Concepts Wealth Management Limited、MC Fintech Solutions Limited 与 MCU Institute Limited。本网站提及透过 MCM Group 姊妹公司提供的服务，由该等实体在它们自己的牌照与委聘条款下提供，而非由 Smarthub Connect Limited 提供。",
          },
          {
            h: "牌照核实",
            p: "Smarthub Connect Limited 的 TCSP 牌照可在香港公司注册处网站 www.cr.gov.hk 核实。其他 MCM Group 实体持有各自的监管牌照（SFC 第 1、4、9 类；IA 注册保险经纪；MPFA 注册中介人），可在相关监管机构的公共登记册核实。",
          },
          {
            h: "非要约或招揽",
            p: "本网站仅供参考，不构成在任何不允许的司法管辖区提供任何服务的要约或招揽。特别是，本网站不针对美国、欧盟或任何需要监管牌照而相关 MCM Group 实体未持有的司法管辖区的任何人。",
          },
          {
            h: "资讯准确性",
            p: "我们努力确保本网站资讯准确与最新。但我们对任何资讯的完整性、准确性或可靠性不作任何明示或暗示的陈述或保证。所示收费仅供参考，可随时更改而不作另行通知。",
          },
        ],
      },
    },
  },
} as const;
