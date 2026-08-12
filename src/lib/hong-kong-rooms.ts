"use client";

/**
 * ============================================================================
 * FILE: hong-kong-rooms.ts — the six Wan Chai rooms, database first
 * ============================================================================
 * WHAT IT IS:
 *   One place that answers "what are the Hong Kong rooms right now?", by
 *   reading `public.rooms` and falling back to the hardcoded `ROOMS` in
 *   booking-data.ts whenever the database cannot answer.
 *
 * WHY IT EXISTS:
 *   `ROOMS` used to be the only source of truth for the public pages, so
 *   editing a room in the admin dashboard changed nothing a visitor could
 *   see. But `ROOMS` cannot simply be deleted either:
 *
 *     1. `public.bookings.room_id` is a foreign key to `public.rooms`, and
 *        the booking trigger prices every request from `rooms.rate`. The
 *        Hong Kong booking engine — overlap prevention, hot-desk seat
 *        counting, the 7-working-day rule, the quoted total — is all keyed
 *        to those six slugs.
 *     2. `formValue` is the exact option text in the team's Google Form.
 *        It lives in code because the form lives outside this repo.
 *     3. The whole site is designed to work with no database configured at
 *        all. Without a fallback catalogue the booking page would be blank.
 *
 *   So `public.rooms` is the source of truth and `ROOMS` is the fallback +
 *   the Google Form mapping. This module merges the two.
 *
 * HOW IT FITS IN:
 *   - Public pages (booking, pricing, home) call `useHongKongRooms()`.
 *   - The booking page already holds a list of published partner listings,
 *     so it can call the pure `mergeRoomRows()` instead of fetching twice.
 *   - The admin dashboard calls `saveHongKongRoom()` to edit a room, which
 *     writes to the same table the booking engine reads — so an edited rate
 *     is the rate the customer is actually quoted.
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { ROOMS, type Room, type RoomId } from "./booking-data";

/**
 * A row of `public.rooms`. Every field beyond the original schema is
 * optional: the extra columns are added by
 * `supabase/hong-kong-rooms-admin.sql`, and this module must keep working
 * for anyone who has not run that migration yet.
 */
type RoomRow = {
  id: string;
  name_en?: string | null;
  name_zh_hk?: string | null;
  name_zh_cn?: string | null;
  capacity?: number | null;
  rate?: number | string | null;
  unit?: string | null;
  form_value?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  // Added by hong-kong-rooms-admin.sql.
  blurb_en?: string | null;
  blurb_zh_hk?: string | null;
  blurb_zh_cn?: string | null;
  image_url?: string | null;
  emoji?: string | null;
};

/** `value` unless it is null/blank, in which case `fallback`. */
function orElse<T>(value: T | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string" && value.trim() === "") return fallback;
  return value;
}

/**
 * Overlay one database row onto its hardcoded twin.
 *
 * The database wins for everything a member of staff can edit. Code wins
 * for `formValue` (unless the row carries one) because the Google Form is
 * not ours to rename, and for any column the migration has not added yet.
 */
function applyRow(room: Room, row: RoomRow): Room {
  const blurbEn = orElse(row.blurb_en, "");
  return {
    ...room,
    name: {
      en: orElse(row.name_en, room.name.en),
      "zh-HK": orElse(row.name_zh_hk, room.name["zh-HK"]),
      "zh-CN": orElse(row.name_zh_cn, room.name["zh-CN"]),
    },
    // Blurbs only exist in the database once the migration has run. Until
    // then, and for any room left blank, keep the translated copy.
    blurb: blurbEn
      ? {
          en: blurbEn,
          "zh-HK": orElse(row.blurb_zh_hk, blurbEn),
          "zh-CN": orElse(row.blurb_zh_cn, blurbEn),
        }
      : room.blurb,
    capacity: Number(row.capacity) > 0 ? Number(row.capacity) : room.capacity,
    rate: row.rate === null || row.rate === undefined ? room.rate : Number(row.rate),
    unit: row.unit === "day" ? "day" : row.unit === "hour" ? "hour" : room.unit,
    emoji: orElse(row.emoji, room.emoji),
    image: orElse(row.image_url, room.image),
    formValue: orElse(row.form_value, room.formValue),
  };
}

/** Build a Room for a database row with no hardcoded twin (a room added later). */
function rowToRoom(row: RoomRow): Room {
  const name = orElse(row.name_en, "Room");
  const blurb = orElse(row.blurb_en, "");
  return {
    id: String(row.id) as RoomId,
    name: {
      en: name,
      "zh-HK": orElse(row.name_zh_hk, name),
      "zh-CN": orElse(row.name_zh_cn, name),
    },
    blurb: {
      en: blurb,
      "zh-HK": orElse(row.blurb_zh_hk, blurb),
      "zh-CN": orElse(row.blurb_zh_cn, blurb),
    },
    capacity: Number(row.capacity) > 0 ? Number(row.capacity) : 1,
    rate: Number(row.rate ?? 0),
    unit: row.unit === "day" ? "day" : "hour",
    emoji: orElse(row.emoji, "🏢"),
    image: orElse(row.image_url, "/conferenceRoom.jpeg"),
    formValue: orElse(row.form_value, ""),
  };
}

