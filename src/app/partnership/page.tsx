"use client";

import { useEffect } from "react";

/** Path URL for people who type /partnership instead of /#/partnership. */
export default function PartnershipPathRedirect() {
  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    window.location.replace(`/#/partnership${search}`);
  }, []);
  return (
    <p className="p-8 text-center text-sm text-slate-500">Opening the partnership application…</p>
  );
}
