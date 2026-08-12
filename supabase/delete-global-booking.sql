-- =====================================================================
-- SMARTHUB — DELETING PARTNER-OFFICE BOOKINGS (staff only)
-- =====================================================================
-- RUN THIS AFTER deletes.sql, global-office-platform.sql AND
-- global-bookings-inbox.sql.
-- Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run twice.
--
-- WHAT THIS IS FOR
--   The admin bookings inbox merges two tables. Wan Chai bookings live
--   in public.bookings and are deleted by public.delete_booking.
--   Partner-office requests — China, Singapore, Cyprus, references that
--   start `GO-` — live in public.global_booking_requests, which
--   delete_booking has never touched. Without this file the trash icon
--   on a `GO-` row reports success and the row comes straight back on
--   the next refresh, because delete_booking answers "no such
--   reference" rather than raising.
--
-- NOT THE SAME THING AS delete-sfo-enquiry.sql
--   That file deletes partnership APPLICATIONS from sfo_enquiries.
--   It has no effect on bookings. Running it will not clear a `GO-`
--   row, and this file will not clear an `SFO-` row.
--
-- CANCEL VS DELETE
--   Cancelling a partner request already frees the slot and keeps the
--   history — prefer it. Delete is for rows that should never have
--   existed: tests, spam, duplicates.
-- =====================================================================


-- =====================================================================
-- SECTION 1 — LET THE ARCHIVE HOLD PARTNER BOOKINGS
-- =====================================================================
-- deleted_records was created with kind in ('booking', 'enquiry'). A
-- partner request is neither: restoring one has to write back to a
-- different table, so it gets its own kind rather than pretending to
-- be a Wan Chai booking.
-- Guarded, so running this before deletes.sql fails with the clear
-- message below instead of a bare "relation does not exist".
do $$
begin
  if to_regclass('public.deleted_records') is null then
    raise exception 'Run supabase/deletes.sql first — public.deleted_records is missing.';
  end if;

  alter table public.deleted_records
    drop constraint if exists deleted_records_kind_check;

  alter table public.deleted_records
    add constraint deleted_records_kind_check
    check (kind in ('booking', 'enquiry', 'global_booking'));
end $$;


