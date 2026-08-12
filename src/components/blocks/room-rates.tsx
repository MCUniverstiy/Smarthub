"use client";

/**
 * ============================================================================
 * FILE: room-rates.tsx — Bookable Room Rate Table Block
 * ============================================================================
 * WHAT IT IS:
 *   A compact table of the six bookable spaces — name, capacity and rate —
 *   with a "Book" link on every row.
 *
 * WHAT IT DOES:
 *   - Reads the room catalogue from `src/lib/booking-data.ts`, so the rates
 *     shown here can never drift from the rates on the booking page or the
 *     ones printed on the team's Google Form.
 *   - Each row deep-links to `#/book?room=<id>`, which opens the booking
 *     page with that room already selected.
 *   - Renders a table on desktop and stacked cards on mobile (a 4-column
 *     table is unreadable on a phone).
 *
 * HOW IT FITS IN:
 *   A "block" component reused by the Pricing page (as the workspace/room
 *   rates section) and the Services page (under "Meeting & Event Space").
 *   Keeping it in one file means one edit updates every page that shows
 *   room prices.
 * ============================================================================
 */

import { useLang } from "@/lib/i18n/lang-context";
import { RouterLink } from "@/lib/router";
import { formatHKD } from "@/lib/booking-data";
import { useHongKongRooms } from "@/lib/hong-kong-rooms";
import { ArrowRight, Users } from "lucide-react";

/**
 * RoomRates — the rate table block.
 *
 * Inputs (props):
 *   - `title?`   : override the section title (defaults to the translated
 *                  `t.booking.rateTableTitle`).
 *   - `showLead?`: whether to show the supporting paragraph. Default true.
 *
 * Produces: a bordered card with a header row, a responsive rate table,
 * and a footer CTA linking to the full booking page.
 */
export function RoomRates({
  title,
  showLead = true,
}: {
  title?: string;
  showLead?: boolean;
}) {
  const { t, lang } = useLang();
  const b = t.booking;
  // Read from `public.rooms` so this table shows the rates staff last saved,
  // and so it can never disagree with the price the booking page quotes.
  const rooms = useHongKongRooms();

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Header — title + optional supporting line. */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/40 px-6 py-5">
        <h3 className="font-display text-xl font-bold text-slate-900">
          {title ?? b.rateTableTitle}
        </h3>
        {showLead && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">
            {b.rateTableLead}
          </p>
        )}
      </div>

      {/* ---------- DESKTOP: real table (sm and up) ---------- */}
      <div className="hidden sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-white text-[11px] uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-6 py-3 font-semibold">
                {b.rateTableRoom}
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                {b.rateTableCapacity}
              </th>
              <th scope="col" className="px-6 py-3 font-semibold">
                {b.rateTableRate}
              </th>
              {/* Empty header for the action column — screen readers get the
                  link text itself, so a visible label would be noise. */}
              <th scope="col" className="px-6 py-3">
                <span className="sr-only">{b.bookCta}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rooms.map((room) => (
              <tr key={room.id} className="transition hover:bg-teal-50/40">
                <td className="px-6 py-4 font-semibold text-slate-900">
                  <span className="mr-1.5" aria-hidden="true">
                    {room.emoji}
                  </span>
                  {room.name[lang]}
                </td>
                <td className="px-6 py-4 text-slate-600">{room.capacity}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
                    {formatHKD(room.rate)}
                    {room.unit === "hour" ? b.perHour : b.perDay}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {/* Deep link — the booking page reads ?room= and preselects. */}
                  <RouterLink
                    to="book"
                    query={{ room: room.id }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 transition hover:text-teal-900"
                  >
                    {b.bookCta}
                    <ArrowRight className="h-3 w-3" />
                  </RouterLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- MOBILE: stacked cards (below sm) ---------- */}
      <ul className="divide-y divide-slate-100 sm:hidden">
        {rooms.map((room) => (
          <li key={room.id} className="px-6 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">
                  <span className="mr-1.5" aria-hidden="true">
                    {room.emoji}
                  </span>
                  {room.name[lang]}
                </div>
                <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="h-3 w-3 text-teal-600" />
                  {room.capacity}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
                {formatHKD(room.rate)}
                {room.unit === "hour" ? b.perHour : b.perDay}
              </span>
            </div>
            <RouterLink
              to="book"
              query={{ room: room.id }}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700"
            >
              {b.bookCta}
              <ArrowRight className="h-3 w-3" />
            </RouterLink>
          </li>
        ))}
      </ul>

      {/* Footer CTA — for visitors who haven't decided on a room yet. */}
      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center">
        <RouterLink
          to="book"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 transition hover:text-teal-900"
        >
          {b.bookAllCta}
          <ArrowRight className="h-3.5 w-3.5" />
        </RouterLink>
      </div>
    </div>
  );
}
