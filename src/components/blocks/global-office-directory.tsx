"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/blocks/section-heading";
import { searchGlobalListings } from "@/lib/global-office";

type Office = { id: string; name: string; country: string; city: string; description: string; capacity: number; features: string[] };

const DEMO_OFFICES: Office[] = [];
const REGIONS = ["Hong Kong", "China", "Singapore", "Cyprus"];

/** Directory belongs on Book a Room: Hong Kong rooms plus global partner offices. */
export function GlobalOfficeDirectory({ onLocationChange }: { onLocationChange?: (location: string) => void }) {
  const [offices, setOffices] = useState<Office[]>(DEMO_OFFICES);
  const [region, setRegion] = useState("Hong Kong");
  useEffect(() => { void searchGlobalListings().then((rows) => rows.length && setOffices(rows.map((r) => ({ id: r.id, name: r.name, country: r.country, city: r.city, description: r.description_html.replace(/<[^>]*>/g, "") || "Premium office space.", capacity: r.capacity, features: r.amenities || [] })))); }, []);
  const regions = REGIONS;
  const visible = offices.filter((office) => office.country === region);
  return <section className="border-t border-[#ebf2f1] bg-[#f6fafa] py-20 lg:py-24"><div className="mx-auto max-w-7xl px-6"><SectionHeading eyebrow="Global office network" title="Choose a location" lead="Select Hong Kong, China, Singapore or Cyprus to see available office space." align="center" /><div className="mt-8 flex flex-wrap justify-center gap-2">{regions.map((item) => <button key={item} type="button" onClick={() => { setRegion(item); onLocationChange?.(item); }} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${region === item ? "bg-[#148f8a] text-white" : "bg-white text-[#4a5e5d] ring-1 ring-[#cdd9d8] hover:bg-[#e2f7f5]"}`}>{item}</button>)}</div><div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{visible.map((office) => <article key={office.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#ebf2f1] bg-white shadow-sm"><div className="relative flex h-40 items-center justify-center bg-[#148f8a]"><div className="text-center text-white"><MapPin className="mx-auto mb-2 h-7 w-7 text-[#7ae2dc]"/><div className="font-display text-xl">{office.city}</div><div className="text-sm text-white/75">{office.country}</div></div><span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#148f8a]">Request to book</span></div><div className="flex flex-1 flex-col p-6"><h3 className="font-display text-xl text-[#1a2d2c]">{office.name}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-[#5a706e]">{office.description}</p><div className="mt-4 flex flex-wrap gap-1">{office.features.slice(0, 3).map((feature) => <span key={feature} className="rounded bg-[#e2f7f5] px-2 py-0.5 text-[10px] font-medium text-[#148f8a]">{feature}</span>)}</div><div className="mt-5 flex items-center justify-between"><span className="text-xs text-[#5a706e]">Up to {office.capacity} people</span><Button size="sm" className="bg-[#148f8a] text-white hover:bg-[#1ab5ad]" onClick={() => { window.location.hash = `#/book?global=${encodeURIComponent(office.id)}&location=${encodeURIComponent(office.country)}`; document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" }); }}>Request <ArrowRight className="ml-1 h-3.5 w-3.5"/></Button></div></div></article>)}</div>{visible.length === 0 && region !== "Hong Kong" && <p className="mt-8 text-center text-sm text-[#5a706e]">Partner offices in {region} will appear here when available.</p>}</div></section>;
}
