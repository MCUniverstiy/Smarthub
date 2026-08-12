"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/blocks/section-heading";
import { searchGlobalListings } from "@/lib/global-office";

type Office = { id: string; name: string; country: string; city: string; description: string; capacity: number; features: string[] };

const DEMO_OFFICES: Office[] = [
  { id: "hk-wc-1", name: "Wan Chai SmartHub Business Centre", country: "Hong Kong", city: "Wan Chai", description: "Professional meeting and private office space with reception support and flexible booking for visiting teams.", capacity: 10, features: ["Meeting rooms", "Reception", "High-speed internet"] },
  { id: "sg-sfo-1", name: "Singapore Central SFO", country: "Singapore", city: "Singapore", description: "Private workspace in Singapore's financial district with boardrooms and secure access.", capacity: 12, features: ["Private boardroom", "24/7 access", "Concierge"] },
  { id: "cn-sh-1", name: "Shanghai Pudong Family Office", country: "China", city: "Shanghai", description: "High-end serviced family office in Lujiazui with Mandarin and English support.", capacity: 8, features: ["Bilingual support", "Legal counsel", "Secure internet"] },
];

/** Directory belongs on Book a Room: Hong Kong rooms plus global partner offices. */
export function GlobalOfficeDirectory() {
  const [offices, setOffices] = useState<Office[]>(DEMO_OFFICES);
  const [region, setRegion] = useState("All locations");
  useEffect(() => { void searchGlobalListings().then((rows) => rows.length && setOffices(rows.map((r) => ({ id: r.id, name: r.name, country: r.country, city: r.city, description: r.description_html.replace(/<[^>]*>/g, "") || "Premium office space.", capacity: r.capacity, features: r.amenities || [] })))); }, []);
  const regions = ["All locations", ...Array.from(new Set(offices.map((office) => office.country)))];
  const visible = region === "All locations" ? offices : offices.filter((office) => office.country === region);
  return <section className="border-t border-[#ebf2f1] bg-[#f6fafa] py-20 lg:py-24"><div className="mx-auto max-w-7xl px-6"><SectionHeading eyebrow="Global office network" title="Find an office by location" lead="Browse SmartHub locations and trusted partner offices. Choose a location, then send a booking request to the local team." align="center" /><div className="mt-8 flex flex-wrap justify-center gap-2">{regions.map((item) => <button key={item} type="button" onClick={() => setRegion(item)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${region === item ? "bg-[#148f8a] text-white" : "bg-white text-[#4a5e5d] ring-1 ring-[#cdd9d8] hover:bg-[#e2f7f5]"}`}>{item}</button>)}</div><div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visible.map((office) => <article key={office.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#ebf2f1] bg-white shadow-sm"><div className="relative flex h-40 items-center justify-center bg-[#148f8a]"><div className="text-center text-white"><MapPin className="mx-auto mb-2 h-7 w-7 text-[#7ae2dc]"/><div className="font-display text-xl">{office.city}</div><div className="text-sm text-white/75">{office.country}</div></div><span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#148f8a]">Request to book</span></div><div className="flex flex-1 flex-col p-6"><h3 className="font-display text-xl text-[#1a2d2c]">{office.name}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-[#5a706e]">{office.description}</p><div className="mt-4 flex flex-wrap gap-1">{office.features.slice(0, 3).map((feature) => <span key={feature} className="rounded bg-[#e2f7f5] px-2 py-0.5 text-[10px] font-medium text-[#148f8a]">{feature}</span>)}</div><div className="mt-5 flex items-center justify-between"><span className="text-xs text-[#5a706e]">Up to {office.capacity} people</span><Button size="sm" className="bg-[#148f8a] text-white hover:bg-[#1ab5ad]" onClick={() => { window.location.hash = `#/book?global=${encodeURIComponent(office.id)}&location=${encodeURIComponent(office.country)}`; document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" }); }}>Request <ArrowRight className="ml-1 h-3.5 w-3.5"/></Button></div></div></article>)}</div></div></section>;
}
