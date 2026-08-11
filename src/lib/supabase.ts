/**
 * SUPABASE CLIENT + BOOKING GATEWAY
 * =================================================================
 * WHAT THIS FILE IS:
 *   The website's connection to the booking database. It wraps the
 *   three RPCs defined in `supabase/schema.sql` so the rest of the app
 *   never has to think about Postgres error codes.
 *
 * WHY THE DATABASE EXISTS AT ALL:
 *   The Google Form records answers but cannot see what is already in
 *   the sheet, so it will happily accept two bookings for the same room
 *   at the same time. The database refuses the second one — not in
 *   JavaScript, which anyone can bypass, but with an exclusion
 *   constraint enforced at the storage layer.
 *
 * IT IS OPTIONAL, BY DESIGN:
 *   If NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are not set, every function
 *   here reports "unconfigured" and the booking page falls back to the
 *   Google Form on its own. The site never breaks because a database
 *   has not been set up yet. That means this can be deployed before the
 *   SQL has been run, and switched on later by adding two env vars.
 *
 * ABOUT THE ANON KEY:
 *   It is public and ships inside the JavaScript bundle. That is normal
 *   and safe here BECAUSE of the row level security in section 8 of
 *   schema.sql: with this key you may create a pending booking and read
 *   the room list, and nothing else. You cannot list bookings, read a
 *   customer's email, or confirm your own booking.
 * =================================================================
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BookingSubmission } from "./booking-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * The public key, under either of the two names Supabase uses.
 *
 * Supabase renamed this key in 2025. Projects created before then have an
 * "anon" key (a long JWT starting `eyJ...`); projects created from
 * November 2025 onwards only get a "publishable" key (a short opaque
 * token starting `sb_publishable_...`). They behave identically — both
 * are low-privilege, both are safe to ship in the browser, and both are
 * gated entirely by row level security — so we accept whichever is set
 * rather than forcing you to know which era your project belongs to.
 *
 * The legacy `anon` key is scheduled for removal at the end of 2026, so
 * PUBLISHABLE_KEY is checked first and is the one to prefer for new
 * setups.
 */
const publicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when both env vars are present, so the app can decide whether to
 * use the database at all. Checked before every call below.
 *
 * The placeholder values from `.env.example` are rejected too, so a
 * half-finished setup does not count as configured — otherwise the site
 * would try to reach `your-project-ref.supabase.co` and fail confusingly
 * instead of falling back to the Google Form.
 */
export const isSupabaseConfigured = Boolean(
  url &&
    publicKey &&
    !url.includes("your-project-ref") &&
    !publicKey.startsWith("your-")
);

/**
 * The client, created once and reused. `null` when unconfigured — the
 * callers below all guard on `isSupabaseConfigured` first.
 *
 * Sessions ARE persisted, because the staff admin page (`#/admin`) signs
 * people in and they should not be logged out by a page refresh. Members
 * of the public booking a room never sign in, so they simply have no
 * session — nothing is stored for them.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, publicKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "smarthub-auth",
      },
    })
  : null;

/* ================================================================
   ERROR TRANSLATION
   ================================================================ */

/**
 * BookingErrorCode — the reasons a booking can be refused, in terms the
 * user interface understands. Section 11 of `supabase/schema.sql` lists
 * the database side of this mapping.
 */
export type BookingErrorCode =
  | "slot-taken"
  | "capacity"
  | "lead-time"
  | "seats-sold-out"
  | "rate-limit"
  | "time-order"
  | "start-window"
  | "end-window"
  | "unconfigured"
  | "network"
  | "unknown";

export type BookingResult =
  | { ok: true; reference: string; total: number; hours: number }
  | { ok: false; code: BookingErrorCode; message: string };

/**
 * classifyError — turn a Postgres failure into a BookingErrorCode.
 *
 * The schema deliberately tags its own exceptions with a `hint` (e.g.
 * 'bookings_lead_time') precisely so this function can stay readable
 * instead of pattern-matching on English error text.
 */
function classifyError(error: {
  code?: string;
  message?: string;
  hint?: string | null;
  details?: string | null;
}): BookingErrorCode {
  const hint = error.hint ?? "";
  const blob = `${error.message ?? ""} ${error.details ?? ""} ${hint}`;

  // 23P01 = exclusion_violation, raised by the bookings_no_overlap
  // constraint. This is the double-booking case.
  if (error.code === "23P01" || blob.includes("bookings_no_overlap")) {
    return "slot-taken";
  }
  if (hint.includes("bookings_capacity") || blob.includes("holds")) return "capacity";
  if (hint.includes("bookings_lead_time") || blob.includes("working days")) return "lead-time";
  if (hint.includes("bookings_seats_sold_out") || blob.includes("seats are left")) {
    return "seats-sold-out";
  }
  if (hint.includes("bookings_rate_limit") || blob.includes("24 hours")) return "rate-limit";
  if (hint.includes("bookings_time_order") || blob.includes("bookings_time_order")) {
    return "time-order";
  }
  if (blob.includes("bookings_start_window")) return "start-window";
  if (blob.includes("bookings_end_window")) return "end-window";
  return "unknown";
}

