"use client";

/*
 * =====================================================================
 * FILE: contact.tsx — The Contact page (route: "contact", URL: #/contact)
 * =====================================================================
 * WHAT THIS FILE IS
 *   The contact page. Combines a left info column (address, phone, WhatsApp,
 *   email, hours) with a right working contact form, plus a Google Maps embed.
 *
 * WHAT IT DOES
 *   Renders <ContactPage /> — a small PageHero, then a two-column section
 *   (info + form). The form saves the enquiry to Supabase, where the team
 *   reads it in the staff inbox (#/admin), with four status states:
 *   idle / sending / success / error. An optional email relay
 *   (NEXT_PUBLIC_FORMSPREE_ENDPOINT) is POSTed to as well, but only if it
 *   is actually configured — the database is the system of record. A hidden honeypot
 *   field traps spam bots. The service dropdown can be preselected via a
 *   `?service=...` query string in the URL (used by the pricing page deep-links).
 *   Below the form: a Google Maps iframe showing the office location.
 *
 * HOW IT FITS IN
 *   - Exported as `ContactPage`, rendered by RouterOutlet when route === "contact".
 *   - Reads `t.contact` for labels, `companyFacts` for phone/email/etc., and
 *     `pageContent[lang].pages.contact` for hero + map title.
 *   - The form's `service` field is preselected from the URL query string
 *     (see `preselectedService` initializer below).
 * =====================================================================
 */

import { useLang } from "@/lib/i18n/lang-context";
import { pageContent } from "@/lib/i18n/page-content";
import { submitEnquiry } from "@/lib/supabase";
import { PageHero } from "@/components/blocks/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Send,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Navigation,
} from "lucide-react";
import { companyFacts } from "@/lib/site-data";
import { RouterLink, hashQuery } from "@/lib/router";

/**
 * ContactPage — top-level page component for the /contact route.
 *
 * Inputs: none (reads everything from context + URL).
 * Returns: a React fragment with PageHero + info/form section + map section.
 *
 * State:
 *   - `status`: "idle" | "sending" | "success" | "error" — drives the submit
 *     button's label and disabled state, plus the error banner.
 *   - `preselectedService`: optional string parsed from the URL query string
 *     on first render (via the router's `hashQuery()` helper, which already
 *     decodes the values). Used as the `defaultValue` of the service <Select>.
 *
 * Hooks: useLang() → { t, lang }.
 */
