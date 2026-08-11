"use client";

/**
 * useIsStaff — is a member of the team signed in right now?
 * =================================================================
 * WHAT IT IS FOR:
 *   Letting the UI show staff-only shortcuts (currently the "Booking
 *   inbox" link in the footer) without showing them to the public.
 *
 * WHAT IT IS NOT:
 *   A security control. This decides what to RENDER, nothing more.
 *   Anyone can edit the returned value in their browser's devtools and
 *   make the link appear — and it would do them no good at all, because
 *   the page it links to loads its data through row level security. A
 *   non-staff visitor who forces the link to appear, clicks it, and
 *   somehow signs in still receives zero booking rows from the
 *   database. The server is the boundary; this is only cosmetics.
 *
 * WHY A SHARED HOOK:
 *   Both the footer and the admin page need the same answer, and the
 *   check involves two round trips (session, then an is_staff() RPC).
 *   Keeping it in one place means the logic cannot drift between them.
 *
 * COST WHEN SUPABASE IS NOT CONFIGURED:
 *   Zero. It returns false immediately and never touches the network,
 *   so sites running on the Google Form alone are unaffected.
 * =================================================================
 */

import { useCallback, useEffect, useState } from "react";
import { isStaff, isSupabaseConfigured, supabase } from "@/lib/supabase";

export function useIsStaff(): boolean {
  const [staff, setStaff] = useState(false);

  /**
   * Ask the database, but only when there is a session to ask about.
   * Skipping the RPC for signed-out visitors keeps the common case free.
   */
  const check = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStaff(false);
      return;
    }
    setStaff(await isStaff());
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // `cancelled` stops a slow reply updating an unmounted footer.
    let cancelled = false;
    const run = () => {
      if (!cancelled) void check();
    };

    // Deferred so no state update happens synchronously in the effect
    // body (react-hooks/set-state-in-effect).
    const id = setTimeout(run, 0);

    // Signing in or out updates every mounted consumer immediately,
    // so the footer link appears the moment sign-in succeeds.
    const { data: sub } = supabase.auth.onAuthStateChange(run);

    return () => {
      cancelled = true;
      clearTimeout(id);
      sub.subscription.unsubscribe();
    };
  }, [check]);

  return staff;
}
