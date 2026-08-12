"use client";

import { SectionHeading } from "@/components/blocks/section-heading";

export const OFFICE_REGIONS = ["Hong Kong", "China", "Singapore", "Cyprus"] as const;
export type OfficeRegion = (typeof OFFICE_REGIONS)[number];

/** Location chips only. Room cards live on the booking page so every country matches Hong Kong. */
export function GlobalOfficeDirectory({
  region,
  onLocationChange,
}: {
  region: string;
  onLocationChange?: (location: string) => void;
}) {
  return (
    <section className="border-t border-[#ebf2f1] bg-[#f6fafa] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Office network"
          title="Choose a location"
          lead="Hong Kong is our own centre. China, Singapore and Cyprus are partner offices we host after approval."
          align="center"
        />
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {OFFICE_REGIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onLocationChange?.(item)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                region === item
                  ? "bg-[#148f8a] text-white"
                  : "bg-white text-[#4a5e5d] ring-1 ring-[#cdd9d8] hover:bg-[#e2f7f5]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
