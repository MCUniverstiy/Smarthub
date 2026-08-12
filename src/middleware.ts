import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * The marketing site is a hash router (`/#/partnership`). Bookmarks,
 * emails and a default HTML form post still hit `/partnership`, which
 * Next.js treats as a missing page. Bounce those paths onto the hash
 * equivalent so the application form (and every other page) loads.
 */
export function middleware(request: NextRequest) {
  // Never intercept form POSTs — there is no server action here, and a
  // POST to /partnership is what produced the "This page couldn't load" crash.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }
  const seg = request.nextUrl.pathname.replace(/\/+$/, "").replace(/^\//, "");
  const dest = `/#/${seg}${request.nextUrl.search}`;
  return new NextResponse(
    `<!doctype html><meta http-equiv="refresh" content="0;url=${dest}"><script>location.replace(${JSON.stringify(dest)})</script>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export const config = {
  matcher: [
    "/about",
    "/about/",
    "/services",
    "/why-hong-kong",
    "/pricing",
    "/insights",
    "/book",
    "/book/",
    "/contact",
    "/contact/",
    "/privacy",
    "/terms",
    "/complaints",
    "/disclosures",
    "/admin",
    "/admin/",
    "/partnership",
    "/partnership/",
  ],
};
