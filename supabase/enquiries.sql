-- =====================================================================
-- SMARTHUB — CONTACT ENQUIRIES (Supabase / PostgreSQL)
-- =====================================================================
-- WHAT THIS SCRIPT DOES
--   Adds a table for the contact-page form, so enquiries are stored
--   alongside bookings instead of living only in Formspree's inbox.
--
-- RUN THIS AFTER schema.sql
--   It reuses `public.is_staff()` and the `public.staff` table created
--   there. Supabase Dashboard → SQL Editor → New query → paste → Run.
--   Safe to run twice.
--
-- WHY BOTHER, WHEN FORMSPREE ALREADY EMAILS US?
--   An email inbox is not a record. You cannot ask it "how many
--   enquiries came in last month", "which service do people ask about
--   most", or "did anyone reply to this one". A row in a table answers
--   all three, and the enquiry survives someone deleting the email.
--
--   Formspree keeps working exactly as before — this is in addition,
--   not instead. See src/components/pages/contact.tsx.
--
-- HOW THIS DIFFERS FROM BOOKINGS
--   A booking reserves a room, so it needs clash prevention, capacity
--   checks and lead times. An enquiry reserves nothing: it is a message.
--   So this table is deliberately much simpler — no exclusion
--   constraint, no scheduling rules. What it shares with bookings is the
--   security model: the public may INSERT and nothing else.
-- =====================================================================


-- =====================================================================
-- SECTION 1 — ENUM
-- =====================================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'enquiry_status') then
    --  new       : just arrived, nobody has looked at it
    --  in-progress: someone is dealing with it
    --  replied   : we have responded
    --  closed    : finished, or not worth pursuing
    --  spam      : junk; kept rather than deleted so patterns are visible
    create type public.enquiry_status as enum
      ('new', 'in-progress', 'replied', 'closed', 'spam');
  end if;
end $$;


