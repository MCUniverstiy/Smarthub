"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n/lang-context";
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
import { 
  Globe, 
  Building2, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  CalendarDays 
} from "lucide-react";
import { RouterLink, hashQuery } from "@/lib/router";
import { companyFacts } from "@/lib/site-data";
import { submitEnquiry, isSupabaseConfigured } from "@/lib/supabase";

interface GlobalOffice {
  id: string;
  name: string;
  country: string;
  city: string;
  description: string;
  capacity: number;
  rate: number;
  unit: "hour" | "day";
  image?: string;
  features: string[];
}

// Sample global SFO offices (in real life loaded from admin / DB)
const SAMPLE_GLOBAL_OFFICES: GlobalOffice[] = [
  {
    id: "sg-sfo-1",
    name: "Singapore Central SFO",
    country: "Singapore",
    city: "Singapore",
    description: "Premium single-family office space in the heart of Singapore's financial district. Full compliance, private boardrooms and 24/7 access.",
    capacity: 12,
    rate: 680,
    unit: "hour",
    features: ["Private boardroom", "24/7 access", "Concierge", "Secure vaults", "Compliance support"],
  },
  {
    id: "cn-sh-1",
    name: "Shanghai Pudong Family Office",
    country: "China",
    city: "Shanghai",
    description: "High-end serviced family office in Lujiazui. Mandarin + English support, direct CEPA access and on-site legal counsel.",
    capacity: 8,
    rate: 520,
    unit: "hour",
    features: ["Mandarin & English", "CEPA structuring", "Legal counsel", "Private meeting rooms", "High-speed secure internet"],
  },
  {
    id: "cy-nic-1",
    name: "Limassol Cyprus SFO Hub",
    country: "Cyprus",
    city: "Limassol",
    description: "EU-based family office with favourable tax regime. Ideal for European and Asian families seeking a Mediterranean base.",
    capacity: 10,
    rate: 420,
    unit: "hour",
    features: ["EU passporting", "Tax optimisation", "Private beach access", "Family lounge", "Visa support"],
  },
];