export function ContactPage() {
  const { t, lang } = useLang();
  const p = pageContent[lang].pages.contact;
  // Form status: starts idle, transitions through sending → success/error.
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  // Lazy-initialize the preselected service from the URL hash query string.
  // e.g. URL #/contact?service=Company%20Incorporation → preselectedService
  //   = "Company Incorporation". The `typeof window === "undefined"` check
  //   `hashQuery()` handles the server-side-rendering guard and returns an
  //   empty params object when there's no query string.
  const [preselectedService] = useState<string | undefined>(() => {
    const svc = hashQuery().get("service");
    return svc ?? undefined;
  });

  /**
   * onSubmit — async form submit handler.
   *
   * Inputs: the form submit event.
   * Flow:
   *   1. Prevent the default browser form POST.
   *   2. Build a FormData object from the form fields.
   *   3. Honeypot check: if the hidden `_gotcha` field has any value, a bot
   *      filled it in — pretend success and abort (don't actually send).
   *   4. Set status to "sending", save the enquiry to Supabase.
   *   5. If an email relay endpoint is configured, POST the FormData there
   *      too. Skipped entirely when it is unset or still the placeholder.
   *   6. If either stored it: "success", reset the form, back to "idle"
   *      after 5 seconds. If neither did: "error", so the visitor knows to
   *      phone or email instead.
   */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot check — if filled, silently abort (likely a bot)
    const honeypot = formData.get("_gotcha");
    if (honeypot) {
      // pretend success so the bot moves on
      setStatus("success");
      form.reset();
      setTimeout(() => setStatus("idle"), 4000);
      return;
    }

    setStatus("sending");

    // ---- 1. Save the enquiry to the database ------------------------
    // This is the primary path. The database is the system of record: it
    // keeps the enquiry where the team can search it, filter it and mark
    // it replied in #/admin, and it has no monthly quota.
    //
    // Awaited before the optional email relay below, so that a slow relay
    // cannot leave the enquiry unsaved if the visitor closes the tab.
    const dbEnquiry = await submitEnquiry({
      fullName: [formData.get("first_name"), formData.get("last_name")]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(" "),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      service: String(formData.get("service") ?? "").trim() || undefined,
      message: String(formData.get("message") ?? "").trim(),
      source: "contact-page",
      lang,
    }).catch(() => ({ ok: false as const }));

    // ---- 2. Optionally relay it to a form service -------------------
    // Formspree (or any drop-in replacement) is entirely optional and OFF
    // unless NEXT_PUBLIC_FORMSPREE_ENDPOINT is set to a real endpoint. Its
    // free tier is only 50 submissions a month, so it is a nice-to-have
    // email relay, never the thing the enquiry depends on.
    //
    // The old placeholder default ("your-form-id") is treated as unset:
    // posting to it would 404 on every submit.
    const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;
    const relayConfigured = Boolean(endpoint && !endpoint.includes("your-form-id"));

    let relayed = false;
    if (relayConfigured) {
      try {
        const res = await fetch(endpoint as string, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });
        relayed = res.ok;
      } catch {
        // Relay unreachable — irrelevant if the database took the enquiry.
        relayed = false;
      }
    }

    // Success if the enquiry landed anywhere durable. Showing an error
    // when the database already holds the message would just make the
    // visitor send it twice.
    if (dbEnquiry.ok || relayed) {
      setStatus("success");
      form.reset();
      setTimeout(() => setStatus("idle"), 5000);
    } else {
      // Nothing stored it. The error state tells them to email or call
      // instead, and those details are on screen beside the form.
      setStatus("error");
    }
  }

  // Array of contact info items rendered in the left column. Each has a Lucide
  // icon, a label, a value, and an optional `href` (makes the value clickable).
  const infoItems = [
    { icon: MapPin, label: t.contact.info.addressLabel, value: t.contact.info.address },
    { icon: Phone, label: t.contact.info.phoneLabel, value: companyFacts.phone, href: `tel:${companyFacts.phone.replace(/\s/g, "")}` },
    {
      icon: MessageCircle,
      label: t.contact.info.whatsappLabel,
      value: companyFacts.whatsapp,
      href: companyFacts.whatsappUrl,
    },
    {
      icon: Mail,
      label: t.contact.info.emailLabel,
      value: companyFacts.email,
      href: `mailto:${companyFacts.email}`,
    },
    { icon: Clock, label: t.contact.info.hoursLabel, value: t.contact.info.hours },
  ];

  return (
    <>
      {/* PAGE HERO: small-height dark image banner with eyebrow, H1, and lead. */}
      <PageHero
        eyebrow={p.heroEyebrow}
        title={p.heroTitle}
        lead={p.heroLead}
        image="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80"
        height="sm"
      />

      {/* ===== INFO + FORM SECTION ===== */}
      {/* Two-column layout: left (2 of 5 cols) is contact info; right (3 of 5)
          is the contact form. The form is the primary conversion target so it
          gets more width. */}
      <section className="bg-white py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
            {/* Left: Info column — heading, intro paragraph, and a list of
                contact info rows (icon + label + value, some clickable). */}
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                {t.contact.info.addressLabel}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{p.mapBody}</p>

              <div className="mt-8 space-y-5">
                {infoItems.map((item, i) => {
                  const Icon = item.icon;
                  const content = item.href ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith("http") ? "_blank" : undefined}
                      rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="font-medium text-slate-900 transition hover:text-teal-700"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="font-medium text-slate-900">{item.value}</span>
                  );
                  return (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                          {item.label}
                        </div>
                        <div className="mt-0.5 text-sm">{content}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Form column — the contact form itself. */}
            <div className="lg:col-span-3">
              {/* Deflection banner: room hire is self-service, so point
                  those visitors at the booking funnel before they type out
                  a free-text enquiry the team would have to reply to. */}
              <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/60 p-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-600 ring-1 ring-teal-100">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-slate-900">
                      {t.booking.homeTitle}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      {t.booking.homeLead}
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="shrink-0 bg-gradient-to-r from-teal-500 to-teal-600 text-white"
                >
                  <RouterLink to="book">{t.booking.ctaShort}</RouterLink>
                </Button>
              </div>

              {/* The <form> element wires its submit event to `onSubmit`.
                  `noValidate={false}` lets the browser run its built-in
                  validation (required, type=email, etc.). */}
              <form
                onSubmit={onSubmit}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
                noValidate={false}
              >
                {/* First name + last name row (2 columns on sm+). */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first_name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {t.contact.form.firstName}
                    </label>
                    <Input id="first_name" name="first_name" required autoComplete="given-name" placeholder="John" />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {t.contact.form.lastName}
                    </label>
                    <Input id="last_name" name="last_name" required autoComplete="family-name" placeholder="Chan" />
                  </div>
                </div>

                {/* Email + phone row (2 columns on sm+). */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {t.contact.form.email}
                    </label>
                    <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {t.contact.form.phone}
                    </label>
                    <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+852 9123 4567" />
                  </div>
                </div>

                {/* Service dropdown — a shadcn/ui Select. `defaultValue` is set
                    from `preselectedService` so deep-links from the pricing page
                    can preselect a service option. */}
                <div className="mt-4">
                  <label htmlFor="service" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t.contact.form.service}
                  </label>
                  <Select name="service" defaultValue={preselectedService}>
                    <SelectTrigger id="service" className="w-full">
                      <SelectValue placeholder={t.contact.form.services[0]} />
                    </SelectTrigger>
                    <SelectContent>
                      {t.contact.form.services.map((s, i) => (
                        <SelectItem key={i} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-4">
                  <label htmlFor="message" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t.contact.form.message}
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    placeholder={t.contact.form.placeholder}
                  />
                </div>

                {/* Honeypot field — a hidden input named `_gotcha`.
                    Humans never see it (CSS `hidden` + `aria-hidden`), so they
                    never fill it in. Bots that auto-fill all form fields will
                    populate it, and `onSubmit` will detect that and silently
                    abort the submission (pretending success). */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="_gotcha">{t.contactExtra.honeypotLabel}</label>
                  <input
                    id="_gotcha"
                    name="_gotcha"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                  />
                </div>

                {/* Submit button — label and icon change based on `status`.
                    Disabled while sending or after success to prevent double-submits. */}
                <Button
                  type="submit"
                  disabled={status === "sending" || status === "success"}
                  className="btn-shimmer mt-6 w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
                >
                  {status === "sending" && (
                    <>
                      <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t.contact.form.sending}
                    </>
                  )}
                  {status === "success" && (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {t.contact.form.success}
                    </>
                  )}
                  {status === "error" && (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      {t.contact.form.submit}
                    </>
                  )}
                  {(status === "idle") && (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t.contact.form.submit}
                    </>
                  )}
                </Button>

                {/* Error banner — only shown when status is "error". Offers a
                    mailto fallback so the user can still reach us. */}
                {status === "error" && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {t.contactExtra.formError}{" "}
                      <a href={`mailto:${companyFacts.email}`} className="font-semibold underline">
                        {companyFacts.email}
                      </a>
                    </span>
                  </p>
                )}

                <p className="mt-4 text-center text-xs text-slate-400">
                  {t.contactExtra.privacyNotice}{" "}
                  <RouterLink to="privacy" className="underline hover:text-teal-600">
                    {t.contactExtra.privacyLink}
                  </RouterLink>
                  .
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MAP ===== */}
      {/* MAP SECTION: a card containing a header row (map title + "Open in
          Google Maps" button) and a 420px-tall Google Maps <iframe> embed.
          The iframe uses Google's free embed URL (no API key required). */}
      <section className="bg-slate-50 pb-20 lg:pb-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">{p.mapTitle}</h3>
                <p className="mt-1 text-sm text-slate-500">{t.contact.info.address}</p>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-teal-200 text-teal-700 hover:bg-teal-50"
              >
                <a
                  href="https://www.google.com/maps/search/?api=1&query=88+Lockhart+Road+Wan+Chai+Hong+Kong&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="mr-1.5 h-3.5 w-3.5" />
                  {t.contactExtra.mapsButton}
                </a>
              </Button>
            </div>
            <div className="relative h-[420px] bg-slate-100">
              <iframe
                title="Smarthub Connect office location"
                src="https://www.google.com/maps?q=88+Lockhart+Road,+Wan+Chai,+Hong+Kong&hl=en&gl=HK&output=embed"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