-- =====================================================================
-- SECTION 2 — DELETE A PARTNER BOOKING
-- =====================================================================
-- SECURITY DEFINER, so it checks staff membership itself: definer
-- functions bypass RLS, and without this check anyone holding the
-- publishable key could empty the partner inbox.
create or replace function public.delete_global_booking(
  p_reference text,
  p_reason    text default null
)
returns table (deleted boolean, reference text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  target public.global_booking_requests%rowtype;
  actor  uuid := auth.uid();
begin
  if not public.is_staff() then
    raise exception 'Only staff can delete bookings'
      using errcode = 'insufficient_privilege';
  end if;

  select * into target
  from public.global_booking_requests g
  where g.reference = p_reference;

  if not found then
    -- Not an error: the row is already gone, which is what the caller
    -- wanted. The client uses this answer to decide whether to try the
    -- Wan Chai table instead, so it must not raise.
    return query select false, p_reference;
    return;
  end if;

  insert into public.deleted_records (kind, reference, payload, deleted_by, deleted_email, reason)
  values (
    'global_booking',
    target.reference,
    to_jsonb(target),
    actor,
    (select email from auth.users where id = actor),
    nullif(btrim(coalesce(p_reason, '')), '')
  );

  delete from public.global_booking_requests g where g.reference = p_reference;

  return query select true, p_reference;
end;
$$;


-- =====================================================================
-- SECTION 3 — TEACH UNDO ABOUT THE NEW KIND
-- =====================================================================
-- restore_deleted lives in deletes.sql and only knows 'booking' and
-- 'enquiry'; a partner row would hit its "Unknown archived kind" error.
-- This replaces it with the same function plus one extra branch.
--
-- ORDERING NOTE: if you ever re-run deletes.sql, run this file again
-- afterwards, or Undo on a partner booking stops working.
create or replace function public.restore_deleted(p_reference text)
returns table (restored boolean, kind text, reference text)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  rec public.deleted_records%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Only staff can restore records'
      using errcode = 'insufficient_privilege';
  end if;

  select * into rec
  from public.deleted_records d
  where d.reference = p_reference
  order by d.deleted_at desc
  limit 1;

  if not found then
    raise exception 'Nothing archived under reference %', p_reference
      using errcode = 'no_data_found';
  end if;

  if rec.kind = 'booking' then
    insert into public.bookings (
      id, reference, full_name, email, phone, company, br_number,
      room_id, booking_date, start_time, end_time, attendees,
      payment_method, status, quoted_hours, quoted_total, is_exclusive,
      notes, internal_note, source, created_at, updated_at
    )
    select
      (rec.payload->>'id')::uuid,
      rec.payload->>'reference',
      rec.payload->>'full_name',
      rec.payload->>'email',
      rec.payload->>'phone',
      rec.payload->>'company',
      rec.payload->>'br_number',
      rec.payload->>'room_id',
      (rec.payload->>'booking_date')::date,
      (rec.payload->>'start_time')::time,
      (rec.payload->>'end_time')::time,
      (rec.payload->>'attendees')::integer,
      (rec.payload->>'payment_method')::public.payment_method,
      (rec.payload->>'status')::public.booking_status,
      (rec.payload->>'quoted_hours')::numeric,
      (rec.payload->>'quoted_total')::numeric,
      coalesce((rec.payload->>'is_exclusive')::boolean, true),
      rec.payload->>'notes',
      rec.payload->>'internal_note',
      coalesce(rec.payload->>'source', 'website'),
      coalesce((rec.payload->>'created_at')::timestamptz, now()),
      now();

  elsif rec.kind = 'enquiry' then
    insert into public.enquiries (
      id, reference, full_name, email, phone, company, service, message,
      source, lang, status, internal_note, created_at, updated_at
    )
    select
      (rec.payload->>'id')::uuid,
      rec.payload->>'reference',
      rec.payload->>'full_name',
      rec.payload->>'email',
      rec.payload->>'phone',
      rec.payload->>'company',
      rec.payload->>'service',
      rec.payload->>'message',
      coalesce(rec.payload->>'source', 'contact-page'),
      rec.payload->>'lang',
      (rec.payload->>'status')::public.enquiry_status,
      rec.payload->>'internal_note',
      coalesce((rec.payload->>'created_at')::timestamptz, now()),
      now();

  elsif rec.kind = 'global_booking' then
    -- The listing is referenced with `on delete restrict`, so a listing
    -- that has since been removed makes this fail loudly. That is
    -- correct: there is nowhere to put the request back.
    insert into public.global_booking_requests (
      id, reference, listing_id, full_name, email, phone, company,
      starts_at, ends_at, attendees, message, quoted_total, currency,
      status, created_at, updated_at
    )
    select
      (rec.payload->>'id')::uuid,
      rec.payload->>'reference',
      (rec.payload->>'listing_id')::uuid,
      rec.payload->>'full_name',
      rec.payload->>'email',
      rec.payload->>'phone',
      rec.payload->>'company',
      (rec.payload->>'starts_at')::timestamptz,
      (rec.payload->>'ends_at')::timestamptz,
      coalesce((rec.payload->>'attendees')::integer, 1),
      rec.payload->>'message',
      (rec.payload->>'quoted_total')::numeric,
      nullif(rec.payload->>'currency', '')::char(3),
      coalesce(rec.payload->>'status', 'requested'),
      coalesce((rec.payload->>'created_at')::timestamptz, now()),
      now();

  else
    raise exception 'Unknown archived kind: %', rec.kind;
  end if;

  delete from public.deleted_records d where d.id = rec.id;

  return query select true, rec.kind, p_reference;
end;
$$;


-- =====================================================================
-- SECTION 4 — PERMISSIONS
-- =====================================================================
-- No `grant delete on public.global_booking_requests`: the RPC is the
-- only way through, so nothing is deleted without being archived first.
revoke all on function public.delete_global_booking(text, text) from public;
grant execute on function public.delete_global_booking(text, text) to authenticated;

revoke all on function public.restore_deleted(text) from public;
grant execute on function public.restore_deleted(text) to authenticated;


-- Delete one stuck partner booking by hand:
--
--   select * from public.delete_global_booking('GO-2608-ABC123', 'test row');
--
-- See what has been archived:
--
--   select deleted_at, kind, reference, deleted_email, reason
--   from public.deleted_records
--   where kind = 'global_booking'
--   order by deleted_at desc;
--
-- Put one back:
--
--   select * from public.restore_deleted('GO-2608-ABC123');