/* ================================================================
   THE THREE CALLS THE WEBSITE MAKES
   ================================================================ */

/**
 * createBooking — record a booking request in the database.
 *
 * Calls the `request_booking` RPC rather than inserting directly,
 * because row level security (correctly) forbids the public from
 * reading the bookings table, and we still want the reference number
 * and price back. The RPC is SECURITY DEFINER and returns only those
 * safe fields.
 *
 * Returns a discriminated union so the caller must handle failure.
 */
export async function createBooking(
  data: BookingSubmission
): Promise<BookingResult> {
  if (!supabase) {
    return { ok: false, code: "unconfigured", message: "Supabase is not configured." };
  }

  try {
    const { data: rows, error } = await supabase.rpc("request_booking", {
      p_full_name: data.fullName,
      p_email: data.email,
      p_phone: data.phone,
      p_company: data.company || "N/A",
      p_br_number: data.brNumber || "N/A",
      p_room_id: data.roomId,
      p_date: data.date,
      p_start: data.startTime,
      p_end: data.endTime,
      p_attendees: Number(data.attendees),
      p_payment: data.payment,
      p_notes: null,
    });

    if (error) {
      return { ok: false, code: classifyError(error), message: error.message };
    }

    // The RPC returns a one-row table, which supabase-js gives us as an
    // array. Defensive: treat an empty result as an unknown failure
    // rather than crashing on rows[0].
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row?.reference) {
      return { ok: false, code: "unknown", message: "No reference returned." };
    }

    return {
      ok: true,
      reference: String(row.reference),
      total: Number(row.total ?? 0),
      hours: Number(row.hours ?? 0),
    };
  } catch (e) {
    // Thrown rather than returned: the network is down, DNS failed, or
    // an ad-blocker ate the request.
    return {
      ok: false,
      code: "network",
      message: e instanceof Error ? e.message : "Network error",
    };
  }
}

/** One already-taken span, as returned by `room_busy_slots`. */
export type BusySlot = { starts: string; ends: string; seats: number };

/**
 * getBusySlots — the times a room is already taken on a given day.
 *
 * Used to grey out unavailable options in the time pickers. The RPC
 * returns ONLY times and seat counts — no names, no emails — so it is
 * safe to call from the browser.
 *
 * Fails soft: on any error it returns [] so the form still works, just
 * without the greyed-out hints. The database is still the thing that
 * ultimately prevents a clash, so a missing hint is cosmetic.
 */
export async function getBusySlots(
  roomId: string,
  date: string
): Promise<BusySlot[]> {
  if (!supabase || !roomId || !date) return [];

  try {
    const { data, error } = await supabase.rpc("room_busy_slots", {
      p_room: roomId,
      p_date: date,
    });
    if (error || !Array.isArray(data)) return [];

    return data.map((r: { starts: string; ends: string; seats: number }) => ({
      // Postgres returns 'HH:MM:SS'; the form works in 'HH:MM'.
      starts: String(r.starts).slice(0, 5),
      ends: String(r.ends).slice(0, 5),
      seats: Number(r.seats ?? 0),
    }));
  } catch {
    return [];
  }
}

/* ================================================================
   STAFF SIDE — used only by the admin page (#/admin)
   ================================================================
   Everything below requires a signed-in user who appears in
   public.staff. Row level security enforces that server-side: a
   signed-in user who is NOT staff simply sees zero rows. None of this
   is reachable with the plain anon key.
   ================================================================ */

/** The booking statuses the office can set. Mirrors the enum in SQL. */
export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** One row of the staff inbox, as returned by `bookings_inbox`. */
export type InboxBooking = {
  reference: string;
  status: BookingStatus;
  booking_date: string;
  start_time: string;
  end_time: string;
  room: string;
  attendees: number;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  br_number: string;
  payment_method: string;
  quoted_total: number | null;
  notes: string | null;
  internal_note: string | null;
  created_at: string;
};

/**
 * isStaff — is the signed-in user allowed to see bookings?
 *
 * Asks the database rather than trusting anything client-side. Returns
 * false when signed out or when the account is not in public.staff.
 */
export async function isStaff(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc("is_staff");
    return !error && data === true;
  } catch {
    return false;
  }
}

/**
 * fetchBookings — the office inbox, newest booking date first.
 *
 * Reads the `bookings_inbox` view, which is `security_invoker` and so
 * respects the same RLS policies as the underlying table. A non-staff
 * account gets an empty list, not an error.
 */
export async function fetchBookings(): Promise<InboxBooking[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("bookings_inbox")
      .select("*")
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true });
    if (error || !Array.isArray(data)) return [];
    return data as InboxBooking[];
  } catch {
    return [];
  }
}

