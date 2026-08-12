/**
 * ROOM BOOKING DATA + GOOGLE FORM BRIDGE
 * =================================================================
 * WHAT THIS FILE IS:
 *   The single source of truth for everything related to booking a
 *   room at Smarthub: the room catalogue (capacity + rate), the
 *   booking rules (lead time, opening hours), and the plumbing that
 *   connects our own on-site booking form to the company's existing
 *   Google Form ("Application for SmartHub Room Booking").
 *
 * WHY A GOOGLE FORM BRIDGE?
 *   The team already collects bookings through a Google Form, and the
 *   responses feed a Google Sheet + email notifications they rely on.
 *   Instead of throwing that workflow away (or dumping an ugly iframe
 *   on the site), the website renders a branded, trilingual, validated
 *   booking form and POSTs the answers straight into the SAME Google
 *   Form. Nothing changes for the back office — every submission still
 *   shows up in the existing "Responses" tab.
 *
 * HOW THE SUBMISSION WORKS:
 *   Every Google Form field has a numeric "entry ID". Posting
 *   `entry.<id>=<value>` pairs to the form's `/formResponse` endpoint
 *   records a response exactly as if the user had clicked Submit on
 *   docs.google.com. Google does not send CORS headers, so the browser
 *   cannot read the reply — we therefore POST with `mode: "no-cors"`
 *   (an opaque response) and treat a non-throwing request as success.
 *   As a safety net, `buildPrefillUrl()` produces a normal Google Form
 *   link with every answer pre-filled, which we show the user if the
 *   silent POST throws (offline, blocked network, corporate proxy…).
 *
 * WHERE THE ENTRY IDS CAME FROM:
 *   Open the live form → View source → find `FB_PUBLIC_LOAD_DATA_`.
 *   Each question array contains its entry ID. They are also visible by
 *   using the form's built-in "Get pre-filled link" feature.
 *   Date questions expand into `_year` / `_month` / `_day` params and
 *   time questions into `_hour` / `_minute`.
 *
 * IF THE FORM EVER CHANGES:
 *   Update `GOOGLE_FORM` below (id + entry ids + the exact option
 *   strings in `ROOMS[].formValue` / `PAYMENT_METHODS[].formValue`).
 *   The option strings must match the Google Form choices CHARACTER
 *   FOR CHARACTER or Google silently discards the answer.
 * =================================================================
 */

import type { Lang } from "./i18n/translations";

/** A string translated into the three site languages. */
export type Trilingual = Record<Lang, string>;

/**
 * GOOGLE_FORM — identifiers for the live "Application for SmartHub Room
 * Booking" form.
 *
 *   - `id`      : the long `1FAIpQLSf...` id in the form URL
 *   - `shortUrl`: the forms.gle link the team shares elsewhere
 *   - `entry`   : question name → numeric entry id
 *
 * The values can be overridden at deploy time with
 * `NEXT_PUBLIC_BOOKING_FORM_ID` (useful if the team recreates the form).
 */
export const GOOGLE_FORM = {
  id:
    process.env.NEXT_PUBLIC_BOOKING_FORM_ID ||
    "1FAIpQLSf--kAyGYvX2S7mtPz4pIbam2SaLat7fPLEHpR5bcgcqw1aQg",
  shortUrl: "https://forms.gle/5KKeL1t17BAivzu18",
  entry: {
    fullName: "entry.2054883057",
    email: "entry.280904660",
    phone: "entry.340283835",
    company: "entry.1075886416",
    brNumber: "entry.1528055843",
    /** Date question — expands to `_year`, `_month`, `_day`. */
    date: "entry.14529283",
    /** Time question — expands to `_hour`, `_minute`. */
    startTime: "entry.1500865837",
    /** Time question — expands to `_hour`, `_minute`. */
    endTime: "entry.950984899",
    room: "entry.1425097312",
    attendees: "entry.1852114653",
    payment: "entry.60526667",
  },
} as const;

/** Public "fill it in on Google" URL (no answers pre-filled). */
export const googleFormViewUrl = `https://docs.google.com/forms/d/e/${GOOGLE_FORM.id}/viewform`;

/** Endpoint that records a response. */
const googleFormResponseUrl = `https://docs.google.com/forms/d/e/${GOOGLE_FORM.id}/formResponse`;

/** Embeddable version of the form (used by the "classic form" fallback). */
export const googleFormEmbedUrl = `${googleFormViewUrl}?embedded=true`;

