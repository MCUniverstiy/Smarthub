"use client";

/*
 * =====================================================================
 * FILE: booking.tsx — The Room Booking page (route: "book", URL: #/book)
 * =====================================================================
 * WHAT THIS FILE IS
 *   The room-booking funnel. It replaces "here is a link to our Google
 *   Form" with a branded, trilingual, validated booking experience that
 *   still records every request in the team's existing Google Form (and
 *   therefore their existing response sheet + email alerts).
 *
 * WHAT IT DOES
 *   Renders <BookingPage /> — a PageHero, a 3-step "how it works" strip,
 *   the room catalogue (6 selectable cards with capacity + rate), the
 *   booking form with a sticky live summary/price estimate, a policy
 *   notice, a FAQ accordion, and a link to the original Google Form for
 *   anyone who prefers it.
 *
 *   On submit the form is validated client-side against the same rules
 *   the Google Form states (≥ 7 working days' notice, 9am–5pm starts,
 *   10am–6pm ends, capacity limits). Valid requests are POSTed to the
 *   Google Form endpoint by `submitToGoogleForm()`. If that POST cannot
 *   leave the browser, we show a pre-filled Google Form link so the
 *   visitor never loses their answers.
 *
 * HOW IT FITS IN
 *   - Exported as `BookingPage`, rendered by RouterOutlet when
 *     route === "book" (see src/lib/router.tsx and src/app/page.tsx).
 *   - Room data, booking rules, price maths and the Google Form bridge
 *     all live in `src/lib/booking-data.ts`.
 *   - Copy comes from `t.booking` (src/lib/i18n/booking-content.ts).
 *   - Deep link: `#/book?room=event-space` preselects a room. The
 *     pricing and services pages use this to send visitors straight to
 *     the right space.
 * =====================================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/lib/i18n/lang-context";
import { PageHero } from "@/components/blocks/page-hero";
import { SectionHeading } from "@/components/blocks/section-heading";
import { GlobalOfficeDirectory } from "@/components/blocks/global-office-directory";
import { searchGlobalListings, submitGlobalBookingRequest, type GlobalListing } from "@/lib/global-office";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Info,
  Loader2,
  MessageCircle,
  Users,
} from "lucide-react";
import { hashQuery, RouterLink } from "@/lib/router";
import { companyFacts } from "@/lib/site-data";
import {
  BOOKING_RULES,
  BookingSubmission,
  buildPrefillUrl,
  earliestBookingDate,
  estimateCost,
  formatTime12,
  getRoom,
  googleFormViewUrl,
  isWeekend,
  minutesOf,
  parseISODate,
  PAYMENT_METHODS,
  PaymentMethodId,
  ROOMS,
  RoomId,
  submitToGoogleForm,
  timeOptions,
  toISODate,
} from "@/lib/booking-data";
import {
  createBooking,
  getBusySlots,
  isSupabaseConfigured,
  type BookingErrorCode,
  type BusySlot,
} from "@/lib/supabase";

/**
 * FormState — the raw values held by the controlled inputs. Everything is
 * a string because that's what DOM inputs give us; conversion + checking
 * happens in `validate()`.
 */
type FormState = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  brNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  roomId: RoomId | "";
  attendees: string;
  payment: PaymentMethodId | "";
};

/** The empty form used on first render and after "Make another booking". */
const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  brNumber: "",
  date: "",
  startTime: "",
  endTime: "",
  roomId: "",
  attendees: "",
  payment: "",
};

/** Field names that can carry a validation error. */
type FieldKey = keyof FormState;

/**
 * fill — tiny template helper. Replaces `{key}` placeholders in a
 * translated string with real values.
 *
 * Example: fill("Up to {n} people", { n: 10 }) → "Up to 10 people"
 *
 * Translations use named placeholders (rather than string concatenation)
 * because word order differs between English and Chinese.
 */
function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template
  );
}

/**
 * BookingPage — top-level page component for the /book route.
 *
 * Inputs: none (reads the language context and the URL query string).
 * Returns: the whole booking funnel as a React fragment.
 *
 * State:
 *   - `form`      : all field values (see FormState)
 *   - `errors`    : field → translated error message, shown inline and
 *                   summarised in a banner above the submit button
 *   - `status`    : "idle" | "sending" | "success" | "fallback"
 *   - `submitted` : a frozen copy of the request, rendered on the
 *                   success screen (the live form is reset)
 *   - `prefillUrl`: pre-filled Google Form link used by the fallback
 */