/**
 * updateBookingStatus — confirm, decline or cancel a booking.
 *
 * Declining or cancelling releases the slot immediately: the exclusion
 * constraint only counts pending and confirmed bookings, so the time
 * becomes bookable again the moment this succeeds.
 */
export async function updateBookingStatus(
  reference: string,
  status: BookingStatus
): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  try {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("reference", reference);
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}

/** Sign a staff member in with email + password. */
export async function signIn(
  email: string,
  password: string
): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Network error" };
  }
}

/** Sign the current staff member out. */
export async function signOut(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    /* already signed out */
  }
}

/**
 * checkAvailability — ask the database whether one specific span is
 * free, just before submitting.
 *
 * This is a courtesy check for a nicer error message; it is NOT what
 * keeps the calendar honest. Between this call and the insert, someone
 * else could take the slot. The exclusion constraint is what actually
 * guarantees correctness, and `createBooking` reports its verdict.
 *
 * Returns `true` when unconfigured or on error, so a failure here never
 * blocks a booking that the database might have accepted.
 */
export async function checkAvailability(
  roomId: string,
  date: string,
  start: string,
  end: string,
  attendees: number
): Promise<boolean> {
  if (!supabase) return true;

  try {
    const { data, error } = await supabase.rpc("is_slot_available", {
      p_room: roomId,
      p_date: date,
      p_start: start,
      p_end: end,
      p_attendees: attendees,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}

// ============================================================================
// CONTACT ENQUIRIES
// ============================================================================
// Same shape as the booking API above: one function for the public that
// writes through an RPC, and staff-only readers that rely on RLS.
//
// The contact page still POSTs to Formspree as well. That is deliberate —
// Formspree is what actually emails the office, and until something else
// sends that email it must keep running. This just means the enquiry is
// also kept as a record rather than only as an email.

/** What the contact form collects. */
export type EnquirySubmission = {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  /** The service they picked in the dropdown, e.g. "company-formation". */
  service?: string;
  message: string;
  /** Which page the enquiry came from. Defaults to "contact-page". */
  source?: string;
  /** Site language at submission time, so the team replies in kind. */
  lang?: "en" | "zh-HK" | "zh-CN";
};

export type EnquiryResult =
  | { ok: true; reference: string }
  | { ok: false; code: "unconfigured" | "rate-limit" | "invalid" | "network" | "unknown"; message: string };

/**
 * submitEnquiry — record a contact-form enquiry in the database.
 *
 * Failure here is not fatal to the user's experience: the contact page
 * treats the Formspree POST as the thing that must succeed, and this as
 * a bonus. So callers can safely ignore a false result.
 */
export async function submitEnquiry(
  data: EnquirySubmission
): Promise<EnquiryResult> {
  if (!supabase) {
    return { ok: false, code: "unconfigured", message: "Supabase is not configured." };
  }

  try {
    const { data: rows, error } = await supabase.rpc("submit_enquiry", {
      p_full_name: data.fullName,
      p_email: data.email,
      p_phone: data.phone || null,
      p_company: data.company || null,
      p_service: data.service || null,
      p_message: data.message,
      p_source: data.source || "contact-page",
      p_lang: data.lang || null,
    });

    if (error) {
      const text = `${error.message} ${error.hint ?? ""}`.toLowerCase();
      const code = text.includes("enquiries_rate_limit") || text.includes("24 hours")
        ? "rate-limit"
        : text.includes("violates check constraint")
          ? "invalid"
          : "unknown";
      return { ok: false, code, message: error.message };
    }

    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row?.reference) {
      return { ok: false, code: "unknown", message: "No reference returned." };
    }
    return { ok: true, reference: String(row.reference) };
  } catch (e) {
    return {
      ok: false,
      code: "network",
      message: e instanceof Error ? e.message : "Network error",
    };
  }
}

/** The statuses the office can set on an enquiry. Mirrors the SQL enum. */
export const ENQUIRY_STATUSES = [
  "new",
  "in-progress",
  "replied",
  "closed",
  "spam",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

/** One row of the staff enquiry inbox, as returned by `enquiries_inbox`. */
export type InboxEnquiry = {
  reference: string;
  status: EnquiryStatus;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  message: string;
  lang: string | null;
  source: string;
  internal_note: string | null;
  created_at: string;
};

/**
 * fetchEnquiries — read the enquiry inbox.
 *
 * Returns [] for non-staff rather than throwing: RLS filters the rows
 * away server-side, so "not allowed" and "nothing to show" look the same
 * from here, which is exactly the point.
 */
export async function fetchEnquiries(): Promise<InboxEnquiry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("enquiries_inbox")
    .select("*")
    .limit(500);
  if (error) return [];
  return (data ?? []) as InboxEnquiry[];
}

/** Move an enquiry between statuses. Staff only, enforced by RLS. */
export async function updateEnquiryStatus(
  reference: string,
  status: EnquiryStatus
): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  const { error } = await supabase
    .from("enquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("reference", reference);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