/**
 * BOOKING_RULES — the constraints printed on the Google Form, encoded so
 * the website can enforce them BEFORE a request reaches the team.
 *
 *   - `minLeadWorkingDays` : bookings must be ≥ 7 working days ahead
 *   - `earliestStartHour`  : start time 9 AM – 5 PM
 *   - `latestStartHour`
 *   - `earliestEndHour`    : end time 10 AM – 6 PM
 *   - `latestEndHour`
 *   - `minuteSteps`        : selectable minutes (on the hour / half hour)
 */
export const BOOKING_RULES = {
  minLeadWorkingDays: 7,
  earliestStartHour: 9,
  latestStartHour: 17,
  earliestEndHour: 10,
  latestEndHour: 18,
  minuteSteps: [0, 30],
} as const;

/**
 * RoomId — stable identifiers used in URLs (`#/book?room=meeting-b`) and
 * as React keys. They never change even if a room is renamed.
 */
export type RoomId =
  | "meeting-a"
  | "hot-desk"
  | "meeting-b"
  | "event-space"
  | "meeting-c"
  | "director";

/**
 * Room — one bookable space.
 *   - `id`        : stable identifier (URL-safe)
 *   - `name`      : display name per language
 *   - `blurb`     : one-line description per language
 *   - `capacity`  : maximum number of attendees
 *   - `rate`      : price in HKD
 *   - `unit`      : whether `rate` is charged per hour or per day
 *   - `emoji`     : the icon used on the Google Form, kept for continuity
 *   - `image`     : photo used on the room card
 *   - `formValue` : the EXACT option text in the Google Form (do not edit
 *                   without editing the form itself)
 */
export type Room = {
  id: RoomId;
  name: Trilingual;
  blurb: Trilingual;
  capacity: number;
  rate: number;
  unit: "hour" | "day";
  emoji: string;
  image: string;
  formValue: string;
};

/**
 * ROOMS — the six bookable spaces, in the same order as the Google Form.
 * Capacities and rates are copied from the form's "Room Information"
 * block so the site and the form can never drift apart.
 */
export const ROOMS: Room[] = [
  {
    id: "meeting-a",
    name: { en: "Meeting Room A", "zh-HK": "會議室 A", "zh-CN": "会议室 A" },
    blurb: {
      en: "Bright boardroom with display screen — ideal for client meetings.",
      "zh-HK": "光猛董事房，配顯示屏——最適合客戶會議。",
      "zh-CN": "明亮董事房，配显示屏——最适合客户会议。",
    },
    capacity: 10,
    rate: 500,
    unit: "hour",
    emoji: "🏢",
    image: "/conferenceRoom.jpeg",
    formValue: "Meeting Room A / 會議室 A / 会议室 A",
  },
  {
    id: "hot-desk",
    name: { en: "Hot Desk", "zh-HK": "共享工位", "zh-CN": "共享工位" },
    blurb: {
      en: "Drop-in desk in the shared work area, charged per day.",
      "zh-HK": "共享工作區即用工位，以日計算。",
      "zh-CN": "共享工作区即用工位，以日计算。",
    },
    capacity: 30,
    rate: 350,
    unit: "day",
    emoji: "💻",
    image: "/hotDesk.jpeg",
    formValue: "Hot Desk / 共享工位 / 共享工位",
  },
  {
    id: "meeting-b",
    name: { en: "Meeting Room B", "zh-HK": "會議室 B", "zh-CN": "会议室 B" },
    blurb: {
      en: "Premium boardroom with video conferencing and harbour-side light.",
      "zh-HK": "高級董事房，設視像會議設備，臨海採光。",
      "zh-CN": "高级董事房，设视频会议设备，临海采光。",
    },
    capacity: 10,
    rate: 800,
    unit: "hour",
    emoji: "🏢",
    image: "/mainAreaKaraoke.jpeg",
    formValue: "Meeting Room B / 會議室 B / 会议室 B",
  },
  {
    id: "event-space",
    name: { en: "Event Space", "zh-HK": "活動場地", "zh-CN": "活动场地" },
    blurb: {
      en: "Open floor for seminars, launches and training — AV included.",
      "zh-HK": "開放式場地，適合講座、發布會及培訓，附影音設備。",
      "zh-CN": "开放式场地，适合讲座、发布会及培训，附影音设备。",
    },
    capacity: 30,
    rate: 1000,
    unit: "hour",
    emoji: "🎤",
    image: "/mainAreaChairs.jpeg",
    formValue: "Event Space / 活動場地 / 活动场地",
  },
  {
    id: "meeting-c",
    name: { en: "Meeting Room C", "zh-HK": "會議室 C", "zh-CN": "会议室 C" },
    blurb: {
      en: "Compact huddle room for interviews and small reviews.",
      "zh-HK": "小型會議室，適合面試及小組討論。",
      "zh-CN": "小型会议室，适合面试及小组讨论。",
    },
    capacity: 6,
    rate: 300,
    unit: "hour",
    emoji: "🏢",
    image: "/sofaRoom.jpeg",
    formValue: "Meeting Room C / 會議室 C / 会议室 C",
  },
  {
    id: "director",
    name: { en: "Director Room", "zh-HK": "總監辦公室", "zh-CN": "总监办公室" },
    blurb: {
      en: "Private executive room for confidential discussions.",
      "zh-HK": "私密行政房間，適合機密商談。",
      "zh-CN": "私密行政房间，适合机密商谈。",
    },
    capacity: 5,
    rate: 300,
    unit: "hour",
    emoji: "👔",
    image: "/managerRoom.jpeg",
    formValue: "Director Room / 總監辦公室 / 总监办公室",
  },
];

