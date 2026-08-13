"use client";

import { useState } from "react";
import { PageHero } from "@/components/blocks/page-hero";
import { SectionHeading } from "@/components/blocks/section-heading";
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
import { Globe, Building2, Users, CheckCircle2, ArrowRight, MapPin } from "lucide-react";
import { submitSfoEnquiry } from "@/lib/global-office";
import { isSupabaseConfigured } from "@/lib/supabase";

const PARTNER_MARKETS = [
  {
    id: "hong-kong",
    country: "Hong Kong",
    city: "Wan Chai",
    flag: "🇭🇰",
    image: "/conferenceRoom.jpeg",
    services: "Incorporation, TCSP, serviced offices, virtual office, meeting rooms",
    blurb: "Our home market — Grade-A floor on Lockhart Road with full corporate and workspace support.",
  },
  {
    id: "singapore",
    country: "Singapore",
    city: "CBD",
    flag: "🇸🇬",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
    services: "Company setup, family office hosting, boardrooms",
    blurb: "Partner desks in the financial district for visiting teams and regional HQs.",
  },
  {
    id: "china",
    country: "Mainland China",
    city: "Shanghai · Shenzhen",
    flag: "🇨🇳",
    image: "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=1200&q=80",
    services: "CEPA structuring, bilingual support, meeting space",
    blurb: "Referral partners for mainland setup, CEPA access and on-the-ground meeting space.",
  },
  {
    id: "cyprus",
    country: "Cyprus",
    city: "Limassol",
    flag: "🇨🇾",
    image: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80",
    services: "EU base, tax planning referrals, private offices",
    blurb: "Mediterranean EU partner for families who need a European footprint.",
  },
  {
    id: "uk",
    country: "United Kingdom",
    city: "London",
    flag: "🇬🇧",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
    services: "UK company, banking introductions, meeting rooms",
    blurb: "City introductions and partner rooms for UK-facing structures.",
  },
  {
    id: "uae",
    country: "United Arab Emirates",
    city: "Dubai",
    flag: "🇦🇪",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
    services: "Free-zone setup referrals, visitor offices",
    blurb: "Middle East partner network for free-zone and DIFC-style hosting.",
  },
] as const;