/**
 * mergeRoomRows — pure merge of database rows over the hardcoded catalogue.
 *
 * Order follows `ROOMS` (which matches the Google Form) and then any extra
 * rooms the database knows about. Rooms switched off with `is_active = false`
 * disappear from the public site without being deleted.
 */
export function mergeRoomRows(rows: RoomRow[] | null | undefined): Room[] {
  if (!Array.isArray(rows) || rows.length === 0) return ROOMS;

  const byId = new Map(rows.map((row) => [String(row.id), row]));

  const known = ROOMS.flatMap((room) => {
    const row = byId.get(room.id);
    if (!row) return [room]; // in code, not yet in the database
    if (row.is_active === false) return [];
    return [applyRow(room, row)];
  });

  const extra = rows
    .filter((row) => row.is_active !== false && !ROOMS.some((r) => r.id === String(row.id)))
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map(rowToRoom);

  return [...known, ...extra];
}

/**
 * fetchHongKongRooms — read the catalogue from the database.
 *
 * Never throws and never returns an empty list: on any failure (offline,
 * unconfigured, migration not run) it returns the hardcoded `ROOMS`, so the
 * booking page always has something to show.
 */
export async function fetchHongKongRooms(): Promise<Room[]> {
  if (!supabase) return ROOMS;
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) return ROOMS;
    return mergeRoomRows(data as RoomRow[]);
  } catch {
    return ROOMS;
  }
}

/**
 * useHongKongRooms — the catalogue as React state.
 *
 * Renders the hardcoded rooms immediately (so there is no empty flash and
 * server-rendered markup still contains the rates), then swaps in whatever
 * the database says. Components can treat the result as a plain `Room[]`.
 */
export function useHongKongRooms(): Room[] {
  const [rooms, setRooms] = useState<Room[]>(ROOMS);

  useEffect(() => {
    let cancelled = false;
    void fetchHongKongRooms().then((next) => {
      if (!cancelled) setRooms(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return rooms;
}

/** The fields a member of staff may change on a Wan Chai room. */
export type HongKongRoomDraft = {
  id: string;
  name_en: string;
  name_zh_hk: string;
  name_zh_cn: string;
  blurb_en: string;
  blurb_zh_hk: string;
  blurb_zh_cn: string;
  capacity: number;
  rate: number;
  unit: "hour" | "day";
  image_url: string | null;
  is_active: boolean;
};

/** Columns that only exist after `supabase/hong-kong-rooms-admin.sql` has run. */
const EXTRA_COLUMNS = ["blurb_en", "blurb_zh_hk", "blurb_zh_cn", "image_url"] as const;

function isMissingColumn(message: string | undefined): boolean {
  return /column .* does not exist|could not find the .* column|schema cache/i.test(
    message || ""
  );
}

/**
 * saveHongKongRoom — write one room back to `public.rooms`.
 *
 * This is the table the booking engine prices from, so an edit here changes
 * what the customer is quoted, not just what they are shown.
 *
 * If the extra-columns migration has not been run, the write is retried with
 * only the original columns and the caller is told what is missing — a
 * partial save beats an error the owner cannot act on.
 */
export async function saveHongKongRoom(
  draft: HongKongRoomDraft
): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };

  const core = {
    name_en: draft.name_en.trim(),
    name_zh_hk: draft.name_zh_hk.trim() || draft.name_en.trim(),
    name_zh_cn: draft.name_zh_cn.trim() || draft.name_en.trim(),
    capacity: Math.max(1, Math.round(Number(draft.capacity) || 1)),
    rate: Math.max(0, Number(draft.rate) || 0),
    unit: draft.unit === "day" ? "day" : "hour",
    is_active: draft.is_active,
  };

  const full: Record<string, unknown> = {
    ...core,
    blurb_en: draft.blurb_en.trim(),
    blurb_zh_hk: draft.blurb_zh_hk.trim() || draft.blurb_en.trim(),
    blurb_zh_cn: draft.blurb_zh_cn.trim() || draft.blurb_en.trim(),
    image_url: draft.image_url,
  };

  const first = await supabase.from("rooms").update(full).eq("id", draft.id).select("id");
  if (!first.error) {
    return (first.data?.length ?? 0) > 0
      ? { ok: true }
      : { ok: false, message: "Only staff can edit rooms — sign in with a staff account." };
  }

  if (!isMissingColumn(first.error.message)) {
    return { ok: false, message: first.error.message };
  }

  const retry = await supabase.from("rooms").update(core).eq("id", draft.id).select("id");
  if (retry.error) return { ok: false, message: retry.error.message };
  if ((retry.data?.length ?? 0) === 0) {
    return { ok: false, message: "Only staff can edit rooms — sign in with a staff account." };
  }
  return {
    ok: true,
    message: `Name, capacity and rate saved. Photo and description need supabase/hong-kong-rooms-admin.sql (missing columns: ${EXTRA_COLUMNS.join(", ")}).`,
  };
}