/** Look up a room by its id. Returns `undefined` for unknown ids. */
export function getRoom(id: string | null | undefined): Room | undefined {
  return ROOMS.find((r) => r.id === id);
}

/**
 * PaymentMethodId — the two settlement options offered on the form.
 */
export type PaymentMethodId = "bank-transfer" | "fps";

/**
 * PAYMENT_METHODS — payment options with their exact Google Form text.
 */
export const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: Trilingual;
  formValue: string;
}[] = [
  {
    id: "bank-transfer",
    label: { en: "Bank Transfer", "zh-HK": "銀行轉帳", "zh-CN": "银行转账" },
    formValue: "Bank Transfer / 銀行轉帳 / 银行转账",
  },
  {
    id: "fps",
    label: { en: "FPS", "zh-HK": "轉數快", "zh-CN": "转数快" },
    formValue: "FPS / 轉數快 / 转数快",
  },
];

/* ============================================================
 * DATE + TIME HELPERS
 * ============================================================ */

/** Format a Date as `YYYY-MM-DD` (what `<input type="date">` expects). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * addWorkingDays — advance a date by N working days (Mon–Fri).
 *
 * Saturdays and Sundays are skipped. Hong Kong public holidays are NOT
 * modelled (they change every year); the team confirms availability
 * manually, and the form itself only promises "≥ 7 working days".
 *
 * Inputs:  `from` — starting date, `days` — number of working days.
 * Returns: a NEW Date (the input is never mutated).
 */
export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay(); // 0 = Sunday, 6 = Saturday
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return d;
}

/**
 * earliestBookingDate — the first date a visitor may request, i.e.
 * `BOOKING_RULES.minLeadWorkingDays` working days after today.
 * Used as the `min` attribute of the date input and by validation.
 */
export function earliestBookingDate(today: Date = new Date()): Date {
  return addWorkingDays(today, BOOKING_RULES.minLeadWorkingDays);
}

/**
 * isWeekend — true for Saturday/Sunday. The office runs Mon–Fri, so the
 * booking form blocks weekend dates with a friendly message.
 */
