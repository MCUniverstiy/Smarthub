"use client";

/**
 * STAFF BOOKING INBOX (#/admin)
 * =================================================================
 * WHAT THIS PAGE IS:
 *   The office's view of the booking database. It replaces squinting
 *   at the Google Sheet: bookings grouped by date, colour-coded by
 *   status, with one-click Confirm / Decline / Cancel.
 *
 * WHO CAN SEE IT:
 *   Only a signed-in Supabase Auth user who also has a row in
 *   `public.staff`. That is enforced by row level security in the
 *   database, not by this component — hiding the UI is a convenience,
 *   not the security boundary. A stranger who guesses the URL, signs
 *   up, and signs in still gets an empty list, because the RLS policies
 *   call `is_staff()`.
 *
 * WHY THERE IS NO "CLASHES" WARNING HERE:
 *   There cannot be any. The exclusion constraint in
 *   `supabase/schema.sql` makes overlapping bookings impossible to
 *   store, so unlike the Google Sheet there is nothing to detect.
 *
 * DELIBERATELY ENGLISH-ONLY:
 *   Every public page is trilingual. This one is an internal tool for
 *   the Wan Chai team, so it is not wired into the i18n dictionaries —
 *   that keeps three translation files from growing for strings no
 *   customer will ever read.
 * =================================================================
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  LogOut,
  Mail,
  Phone,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatHKD } from "@/lib/booking-data";
import {
  BOOKING_STATUSES,
  fetchBookings,
  isStaff,
  isSupabaseConfigured,
  signIn,
  signOut,
  supabase,
  updateBookingStatus,
  type BookingStatus,
  type InboxBooking,
} from "@/lib/supabase";

/** Tailwind classes per status, so the eye can scan the list quickly. */
const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-blue-50 text-blue-700 ring-blue-600/20",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  declined: "bg-red-50 text-red-700 ring-red-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
};

