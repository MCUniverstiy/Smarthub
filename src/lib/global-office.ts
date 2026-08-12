import { supabase, submitEnquiry } from "./supabase";

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
  rate?: number;
  rate_unit?: "hour" | "day";
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

/**
 * Sends a company application to host offices with SmartHub.
 * Prefers `submit_sfo_enquiry`. If that SQL is missing, stores the
 * same lead in `enquiries` with source=partnership-page.
 */
export async function submitSfoEnquiry(input: SfoEnquiryInput): Promise<{ ok: true; reference: string } | { ok: false; message: string }> {
  if (!supabase) return { ok: false, message: "The enquiry service is not configured yet." };

  const composed = [
    input.message?.trim() || "(No additional message)",
    input.country ? `Country: ${input.country}` : "",
    input.city ? `Preferred office city: ${input.city}` : "",
  ].filter(Boolean).join("\n");

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
  if (!error && row?.reference) {
    return { ok: true, reference: String(row.reference) };
  }

  const fallback = await submitEnquiry({
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    company: input.company,
    service: "office-hosting-partnership",
    message: composed,
    source: "partnership-page",
  });
  if (fallback.ok) return { ok: true, reference: fallback.reference };

  return {
    ok: false,
    message: error?.message || fallback.message || "Could not submit the application.",
  };
}

export type SfoPipelineStatus =
  | "new"
  | "qualified"
  | "description-review"
  | "approved"
  | "converted"
  | "closed"
  | "spam";

export type PartnershipApplication = {
  id?: string;
  reference: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string;
  country: string | null;
  city: string | null;
  raw_message: string;
  pipeline_status: SfoPipelineStatus;
  created_at: string;
  source?: string;
};

export async function fetchPartnershipApplications(): Promise<PartnershipApplication[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("sfo_enquiries")
    .select("id,reference,full_name,email,phone,company,country,city,raw_message,pipeline_status,created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (!error && Array.isArray(data)) {
    return data as PartnershipApplication[];
  }

  const { data: fallback } = await supabase
    .from("enquiries_inbox")
    .select("*")
    .eq("source", "partnership-page")
    .limit(300);
  return (fallback ?? []).map((row: {
    reference: string;
    full_name: string;
    email: string;
    phone: string | null;
    company: string | null;
    message: string;
    status: string;
    created_at: string;
    source: string;
  }) => ({
    reference: row.reference,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    company: row.company || "",
    country: null,
    city: null,
    raw_message: row.message,
    pipeline_status: mapEnquiryToPipeline(row.status),
    created_at: row.created_at,
    source: row.source,
  }));
}

function mapEnquiryToPipeline(status: string): SfoPipelineStatus {
  if (status === "spam") return "spam";
  if (status === "closed") return "closed";
  if (status === "replied" || status === "in-progress") return "qualified";
  return "new";
}

export async function deletePartnershipApplication(
  reference: string
): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };

  const rpc = await supabase.rpc("delete_sfo_enquiry", { p_reference: reference });
  if (!rpc.error) return { ok: true };

  const direct = await supabase.from("sfo_enquiries").delete().eq("reference", reference).select("reference");
  if (!direct.error && (direct.data?.length ?? 0) > 0) return { ok: true };

  const viaEnquiry = await supabase.rpc("delete_enquiry", { p_reference: reference, p_reason: "staff partnership cleanup" });
  if (!viaEnquiry.error) return { ok: true };

  return {
    ok: false,
    message:
      rpc.error?.message ||
      direct.error?.message ||
      viaEnquiry.error?.message ||
      "Could not delete this application. Run the latest global-office SQL so staff can delete.",
  };
}

export async function updatePartnershipStatus(
  reference: string,
  status: SfoPipelineStatus
): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  const { error } = await supabase
    .from("sfo_enquiries")
    .update({ pipeline_status: status })
    .eq("reference", reference);
  if (!error) return { ok: true };

  const enquiryStatus =
    status === "spam" ? "spam" :
    status === "closed" || status === "converted" ? "closed" :
    status === "approved" || status === "qualified" || status === "description-review" ? "in-progress" :
    "new";
  const { error: e2 } = await supabase
    .from("enquiries")
    .update({ status: enquiryStatus })
    .eq("reference", reference);
  return e2 ? { ok: false, message: e2.message } : { ok: true };
}

/** Staff-only listing editor helpers. RLS in global-office-platform.sql is the access control. */
export type ManagedGlobalListing = GlobalListing & { status: "draft" | "review" | "published" | "hidden" | "archived"; visibility: boolean };
export type ListingDraft = Pick<ManagedGlobalListing, "name" | "country" | "city" | "description_html" | "capacity" | "rate" | "rate_unit" | "amenities"> & { id?: string; status?: ManagedGlobalListing["status"]; visibility?: boolean; image_url?: string | null };

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `office-${Date.now()}`;

export async function getManagedGlobalListings(): Promise<ManagedGlobalListing[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("global_listings").select("*").order("updated_at", { ascending: false });
  return error || !Array.isArray(data) ? [] : data as ManagedGlobalListing[];
}

export async function saveGlobalListing(draft: ListingDraft): Promise<{ ok: boolean; id?: string; message?: string }> {
  if (!supabase) return { ok: false, message: "Supabase is not configured." };
  const row: any = {
    name: draft.name, country: draft.country, city: draft.city, description_html: draft.description_html,
    capacity: draft.capacity, amenities: draft.amenities,
    status: draft.status ?? "draft", visibility: draft.visibility ?? false,
    slug: draft.id ? undefined : `${slugify(draft.country)}-${slugify(draft.city)}-${slugify(draft.name)}-${Date.now().toString().slice(-5)}`,
    // `rate` is NOT NULL with no default in global_listings, so an insert that
    // omits it fails outright. Default to 0 ("price on request") rather than
    // letting the whole save disappear with a constraint error.
    rate: draft.rate ?? 0,
    rate_unit: draft.rate_unit ?? "hour",
  };
  if (draft.image_url !== undefined) row.image_url = draft.image_url;
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