export function PartnershipPage() {
  const { t, lang } = useLang();

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
  const [submittedRef, setSubmittedRef] = useState<string>("");

  // Offices (merged sample + any created via admin later – for demo we use sample)
  const [globalOffices, setGlobalOffices] = useState<GlobalOffice[]>(SAMPLE_GLOBAL_OFFICES);

  // Load offices created in Admin (localStorage)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("smarthub-global-offices");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setGlobalOffices([...parsed, ...SAMPLE_GLOBAL_OFFICES]);
        }
      }
    } catch {}
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.company) {
      alert("Please fill in name, email and company.");
      return;
    }

    setStatus("sending");

    const enquiryData = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      company: form.company,
      service: "partnership-sfo-global",
      message: `PARTNERSHIP ENQUIRY — Global SFO Office\n\nCountry of interest: ${form.country || "Not specified"}\nPreferred location: ${form.officeLocation || "Any"}\n\n${form.message}`,
      source: "partnership-page",
      lang,
    };

    const result = await submitEnquiry(enquiryData);

    if (result.ok) {
      setSubmittedRef(result.reference);
      setStatus("success");
      // reset form
      setForm({ fullName: "", email: "", phone: "", company: "", country: "", officeLocation: "", message: "" });
    } else {
      setStatus("error");
    }
  }

  const bookOffice = (office: GlobalOffice) => {
    // Navigate to booking with global office pre-selected via query
    if (typeof window !== "undefined") {
      window.location.hash = `#/book?global=${encodeURIComponent(office.id)}&location=${encodeURIComponent(office.country)}`;
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Global Single Family Offices"
        title="Partner with us worldwide."
        lead="List your offices in Singapore, China, Cyprus and beyond. Let companies from around the world book premium SFO space through SmartHub."
        image="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80"
        height="md"
      />

      {/* VALUE PROPOSITION */}
      <section className="bg-white py-16 border-b">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Globe className="h-6 w-6" />,
                title: "Global Reach",
                desc: "Attract families and corporates from Singapore, China, Cyprus, Europe and the Middle East.",
              },
              {
                icon: <Building2 className="h-6 w-6" />,
                title: "Shared Office Network",
                desc: "List your premium spaces and let clients seamlessly book offices across multiple jurisdictions.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Admin Control",
                desc: "Create, edit and publish new SFO offices from our admin dashboard. Full control over descriptions and pricing.",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 rounded-2xl border border-slate-200 p-6">
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

      {/* CURRENT GLOBAL OFFICES / LISTINGS */}
      <section className="py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Live Global SFO Network"
            title="Book premium offices around the world"
            lead="These partner locations are already live. More offices are added daily by our partners and through the admin dashboard."
            align="center"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {globalOffices.map((office) => (
              <div key={office.id} className="group flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm hover:shadow-xl transition">
                <div className="relative h-48 bg-gradient-to-br from-teal-900/90 to-slate-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <MapPin className="mx-auto h-8 w-8 mb-2 text-teal-300" />
                    <div className="font-display text-xl font-bold">{office.city}</div>
                    <div className="text-sm opacity-80">{office.country}</div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 text-teal-800 px-3 py-1 rounded-full text-xs font-bold">
                    {office.unit === "hour" ? `HK$${office.rate}/hr` : `HK$${office.rate}/day`}
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col">
                  <h3 className="font-display text-xl font-bold text-slate-900">{office.name}</h3>
                  <p className="mt-2 text-sm text-slate-600 line-clamp-3 flex-1">{office.description}</p>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {office.features.slice(0, 3).map((f, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-medium">
                        {f}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Up to <span className="font-semibold text-slate-800">{office.capacity}</span> people
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => bookOffice(office)}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Book this office <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Want your city listed? Submit the form below and our team will review within 48 hours.
          </p>
        </div>
      </section>

      {/* PARTNERSHIP ENQUIRY FORM */}
      <section className="py-20 bg-white" id="partnership-form">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeading
            eyebrow="Become a Global Partner"
            title="List your office or set up a new SFO hub"
            lead="Companies from around the world are looking for trusted single-family office partners. Tell us about your location and we’ll help you get listed and bookable."
            align="center"
          />

          {status === "success" ? (
            <div className="mt-10 rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h3 className="mt-4 font-display text-2xl font-bold text-emerald-900">Thank you!</h3>
              <p className="mt-2 text-emerald-800">
                Your enquiry was received. Reference: <span className="font-mono font-semibold">{submittedRef}</span>
              </p>
              <p className="mt-1 text-sm text-emerald-700">Our team will review within 1-2 business days and contact you to finalise listing.</p>
              <Button asChild variant="outline" className="mt-6" onClick={() => setStatus("idle")}>
                Submit another enquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-6 rounded-3xl border bg-white p-8 shadow-xl">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name *</label>
                  <Input value={form.fullName} onChange={(e) => handleChange("fullName", e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email *</label>
                  <Input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone / WhatsApp</label>
                  <Input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Company / Family Office *</label>
                  <Input value={form.company} onChange={(e) => handleChange("company", e.target.value)} required />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Your Country / Region</label>
                  <Select value={form.country} onValueChange={(v) => handleChange("country", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                      <SelectItem value="China">China (Mainland)</SelectItem>
                      <SelectItem value="Cyprus">Cyprus</SelectItem>
                      <SelectItem value="Hong Kong">Hong Kong (existing)</SelectItem>
                      <SelectItem value="Other">Other (please specify in message)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Preferred Office City</label>
                  <Input value={form.officeLocation} onChange={(e) => handleChange("officeLocation", e.target.value)} placeholder="e.g. Singapore, Shanghai, Limassol" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tell us about your space or partnership interest</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  rows={5}
                  placeholder="Describe your office, capacity, unique benefits, or how you'd like to partner (e.g. 'We have 3 premium SFO suites in Singapore CBD, want to be bookable for international families...')"
                  className="min-h-[120px]"
                />
              </div>

              <Button 
                type="submit" 
                disabled={status === "sending"}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-6 text-base"
              >
                {status === "sending" ? "Submitting..." : "Submit Partnership Enquiry"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-center text-xs text-slate-500">
                Enquiries are reviewed by our team. Once approved, we publish your office and enable instant bookings via our global booking system.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* HOW IT WORKS FOR PARTNERS */}
      <section className="bg-white py-16 border-t">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHeading 
            eyebrow="How it works" 
            title="From enquiry to live booking in days" 
            align="center" 
          />

          <div className="mt-10 grid md:grid-cols-4 gap-6">
            {[
              "1. Submit enquiry above",
              "2. Our team reviews & improves description",
              "3. We list your office on the global booking platform",
              "4. Companies worldwide can instantly book your space"
            ].map((step, i) => (
              <div key={i} className="rounded-2xl border p-5 text-sm font-medium text-slate-700">
                {step}
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">Already a partner? Log in to the <RouterLink to="admin" className="font-semibold text-teal-600 underline">Admin Dashboard</RouterLink> to manage your offices.</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <div className="bg-gradient-to-r from-teal-950 to-slate-950 py-12 text-center text-white">
        <div className="mx-auto max-w-xl px-6">
          <h3 className="font-display text-2xl font-bold">Ready to expand your SFO footprint?</h3>
          <p className="mt-2 text-teal-200">List your offices today and start receiving international bookings.</p>
          <Button 
            size="lg" 
            className="mt-5 bg-white text-teal-900 hover:bg-white/90"
            onClick={() => document.getElementById("partnership-form")?.scrollIntoView({ behavior: "smooth" })}
          >
            Submit your listing now
          </Button>
        </div>
      </div>
    </>
  );
}