export function PartnershipPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    officeLocation: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [submittedRef, setSubmittedRef] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<string>("all");

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function enquireFor(country: string) {
    setForm((prev) => ({ ...prev, country, officeLocation: country }));
    document.getElementById("partnership-form")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!form.fullName || !form.email || !form.company) {
      alert("Please fill in name, email and company.");
      return;
    }
    if (!isSupabaseConfigured) {
      alert("Please email info@smarthubc.com — the enquiry service is not configured in this environment.");
      return;
    }
    setStatus("sending");
    try {
      const result = await submitSfoEnquiry({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        company: form.company,
        country: form.country,
        city: form.officeLocation,
        message: form.message,
      });
      if (result.ok) {
        setSubmittedRef(result.reference);
        setStatus("success");
        setForm({ fullName: "", email: "", phone: "", company: "", country: "", officeLocation: "", message: "" });
      } else {
        setStatus("error");
        alert(result.message || "Could not submit the enquiry.");
      }
    } catch (err) {
      setStatus("error");
      alert(err instanceof Error ? err.message : "Could not submit the enquiry.");
    }
  }

  const visible =
    selectedMarket === "all"
      ? PARTNER_MARKETS
      : PARTNER_MARKETS.filter((m) => m.id === selectedMarket);

  return (
    <>
      <PageHero
        eyebrow="International partnership"
        title="A global desk. Local partners."
        lead="Smarthub Connect refers clients across Asia, Europe and the Middle East. Browse our partner markets, then send an enquiry — we follow up and introduce the right local firm."
        image="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=2400&q=80"
        height="md"
      />

      <section className="bg-white py-16 border-b">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Globe className="h-6 w-6" />,
                title: "International by design",
                desc: "Hong Kong is the hub. Partner desks in Singapore, China, Cyprus, the UK and the UAE handle the rest.",
              },
              {
                icon: <Building2 className="h-6 w-6" />,
                title: "Referral, not a franchise",
                desc: "We introduce you to vetted local partners for setup, compliance and a place to sit. You stay with one relationship at Smarthub.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Enquire for follow-up",
                desc: "Tell us the country and what you need. Our team replies within one business day with next steps.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 p-6">
                <div className="mt-1 text-teal-600">{item.icon}</div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple world map / collaboration graphic */}
      <section className="bg-[#f6fafa] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Partner map"
            title="Where we collaborate"
            lead="Pins mark markets we can refer into. Select a country below to filter the service cards."
            align="center"
          />
          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white sm:p-10">
            <svg viewBox="0 0 800 360" className="mx-auto h-auto w-full max-w-4xl" role="img" aria-label="World map of partner markets">
              <rect width="800" height="360" fill="#0f172a" />
              <path
                d="M80 80h80v40H80zM200 70h120v50H200zM360 90h90v40H360zM500 80h70v35H500zM620 100h90v40H620zM140 180h70v40h-70zM280 170h100v55H280zM430 190h80v40H430zM560 175h110v50H560zM90 250h100v40H90zM250 260h90v35H250zM400 255h120v40H400zM580 250h90v40H580z"
                fill="#134e4a"
                opacity="0.55"
              />
              {[
                { x: 620, y: 155, label: "HK" },
                { x: 590, y: 175, label: "SG" },
                { x: 605, y: 130, label: "CN" },
                { x: 430, y: 145, label: "CY" },
                { x: 370, y: 110, label: "UK" },
                { x: 500, y: 170, label: "UAE" },
              ].map((pin) => (
                <g key={pin.label}>
                  <circle cx={pin.x} cy={pin.y} r="7" fill="#2dd4bf" />
                  <text x={pin.x + 12} y={pin.y + 4} fill="#ccfbf1" fontSize="12" fontFamily="sans-serif">
                    {pin.label}
                  </text>
                </g>
              ))}
            </svg>
            <p className="mt-4 text-center text-sm text-teal-100">
              Hong Kong · Singapore · Mainland China · Cyprus · United Kingdom · UAE
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Partner markets"
            title="Services by country"
            lead="Same layout as our room booking cards — pick a market and send an enquiry for follow-up."
            align="center"
          />
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedMarket("all")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                selectedMarket === "all" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              All markets
            </button>
            {PARTNER_MARKETS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMarket(m.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  selectedMarket === m.id ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {m.flag} {m.country}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((m) => (
              <article key={m.id} className="lift-card flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div
                  className="h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${m.image})` }}
                  role="img"
                  aria-label={m.country}
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
                    <MapPin className="h-3.5 w-3.5" />
                    {m.city}
                  </div>
                  <h3 className="mt-2 font-display text-xl font-bold text-slate-900">
                    {m.flag} {m.country}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{m.blurb}</p>
                  <p className="mt-3 text-xs font-medium text-slate-500">{m.services}</p>
                  <Button
                    type="button"
                    className="mt-5 bg-gradient-to-r from-teal-500 to-teal-600 text-white"
                    onClick={() => enquireFor(m.country)}
                  >
                    Enquire for follow-up
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-50" id="partnership-form">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeading
            eyebrow="Referral enquiry"
            title="Tell us where you need a partner"
            lead="We review every enquiry and introduce the right local desk. Hosts who want to join the network can use the same form."
            align="center"
          />

          {status === "success" ? (
            <div className="mt-10 rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h3 className="mt-4 font-display text-2xl font-bold text-emerald-900">Thank you</h3>
              <p className="mt-2 text-emerald-800">
                Received. Reference: <span className="font-mono font-semibold">{submittedRef}</span>
              </p>
              <Button type="button" variant="outline" className="mt-6" onClick={() => setStatus("idle")}>
                Send another enquiry
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit(e);
              }}
              className="mt-10 space-y-6 rounded-3xl border bg-white p-8 shadow-xl"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full name *</label>
                  <Input value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email *</label>
                  <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone</label>
                  <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Company *</label>
                  <Input value={form.company} onChange={(e) => handleChange("company", e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Market</label>
                  <Select value={form.country} onValueChange={(v) => handleChange("country", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTNER_MARKETS.map((m) => (
                        <SelectItem key={m.id} value={m.country}>
                          {m.country}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">City / preference</label>
                  <Input
                    value={form.officeLocation}
                    onChange={(e) => handleChange("officeLocation", e.target.value)}
                    placeholder="e.g. Singapore, Shanghai"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">What do you need?</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  rows={5}
                  placeholder="Company setup, a desk for a visiting team, a referral to a local partner…"
                />
              </div>
              <Button
                type="submit"
                disabled={status === "sending"}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-6 text-base"
              >
                {status === "sending" ? "Submitting…" : "Submit enquiry"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
