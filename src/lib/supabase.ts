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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when both env vars are present, so the app can decide whether to
 * use the database at all. Checked before every call below.
 */
export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes("your-project-ref")
);

/**
 * The client, created once and reused. `null` when unconfigured — the
 * callers below all guard on `isSupabaseConfigured` first.
 *
 * `persistSession: false` because visitors booking a room are anonymous;
 * we never sign anyone in, so there is no session worth keeping.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
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
