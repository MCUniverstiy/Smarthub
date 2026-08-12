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

/** Staff-only listing editor helpers. RLS in global-office-platform.sql is the access control. */
export type ManagedGlobalListing = GlobalListing & { status: "draft" | "review" | "published" | "hidden" | "archived"; visibility: boolean };
export type ListingDraft = Pick<ManagedGlobalListing, "name" | "country" | "city" | "description_html" | "capacity" | "rate" | "rate_unit" | "amenities"> & { id?: string; status?: ManagedGlobalListing["status"]; visibility?: boolean };

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `office-${Date.now()}`;

export async function getManagedGlobalListings(): Promise<ManagedGlobalListing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("global_listings").select("*").order("updated_at", { ascending: false });
  return error || !Array.isArray(data) ? [] : data as ManagedGlobalListing[];
}

export async function saveGlobalListing(draft: ListingDraft): Promise<{ ok: boolean; id?: string; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  const row = {
    name: draft.name, country: draft.country, city: draft.city, description_html: draft.description_html,
    capacity: draft.capacity, rate: draft.rate, rate_unit: draft.rate_unit, amenities: draft.amenities,
    status: draft.status ?? "draft", visibility: draft.visibility ?? false,
    slug: draft.id ? undefined : `${slugify(draft.country)}-${slugify(draft.city)}-${slugify(draft.name)}-${Date.now().toString().slice(-5)}`,
  };
  const query = draft.id
    ? supabase.from("global_listings").update(row).eq("id", draft.id).select("id").single()
    : supabase.from("global_listings").insert(row).select("id").single();
  const { data, error } = await query;
  return error ? { ok: false, message: error.message } : { ok: true, id: data.id };
}

export async function removeGlobalListing(id: string): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  const { error } = await supabase.from("global_listings").delete().eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}


/** Staff-only publication control. Published + visible is the only state exposed publicly. */
export async function setGlobalListingPublication(id: string, published: boolean): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  const { error } = await supabase
    .from("global_listings")
    .update({ status: published ? "published" : "hidden", visibility: published, published_at: published ? new Date().toISOString() : null })
    .eq("id", id);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function submitGlobalBookingRequest(input: { listingId: string; fullName: string; email: string; phone?: string; company?: string; startsAt: string; endsAt: string; attendees: number; message?: string }): Promise<{ ok: true; reference: string } | { ok: false; message: string }> {
  if (!supabase) return { ok: false, message: "The global booking service is not configured yet." };
  const { data, error } = await supabase.rpc("submit_global_booking_request", {
    p_listing_id: input.listingId, p_full_name: input.fullName, p_email: input.email,
    p_phone: input.phone || null, p_company: input.company || null, p_starts_at: input.startsAt,
    p_ends_at: input.endsAt, p_attendees: input.attendees, p_message: input.message || "",
  });
  const row = Array.isArray(data) ? data[0] : data;
  return error || !row?.reference ? { ok: false, message: error?.message || "No booking reference returned." } : { ok: true, reference: String(row.reference) };
}
