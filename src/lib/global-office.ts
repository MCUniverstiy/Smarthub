import { supabase } from "./supabase";

/** Public-safe fields returned by the global listing search RPC. */
export type GlobalListing = {
  id: string;
  slug: string;
  name: string;
  country: string;
  city: string;
  description_html: string;
  capacity: number;
  currency: string;
  rate: number;
  rate_unit: "hour" | "day";
  amenities: string[];
  image_url: string | null;
  booking_mode: "request" | "instant";
  timezone: string;
};

export type GlobalListingFilters = {
  country?: string;
  city?: string;
  minCapacity?: number;
  amenities?: string[];
};

/** Reads only public, published listings. Returns an empty list offline/unconfigured. */
export async function searchGlobalListings(filters: GlobalListingFilters = {}): Promise<GlobalListing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("search_global_listings", {
    p_country: filters.country || null,
    p_city: filters.city || null,
    p_min_capacity: filters.minCapacity || null,
    p_amenities: filters.amenities?.length ? filters.amenities : null,
    p_limit: 60,
  });
  if (error || !Array.isArray(data)) return [];
  return data as GlobalListing[];
}

export type SfoEnquiryInput = {
  fullName: string;
  email: string;
  phone?: string;
  company: string;
  country?: string;
  city?: string;
  message?: string;
};

/** Sends the partnership form to the dedicated SFO pipeline. */
export async function submitSfoEnquiry(input: SfoEnquiryInput): Promise<{ ok: true; reference: string } | { ok: false; message: string }> {
  if (!supabase) return { ok: false, message: "The enquiry service is not configured yet." };
  const { data, error } = await supabase.rpc("submit_sfo_enquiry", {
    p_full_name: input.fullName,
    p_email: input.email,
    p_phone: input.phone || null,
    p_company: input.company,
    p_country: input.country || null,
    p_city: input.city || null,
    p_message: input.message || "",
  });
  const row = Array.isArray(data) ? data[0] : data;
  return error || !row?.reference
    ? { ok: false, message: error?.message || "No enquiry reference was returned." }
    : { ok: true, reference: String(row.reference) };
}