-- =====================================================================
-- SECTION 2 — THE TABLE
-- =====================================================================
create table if not exists public.enquiries (
  id           uuid        primary key default gen_random_uuid(),
  reference    text        not null unique
                           default 'EN-'
                             || to_char(now() at time zone 'Asia/Hong_Kong', 'YYMM')
                             || '-'
                             || upper(substr(translate(gen_random_uuid()::text, '-01lo', ''), 1, 6)),

  -- ---- who ----------------------------------------------------------
  -- The contact form asks for first and last name separately, but stores
  -- them joined: the office reads a name, it never sorts by surname.
  full_name    text        not null check (length(btrim(full_name)) between 1 and 120),
  email        text        not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  -- Phone is optional on the contact form, unlike on the booking form.
  phone        text        check (phone is null or length(btrim(phone)) between 6 and 32),
  company      text,

  -- ---- what ----------------------------------------------------------
  -- Which service they picked from the dropdown, e.g. 'company-formation'.
  -- Free text rather than an enum so adding a service to the website does
  -- not require a database migration.
  service      text,
  message      text        not null check (length(btrim(message)) between 1 and 5000),

  -- ---- where it came from --------------------------------------------
  -- 'contact-page' | 'pricing-page' | ... — useful for knowing which page
  -- actually generates enquiries.
  source       text        not null default 'contact-page',
  -- The site language they were reading when they wrote in, so the team
  -- knows which language to reply in.
  lang         text        check (lang is null or lang in ('en', 'zh-HK', 'zh-CN')),

  -- ---- admin ----------------------------------------------------------
  status       public.enquiry_status not null default 'new',
  internal_note text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.enquiries is
  'Contact-form enquiries. Mirrored from Formspree, which keeps working.';
comment on column public.enquiries.lang is
  'Site language at submission time, so the team replies in the right one.';

create index if not exists enquiries_status_created_idx
  on public.enquiries (status, created_at desc);
create index if not exists enquiries_email_idx
  on public.enquiries (lower(email));


-- =====================================================================
-- SECTION 3 — TRIGGERS
-- =====================================================================

-- Tidy the input and keep updated_at honest.
create or replace function public.enquiries_prepare()
returns trigger
language plpgsql
as $$
begin
  new.email      := lower(btrim(new.email));
  new.full_name  := btrim(new.full_name);
  new.message    := btrim(new.message);
  new.phone      := nullif(btrim(coalesce(new.phone, '')), '');
  new.company    := nullif(btrim(coalesce(new.company, '')), '');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists enquiries_prepare_trg on public.enquiries;
create trigger enquiries_prepare_trg
  before insert or update on public.enquiries
  for each row execute function public.enquiries_prepare();

-- Same anti-spam idea as bookings: one email address may not file more
-- than 5 unanswered enquiries in 24 hours.
create or replace function public.enquiries_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent integer;
begin
  select count(*) into recent
  from public.enquiries e
  where lower(e.email) = lower(new.email)
    and e.status = 'new'
    and e.created_at > now() - interval '24 hours';

  if recent >= 5 then
    raise exception
      'Too many enquiries from this email address in the last 24 hours'
      using errcode = 'check_violation',
            hint = 'enquiries_rate_limit';
  end if;

  return new;
end;
$$;

drop trigger if exists enquiries_rate_limit_trg on public.enquiries;
create trigger enquiries_rate_limit_trg
  before insert on public.enquiries
  for each row execute function public.enquiries_rate_limit();


-- =====================================================================
-- SECTION 4 — ROW LEVEL SECURITY
-- =====================================================================
-- Identical stance to bookings: the public may create an enquiry and
-- read nothing. Without this, the public anon key could download every
-- message anyone has ever sent you, complete with their email address.
alter table public.enquiries enable row level security;

drop policy if exists enquiries_public_insert on public.enquiries;
create policy enquiries_public_insert
  on public.enquiries for insert
  to anon, authenticated
  with check (
    -- The public may only ever create a NEW enquiry. Without this they
    -- could file one pre-marked 'closed' and hide it from the team.
    status = 'new'
    and internal_note is null
  );

drop policy if exists enquiries_staff_read on public.enquiries;
create policy enquiries_staff_read
  on public.enquiries for select
  to authenticated
  using (public.is_staff());

drop policy if exists enquiries_staff_write on public.enquiries;
create policy enquiries_staff_write
  on public.enquiries for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());


-- =====================================================================
-- SECTION 5 — THE PUBLIC API
-- =====================================================================
-- One function, for the same reason as bookings: RLS forbids the public
-- from reading the table, but the browser still wants the reference
-- number back. SECURITY DEFINER lets this insert and return just that.
create or replace function public.submit_enquiry(
  p_full_name text,
  p_email     text,
  p_phone     text default null,
  p_company   text default null,
  p_service   text default null,
  p_message   text default '',
  p_source    text default 'contact-page',
  p_lang      text default null
)
returns table (reference text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  new_row public.enquiries%rowtype;
begin
  insert into public.enquiries (
    full_name, email, phone, company, service, message, source, lang, status
  ) values (
    p_full_name, p_email, p_phone, p_company, p_service, p_message,
    coalesce(nullif(btrim(p_source), ''), 'contact-page'),
    p_lang, 'new'
  )
  returning * into new_row;

  return query select new_row.reference;
end;
$$;

grant insert on public.enquiries to anon, authenticated;
grant select, update on public.enquiries to authenticated;

revoke all on function public.submit_enquiry(
  text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_enquiry(
  text, text, text, text, text, text, text, text) to anon, authenticated;


-- =====================================================================
-- SECTION 6 — STAFF VIEW
-- =====================================================================
create or replace view public.enquiries_inbox
with (security_invoker = true)
as
select
  e.reference,
  e.status,
  e.full_name,
  e.email,
  e.phone,
  e.company,
  e.service,
  e.message,
  e.lang,
  e.source,
  e.internal_note,
  e.created_at
from public.enquiries e
order by e.created_at desc;

comment on view public.enquiries_inbox is
  'Staff-facing enquiry list. Respects RLS via security_invoker.';

grant select on public.enquiries_inbox to authenticated;