/** "2026-09-08" -> "Tue 8 Sep 2026" */
function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "14:00:00" -> "2:00 PM" */
function prettyTime(t: string): string {
  const [hRaw, m] = String(t).split(":");
  const h = Number(hRaw);
  if (Number.isNaN(h)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m ?? "00"} ${suffix}`;
}

export function AdminPage() {
  /** "checking" until we know whether someone is signed in and staff. */
  const [gate, setGate] = useState<"checking" | "signed-out" | "denied" | "ok">(
    "checking"
  );
  const [bookings, setBookings] = useState<InboxBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<BookingStatus | "all">("pending");
  const [notice, setNotice] = useState<string>("");

  // Sign-in form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState("");

  /** Load the inbox. Separated so the Refresh button can reuse it. */
  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchBookings();
    setBookings(rows);
    setLoading(false);
  }, []);

  /**
   * Decide what to show: signed out, signed in but not staff, or the
   * inbox. Re-runs whenever the auth state changes, so signing in or
   * out updates the page without a reload.
   */
  const evaluate = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setGate("signed-out");
      return;
    }
    const allowed = await isStaff();
    if (!allowed) {
      setGate("denied");
      return;
    }
    setGate("ok");
    await load();
  }, [load]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // `cancelled` stops a late auth response updating an unmounted page.
    let cancelled = false;
    const run = () => {
      if (!cancelled) void evaluate();
    };

    // Deferred to a microtask so no state update happens synchronously
    // while this effect body is still running (react-hooks lint rule).
    const id = setTimeout(run, 0);
    const { data: sub } = supabase.auth.onAuthStateChange(run);

    return () => {
      cancelled = true;
      clearTimeout(id);
      sub.subscription.unsubscribe();
    };
  }, [evaluate]);

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSigningIn(true);
    setSignInError("");
    const res = await signIn(email.trim(), password);
    setSigningIn(false);
    if (!res.ok) {
      setSignInError(res.message ?? "Could not sign in.");
      return;
    }
    setPassword("");
    // onAuthStateChange fires and re-runs `evaluate`.
  }

  async function setStatus(reference: string, status: BookingStatus) {
    // Optimistic: update the row immediately, roll back if the database
    // refuses. The office clicks these constantly; waiting feels broken.
    const previous = bookings;
    setBookings((rows) =>
      rows.map((r) => (r.reference === reference ? { ...r, status } : r))
    );
    const res = await updateBookingStatus(reference, status);
    if (!res.ok) {
      setBookings(previous);
      setNotice(res.message ?? "Could not update that booking.");
      return;
    }
    setNotice(
      status === "declined" || status === "cancelled"
        ? `${reference} released — that slot is bookable again.`
        : `${reference} marked ${STATUS_LABELS[status].toLowerCase()}.`
    );
  }

  /** Bookings matching the current filter, grouped by date. */
  const grouped = useMemo(() => {
    const rows =
      filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
    const map = new Map<string, InboxBooking[]>();
    rows.forEach((b) => {
      const list = map.get(b.booking_date) ?? [];
      list.push(b);
      map.set(b.booking_date, list);
    });
    return Array.from(map.entries());
  }, [bookings, filter]);

  /** How many bookings sit in each status, for the filter chips. */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bookings.length };
    BOOKING_STATUSES.forEach((s) => {
      c[s] = bookings.filter((b) => b.status === s).length;
    });
    return c;
  }, [bookings]);

  /* ---------------- Supabase not set up ---------------- */
  if (!isSupabaseConfigured) {
    return (
      <Shell>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-600" />
          <h2 className="mt-4 font-display text-xl font-bold text-slate-900">
            No database connected
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            Run <code className="rounded bg-white px-1.5 py-0.5">supabase/schema.sql</code>{" "}
            in the Supabase SQL editor, then set{" "}
            <code className="rounded bg-white px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and{" "}
            <code className="rounded bg-white px-1.5 py-0.5">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>
            . Until then bookings go to the Google Form only.
          </p>
        </div>
      </Shell>
    );
  }

  /* ---------------- Still checking ---------------- */
  if (gate === "checking") {
    return (
      <Shell>
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" /> Checking your access…
        </p>
      </Shell>
    );
  }

  /* ---------------- Sign in ---------------- */
  if (gate === "signed-out") {
    return (
      <Shell>
        <div className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
          <h2 className="font-display text-xl font-bold text-slate-900">Staff sign in</h2>
          <p className="mt-2 text-sm text-slate-600">
            For the Wan Chai team. Bookings are not visible without an account.
          </p>
          <form onSubmit={onSignIn} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
                autoComplete="current-password"
              />
            </div>
            {signInError && (
              <p className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {signInError}
              </p>
            )}
            <Button
              type="submit"
              disabled={signingIn}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
            >
              {signingIn ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </Shell>
    );
  }

  /* ---------------- Signed in, but not staff ---------------- */
  if (gate === "denied") {
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5">
          <AlertCircle className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-4 font-display text-xl font-bold text-slate-900">
            This account has no access
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            You are signed in, but your account is not on the staff list. An
            administrator can add you by running the{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5">insert into public.staff</code>{" "}
            snippet in <code className="rounded bg-slate-100 px-1.5 py-0.5">supabase/README.md</code>.
          </p>
          <Button
            onClick={() => void signOut()}
            variant="outline"
            className="mt-6"
          >
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </Shell>
    );
  }

  /* ---------------- The inbox ---------------- */
  return (
    <Shell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
            Booking inbox
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {bookings.length} booking{bookings.length === 1 ? "" : "s"} in the database.
            Overlaps are impossible — the database refuses them.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void load()} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => void signOut()} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>

      {notice && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{notice}</span>
          <button
            onClick={() => setNotice("")}
            className="text-teal-600 hover:text-teal-800"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", ...BOOKING_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition ${
              filter === s
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}{" "}
            <span className="opacity-60">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-slate-500">Loading bookings…</p>
      ) : grouped.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            {filter === "all"
              ? "No bookings yet."
              : `No ${STATUS_LABELS[filter as BookingStatus].toLowerCase()} bookings.`}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([date, rows]) => (
            <section key={date}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                <CalendarDays className="h-4 w-4" />
                {prettyDate(date)}
              </h2>
              <div className="space-y-3">
                {rows.map((b) => (
                  <article
                    key={b.reference}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-base font-bold text-slate-900">
                            {b.room}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                              STATUS_STYLES[b.status]
                            }`}
                          >
                            {STATUS_LABELS[b.status]}
                          </span>
                          <code className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            {b.reference}
                          </code>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {prettyTime(b.start_time)} – {prettyTime(b.end_time)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {b.attendees}
                          </span>
                          {b.quoted_total != null && (
                            <span className="font-semibold text-slate-900">
                              {formatHKD(Number(b.quoted_total))}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions. Declining or cancelling frees the slot. */}
                      <div className="flex flex-wrap gap-2">
                        {b.status !== "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() => void setStatus(b.reference, "confirmed")}
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Confirm
                          </Button>
                        )}
                        {b.status !== "declined" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void setStatus(b.reference, "declined")}
                          >
                            Decline
                          </Button>
                        )}
                        {b.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void setStatus(b.reference, "cancelled")}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-x-6 gap-y-1.5 border-t border-slate-100 pt-3 text-sm sm:grid-cols-2">
                      <div className="font-medium text-slate-900">{b.full_name}</div>
                      <div className="text-slate-600">
                        {b.company && b.company !== "N/A" ? b.company : "—"}
                        {b.br_number && b.br_number !== "N/A" && (
                          <span className="text-slate-400"> · BR {b.br_number}</span>
                        )}
                      </div>
                      <a
                        href={`mailto:${b.email}`}
                        className="flex items-center gap-1.5 text-teal-700 hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {b.email}
                      </a>
                      <a
                        href={`tel:${b.phone}`}
                        className="flex items-center gap-1.5 text-teal-700 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {b.phone}
                      </a>
                      <div className="text-slate-500">
                        Payment: {b.payment_method === "fps" ? "FPS" : "Bank transfer"}
                      </div>
                      {b.notes && (
                        <div className="text-slate-500 sm:col-span-2">Note: {b.notes}</div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Shell>
  );
}

/** Plain page frame — no marketing hero; this is an internal tool. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen bg-slate-50 py-12 lg:py-16">
      <div className="mx-auto max-w-5xl px-6">{children}</div>
    </section>
  );
}
