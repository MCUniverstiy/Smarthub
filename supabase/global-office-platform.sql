-- =====================================================================
-- SMARTHUB GLOBAL OFFICE + SFO PLATFORM
-- Run after schema.sql and enquiries.sql in the Supabase SQL Editor.
-- Safe to re-run. This is the production replacement for the temporary
-- browser-local global office catalogue.
-- =====================================================================

-- 1. Organisations and members ------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (length(btrim(legal_name)) between 2 and 160),
  organization_type text not null check (organization_type in ('smarthub','sfo','office-provider','corporate-client')),
  country_code text,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null check (member_role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

-- 2. Listing catalogue ---------------------------------------------------------
create table if not exists public.global_listings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  source_enquiry_id uuid unique,
  slug text unique not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft','review','published','hidden','archived')),
  visibility boolean not null default false,
  booking_mode text not null default 'request' check (booking_mode in ('request','instant')),
  name text not null check (length(btrim(name)) between 2 and 160),
  country text not null,
  city text not null,
  address text,
  timezone text not null default 'Asia/Hong_Kong',
  description_html text not null default '',
  capacity integer not null check (capacity > 0),
  currency char(3) not null default 'HKD',
  rate numeric(12,2) not null check (rate >= 0),
  rate_unit text not null default 'hour' check (rate_unit in ('hour','day')),
  amenities text[] not null default '{}',
  image_url text,
  is_exclusive boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists global_listings_public_search_idx on public.global_listings (status, visibility, country, city, capacity);
create index if not exists global_listings_org_idx on public.global_listings (organization_id);

-- 3. Availability and request-to-book workflow --------------------------------
create table if not exists public.global_listing_availability (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.global_listings(id) on delete cascade,
  weekday smallint check (weekday between 0 and 6),
  starts_at time,
  ends_at time,
  available_from date,
  available_until date,
  is_blackout boolean not null default false,
  check (starts_at is null or ends_at is null or starts_at < ends_at)
);

create table if not exists public.global_booking_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default 'GO-' || to_char(now() at time zone 'Asia/Hong_Kong', 'YYMM') || '-' || upper(substr(translate(gen_random_uuid()::text, '-01lo', ''), 1, 6)),
  listing_id uuid not null references public.global_listings(id) on delete restrict,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text,
  company text,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  attendees integer not null default 1 check (attendees > 0),
  message text,
  quoted_total numeric(12,2),
  currency char(3),
  status text not null default 'requested' check (status in ('requested','held','confirmed','declined','cancelled','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists global_booking_requests_listing_status_idx on public.global_booking_requests(listing_id, status, starts_at);

-- 4. Dedicated SFO partnership pipeline ---------------------------------------
create table if not exists public.sfo_enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default 'SFO-' || to_char(now() at time zone 'Asia/Hong_Kong', 'YYMM') || '-' || upper(substr(translate(gen_random_uuid()::text, '-01lo', ''), 1, 6)),
  full_name text not null,
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text,
  company text not null,
  country text,
  city text,
  raw_message text not null default '',
  description_html text not null default '',
  pipeline_status text not null default 'new' check (pipeline_status in ('new','qualified','description-review','approved','converted','closed','spam')),
  assigned_to uuid references auth.users(id) on delete set null,
  converted_listing_id uuid unique references public.global_listings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sfo_enquiries_pipeline_idx on public.sfo_enquiries(pipeline_status, created_at desc);

-- Complete the circular link after both tables exist.
alter table public.global_listings drop constraint if exists global_listings_source_enquiry_id_fkey;
alter table public.global_listings add constraint global_listings_source_enquiry_id_fkey
  foreign key (source_enquiry_id) references public.sfo_enquiries(id) on delete set null;

-- 5. Audit log -----------------------------------------------------------------
create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- 6. Timestamps + staff/partner helper -----------------------------------------
create or replace function public.global_platform_prepare()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists global_listing_prepare_trg on public.global_listings;
create trigger global_listing_prepare_trg before update on public.global_listings for each row execute function public.global_platform_prepare();
drop trigger if exists global_booking_prepare_trg on public.global_booking_requests;
create trigger global_booking_prepare_trg before update on public.global_booking_requests for each row execute function public.global_platform_prepare();
drop trigger if exists sfo_enquiry_prepare_trg on public.sfo_enquiries;
create trigger sfo_enquiry_prepare_trg before update on public.sfo_enquiries for each row execute function public.global_platform_prepare();

create or replace function public.can_manage_organization(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (
    select 1 from public.organization_members m
    where m.organization_id = p_organization_id and m.user_id = auth.uid() and m.member_role in ('owner','admin')
  );
$$;

-- 7. Public RPCs: only return safe data ----------------------------------------
create or replace function public.search_global_listings(
  p_country text default null, p_city text default null, p_min_capacity integer default null,
  p_amenities text[] default null, p_limit integer default 30
)
returns setof public.global_listings language sql stable security definer set search_path = public as $$
  select l.* from public.global_listings l
  where l.status = 'published' and l.visibility = true
    and (p_country is null or l.country ilike p_country)
    and (p_city is null or l.city ilike '%' || p_city || '%')
    and (p_min_capacity is null or l.capacity >= p_min_capacity)
    and (p_amenities is null or l.amenities @> p_amenities)
  order by l.published_at desc nulls last, l.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

create or replace function public.submit_sfo_enquiry(
  p_full_name text, p_email text, p_phone text default null, p_company text default '',
  p_country text default null, p_city text default null, p_message text default ''
)
returns table(reference text) language plpgsql security definer set search_path = public as $$
declare row public.sfo_enquiries%rowtype;
begin
  insert into public.sfo_enquiries(full_name,email,phone,company,country,city,raw_message)
  values (p_full_name,p_email,nullif(btrim(p_phone),''),p_company,nullif(btrim(p_country),''),nullif(btrim(p_city),''),p_message)
  returning * into row;
  return query select row.reference;
end $$;

create or replace function public.submit_global_booking_request(
  p_listing_id uuid, p_full_name text, p_email text, p_phone text default null,
  p_company text default null, p_starts_at timestamptz default now(), p_ends_at timestamptz default now() + interval '1 hour',
  p_attendees integer default 1, p_message text default ''
)
returns table(reference text) language plpgsql security definer set search_path = public as $$
declare row public.global_booking_requests%rowtype; listing public.global_listings%rowtype;
begin
  select * into listing from public.global_listings where id = p_listing_id and status = 'published' and visibility = true;
  if not found then raise exception 'Listing is not available'; end if;
  if p_attendees > listing.capacity then raise exception 'Requested attendance exceeds room capacity'; end if;
  insert into public.global_booking_requests(listing_id,full_name,email,phone,company,starts_at,ends_at,attendees,message,currency)
  values (p_listing_id,p_full_name,p_email,nullif(btrim(p_phone),''),nullif(btrim(p_company),''),p_starts_at,p_ends_at,p_attendees,nullif(btrim(p_message),''),listing.currency)
  returning * into row;
  return query select row.reference;
end $$;

-- Conversion is staff-only and deliberately creates a draft: no lead becomes public without review.
create or replace function public.convert_sfo_enquiry_to_listing(p_enquiry_id uuid, p_slug text)
returns uuid language plpgsql security definer set search_path = public as $$
declare e public.sfo_enquiries%rowtype; new_id uuid;
begin
  if not public.is_staff() then raise exception 'Staff access required'; end if;
  select * into e from public.sfo_enquiries where id = p_enquiry_id for update;
  if not found then raise exception 'SFO enquiry not found'; end if;
  if e.converted_listing_id is not null then return e.converted_listing_id; end if;
  insert into public.global_listings(source_enquiry_id,slug,status,visibility,name,country,city,description_html,capacity,rate)
  values (e.id,p_slug,'draft',false,coalesce(e.company,'New SFO listing'),coalesce(e.country,'Hong Kong'),coalesce(e.city,'Hong Kong'),e.description_html,1,0)
  returning id into new_id;
  update public.sfo_enquiries set converted_listing_id = new_id, pipeline_status = 'converted' where id = e.id;
  insert into public.audit_events(actor_id,entity_type,entity_id,action,after_data) values(auth.uid(),'global_listing',new_id,'converted_from_sfo_enquiry',jsonb_build_object('enquiry_id',e.id));
  return new_id;
end $$;

-- 8. RLS -----------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.global_listings enable row level security;
alter table public.global_listing_availability enable row level security;
alter table public.global_booking_requests enable row level security;
alter table public.sfo_enquiries enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists global_listings_public_read on public.global_listings;
create policy global_listings_public_read on public.global_listings for select using (status = 'published' and visibility = true);
drop policy if exists global_listings_staff_all on public.global_listings;
create policy global_listings_staff_all on public.global_listings for all to authenticated using (public.is_staff() or public.can_manage_organization(organization_id)) with check (public.is_staff() or public.can_manage_organization(organization_id));
drop policy if exists global_bookings_staff_read on public.global_booking_requests;
create policy global_bookings_staff_read on public.global_booking_requests for select to authenticated using (public.is_staff() or public.can_manage_organization((select organization_id from public.global_listings where id = listing_id)));
drop policy if exists global_bookings_staff_write on public.global_booking_requests;
create policy global_bookings_staff_write on public.global_booking_requests for update to authenticated using (public.is_staff()) with check (public.is_staff());
grant select, update on public.global_booking_requests to authenticated;
drop policy if exists sfo_enquiries_staff_all on public.sfo_enquiries;
create policy sfo_enquiries_staff_all on public.sfo_enquiries for all to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists audit_events_staff_read on public.audit_events;
create policy audit_events_staff_read on public.audit_events for select to authenticated using (public.is_staff());

revoke all on function public.search_global_listings(text,text,integer,text[],integer) from public;
grant execute on function public.search_global_listings(text,text,integer,text[],integer) to anon, authenticated;
revoke all on function public.submit_sfo_enquiry(text,text,text,text,text,text,text) from public;
grant execute on function public.submit_sfo_enquiry(text,text,text,text,text,text,text) to anon, authenticated;
revoke all on function public.submit_global_booking_request(uuid,text,text,text,text,timestamptz,timestamptz,integer,text) from public;
grant execute on function public.submit_global_booking_request(uuid,text,text,text,text,timestamptz,timestamptz,integer,text) to anon, authenticated;
grant execute on function public.convert_sfo_enquiry_to_listing(uuid,text) to authenticated;

-- Staff may delete partnership applications (plain DELETE is not granted).
create or replace function public.delete_sfo_enquiry(p_reference text)
returns table(deleted boolean, reference text)
language plpgsql volatile security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'Only staff can delete partnership applications' using errcode = 'insufficient_privilege';
  end if;
  delete from public.sfo_enquiries e where e.reference = p_reference;
  if found then
    return query select true, p_reference;
  else
    return query select false, p_reference;
  end if;
end $$;

revoke all on function public.delete_sfo_enquiry(text) from public;
grant execute on function public.delete_sfo_enquiry(text) to authenticated;
grant delete on public.sfo_enquiries to authenticated;
