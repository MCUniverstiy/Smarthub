// ============================================================================
// FILE: booking-content.ts
// WHAT IT IS: Every string used by the room-booking page (route "book",
//             URL #/book) in all 3 site languages.
// WHAT IT DOES: Exports a `bookingContent` object that lang-context.tsx merges
//               into the global dictionary as `t.booking`. Components read
//               `t.booking.form.fullName`, `t.booking.rooms.title`, etc.
// HOW IT FITS: translations.ts = base UI labels. page-content.ts = page body
//              copy. extra-content.ts = misc/legal. booking-content.ts = the
//              booking funnel (hero, room catalogue labels, form fields,
//              validation messages, confirmation screen, FAQ).
// WHY SEPARATE: the booking flow has ~70 strings of its own. Keeping them in
//               one file makes it obvious what to re-translate if the team
//               changes the rooms, the rates or the booking policy.
// ============================================================================

export const bookingContent = {
  // ===== ENGLISH =====
  en: {
    // --- Nav / CTA labels used outside the booking page ---
    navLabel: "Book a Room",
    ctaShort: "Book a Room",

    // --- Page hero ---
    heroEyebrow: "Room Booking",
    heroTitle: "Book a meeting room in Wan Chai.",
    heroLead:
      "Six spaces, transparent hourly rates, and a booking request that reaches our team instantly. Pick a room, choose your slot, and we confirm by email within one business day.",

    // --- The 3-step "how it works" strip ---
    stepsTitle: "How booking works",
    steps: [
      {
        title: "Choose your space",
        text: "Compare capacity and rates below, then pick the room that fits your session.",
      },
      {
        title: "Send the request",
        text: "Tell us the date, time and headcount. Requests must be at least 7 working days ahead.",
      },
      {
        title: "We confirm & invoice",
        text: "Our Wan Chai team checks availability and emails your confirmation plus payment details.",
      },
    ],

    // --- Room catalogue section ---
    roomsEyebrow: "Available Spaces",
    roomsTitle: "Six rooms. One Wan Chai address.",
    roomsLead:
      "Review capacity and rental rates before you select a room. All rates are in HKD and exclude optional catering or AV support.",
    capacityLabel: "Up to {n} people",
    perHour: "/hour",
    perDay: "/day",
    selectRoom: "Select this room",
    selectedRoom: "Selected",

    // --- Homepage booking band ---
    homeEyebrow: "Book a Space",
    homeTitle: "Need a room this month?",
    homeLead:
      "Meeting rooms from HK$300/hour, hot desks from HK$350/day and an event space for 30. Request online and we confirm within one business day.",
    homeCta: "See rooms & rates",

    // --- Compact rate table reused on the Pricing + Services pages ---
    rateTableTitle: "Rooms by the hour",
    rateTableLead:
      "Hourly and daily rates for our bookable meeting rooms and event space. Request any of them online — confirmation within one business day.",
    rateTableRoom: "Space",
    rateTableCapacity: "Capacity",
    rateTableRate: "Rate",
    bookCta: "Book",
    bookAllCta: "Book a room",

    // --- Booking form ---
    formEyebrow: "Booking Request",
    formTitle: "Tell us about your booking.",
    formLead:
      "All fields marked * are required. Your request goes straight to our booking team — nothing is charged until we confirm availability.",
    form: {
      fullName: "Full name",
      email: "Email address",
      phone: "Phone number",
      phoneHint: "Include the country code, e.g. +852 4571 6234",
      company: "Company name",
      companyHint: 'Enter "N/A" if you are booking as an individual',
      brNumber: "BR number",
      brHint: 'Business Registration number — enter "N/A" if not applicable',
      date: "Booking date",
      dateHint: "Must be at least 7 working days from today",
      startTime: "Start time",
      startHint: "Between 9:00 AM and 5:00 PM",
      endTime: "End time",
      endHint: "Between 10:00 AM and 6:00 PM",
      room: "Room",
      attendees: "Number of attendees",
      payment: "Payment method",
      submit: "Send booking request",
      sending: "Sending request…",
      required: "Required",
      chooseRoom: "Choose a room",
      chooseTime: "Choose a time",
    },

    // --- Live summary card beside the form ---
    summaryTitle: "Your booking",
    summaryEmpty: "Select a room and a time slot to see your estimate.",
    summaryRoom: "Room",
    summaryDate: "Date",
    summaryTime: "Time",
    summaryDuration: "Duration",
    summaryAttendees: "Attendees",
    summaryEstimate: "Estimated cost",
    summaryHours: "{n} hr",
    summaryDayRate: "1 day",
    summaryNote:
      "Estimate only. Hourly rooms are billed per started hour; the final invoice is confirmed by our team.",

    // --- Validation messages ---
    errors: {
      title: "Please check the following:",
      fullName: "Enter your full name.",
      email: "Enter a valid email address.",
      phone: "Enter a phone number with country code, e.g. +85245716234.",
      company: 'Enter your company name, or "N/A".',
      brNumber: 'Enter your BR number, or "N/A".',
      date: "Choose a booking date.",
      dateTooSoon:
        "Bookings need at least 7 working days' notice. The earliest available date is {date}.",
      dateWeekend: "The office is open Monday to Friday. Please choose a weekday.",
      startTime: "Choose a start time between 9:00 AM and 5:00 PM.",
      endTime: "Choose an end time between 10:00 AM and 6:00 PM.",
      endBeforeStart: "The end time must be after the start time.",
      room: "Select a room.",
      attendees: "Enter the number of attendees.",
      attendeesOverCapacity:
        "{room} holds up to {n} people. Please reduce the headcount or pick a larger space.",
      payment: "Select a payment method.",

      // --- Refusals that come back from the database ---
      // The booking database can reject a request the browser thought
      // was fine, because it knows what everyone else has booked.
      slotTaken:
        "Sorry — that room has just been booked for the time you chose. Please pick another time or room.",
      seatsSoldOut:
        "The hot desk area is fully booked for that day. Please choose another date.",
      rateLimit:
        "You already have several requests waiting. Please give us a moment to reply before sending more.",
      submitFailed:
        "We could not send your request just now. Please try the Google Form link below, or call us on +852 5501 3516.",
    },

    // --- Live availability hints ---
    availability: {
      checking: "Checking availability…",
      taken: "Already booked",
      freeSlot: "Available",
      busyOn: "Already booked on this date:",
      allFree: "No bookings yet for this date — every time slot is free.",
      seatsLeft: "{n} of {total} hot desk seats left for this date.",
      referenceLabel: "Booking reference",
    },

    // --- Success screen ---
    successTitle: "Booking request received",
    successBody:
      "Thank you — your request is with our Wan Chai team. We will confirm availability and send payment details by email within one business day.",
    successRef: "Summary of your request",
    successAnother: "Make another booking",
    successContact: "Need it sooner? WhatsApp us",

    // --- Fallback when the silent submission cannot reach Google ---
    fallbackTitle: "We couldn't send that automatically",
    fallbackBody:
      "Your connection blocked the submission. Your answers are safe — open the pre-filled form to finish in one click, or email us directly.",
    fallbackButton: "Open pre-filled form",

    // --- Policy notice ---
    noticeTitle: "Before you book",
    notices: [
      "Bookings must be requested at least 7 working days in advance.",
      "Start times run 9:00 AM – 5:00 PM; end times run 10:00 AM – 6:00 PM.",
      "All bookings are subject to availability and written confirmation.",
      "No refunds are provided once a booking is confirmed.",
    ],

    // --- Alternate route for people who prefer Google's own form ---
    classicTitle: "Prefer the original Google Form?",
    classicBody:
      "This page submits to the same form our team already uses, so either route reaches us. Open it on Google if you'd rather fill it in there.",
    classicButton: "Open on Google Forms",

    // --- FAQ accordion ---
    faqTitle: "Booking questions",
    faq: [
      {
        q: "How far in advance do I need to book?",
        a: "At least 7 working days before your session. This gives our team time to confirm the room, arrange access cards and issue your invoice. Need something sooner? WhatsApp us and we'll tell you what's free.",
      },
      {
        q: "When will my booking be confirmed?",
        a: "We reply by email within one business day. A booking is only confirmed once you receive that written confirmation — submitting the form alone does not reserve the room.",
      },
      {
        q: "How do I pay?",
        a: "By bank transfer or FPS. Payment details are included in the confirmation email. Payment must be settled before the booking date.",
      },
      {
        q: "Can I cancel or get a refund?",
        a: "No refunds are provided once a booking is confirmed. If you need to move a confirmed booking, contact us as early as possible and we'll do our best to reschedule.",
      },
      {
        q: "What's included in the room rate?",
        a: "WiFi, air conditioning, whiteboard and pantry access. Projector, video conferencing and catering can be arranged on request — mention it when we confirm.",
      },
      {
        q: "Can I book for more people than the stated capacity?",
        a: "No. Capacities are fire-safety limits. If your group is larger than the room allows, choose the Event Space (up to 30 people) or contact us about combining rooms.",
      },
    ],
  },

  // ===== TRADITIONAL CHINESE (繁體中文) =====
  "zh-HK": {
    navLabel: "預訂房間",
    ctaShort: "預訂房間",

    heroEyebrow: "房間預訂",
    heroTitle: "預訂灣仔會議室。",
    heroLead:
      "六個空間、透明時租收費，申請即時送達我們團隊。揀房間、選時段，我們會於一個工作天內以電郵確認。",

    stepsTitle: "預訂流程",
    steps: [
      {
        title: "選擇空間",
        text: "先比較下方的容納人數及收費，再揀最合適嘅房間。",
      },
      {
        title: "提交申請",
        text: "填寫日期、時間及人數。申請須於使用日前至少 7 個工作日提出。",
      },
      {
        title: "確認及發單",
        text: "灣仔團隊查核空檔後，會電郵確認並附上付款資料。",
      },
    ],

    roomsEyebrow: "可預訂空間",
    roomsTitle: "六個房間。一個灣仔地址。",
    roomsLead:
      "選擇房間前請先查看容納人數及租金。所有收費以港幣計算，不包括餐飲及影音支援。",
    capacityLabel: "可容納 {n} 人",
    perHour: "/小時",
    perDay: "/日",
    selectRoom: "選擇此房間",
    selectedRoom: "已選擇",

    homeEyebrow: "預訂空間",
    homeTitle: "本月需要用房間？",
    homeLead:
      "會議室每小時 HK$300 起、共享工位每日 HK$350 起，另有可容納 30 人的活動場地。網上申請，一個工作天內確認。",
    homeCta: "查看房間及收費",

    rateTableTitle: "時租房間",
    rateTableLead:
      "可預訂會議室及活動場地的時租與日租收費。可於網上申請，一個工作天內確認。",
    rateTableRoom: "空間",
    rateTableCapacity: "容納人數",
    rateTableRate: "收費",
    bookCta: "預訂",
    bookAllCta: "預訂房間",

    formEyebrow: "預訂申請",
    formTitle: "請填寫預訂詳情。",
    formLead:
      "標示 * 的欄位為必填。申請將直接送到預訂團隊——確認空檔前不會收取任何費用。",
    form: {
      fullName: "姓名",
      email: "電子郵件",
      phone: "電話號碼",
      phoneHint: "請包括國家區號，例如 +852 4571 6234",
      company: "公司名稱",
      companyHint: "如以個人名義預訂，請填「N/A」",
      brNumber: "BR 編號",
      brHint: "商業登記號碼——如不適用請填「N/A」",
      date: "預訂日期",
      dateHint: "須為今日起計最少 7 個工作日之後",
      startTime: "開始時間",
      startHint: "上午 9:00 至下午 5:00",
      endTime: "結束時間",
      endHint: "上午 10:00 至下午 6:00",
      room: "房間",
      attendees: "參加人數",
      payment: "付款方式",
      submit: "提交預訂申請",
      sending: "提交中…",
      required: "必填",
      chooseRoom: "請選擇房間",
      chooseTime: "請選擇時間",
    },

    summaryTitle: "您的預訂",
    summaryEmpty: "選擇房間及時段後即可查看預算。",
    summaryRoom: "房間",
    summaryDate: "日期",
    summaryTime: "時間",
    summaryDuration: "時長",
    summaryAttendees: "人數",
    summaryEstimate: "預計費用",
    summaryHours: "{n} 小時",
    summaryDayRate: "1 日",
    summaryNote: "此為預算。時租房間按開始的每小時計算，最終金額以我們的確認為準。",

    errors: {
      title: "請檢查以下項目：",
      fullName: "請填寫姓名。",
      email: "請填寫有效的電子郵件地址。",
      phone: "請填寫連國家區號的電話號碼，例如 +85245716234。",
      company: "請填寫公司名稱，或填「N/A」。",
      brNumber: "請填寫 BR 編號，或填「N/A」。",
      date: "請選擇預訂日期。",
      dateTooSoon: "預訂須至少 7 個工作日前提出。最早可選日期為 {date}。",
      dateWeekend: "辦公室逢星期一至五開放，請選擇平日。",
      startTime: "請選擇上午 9:00 至下午 5:00 之間的開始時間。",
      endTime: "請選擇上午 10:00 至下午 6:00 之間的結束時間。",
      endBeforeStart: "結束時間必須晚於開始時間。",
      room: "請選擇房間。",
      attendees: "請填寫參加人數。",
      attendeesOverCapacity: "{room} 最多容納 {n} 人。請減少人數或選擇較大空間。",
      payment: "請選擇付款方式。",

      slotTaken: "抱歉——該房間於您所選時段剛被預訂。請選擇其他時間或房間。",
      seatsSoldOut: "共享工位當日已滿。請選擇其他日期。",
      rateLimit: "您已有多個申請待處理。請稍候回覆後再提交。",
      submitFailed:
        "暫時無法送出申請。請使用下方 Google 表單連結，或致電 +852 5501 3516。",
    },

    availability: {
      checking: "正在查詢空檔…",
      taken: "已被預訂",
      freeSlot: "可預訂",
      busyOn: "此日期已預訂時段：",
      allFree: "此日期尚未有預訂——所有時段可選。",
      seatsLeft: "此日期共享工位尚餘 {n} / {total} 個座位。",
      referenceLabel: "預訂編號",
    },

    successTitle: "已收到預訂申請",
    successBody:
      "多謝您——申請已送達灣仔團隊。我們會於一個工作天內確認空檔並電郵付款資料。",
    successRef: "申請摘要",
    successAnother: "再預訂一次",
    successContact: "急需安排？WhatsApp 我們",

    fallbackTitle: "系統未能自動提交",
    fallbackBody:
      "您的網絡阻擋了提交。資料已保留——開啟已預填的表格一按完成，或直接電郵我們。",
    fallbackButton: "開啟預填表格",

    noticeTitle: "預訂前請留意",
    notices: [
      "預訂須於使用日前至少 7 個工作日提出。",
      "開始時間為上午 9:00 至下午 5:00；結束時間為上午 10:00 至下午 6:00。",
      "所有預訂視乎空檔情況，並須以書面確認。",
      "預訂一經確認，恕不退款。",
    ],

    classicTitle: "想用原本的 Google 表格？",
    classicBody:
      "本頁提交到團隊一直使用的同一份表格，兩種方式都會送達我們。如想直接在 Google 填寫，可按下方連結。",
    classicButton: "在 Google 表格開啟",

    faqTitle: "預訂常見問題",
    faq: [
      {
        q: "需要提前幾耐預訂？",
        a: "使用日前最少 7 個工作日。團隊需要時間確認房間、安排門卡及發出發票。如需更快安排，請 WhatsApp 我們查詢空檔。",
      },
      {
        q: "幾時會確認預訂？",
        a: "我們會於一個工作天內電郵回覆。收到書面確認後預訂方為生效——只提交表格並不代表已預留房間。",
      },
      {
        q: "如何付款？",
        a: "可以銀行轉帳或轉數快（FPS）。付款資料會附於確認電郵，並須於預訂日期前結清。",
      },
      {
        q: "可否取消或退款？",
        a: "預訂一經確認，恕不退款。如需改期，請盡早聯絡我們，我們會盡力協助安排。",
      },
      {
        q: "租金包括甚麼？",
        a: "包括 WiFi、冷氣、白板及茶水間使用。投影機、視像會議及餐飲可按需要安排，請於確認時告知。",
      },
      {
        q: "人數可否超出上限？",
        a: "不可以，容納人數為消防安全上限。如人數較多，請選擇活動場地（最多 30 人）或聯絡我們合併房間。",
      },
    ],
  },

  // ===== SIMPLIFIED CHINESE (简体中文) =====
  "zh-CN": {
    navLabel: "预订房间",
    ctaShort: "预订房间",

    heroEyebrow: "房间预订",
    heroTitle: "预订湾仔会议室。",
    heroLead:
      "六个空间、透明时租收费，申请即时送达我们团队。选房间、选时段，我们会在一个工作日内以邮件确认。",

    stepsTitle: "预订流程",
    steps: [
      {
        title: "选择空间",
        text: "先比较下方的容纳人数及收费，再选最合适的房间。",
      },
      {
        title: "提交申请",
        text: "填写日期、时间及人数。申请须在使用日前至少 7 个工作日提出。",
      },
      {
        title: "确认及开票",
        text: "湾仔团队核查空档后，会邮件确认并附上付款资料。",
      },
    ],

    roomsEyebrow: "可预订空间",
    roomsTitle: "六个房间。一个湾仔地址。",
    roomsLead:
      "选择房间前请先查看容纳人数及租金。所有收费以港元计算，不包括餐饮及影音支持。",
    capacityLabel: "可容纳 {n} 人",
    perHour: "/小时",
    perDay: "/天",
    selectRoom: "选择此房间",
    selectedRoom: "已选择",

    homeEyebrow: "预订空间",
    homeTitle: "本月需要用房间？",
    homeLead:
      "会议室每小时 HK$300 起、共享工位每日 HK$350 起，另有可容纳 30 人的活动场地。在线申请，一个工作日内确认。",
    homeCta: "查看房间及收费",

    rateTableTitle: "时租房间",
    rateTableLead:
      "可预订会议室及活动场地的时租与日租收费。可在线申请，一个工作日内确认。",
    rateTableRoom: "空间",
    rateTableCapacity: "容纳人数",
    rateTableRate: "收费",
    bookCta: "预订",
    bookAllCta: "预订房间",

    formEyebrow: "预订申请",
    formTitle: "请填写预订详情。",
    formLead:
      "标示 * 的栏位为必填。申请将直接送到预订团队——确认空档前不会收取任何费用。",
    form: {
      fullName: "姓名",
      email: "电子邮件",
      phone: "电话号码",
      phoneHint: "请包括国家区号，例如 +852 4571 6234",
      company: "公司名称",
      companyHint: "如以个人名义预订，请填“N/A”",
      brNumber: "BR 编号",
      brHint: "商业登记号码——如不适用请填“N/A”",
      date: "预订日期",
      dateHint: "须为今日起计最少 7 个工作日之后",
      startTime: "开始时间",
      startHint: "上午 9:00 至下午 5:00",
      endTime: "结束时间",
      endHint: "上午 10:00 至下午 6:00",
      room: "房间",
      attendees: "参会人数",
      payment: "付款方式",
      submit: "提交预订申请",
      sending: "提交中…",
      required: "必填",
      chooseRoom: "请选择房间",
      chooseTime: "请选择时间",
    },

    summaryTitle: "您的预订",
    summaryEmpty: "选择房间及时段后即可查看预算。",
    summaryRoom: "房间",
    summaryDate: "日期",
    summaryTime: "时间",
    summaryDuration: "时长",
    summaryAttendees: "人数",
    summaryEstimate: "预计费用",
    summaryHours: "{n} 小时",
    summaryDayRate: "1 天",
    summaryNote: "此为预算。时租房间按开始的每小时计算，最终金额以我们的确认为准。",

    errors: {
      title: "请检查以下项目：",
      fullName: "请填写姓名。",
      email: "请填写有效的电子邮件地址。",
      phone: "请填写含国家区号的电话号码，例如 +85245716234。",
      company: "请填写公司名称，或填“N/A”。",
      brNumber: "请填写 BR 编号，或填“N/A”。",
      date: "请选择预订日期。",
      dateTooSoon: "预订须至少 7 个工作日前提出。最早可选日期为 {date}。",
      dateWeekend: "办公室周一至周五开放，请选择工作日。",
      startTime: "请选择上午 9:00 至下午 5:00 之间的开始时间。",
      endTime: "请选择上午 10:00 至下午 6:00 之间的结束时间。",
      endBeforeStart: "结束时间必须晚于开始时间。",
      room: "请选择房间。",
      attendees: "请填写参会人数。",
      attendeesOverCapacity: "{room} 最多容纳 {n} 人。请减少人数或选择更大空间。",
      payment: "请选择付款方式。",

      slotTaken: "抱歉——该房间在您所选时段刚被预订。请选择其他时间或房间。",
      seatsSoldOut: "共享工位当日已满。请选择其他日期。",
      rateLimit: "您已有多个申请待处理。请稍候回复后再提交。",
      submitFailed:
        "暂时无法发送申请。请使用下方 Google 表单链接，或致电 +852 5501 3516。",
    },

    availability: {
      checking: "正在查询空档…",
      taken: "已被预订",
      freeSlot: "可预订",
      busyOn: "此日期已预订时段：",
      allFree: "此日期尚未有预订——所有时段可选。",
      seatsLeft: "此日期共享工位尚余 {n} / {total} 个座位。",
      referenceLabel: "预订编号",
    },

    successTitle: "已收到预订申请",
    successBody:
      "感谢您——申请已送达湾仔团队。我们会在一个工作日内确认空档并邮件发送付款资料。",
    successRef: "申请摘要",
    successAnother: "再预订一次",
    successContact: "急需安排？WhatsApp 我们",

    fallbackTitle: "系统未能自动提交",
    fallbackBody:
      "您的网络阻挡了提交。资料已保留——打开已预填的表单一键完成，或直接邮件联系我们。",
    fallbackButton: "打开预填表单",

    noticeTitle: "预订前请留意",
    notices: [
      "预订须在使用日前至少 7 个工作日提出。",
      "开始时间为上午 9:00 至下午 5:00；结束时间为上午 10:00 至下午 6:00。",
      "所有预订视空闲情况而定，并须以书面确认。",
      "预订一经确认，恕不退款。",
    ],

    classicTitle: "想用原本的 Google 表单？",
    classicBody:
      "本页提交到团队一直使用的同一份表单，两种方式都会送达我们。如想直接在 Google 填写，可点击下方链接。",
    classicButton: "在 Google 表单打开",

    faqTitle: "预订常见问题",
    faq: [
      {
        q: "需要提前多久预订？",
        a: "使用日前最少 7 个工作日。团队需要时间确认房间、安排门禁卡及开具发票。如需更快安排，请 WhatsApp 我们查询空档。",
      },
      {
        q: "什么时候会确认预订？",
        a: "我们会在一个工作日内邮件回复。收到书面确认后预订方为生效——仅提交表单并不代表已预留房间。",
      },
      {
        q: "如何付款？",
        a: "可用银行转账或转数快（FPS）。付款资料会附在确认邮件中，并须在预订日期前结清。",
      },
      {
        q: "可否取消或退款？",
        a: "预订一经确认，恕不退款。如需改期，请尽早联系我们，我们会尽力协助安排。",
      },
      {
        q: "租金包括什么？",
        a: "包括 WiFi、空调、白板及茶水间使用。投影机、视频会议及餐饮可按需安排，请在确认时告知。",
      },
      {
        q: "人数可否超出上限？",
        a: "不可以，容纳人数为消防安全上限。如人数较多，请选择活动场地（最多 30 人）或联系我们合并房间。",
      },
    ],
  },
} as const;