export function isWeekend(iso: string): boolean {
  const d = parseISODate(iso);
  if (!d) return false;
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

/** Parse `YYYY-MM-DD` into a local Date, or `null` when malformed. */
export function parseISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * timeOptions — build the list of selectable `HH:MM` values between two
 * hours (inclusive), stepping through `BOOKING_RULES.minuteSteps`.
 *
 * e.g. `timeOptions(9, 17)` → 09:00, 09:30, … 17:00
 * The final hour only offers `:00` so we never exceed the latest slot.
 */
export function timeOptions(fromHour: number, toHour: number): string[] {
  const out: string[] = [];
  for (let h = fromHour; h <= toHour; h++) {
    for (const m of BOOKING_RULES.minuteSteps) {
      if (h === toHour && m !== 0) continue;
      out.push(`${`${h}`.padStart(2, "0")}:${`${m}`.padStart(2, "0")}`);
    }
  }
  return out;
}

/** Convert `HH:MM` into minutes past midnight (`"09:30"` → 570). */
export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Render `HH:MM` in 12-hour form for humans (`"14:30"` → `"2:30 PM"`). */
export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${`${m}`.padStart(2, "0")} ${suffix}`;
}

/* ============================================================
 * PRICE ESTIMATE
 * ============================================================ */

/**
 * estimateCost — work out the indicative price of a booking.
 *
 * Hourly rooms are billed per started hour of the selected window.
 * The Hot Desk is billed per day, so any same-day window costs one day.
 *
 * Inputs:  `room`, `start`/`end` as `HH:MM`.
 * Returns: `{ hours, total }` — `hours` is the booked duration (may be
 *          fractional, e.g. 1.5), `total` is HKD. Returns `null` when the
 *          window is invalid so callers can hide the estimate.
 */
export function estimateCost(
  room: Room | undefined,
  start: string,
  end: string
): { hours: number; total: number } | null {
  if (!room || !start || !end) return null;
  const minutes = minutesOf(end) - minutesOf(start);
  if (minutes <= 0) return null;
  const hours = minutes / 60;
  const total = room.unit === "day" ? room.rate : Math.ceil(hours) * room.rate;
  return { hours, total };
}

/** Format a number as `HK$1,000`. */
export function formatHKD(amount: number): string {
  return `HK$${amount.toLocaleString("en-US")}`;
}

/* ============================================================
 * GOOGLE FORM PAYLOAD
 * ============================================================ */

/**
 * BookingSubmission — everything our on-site form collects. Mirrors the
 * Google Form's questions one-to-one.
 */
export type BookingSubmission = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  brNumber: string;
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:MM` */
  startTime: string;
  /** `HH:MM` */
  endTime: string;
  roomId: RoomId;
  attendees: string;
  payment: PaymentMethodId;
};

/**
 * buildFormParams — translate a `BookingSubmission` into the
 * `entry.<id>` key/value pairs Google expects.
 *
 * Date and time questions are split into their component parts
 * (`_year` / `_month` / `_day`, `_hour` / `_minute`) because that is how
 * Google Forms serialises them.
 *
 * Returns: `URLSearchParams`, ready to POST or to append to a prefill URL.
 */
export function buildFormParams(data: BookingSubmission): URLSearchParams {
  const e = GOOGLE_FORM.entry;
  const room = getRoom(data.roomId);
  const payment = PAYMENT_METHODS.find((p) => p.id === data.payment);
  const [year, month, day] = data.date.split("-");
  const [startHour, startMinute] = data.startTime.split(":");
  const [endHour, endMinute] = data.endTime.split(":");

  const params = new URLSearchParams();
  params.set(e.fullName, data.fullName);
  params.set(e.email, data.email);
  params.set(e.phone, data.phone);
  params.set(e.company, data.company || "N/A");
  params.set(e.brNumber, data.brNumber || "N/A");
  params.set(`${e.date}_year`, year);
  // Strip leading zeros — Google expects plain integers here.
  params.set(`${e.date}_month`, String(Number(month)));
  params.set(`${e.date}_day`, String(Number(day)));
  params.set(`${e.startTime}_hour`, String(Number(startHour)));
  params.set(`${e.startTime}_minute`, String(Number(startMinute)));
  params.set(`${e.endTime}_hour`, String(Number(endHour)));
  params.set(`${e.endTime}_minute`, String(Number(endMinute)));
  if (room) params.set(e.room, room.formValue);
  params.set(e.attendees, data.attendees);
  if (payment) params.set(e.payment, payment.formValue);
  return params;
}

/**
 * buildPrefillUrl — a normal Google Form link with every answer already
 * filled in. Shown as a fallback if the silent submission fails, and as
 * the "review on Google Forms" escape hatch for cautious users.
 */
export function buildPrefillUrl(data: BookingSubmission): string {
  const params = buildFormParams(data);
  params.set("usp", "pp_url");
  return `${googleFormViewUrl}?${params.toString()}`;
}

/**
 * submitToGoogleForm — record the booking request in the existing
 * Google Form / Sheet.
 *
 * Google Forms does not send CORS headers, so we fire the request with
 * `mode: "no-cors"`. The browser performs the POST but hands us an
 * opaque response we cannot inspect: no status code, no body. In
 * practice the request either goes through (resolved promise) or fails
 * at the network level (rejected promise), which is exactly the signal
 * we surface to the user.
 *
 * Inputs:  a validated `BookingSubmission`.
 * Returns: `true` when the POST left the browser, `false` on a network
 *          error — in which case the caller shows the prefilled-link
 *          fallback so the visitor can still complete the booking.
 */
export async function submitToGoogleForm(
  data: BookingSubmission
): Promise<boolean> {
  try {
    await fetch(googleFormResponseUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: buildFormParams(data).toString(),
    });
    return true;
  } catch {
    return false;
  }
}
