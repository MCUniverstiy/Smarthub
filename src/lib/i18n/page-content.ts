// ============================================================================
// FILE: page-content.ts
// WHAT IT IS: Page-specific content (hero text, body paragraphs, FAQs) for
//             every page on the site, in all 3 languages (EN / 繁體 / 简体).
// WHAT IT DOES: Provides a `pageContent` object that gets merged into the
//               main translation dictionary at runtime by lang-context.tsx.
//               This is the file you edit when you need to change the actual
//               WORDS on a specific page (not the UI labels — those are in
//               translations.ts).
// HOW IT FITS: translations.ts = UI labels (nav, buttons, form fields).
//               page-content.ts = page body copy (heroes, story, FAQs).
//               extra-content.ts = legal pages + cookie + 404 text.
//               lang-context.tsx merges all 3 into one `t` object.
// ============================================================================

// Exported as `pageContent` — imported by lang-context.tsx and by page
// components that need page-specific text (via `pageContent[lang].pages.home` etc.)
export const pageContent = {
  // ===== ENGLISH =====
  en: {
    pages: {
      // --- HOME PAGE content ---
      // Used by: src/components/pages/home.tsx
      // Accessed via: pageContent[lang].pages.home
      home: {
        heroEyebrow: "Hong Kong · Est. Wan Chai",       // Small pill above headline
        heroTitle: "Real partnership for",               // First part of big headline
        heroAccent: "Hong Kong business.",               // Gradient-colored second part
        heroLead:                                        // Paragraph below headline
          "Smarthub Connect is a corporate services provider and workspace operator in the heart of Wan Chai — everything you need to incorporate, comply and grow under one roof.",
        heroCta1: "Explore Services",                    // Primary button text
        heroCta2: "Book a Tour",                         // Secondary button text
        introEyebrow: "Who We Are",                      // Intro section label
        introTitle: "One partner. Four services. One Wan Chai address.",
        introBody:
          "For more than two decades, Smarthub Connect has helped entrepreneurs, family offices and multinational firms set up and operate in Hong Kong. We handle incorporation, compliance and workspace — backed by the wider MCM Group ecosystem.",
        introCta: "Learn about us",
        servicesEyebrow: "What We Do",
        servicesTitle: "Services built around your Hong Kong operation.",
        servicesLead:
          "From your first company incorporation to a fully-staffed Wan Chai office, Smarthub Connect has a service line for every stage.",
        servicesCta: "View all services",
        whyhkEyebrow: "Why Hong Kong",
        whyhkTitle: "The world's most business-friendly city.",
        whyhkLead:
          "Low tax, free capital movement, common law, and the gateway to China — Hong Kong remains the preferred hub for Asian family offices and regional HQs.",
        whyhkCta: "See the full case",
        insightsEyebrow: "Insights",
        insightsTitle: "Practical Hong Kong commentary. No fluff.",
        insightsCta: "All insights",
        ctaTitle: "Ready to set up in Hong Kong?",
        ctaLead:
          "Book a free 30-minute consultation with our Wan Chai team. We'll map out your structure, timeline and next steps — no obligation.",
        ctaButton: "Book a Consultation",
      },
      // --- ABOUT PAGE content ---
      // Used by: src/components/pages/about.tsx
      about: {
        heroEyebrow: "About Smarthub Connect",
        heroTitle: "Hong Kong's corporate services specialist.",
        heroLead:
          "We are a TCSP-licensed trust and company service provider based in Wan Chai — and part of the MCM Group ecosystem of wealth, fintech and education firms.",
        storyEyebrow: "Our Story",
        storyTitle: "Built for Hong Kong. Built for the long term.",
        storyBody: [
          "Smarthub Connect Limited is the corporate services and workspace arm of MCM Group. The mission is simple: give entrepreneurs, family offices and multinationals a single, reliable partner for everything required to operate in Hong Kong.",
          "Over two decades our team has incorporated more than 1,200 Hong Kong and offshore companies, served thousands of workspace clients, and built a bilingual team that speaks English, Cantonese and Mandarin fluently. We operate from a Grade-A floor at 25/F, 88 Lockhart Road, Wan Chai — two minutes from the MTR.",
          "What makes us different is what we don't do: we don't outsource core services, we don't take referral commissions, and we don't pass you between vendors. Your relationship director at Smarthub coordinates every discipline in-house — corporate, workspace, accounting and compliance.",
        ],
        valuesEyebrow: "What We Stand For",
        valuesTitle: "Four principles that shape every engagement.",
        values: [
          {
            title: "Licensed & Accountable",
            text: "TCSP-licensed (TC010264). We carry the regulatory responsibility — we don't outsource it.",
          },
          {
            title: "In-House Execution",
            text: "Secretarial, accounting, workspace and IT — all delivered by Smarthub staff, not third-party vendors.",
          },
          {
            title: "Bilingual by Default",
            text: "English, Cantonese and Mandarin spoken daily. Documents prepared in the language your business operates in.",
          },
          {
            title: "Long-Term Partnership",
            text: "98% client retention. We measure success in decades, not transactions.",
          },
        ],
        groupEyebrow: "MCM Group",
        groupTitle: "Part of a wider ecosystem.",
        groupBody:
          "Smarthub Connect is one of six companies under the MCM Group umbrella — alongside Money Concepts (Asia) Holdings, Money Concepts Asset Management, Money Concepts Wealth Management, MC Fintech Solutions and MCU Institute. Clients who start with corporate services can seamlessly access wealth management, fintech infrastructure and professional education through sister entities, all under the same relationship.",
        groupCta: "Speak to our team",
        teamEyebrow: "The Team",
        teamTitle: "A senior Hong Kong team.",
        teamBody:
          "Our Wan Chai office is staffed by company secretaries, accountants, workspace managers and relationship directors with decades of professional experience. Every engagement is led by a senior practitioner who knows your structure inside out.",
      },
      // --- SERVICES PAGE content ---
      // Used by: src/components/pages/services.tsx
      services: {
        heroEyebrow: "Our Services",
        heroTitle: "Four services. One Wan Chai address.",
        heroLead:
          "Whether you are a startup incorporating your first Hong Kong company or a family office running a BVI holding structure, Smarthub Connect has a service line built for you.",
        pricingTeaserTitle: "Transparent Hong Kong market pricing.",
        pricingTeaserBody:
          "Starter packages from HK$8,800 one-off. Full TCSP compliance + virtual office from HK$1,980/month. Enterprise solutions custom-quoted.",
        pricingTeaserCta: "View full pricing",
        detailCta: "Enquire about this service",
      },
      // --- WHY HONG KONG PAGE content ---
      // Used by: src/components/pages/why-hk.tsx
      whyhk: {
        heroEyebrow: "Why Hong Kong",
        heroTitle: "Asia's preferred business hub.",
        heroLead:
          "Hong Kong ranks consistently in the top 5 globally for ease of doing business. With 0% profits tax on offshore income, free capital movement, and a common-law legal system, it remains the preferred base for family offices and multinational regional HQs.",
        statsTitle: "Hong Kong by the numbers.",
        stats: [
          { num: "16.5%", label: "Corporate profits tax (first HK$2M: 8.25%)" },
          { num: "0%", label: "GST / VAT / Capital gains tax" },
          { num: "Top 5", label: "Global ease of doing business" },
          { num: "5hr", label: "Flight radius to half the world" },
          { num: "7.5M", label: "Population, bilingual workforce" },
          { num: "1900+", label: "Listed companies on HKEX" },
        ],
        ctaTitle: "Ready to set up in Hong Kong?",
        ctaLead:
          "Our Wan Chai team handles the entire incorporation and compliance process — typically in 7–10 working days.",
        ctaButton: "Book a Consultation",
      },
      // --- PRICING PAGE content ---
      // Used by: src/components/pages/pricing.tsx
      // Contains: hero text, 3 pricing tiers, 6 workspace add-ons, 6 FAQ items
      pricing: {
        heroEyebrow: "Pricing",
        heroTitle: "Transparent Hong Kong market rates.",
        heroLead:
          "Indicative monthly and annual pricing based on Hong Kong market research as of 2026. Final quotes depend on your structure and requirements — book a free consultation for a tailored proposal.",
        faqTitle: "Frequently asked questions.",
        faq: [
          {
            q: "What does the Starter package include?",
            a: "Hong Kong limited company incorporation, one year of company secretarial service, registered address for one year, bank account opening support, and delivery of your Business Registration and Certificate of Incorporation. Government fees are billed at cost.",
          },
          {
            q: "Can I upgrade from Professional to Enterprise later?",
            a: "Yes. Many of our clients start on Professional, then upgrade to Enterprise as they hire staff and need a dedicated private office. Upgrades are pro-rated and effective immediately.",
          },
          {
            q: "Do you handle offshore structures (BVI, Cayman)?",
            a: "Yes. Our TCSP licence covers offshore incorporation and ongoing secretarial. BVI and Cayman formations are typically quoted as part of an Enterprise package.",
          },
          {
            q: "What are your office hours?",
            a: "Monday to Friday 9:00–18:30. Office access for tenants is 24/7 via keycard.",
          },
          {
            q: "Do you offer refunds if I cancel?",
            a: "Annual prepayments are refundable on a pro-rated basis for any full unused months remaining. Monthly plans can be cancelled with 30 days' notice.",
          },
          {
            q: "How do I get started?",
            a: "Book a free consultation via our contact form, or WhatsApp us at +852 5501 3516. We'll typically respond within one business day with a tailored proposal.",
          },
        ],
      },
      // --- INSIGHTS PAGE content ---
      // Used by: src/components/pages/insights.tsx
      // Contains: hero text, featured article, newsletter signup text
      insights: {
        heroEyebrow: "Insights",
        heroTitle: "Practical Hong Kong corporate and workspace commentary.",
        heroLead:
          "Commentary and how-to guides from our Wan Chai team — covering incorporation, compliance, tax, workspaces and operating in Hong Kong.",
        featured: {
          cat: "Tax",
          date: "Q3 2026 · 8 min read",
          title: "Hong Kong Offshore Tax Claim — Documentation the IRD Will Actually Accept",
          excerpt:
            "A practical walkthrough of the evidence package that consistently passes IRD offshore claims audit, with a sample memo template and 2026 case examples.",
        },
        newsletterTitle: "Get our quarterly briefing.",
        newsletterBody:
          "Once a quarter, we send a short briefing on HK regulatory changes, tax deadlines and workspace market trends. No spam, ever.",
        newsletterPlaceholder: "you@company.com",
        newsletterCta: "Subscribe",
        newsletterSuccess: "Subscribed ✓",
      },
      // --- CONTACT PAGE content ---
      // Used by: src/components/pages/contact.tsx
      contact: {
        heroEyebrow: "Contact",
        heroTitle: "Book a free consultation.",
        heroLead:
          "Tell us about your business and what you need. A real human from our Wan Chai office will get back to you within one business day.",
        mapTitle: "Find us in Wan Chai.",
        mapBody:
          "Two minutes from Wan Chai MTR (Exit C). Look for 88 Lockhart Road — we're on the 25th floor.",
      },
    },
  },

  // ===== TRADITIONAL CHINESE (繁體中文) =====
  // Structure mirrors the English section above — same keys, Chinese values.
  // Every key in EN must have a corresponding key here, or the UI will show
  // undefined text when the user switches to Cantonese.
  "zh-HK": {
    pages: {
      home: {
        heroEyebrow: "香港 · 灣仔立足",
        heroTitle: "真正的夥伴",
        heroAccent: "進軍香港商業。",
        heroLead:
          "Smarthub Connect 是持牌 TCSP 企業服務供應商與工作空間營運商，位處灣仔核心地段——成立、合規與擴展，一站搞定。",
        heroCta1: "探索服務",
        heroCta2: "預約參觀",
        introEyebrow: "關於我們",
        introTitle: "一個夥伴。四項服務。一個灣仔地址。",
        introBody:
          "二十多年來，Smarthub Connect 協助創業家、家族辦公室與跨國企業在香港設立與營運。我們處理成立、合規與工作空間——並由 MCM Group 生態系統支援。",
        introCta: "認識我們",
        servicesEyebrow: "我們做甚麼",
        servicesTitle: "圍繞您香港業務而建的服務。",
        servicesLead:
          "由首間公司成立到全配置灣仔辦公室，Smarthub Connect 為每個階段提供專屬服務。",
        servicesCta: "查看全部服務",
        whyhkEyebrow: "為何香港",
        whyhkTitle: "全球最友善的營商城市。",
        whyhkLead:
          "低稅、資金自由、普通法、中國門戶——香港依然是家族辦公室與區域總部首選樞紐。",
        whyhkCta: "查看完整理據",
        insightsEyebrow: "資訊",
        insightsTitle: "實用香港評論。絕不灌水。",
        insightsCta: "全部資訊",
        ctaTitle: "準備好喺香港設立？",
        ctaLead:
          "預約灣仔團隊 30 分鐘免費諮詢。我哋會梳理您的架構、時間表同下一步——無任何義務。",
        ctaButton: "預約諮詢",
      },
      about: {
        heroEyebrow: "關於 Smarthub Connect",
        heroTitle: "香港企業服務專家。",
        heroLead:
          "我哋係持牌信託及公司服務供應商，立足灣仔——並屬 MCM Group 財富、金融科技同教育公司生態系統一員。",
        storyEyebrow: "我們的故事",
        storyTitle: "為香港而建。為長遠而建。",
        storyBody: [
          "Smarthub Connect Limited 為 MCM Group 旗下企業服務與工作空間臂膀。使命簡單：為創業家、家族辦公室與跨國企業提供單一、可靠的香港營運夥伴。",
          "二十多年來，我哋成立咗超過 1,200 間香港及離岸公司，服務數千工作空間客戶，建立咗流利使用英語、粵語同普通話嘅雙語團隊。我哋於灣仔駱克道 88 號 25 樓甲級樓層營運——港鐵兩分鐘即達。",
          "我哋嘅分別在於我哋唔做嘅嘢：唔外判核心服務、唔收轉介佣金、唔將您喺供應商之間傳遞。您嘅關係董事喺 Smarthub 內部協調所有紀律——企業、工作空間、會計同合規。",
        ],
        valuesEyebrow: "我們信甚麼",
        valuesTitle: "四個原則塑造每次合作。",
        values: [
          {
            title: "持牌問責",
            text: "持牌 TCSP (TC010264)。我哋承擔監管責任——唔外判。",
          },
          {
            title: "內部執行",
            text: "秘書、會計、工作空間同 IT——全部由 Smarthub 員工交付，唔假外求。",
          },
          {
            title: "雙語為本",
            text: "日常使用英語、粵語同普通話。文件以您業務語言編製。",
          },
          {
            title: "長遠夥伴",
            text: "98% 客戶續約率。以十年為單位量度成功，唔係以交易。",
          },
        ],
        groupEyebrow: "MCM Group",
        groupTitle: "更廣生態系統一員。",
        groupBody:
          "Smarthub Connect 係 MCM Group 傘下六間公司之一——連同 Money Concepts (Asia) Holdings、Money Concepts Asset Management、Money Concepts Wealth Management、MC Fintech Solutions 同 MCU Institute。由企業服務開始嘅客戶，可無縫接軌姊妹公司嘅財富管理、金融科技基建同專業教育——同一關係之下。",
        groupCta: "聯絡我哋團隊",
        teamEyebrow: "團隊",
        teamTitle: "資深香港團隊。",
        teamBody:
          "我哋灣仔辦公室由公司秘書、會計師、工作空間經理同關係董事組成——團隊具備數十年專業經驗。每次合作由認識您架構嘅資深從業員帶領。",
      },
      services: {
        heroEyebrow: "我們的服務",
        heroTitle: "四項服務。一個灣仔地址。",
        heroLead:
          "無論您係初創公司首次在香港成立，還是家族辦公室運作 BVI 控股結構，Smarthub Connect 都有專為您而設嘅服務。",
        pricingTeaserTitle: "透明嘅香港市場收費。",
        pricingTeaserBody:
          "入門套餐由 HK$8,800 一次過。全面 TCSP 合規 + 虛擬辦公室由 HK$1,980/月。企業方案自訂報價。",
        pricingTeaserCta: "查看完整收費",
        detailCta: "查詢此服務",
      },
      whyhk: {
        heroEyebrow: "為何香港",
        heroTitle: "亞洲首選營商樞紐。",
        heroLead:
          "香港持續位列全球營商便利度前五。離岸收入 0% 利得稅、資金自由進出、普通法法制——依然是家族辦公室與跨國區域總部首選基地。",
        statsTitle: "香港數字一覽。",
        stats: [
          { num: "16.5%", label: "企業利得稅 (首 HK$2M: 8.25%)" },
          { num: "0%", label: "GST / VAT / 資本增值稅" },
          { num: "Top 5", label: "全球營商便利度" },
          { num: "5 小時", label: "飛行半徑覆蓋全球半數" },
          { num: "750 萬", label: "人口，雙語工作人口" },
          { num: "1900+", label: "港交所上市公司" },
        ],
        ctaTitle: "準備好喺香港設立？",
        ctaLead: "我哋灣仔團隊處理整個成立同合規流程——通常 7–10 個工作天。",
        ctaButton: "預約諮詢",
      },
      pricing: {
        heroEyebrow: "收費",
        heroTitle: "透明的香港市場行情。",
        heroLead:
          "以下為 2026 年香港市場研究之參考收費。最終報價視乎您的架構與需求——預約免費諮詢以獲取度身訂造方案。",
        faqTitle: "常見問題。",
        faq: [
          {
            q: "入門套餐包括甚麼？",
            a: "香港有限公司成立、一年公司秘書服務、一年註冊地址、銀行開戶支援，及交付商業登記證與公司註冊證書。政府費用按成本實報。",
          },
          {
            q: "可以由專業升級到企業嗎？",
            a: "可以。好多客戶由專業開始，到請人同需要專屬私人辦公室時升級到企業。升級按比例計算，即時生效。",
          },
          {
            q: "你哋處理離岸架構 (BVI、開曼) 嗎？",
            a: "處理。我哋 TCSP 牌照涵蓋離岸成立同持續秘書。BVI 同開曼成立通常作為企業套餐一部分報價。",
          },
          {
            q: "營業時間係幾點？",
            a: "週一至五 9:00–18:30。租戶辦公室通行 24/7 智能卡。",
          },
          {
            q: "取消有退款嗎？",
            a: "年付預繳可按未用完整月份比例退款。月計劃可提前 30 日通知取消。",
          },
          {
            q: "點樣開始？",
            a: "透過聯絡表單預約免費諮詢，或 WhatsApp +852 5501 3516。通常一個工作天內回覆度身方案。",
          },
        ],
      },
      insights: {
        heroEyebrow: "資訊",
        heroTitle: "實用香港企業與工作空間評論。",
        heroLead: "來自我哋灣仔團隊嘅評論同指南——涵蓋成立、合規、稅務、工作空間同香港營運。",
        featured: {
          cat: "稅務",
          date: "2026 Q3 · 8 分鐘閱讀",
          title: "香港離岸稅申索——稅局真正接受的文件",
          excerpt:
            "實戰拆解 consistently 通過稅局離岸申索審計的證據套件，附備忘錄範本同 2026 案例示範。",
        },
        newsletterTitle: "訂閱我哋季度簡報。",
        newsletterBody: "每季一封，講 HK 監管變化、稅務死線同工作空間市場趨勢。絕無垃圾郵件。",
        newsletterPlaceholder: "you@company.com",
        newsletterCta: "訂閱",
        newsletterSuccess: "已訂閱 ✓",
      },
      contact: {
        heroEyebrow: "聯絡",
        heroTitle: "預約免費諮詢。",
        heroLead: "告訴我們您的業務及需求。我們灣仔辦公室的真人將於一個工作天內回覆。",
        mapTitle: "灣仔見。",
        mapBody: "灣仔港鐵 C 出口兩分鐘。搵駱克道 88 號——我哋喺 25 樓。",
      },
    },
  },

  // ===== SIMPLIFIED CHINESE (简体中文) =====
  // Structure mirrors the English section above — same keys, Chinese values.
  "zh-CN": {
    pages: {
      home: {
        heroEyebrow: "香港 · 立足湾仔",
        heroTitle: "真正的伙伴",
        heroAccent: "进军香港商业。",
        heroLead:
          "Smarthub Connect 是持牌 TCSP 企业服务供应商与工作空间运营商，位于湾仔核心地段——成立、合规与扩展，一站搞定。",
        heroCta1: "探索服务",
        heroCta2: "预约参观",
        introEyebrow: "关于我们",
        introTitle: "一个伙伴。四项服务。一个湾仔地址。",
        introBody:
          "二十多年来，Smarthub Connect 协助创业者、家族办公室与跨国企业在香港设立与运营。我们处理成立、合规与工作空间——并由 MCM Group 生态系统支援。",
        introCta: "认识我们",
        servicesEyebrow: "我们做什么",
        servicesTitle: "围绕您香港业务而建的服务。",
        servicesLead:
          "由首间公司成立到全配置湾仔办公室，Smarthub Connect 为每个阶段提供专属服务。",
        servicesCta: "查看全部服务",
        whyhkEyebrow: "为何香港",
        whyhkTitle: "全球最友善的营商城市。",
        whyhkLead:
          "低税、资金自由、普通法、中国门户——香港依然是家族办公室与区域总部首选枢纽。",
        whyhkCta: "查看完整理据",
        insightsEyebrow: "资讯",
        insightsTitle: "实用香港评论。绝不灌水。",
        insightsCta: "全部资讯",
        ctaTitle: "准备好在香港设立？",
        ctaLead: "预约湾仔团队 30 分钟免费咨询。我们会梳理您的架构、时间表与下一步——无任何义务。",
        ctaButton: "预约咨询",
      },
      about: {
        heroEyebrow: "关于 Smarthub Connect",
        heroTitle: "香港企业服务专家。",
        heroLead:
          "我们是持牌信托及公司服务供应商，立足湾仔——并属 MCM Group 财富、金融科技与教育公司生态系统一员。",
        storyEyebrow: "我们的故事",
        storyTitle: "为香港而建。为长远而建。",
        storyBody: [
          "Smarthub Connect Limited 为 MCM Group 旗下企业服务与工作空间臂膀。使命简单：为创业者、家族办公室与跨国企业提供单一、可靠的香港营运伙伴。",
          "二十多年来，我们成立了超过 1,200 间香港及离岸公司，服务数千工作空间客户，建立了流利使用英语、粤语与普通话的双语团队。我们于湾仔骆克道 88 号 25 楼甲级楼层营运——地铁两分钟即达。",
          "我们的分别在于我们不做的事：不外判核心服务、不收转介佣金、不将您在供应商之间传递。您的关系董事在 Smarthub 内部协调所有纪律——企业、工作空间、会计与合规。",
        ],
        valuesEyebrow: "我们信什么",
        valuesTitle: "四个原则塑造每次合作。",
        values: [
          {
            title: "持牌问责",
            text: "持牌 TCSP (TC010264)。我们承担监管责任——不外判。",
          },
          {
            title: "内部执行",
            text: "秘书、会计、工作空间与 IT——全部由 Smarthub 员工交付，不假外求。",
          },
          {
            title: "双语为本",
            text: "日常使用英语、粤语与普通话。文件以您业务语言编制。",
          },
          {
            title: "长远伙伴",
            text: "98% 客户续约率。以十年为单位量度成功，不是以交易。",
          },
        ],
        groupEyebrow: "MCM Group",
        groupTitle: "更广生态系统一员。",
        groupBody:
          "Smarthub Connect 是 MCM Group 伞下六间公司之一——连同 Money Concepts (Asia) Holdings、Money Concepts Asset Management、Money Concepts Wealth Management、MC Fintech Solutions 与 MCU Institute。由企业服务开始的客户，可无缝接轨姊妹公司的财富管理、金融科技基建与专业教育——同一关系之下。",
        groupCta: "联络我们团队",
        teamEyebrow: "团队",
        teamTitle: "资深香港团队。",
        teamBody:
          "我们湾仔办公室由公司秘书、会计师、工作空间经理与关系董事组成——团队具备数十年专业经验。每次合作由认识您架构的资深从业员带领。",
      },
      services: {
        heroEyebrow: "我们的服务",
        heroTitle: "四项服务。一个湾仔地址。",
        heroLead:
          "无论您是初创公司首次在香港成立，还是家族办公室运作 BVI 控股结构，Smarthub Connect 都有专为而设的服务。",
        pricingTeaserTitle: "透明的香港市场收费。",
        pricingTeaserBody:
          "入门套餐由 HK$8,800 一次过。全面 TCSP 合规 + 虚拟办公室由 HK$1,980/月。企业方案自订报价。",
        pricingTeaserCta: "查看完整收费",
        detailCta: "查询此服务",
      },
      whyhk: {
        heroEyebrow: "为何香港",
        heroTitle: "亚洲首选营商枢纽。",
        heroLead:
          "香港持续位列全球营商便利度前五。离岸收入 0% 利得税、资金自由进出、普通法法制——依然是家族办公室与跨国区域总部首选基地。",
        statsTitle: "香港数字一览。",
        stats: [
          { num: "16.5%", label: "企业利得税 (首 HK$2M: 8.25%)" },
          { num: "0%", label: "GST / VAT / 资本增值税" },
          { num: "Top 5", label: "全球营商便利度" },
          { num: "5 小时", label: "飞行半径覆盖全球半数" },
          { num: "750 万", label: "人口，双语工作人口" },
          { num: "1900+", label: "港交所上市公司" },
        ],
        ctaTitle: "准备好在香港设立？",
        ctaLead: "我们湾仔团队处理整个成立与合规流程——通常 7–10 个工作天。",
        ctaButton: "预约咨询",
      },
      pricing: {
        heroEyebrow: "收费",
        heroTitle: "透明的香港市场行情。",
        heroLead:
          "以下为 2026 年香港市场研究的参考收费。最终报价视乎您的架构与需求——预约免费咨询以获取量身定做方案。",
        faqTitle: "常见问题。",
        faq: [
          {
            q: "入门套餐包括什么？",
            a: "香港有限公司成立、一年公司秘书服务、一年注册地址、银行开户支援，及交付商业登记证与公司注册证书。政府费用按成本实报。",
          },
          {
            q: "可以由专业升级到企业吗？",
            a: "可以。很多客户由专业开始，到请人与需要专属私人办公室时升级到企业。升级按比例计算，即时生效。",
          },
          {
            q: "你们处理离岸架构 (BVI、开曼) 吗？",
            a: "处理。我们 TCSP 牌照涵盖离岸成立与持续秘书。BVI 与开曼成立通常作为企业套餐一部分报价。",
          },
          {
            q: "营业时间是几点？",
            a: "周一至五 9:00–18:30。租户办公室通行 24/7 智能卡。",
          },
          {
            q: "取消有退款吗？",
            a: "年付预缴可按未用完整月份比例退款。月计划可提前 30 天通知取消。",
          },
          {
            q: "怎样开始？",
            a: "透过联络表单预约免费咨询，或 WhatsApp +852 5501 3516。通常一个工作天内回复量身方案。",
          },
        ],
      },
      insights: {
        heroEyebrow: "资讯",
        heroTitle: "实用香港企业与工作空间评论。",
        heroLead: "来自我们湾仔团队的评论与指南——涵盖成立、合规、税务、工作空间与香港营运。",
        featured: {
          cat: "税务",
          date: "2026 Q3 · 8 分钟阅读",
          title: "香港离岸税申索——税局真正接受的文件",
          excerpt: "实战拆解 consistently 通过税局离岸申索审计的证据套装，附备忘录范本与 2026 案例示范。",
        },
        newsletterTitle: "订阅我们季度简报。",
        newsletterBody: "每季一封，讲 HK 监管变化、税务死线与工作空间市场趋势。绝无垃圾邮件。",
        newsletterPlaceholder: "you@company.com",
        newsletterCta: "订阅",
        newsletterSuccess: "已订阅 ✓",
      },
      contact: {
        heroEyebrow: "联系",
        heroTitle: "预约免费咨询。",
        heroLead: "告诉我们您的业务及需求。我们湾仔办公室的真人将于一个工作天内回复。",
        mapTitle: "湾仔见。",
        mapBody: "湾仔地铁 C 出口两分钟。找骆克道 88 号——我们在 25 楼。",
      },
    },
  },
} as const;