export function BookingPage() {
  const { t, lang } = useLang();
  const b = t.booking;
  const [selectedOfficeLocation, setSelectedOfficeLocation] = useState("Hong Kong");
  const [globalListings, setGlobalListings] = useState<GlobalListing[]>([]);
  const [globalListingId, setGlobalListingId] = useState("");
  const selectedGlobalListing = globalListings.find((listing) => listing.id === globalListingId);
  const isGlobalBooking = Boolean(selectedGlobalListing);

  const FALLBACK_OFFICE_IMAGE =
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";

  const catalogue = useMemo(() => {
    const fromDb = globalListings.map((listing) => ({
      id: listing.id,
      kind: "global" as const,
      name: listing.name,
      description: listing.description_html.replace(/<[^>]*>/g, "") || "Premium office space.",
      capacity: listing.capacity,
      image: listing.image_url || FALLBACK_OFFICE_IMAGE,
      emoji: "",
    }));
    if (selectedOfficeLocation === "Hong Kong") {
      // Published HK listings from admin replace the hardcoded Wan Chai rooms.
      if (fromDb.length) return fromDb;
      return ROOMS.map((room) => ({
        id: room.id,
        kind: "local" as const,
        name: room.name[lang],
        description: room.blurb[lang],
        capacity: room.capacity,
        image: room.image,
        emoji: room.emoji,
      }));
    }
    return fromDb;
  }, [globalListings, lang, selectedOfficeLocation]);

  // Lazy initialiser: seed the form from the URL so `#/book?room=event-space`
  // opens with that room preselected. Reading the hash here (rather than in
  // an effect) avoids a second render pass. It is SSR-safe because
  // `hashQuery()` returns empty params when `window` is undefined — and this
  // page never renders on the server anyway, since the hash router resolves
  // to "home" there.
  const [form, setForm] = useState<FormState>(() => {
    const requested = hashQuery().get("room");
    return requested && getRoom(requested)
      ? { ...EMPTY_FORM, roomId: requested as RoomId }
      : EMPTY_FORM;
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "fallback">(
    "idle"
  );
  const [submitted, setSubmitted] = useState<BookingSubmission | null>(null);
  const [prefillUrl, setPrefillUrl] = useState<string>("");

  useEffect(() => {
    setGlobalListingId("");
    setForm((f) => ({ ...f, roomId: "" }));
    void searchGlobalListings({ country: selectedOfficeLocation }).then(setGlobalListings);
  }, [selectedOfficeLocation]);

  /**
   * Booking reference returned by the database (e.g. "SH-2608-4KQ9TW").
   * Empty when the request only went to the Google Form, which has no
   * concept of a reference number.
   */
  const [reference, setReference] = useState<string>("");

  /**
   * Times already taken for the chosen room + date, so the pickers can
   * grey them out. Loaded from the database; always [] when Supabase is
   * not configured, in which case the form behaves exactly as before.
   */
  /**
   * Stored WITH the room+date it was fetched for. Keeping the key next
   * to the data means a stale result for a previously-selected room is
   * ignored during render rather than having to be cleared by an effect.
   */
  const [busyFor, setBusyFor] = useState<{ key: string; slots: BusySlot[] }>({
    key: "",
    slots: [],
  });
  /** The room+date the visitor currently has selected. */
  const busyKey = form.roomId && form.date ? `${form.roomId}|${form.date}` : "";

  /** Busy slots, but only if they belong to the current room + date. */
  const busy = busyFor.key === busyKey ? busyFor.slots : [];

  /**
   * Derived rather than stored: we are loading precisely when a room and
   * date are chosen but the data we hold is for a different pair. This
   * avoids a setState inside the effect body.
   */
  const loadingBusy = Boolean(busyKey) && busyFor.key !== busyKey;
  // Anchor used to scroll the visitor down to the form when they pick a
  // room from the catalogue above.
  const formRef = useRef<HTMLDivElement>(null);

  // The earliest date the visitor may request (7 working days out).
  // `useMemo` keeps it stable across re-renders so the date input's `min`
  // attribute doesn't churn while typing.
  const minDate = useMemo(() => earliestBookingDate(), []);
  const minDateISO = toISODate(minDate);

  // Selectable time slots, derived from the rules in booking-data.ts.
  const startOptions = useMemo(
    () => timeOptions(BOOKING_RULES.earliestStartHour, BOOKING_RULES.latestStartHour),
    []
  );
  const endOptions = useMemo(
    () => timeOptions(BOOKING_RULES.earliestEndHour, BOOKING_RULES.latestEndHour),
    []
  );

  const selectedRoom = getRoom(form.roomId);
  const estimate = estimateCost(selectedRoom, form.startTime, form.endTime);

  /* ================= LIVE AVAILABILITY =================
     Whenever the visitor picks a room AND a date, ask the database what
     is already booked so we can grey those times out. This is a
     convenience only: the database itself is what actually prevents a
     clash, so if this lookup fails the form still works — the visitor
     just finds out at submit time instead of while choosing. */
  useEffect(() => {
    // Nothing to look up until both are chosen, and nothing to look up
    // at all when the site is running without a database.
    if (!isSupabaseConfigured || !form.roomId || !form.date) return;

    // `cancelled` guards against a slow response for a room the visitor
    // has already navigated away from overwriting a newer result.
    let cancelled = false;

    getBusySlots(form.roomId, form.date).then((slots) => {
      if (cancelled) return;
      setBusyFor({ key: `${form.roomId}|${form.date}`, slots });
    });

    return () => {
      cancelled = true;
    };
  }, [form.roomId, form.date]);

  /**
   * seatsTaken — how many hot-desk seats are already committed for the
   * chosen date. Only meaningful for the shared (non-exclusive) space.
   */
  const seatsTaken = useMemo(
    () => busy.reduce((sum, s) => sum + s.seats, 0),
    [busy]
  );

  /** The hot desk is the one room sold by the seat rather than whole. */
  const isSharedRoom = selectedRoom?.unit === "day";

  /**
   * isTimeBlocked — would starting (or ending) at this slot land inside
   * a booking that already exists?
   *
   * Only applies to exclusive rooms. The hot desk can take overlapping
   * bookings until its 30 seats run out, so greying out its times would
   * be wrong.
   *
   * A slot is treated as free at the exact moment another booking ends,
   * matching the database's `[)` range bounds — so a 10:00–11:00 booking
   * leaves 11:00 available as a start time.
   */
  const isTimeBlocked = useCallback(
    (slot: string, edge: "start" | "end") => {
      if (!busy.length || isSharedRoom) return false;
      const m = minutesOf(slot);
      return busy.some((s) => {
        const from = minutesOf(s.starts);
        const to = minutesOf(s.ends);
        // For a start time, [from, to) is unusable.
        // For an end time, (from, to] is unusable.
        return edge === "start" ? m >= from && m < to : m > from && m <= to;
      });
    },
    [busy, isSharedRoom]
  );

  /**
   * Format a `YYYY-MM-DD` string the way each language writes dates.
   * Falls back to the raw string if the date can't be parsed.
   */
  function formatDate(iso: string): string {
    const d = parseISODate(iso);
    if (!d) return iso;
    const locale = lang === "en" ? "en-GB" : lang === "zh-HK" ? "zh-HK" : "zh-CN";
    return d.toLocaleDateString(locale, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * update — set one field and clear any error already shown for it, so
   * the red text disappears as soon as the visitor starts fixing it.
   */
  function update<K extends FieldKey>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  /**
   * chooseRoom — called by the room cards above the form.
   * Selects the room, records it in the URL (so the page can be shared or
   * bookmarked with that room preselected), and scrolls down to the form.
   */
  function chooseRoom(id: RoomId) {
    update("roomId", id);
    if (typeof window !== "undefined") {
      // `replaceState` avoids adding a history entry for every card click
      // and avoids firing `hashchange` (which would reset scroll).
      window.history.replaceState(null, "", `#/book?room=${id}`);
    }
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /**
   * validate — check every field against the Google Form's stated rules.
   *
   * Rules enforced here (all of them mirror the form's own wording):
   *   - name / email / phone / company / BR are required
   *   - date ≥ 7 working days ahead, and not a weekend
   *   - start time 9:00–17:00, end time 10:00–18:00, end after start
   *   - a room must be chosen
   *   - attendees is a positive number within the room's capacity
   *   - a payment method must be chosen
   *
   * Returns: an object of field → message. Empty means the form is valid.
   */
  function validate(): Partial<Record<FieldKey, string>> {
    const e: Partial<Record<FieldKey, string>> = {};
    const err = b.errors;

    if (!form.fullName.trim()) e.fullName = err.fullName;
    // Deliberately loose email check: "something@something.tld". Strict
    // RFC validation rejects addresses that actually work.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = err.email;
    // Accept +, spaces, dashes, brackets; require at least 8 digits.
    if ((form.phone.replace(/\D/g, "") || "").length < 8) e.phone = err.phone;
    if (!form.company.trim()) e.company = err.company;
    if (!form.brNumber.trim()) e.brNumber = err.brNumber;

    if (!form.date) {
      e.date = err.date;
    } else if (isWeekend(form.date)) {
      e.date = err.dateWeekend;
    } else {
      const chosen = parseISODate(form.date);
      if (!chosen || chosen < minDate) {
        e.date = fill(err.dateTooSoon, { date: formatDate(minDateISO) });
      }
    }

    if (!form.startTime) e.startTime = err.startTime;
    if (!form.endTime) e.endTime = err.endTime;
    if (form.startTime && form.endTime && minutesOf(form.endTime) <= minutesOf(form.startTime)) {
      e.endTime = err.endBeforeStart;
    }

    if (isGlobalBooking ? !globalListingId : !form.roomId) e.roomId = err.room;

    const attendees = Number(form.attendees);
    if (!form.attendees.trim() || !Number.isFinite(attendees) || attendees < 1) {
      e.attendees = err.attendees;
    } else if ((selectedRoom && attendees > selectedRoom.capacity) || (selectedGlobalListing && attendees > selectedGlobalListing.capacity)) {
      const capacity = selectedRoom?.capacity ?? selectedGlobalListing?.capacity ?? 0;
      e.attendees = fill(err.attendeesOverCapacity, { room: selectedRoom?.name[lang] ?? selectedGlobalListing?.name ?? "office", n: capacity });
    }

    if (!isGlobalBooking && !form.payment) e.payment = err.payment;

    return e;
  }

  /**
   * onSubmit — validate, then hand the request to the Google Form.
   *
   * Flow:
   *   1. Stop the browser's own submit.
   *   2. Validate. On failure: show the errors and scroll them into view.
   *   3. Build the `BookingSubmission` and remember a pre-filled Google
   *      Form URL (our fallback if the POST can't get through).
   *   4. POST to the form. Google returns an opaque response, so
   *      `submitToGoogleForm` reports "did the request leave the browser".
   *   5. Success → show the confirmation screen and reset the form.
   *      Failure → show the pre-filled-link fallback, keeping the answers.
   */
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (isGlobalBooking && selectedGlobalListing) {
      setStatus("sending");
      const result = await submitGlobalBookingRequest({
        listingId: selectedGlobalListing.id, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), company: form.company.trim(),
        startsAt: new Date(`${form.date}T${form.startTime}:00`).toISOString(), endsAt: new Date(`${form.date}T${form.endTime}:00`).toISOString(), attendees: Number(form.attendees),
      });
      if (!result.ok) { setErrors({ roomId: result.message }); setStatus("idle"); return; }
      setReference(result.reference); setStatus("success"); setSubmitted({ ...form, roomId: "" as RoomId, attendees: form.attendees, payment: "" as PaymentMethodId }); setForm(EMPTY_FORM); return;
    }

    const payload: BookingSubmission = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
      brNumber: form.brNumber.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      roomId: form.roomId as RoomId,
      attendees: form.attendees.trim(),
      payment: form.payment as PaymentMethodId,
    };

    setStatus("sending");
    setPrefillUrl(buildPrefillUrl(payload));

    /* ---- 1. The database has the final say -------------------------
       It is the only party that knows what everyone else has booked, so
       it goes first. If it refuses (the slot was taken while the visitor
       was filling in the form) we stop here and say so, WITHOUT writing
       to the Google Form — otherwise the sheet would collect a booking
       the office can never honour. */
    let dbReference = "";

    if (isSupabaseConfigured) {
      const result = await createBooking(payload);

      if (!result.ok && result.code !== "unconfigured" && result.code !== "network") {
        // A real, considered refusal from the database.
        setErrors({ [errorFieldFor(result.code)]: messageFor(result.code) });
        setStatus("idle");
        // Re-check availability so the greyed-out slots reflect whatever
        // just changed underneath the visitor.
        getBusySlots(payload.roomId, payload.date).then((slots) =>
          setBusyFor({ key: `${payload.roomId}|${payload.date}`, slots })
        );
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (result.ok) dbReference = result.reference;
      // On "network"/"unconfigured" we deliberately fall through to the
      // Google Form: a booking in the sheet is far better than a lost
      // enquiry because the database was briefly unreachable.
    }

    /* ---- 2. Mirror into the Google Form ----------------------------
       The team's existing sheet, notifications and workflow all hang off
       this form, so every accepted booking still lands there. */
    const ok = await submitToGoogleForm(payload);

    setSubmitted(payload);
    setReference(dbReference);

    // A booking recorded in the database is a success even if the
    // Google Form POST was blocked — the request is safely stored.
    if (ok || dbReference) {
      setStatus("success");
      setForm(EMPTY_FORM);
      setErrors({});
    } else {
      setStatus("fallback");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * messageFor — the translated sentence for a database refusal.
   * Mirrors section 11 of `supabase/schema.sql`.
   */
  function messageFor(code: BookingErrorCode): string {
    const err = b.errors;
    switch (code) {
      case "slot-taken":
        return err.slotTaken;
      case "seats-sold-out":
        return err.seatsSoldOut;
      case "rate-limit":
        return err.rateLimit;
      case "capacity":
        return selectedRoom
          ? fill(err.attendeesOverCapacity, {
              room: selectedRoom.name[lang],
              n: selectedRoom.capacity,
            })
          : err.attendees;
      case "lead-time":
        return fill(err.dateTooSoon, { date: formatDate(minDateISO) });
      case "time-order":
        return err.endBeforeStart;
      case "start-window":
        return err.startTime;
      case "end-window":
        return err.endTime;
      default:
        return err.submitFailed;
    }
  }

  /** Which field to attach a database refusal to, so it appears in context. */
  function errorFieldFor(code: BookingErrorCode): FieldKey {
    switch (code) {
      case "capacity":
      case "seats-sold-out":
        return "attendees";
      case "lead-time":
        return "date";
      case "start-window":
        return "startTime";
      case "slot-taken":
      case "time-order":
      case "end-window":
        return "endTime";
      default:
        return "date";
    }
  }

  /** Reset everything back to a blank form (the success screen's CTA). */
  function reset() {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitted(null);
    setStatus("idle");
    setPrefillUrl("");
    setReference("");
    setBusyFor({ key: "", slots: [] });
  }

  // Errors, flattened for the summary banner above the submit button.
  const errorList = Object.values(errors).filter(Boolean) as string[];

  /* ================= SUCCESS SCREEN =================
     Shown instead of the form once a request has been recorded. It
     repeats the booked details so the visitor has them in writing
     before our confirmation email arrives. */
  if (status === "success" && submitted) {
    const room = getRoom(submitted.roomId);
    const cost = estimateCost(room, submitted.startTime, submitted.endTime);
    return (
      <>
        <PageHero
          eyebrow={b.heroEyebrow}
          title={b.successTitle}
          image="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=80"
          height="sm"
        />
        <section className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <div className="rounded-3xl border border-teal-200 bg-teal-50/50 p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/25">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                {b.successTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
                {b.successBody}
              </p>
            </div>

            {/* Read-only recap of what was sent. */}
            <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-700">
                  {b.successRef}
                </h3>
              </div>
              <dl className="divide-y divide-slate-100 text-sm">
                {/* Only the database issues a reference number, so this
                    row appears when the booking was stored there. */}
                {reference && (
                  <SummaryRow
                    label={b.availability.referenceLabel}
                    value={reference}
                  />
                )}
                <SummaryRow label={b.summaryRoom} value={room ? room.name[lang] : selectedGlobalListing?.name ?? "—"} />
                <SummaryRow label={b.summaryDate} value={formatDate(submitted.date)} />
                <SummaryRow
                  label={b.summaryTime}
                  value={`${formatTime12(submitted.startTime)} – ${formatTime12(submitted.endTime)}`}
                />
                <SummaryRow label={b.summaryAttendees} value={submitted.attendees} />
                <SummaryRow
                  label={b.form.payment}
                  value={
                    PAYMENT_METHODS.find((p) => p.id === submitted.payment)?.label[lang] ?? "—"
                  }
                />
                <SummaryRow label="Availability" value="Our team will confirm availability and terms." />
              </dl>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                onClick={reset}
                className="bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
              >
                {b.successAnother}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
              <Button asChild variant="outline" className="border-slate-200">
                <a href={companyFacts.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5 text-teal-600" />
                  {b.successContact}
                </a>
              </Button>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* ================= MAIN BOOKING PAGE ================= */
  return (
    <>
      <PageHero
        eyebrow={b.heroEyebrow}
        title={b.heroTitle}
        lead={b.heroLead}
        image="https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=2400&q=80"
        height="md"
      />



      {/* Global locations come first. The Hong Kong room catalogue below remains
          the local booking experience. */}
      <GlobalOfficeDirectory region={selectedOfficeLocation} onLocationChange={setSelectedOfficeLocation} />

      <section className="bg-gradient-to-b from-white via-teal-50/30 to-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow={`${selectedOfficeLocation} offices`}
            title="Available Spaces"
            lead={
              selectedOfficeLocation === "Hong Kong"
                ? "Six rooms. One Wan Chai address. Select a room to request a booking."
                : `Partner offices in ${selectedOfficeLocation}. Select a space to request a booking.`
            }
            align="center"
          />

          {catalogue.length === 0 ? (
            <p className="mt-12 text-center text-sm text-slate-500">
              No published offices in {selectedOfficeLocation} yet. Approve a partnership application and publish it from admin.
            </p>
          ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {catalogue.map((room) => {
              const isSelected = room.kind === "local" ? form.roomId === room.id : globalListingId === room.id;
              return (
                <div
                  key={room.id}
                  className={`group flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:shadow-xl ${
                    isSelected
                      ? "border-teal-500 ring-2 ring-teal-500/30"
                      : "border-slate-200"
                  }`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    <img
                      src={room.image}
                      alt={room.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 to-transparent" />
                    {isSelected && (
                      <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-teal-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                        {b.selectedRoom}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      {room.emoji ? <span className="mr-1.5" aria-hidden="true">{room.emoji}</span> : null}
                      {room.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                      {room.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <Users className="h-3.5 w-3.5 text-teal-600" />
                      {fill(b.capacityLabel, { n: room.capacity })}
                    </div>
                    <Button
                      onClick={() => {
                        if (room.kind === "local") chooseRoom(room.id as RoomId);
                        else {
                          setGlobalListingId(room.id);
                          update("roomId", "");
                          formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                      className={`mt-5 w-full ${
                        isSelected
                          ? "bg-teal-600 text-white hover:bg-teal-700"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {isSelected ? b.selectedRoom : b.selectRoom}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* ===== BOOKING FORM + LIVE SUMMARY ===== */}
      <section ref={formRef} id="booking-form" className="scroll-mt-24 bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
            {/* ---------- FORM (3 of 5 columns) ---------- */}
            <div className="lg:col-span-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-700">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                {b.formEyebrow}
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                {b.formTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{b.formLead}</p>

              <form
                onSubmit={onSubmit}
                noValidate
                className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
              >
                {/* --- Contact details --- */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={b.form.fullName} htmlFor="fullName" error={errors.fullName} required>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      autoComplete="name"
                      placeholder="Chan Tai Man"
                      aria-invalid={Boolean(errors.fullName)}
                    />
                  </Field>
                  <Field label={b.form.email} htmlFor="email" error={errors.email} required>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      autoComplete="email"
                      placeholder="you@company.com"
                      aria-invalid={Boolean(errors.email)}
                    />
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label={b.form.phone}
                    htmlFor="phone"
                    hint={b.form.phoneHint}
                    error={errors.phone}
                    required
                  >
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      autoComplete="tel"
                      placeholder="+852 4571 6234"
                      aria-invalid={Boolean(errors.phone)}
                    />
                  </Field>
                  <Field
                    label={b.form.company}
                    htmlFor="company"
                    hint={b.form.companyHint}
                    error={errors.company}
                    required
                  >
                    <Input
                      id="company"
                      value={form.company}
                      onChange={(e) => update("company", e.target.value)}
                      autoComplete="organization"
                      placeholder="Acme Limited / N/A"
                      aria-invalid={Boolean(errors.company)}
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field
                    label={b.form.brNumber}
                    htmlFor="brNumber"
                    hint={b.form.brHint}
                    error={errors.brNumber}
                    required
                  >
                    <Input
                      id="brNumber"
                      value={form.brNumber}
                      onChange={(e) => update("brNumber", e.target.value)}
                      placeholder="12345678-000 / N/A"
                      aria-invalid={Boolean(errors.brNumber)}
                    />
                  </Field>
                </div>

                <div className="my-7 h-px bg-slate-100" />

                {/* --- Date + time --- */}
                <div className="mt-4">
                  <Field
                    label={b.form.date}
                    htmlFor="date"
                    hint={b.form.dateHint}
                    error={errors.date}
                    required
                  >
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      min={minDateISO}
                      onChange={(e) => update("date", e.target.value)}
                      aria-invalid={Boolean(errors.date)}
                    />
                  </Field>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {/* LIVE AVAILABILITY — only rendered once a room and a
                      date are chosen, and only when a database is wired
                      up. Turns "submit and hope" into "see what's free". */}
                  {isSupabaseConfigured && form.roomId && form.date && (
                    <div className="sm:col-span-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        {loadingBusy ? (
                          <p className="flex items-center gap-2 text-sm text-slate-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {b.availability.checking}
                          </p>
                        ) : isSharedRoom && selectedRoom ? (
                          <p className="text-sm text-slate-600">
                            {fill(b.availability.seatsLeft, {
                              n: Math.max(0, selectedRoom.capacity - seatsTaken),
                              total: selectedRoom.capacity,
                            })}
                          </p>
                        ) : busy.length === 0 ? (
                          <p className="flex items-center gap-2 text-sm text-teal-700">
                            <CheckCircle2 className="h-4 w-4" />
                            {b.availability.allFree}
                          </p>
                        ) : (
                          <div className="text-sm text-slate-600">
                            <p className="font-medium text-slate-700">
                              {b.availability.busyOn}
                            </p>
                            <ul className="mt-1.5 flex flex-wrap gap-1.5">
                              {busy.map((s, i) => (
                                <li
                                  key={`${s.starts}-${i}`}
                                  className="rounded-full bg-slate-200/80 px-2.5 py-1 text-xs font-medium text-slate-600"
                                >
                                  {formatTime12(s.starts)} – {formatTime12(s.ends)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Field
                    label={b.form.startTime}
                    htmlFor="startTime"
                    hint={b.form.startHint}
                    error={errors.startTime}
                    required
                  >
                    <Select
                      value={form.startTime}
                      onValueChange={(v) => update("startTime", v)}
                    >
                      <SelectTrigger id="startTime" className="w-full">
                        <SelectValue placeholder={b.form.chooseTime} />
                      </SelectTrigger>
                      <SelectContent>
                        {startOptions.map((slot) => {
                          // Greyed out when the database says the room is
                          // already taken at this time.
                          const blocked = isTimeBlocked(slot, "start");
                          return (
                            <SelectItem key={slot} value={slot} disabled={blocked}>
                              {formatTime12(slot)}
                              {blocked && (
                                <span className="ml-2 text-xs text-slate-400">
                                  {b.availability.taken}
                                </span>
                              )}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    label={b.form.endTime}
                    htmlFor="endTime"
                    hint={b.form.endHint}
                    error={errors.endTime}
                    required
                  >
                    <Select value={form.endTime} onValueChange={(v) => update("endTime", v)}>
                      <SelectTrigger id="endTime" className="w-full">
                        <SelectValue placeholder={b.form.chooseTime} />
                      </SelectTrigger>
                      <SelectContent>
                        {endOptions.map((slot) => (
                          <SelectItem
                            key={slot}
                            value={slot}
                            // Slots at or before the chosen start time are
                            // disabled so an invalid window can't be picked,
                            // as are times that run into an existing booking.
                            disabled={
                              (Boolean(form.startTime) &&
                                minutesOf(slot) <= minutesOf(form.startTime)) ||
                              isTimeBlocked(slot, "end")
                            }
                          >
                            {formatTime12(slot)}
                            {isTimeBlocked(slot, "end") && (
                              <span className="ml-2 text-xs text-slate-400">
                                {b.availability.taken}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="my-7 h-px bg-slate-100" />

                {/* --- Room, headcount, payment --- */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={b.form.room} htmlFor="room" error={errors.roomId} required>
                    <Select
                      value={isGlobalBooking ? globalListingId : form.roomId}
                      onValueChange={(v) => isGlobalBooking ? setGlobalListingId(v) : update("roomId", v as RoomId)}
                    >
                      <SelectTrigger id="room" className="w-full">
                        <SelectValue placeholder={b.form.chooseRoom} />
                      </SelectTrigger>
                      <SelectContent>
                        {isGlobalBooking
                          ? globalListings.map((listing) => <SelectItem key={listing.id} value={listing.id}>{listing.name} · {listing.city}</SelectItem>)
                          : ROOMS.map((room) => <SelectItem key={room.id} value={room.id}>{room.emoji} {room.name[lang]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    label={b.form.attendees}
                    htmlFor="attendees"
                    hint={
                      selectedRoom
                        ? fill(b.capacityLabel, { n: selectedRoom.capacity })
                        : undefined
                    }
                    error={errors.attendees}
                    required
                  >
                    <Input
                      id="attendees"
                      type="number"
                      min={1}
                      max={selectedRoom?.capacity}
                      value={form.attendees}
                      onChange={(e) => update("attendees", e.target.value)}
                      placeholder="6"
                      aria-invalid={Boolean(errors.attendees)}
                    />
                  </Field>
                </div>

                {/* Payment method — radio-style buttons rather than a
                    dropdown: only two options, and tapping is faster. */}
                <div className="mt-4">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {b.form.payment} <span className="text-rose-500">*</span>
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PAYMENT_METHODS.map((method) => {
                      const active = form.payment === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => update("payment", method.id)}
                          aria-pressed={active}
                          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                            active
                              ? "border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-500/30"
                              : "border-slate-200 text-slate-700 hover:border-teal-200 hover:bg-teal-50/50"
                          }`}
                        >
                          <CreditCard
                            className={`h-4 w-4 ${active ? "text-teal-600" : "text-slate-400"}`}
                          />
                          {method.label[lang]}
                        </button>
                      );
                    })}
                  </div>
                  {errors.payment && <ErrorText>{errors.payment}</ErrorText>}
                </div>

                {/* --- Error summary --- */}
                {errorList.length > 0 && (
                  <div
                    role="alert"
                    className="mt-6 rounded-xl bg-rose-50 p-4 text-xs text-rose-700"
                  >
                    <p className="flex items-center gap-1.5 font-semibold">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {b.errors.title}
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      {errorList.map((message, i) => (
                        <li key={i}>{message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* --- Fallback: the silent POST didn't get through --- */}
                {status === "fallback" && (
                  <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {b.fallbackTitle}
                    </p>
                    <p className="mt-1.5 leading-relaxed">{b.fallbackBody}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
                        <a href={prefillUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          {b.fallbackButton}
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="border-amber-300">
                        <a href={`mailto:${companyFacts.email}`}>{companyFacts.email}</a>
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn-shimmer mt-7 w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
                >
                  {status === "sending" ? (
                    <>
                      <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {b.form.sending}
                    </>
                  ) : (
                    <>
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {b.form.submit}
                    </>
                  )}
                </Button>

                <p className="mt-4 text-center text-xs text-slate-400">
                  {t.contactExtra.privacyNotice}{" "}
                  <RouterLink to="privacy" className="underline hover:text-teal-600">
                    {t.contactExtra.privacyLink}
                  </RouterLink>
                  .
                </p>
              </form>
            </div>

            {/* ---------- LIVE SUMMARY (2 of 5 columns) ---------- */}
            {/* Sticky on large screens so the running estimate stays in view
                while the visitor works down the form. */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-28">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/40 px-6 py-5">
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      {b.summaryTitle}
                    </h3>
                  </div>

                  {!selectedRoom && !form.date ? (
                    <p className="px-6 py-8 text-sm text-slate-500">{b.summaryEmpty}</p>
                  ) : (
                    <dl className="divide-y divide-slate-100 text-sm">
                      <SummaryRow
                        label={b.summaryRoom}
                        value={selectedRoom ? selectedRoom.name[lang] : selectedGlobalListing?.name ?? "—"}
                      />
                      <SummaryRow
                        label={b.summaryDate}
                        value={form.date ? formatDate(form.date) : "—"}
                      />
                      <SummaryRow
                        label={b.summaryTime}
                        value={
                          form.startTime && form.endTime
                            ? `${formatTime12(form.startTime)} – ${formatTime12(form.endTime)}`
                            : "—"
                        }
                      />
                      <SummaryRow
                        label={b.summaryDuration}
                        value={
                          estimate
                            ? selectedRoom?.unit === "day"
                              ? b.summaryDayRate
                              : fill(b.summaryHours, { n: estimate.hours })
                            : "—"
                        }
                      />
                      <SummaryRow label={b.summaryAttendees} value={form.attendees || "—"} />
                      <div className="bg-teal-50/50 px-6 py-4 text-sm font-semibold text-teal-800">
                        Final availability and booking terms will be confirmed by our team.
                      </div>
                    </dl>
                  )}

                  <p className="border-t border-slate-100 px-6 py-4 text-[11px] leading-relaxed text-slate-400">
                    {b.summaryNote}
                  </p>
                </div>

                {/* Policy notice — the same warnings printed on the form. */}
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <h4 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-slate-700">
                    <Info className="h-4 w-4 text-teal-600" />
                    {b.noticeTitle}
                  </h4>
                  <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-600">
                    {b.notices.map((note, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" />
                        {note}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-600">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                    {t.contact.info.hours}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="bg-slate-50 py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading eyebrow={t.pricingExtra.faqEyebrow} title={b.faqTitle} align="center" />
          <div className="mt-12">
            <Accordion type="single" collapsible className="w-full">
              {b.faq.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`booking-faq-${i}`}
                  className="mb-3 rounded-2xl border border-slate-200 bg-white px-6 shadow-sm data-[state=open]:border-teal-200 data-[state=open]:ring-1 data-[state=open]:ring-teal-200"
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

          {/* Escape hatch to the original Google Form. Some clients have
              already bookmarked it, and it reassures anyone who would
              rather submit through Google directly. */}
          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <h3 className="font-display text-lg font-bold text-slate-900">{b.classicTitle}</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              {b.classicBody}
            </p>
            <Button asChild variant="outline" className="mt-5 border-teal-200 text-teal-700 hover:bg-teal-50">
              <a href={googleFormViewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                {b.classicButton}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Field — a labelled form row: label (+ required asterisk), the control
 * itself, an optional hint, and an optional error message.
 *
 * Inputs:
 *   - `label`    : visible field name
 *   - `htmlFor`  : id of the control, so clicking the label focuses it
 *   - `hint?`    : small grey helper text below the control
 *   - `error?`   : validation message; replaces the hint when present
 *   - `required?`: renders a red asterisk
 *   - `children` : the Input / Select control
 */
function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
      >
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <ErrorText>{error}</ErrorText>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

/** Small red validation message shown under a field. */
function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 flex items-start gap-1 text-[11px] leading-relaxed text-rose-600">
      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
      {children}
    </p>
  );
}

/** One label/value row inside the summary and confirmation cards. */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-6 py-3.5">
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}
