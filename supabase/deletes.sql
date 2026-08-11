-- =====================================================================
-- SMARTHUB — DELETING BOOKINGS AND ENQUIRIES (staff only)
-- =====================================================================
-- RUN THIS AFTER schema.sql AND enquiries.sql.
-- Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run twice.
--
-- WHY THIS IS NOT JUST "GRANT DELETE"
--   Because delete is forever, and the row you most want back is the one
--   you deleted by accident at 6pm on a Friday. Every delete here copies
--   the row into an archive table first, so it can be read back.
--
-- CANCEL VS DELETE — USE CANCEL MOST OF THE TIME
--   Cancelling a booking already frees the room for someone else and
--   keeps the history. That is the right tool for "this is not
--   happening any more".
--
--   Delete is for rows that should never have existed: test bookings,
--   spam, duplicates. It removes them from the list entirely.
-- =====================================================================


-- =====================================================================
-- SECTION 1 — THE ARCHIVE
-- =====================================================================
-- One table for both, holding the whole original row as JSON. Using
-- jsonb rather than mirrored columns means this never has to be altered
-- when bookings or enquiries gain a column later.
create table if not exists public.deleted_records (
  id           uuid        primary key default gen_random_uuid(),
  -- 'booking' or 'enquiry'
  kind         text        not null check (kind in ('booking', 'enquiry')),
  -- The reference of the deleted row, kept as a plain column so you can
  -- search the archive without digging into the JSON.
  reference    text        not null,
  -- The complete row as it was at the moment of deletion.
  payload      jsonb       not null,
  -- Who pressed the button, and optionally why.
  deleted_by   uuid        references auth.users (id) on delete set null,
  deleted_email text,
  reason       text,
  deleted_at   timestamptz not null default now()
);

comment on table public.deleted_records is
  'Archive of deleted bookings and enquiries. Lets a mistaken delete be recovered.';

create index if not exists deleted_records_kind_idx
  on public.deleted_records (kind, deleted_at desc);
create index if not exists deleted_records_reference_idx
  on public.deleted_records (reference);

-- Staff-only, like everything else. The public must not be able to read
-- the archive — it holds the same personal data the live tables do.
alter table public.deleted_records enable row level security;

drop policy if exists deleted_records_staff_read on public.deleted_records;
create policy deleted_records_staff_read
  on public.deleted_records for select
  to authenticated
  using (public.is_staff());

grant select on public.deleted_records to authenticated;


-- =====================================================================
-- SECTION 2 — DELETE A BOOKING
-- =====================================================================
-- SECURITY DEFINER, so it must check staff membership itself: definer
-- functions bypass RLS, and without this check any visitor holding the
-- publishable key could delete your entire calendar.
create or replace function public.delete_booking(
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
  target public.bookings%rowtype;
  actor  uuid := auth.uid();
begin
  if not public.is_staff() then
    raise exception 'Only staff can delete bookings'
      using errcode = 'insufficient_privilege';
  end if;

  select * into target
  from public.bookings b
  where b.reference = p_reference;

  if not found then
    -- Not an error: the row is already gone, which is what the caller
    -- wanted. Saying so lets the UI stay quiet instead of showing a
    -- scary message when someone double-clicks.
    return query select false, p_reference;
    return;
  end if;

  insert into public.deleted_records (kind, reference, payload, deleted_by, deleted_email, reason)
  values (
    'booking',
    target.reference,
    to_jsonb(target),
    actor,
    (select email from auth.users where id = actor),
    nullif(btrim(coalesce(p_reason, '')), '')
  );

  delete from public.bookings b where b.reference = p_reference;

  return query select true, p_reference;
end;
$$;


-- =====================================================================
-- SECTION 3 — DELETE AN ENQUIRY
-- =====================================================================
create or replace function public.delete_enquiry(
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
  target public.enquiries%rowtype;
  actor  uuid := auth.uid();
begin
  if not public.is_staff() then
    raise exception 'Only staff can delete enquiries'
      using errcode = 'insufficient_privilege';
  end if;

  select * into target
  from public.enquiries e
  where e.reference = p_reference;

  if not found then
    return query select false, p_reference;
    return;
  end if;

  insert into public.deleted_records (kind, reference, payload, deleted_by, deleted_email, reason)
  values (
    'enquiry',
    target.reference,
    to_jsonb(target),
    actor,
    (select email from auth.users where id = actor),
    nullif(btrim(coalesce(p_reason, '')), '')
  );

  delete from public.enquiries e where e.reference = p_reference;

  return query select true, p_reference;
end;
$$;


-- =====================================================================
-- SECTION 4 — PERMISSIONS
-- =====================================================================
-- Note what is NOT granted: no `grant delete on public.bookings`. The
-- only way to remove a row is through these functions, so nothing can
-- be deleted without first being archived.
revoke all on function public.delete_booking(text, text) from public;
revoke all on function public.delete_enquiry(text, text) from public;

grant execute on function public.delete_booking(text, text) to authenticated;
grant execute on function public.delete_enquiry(text, text) to authenticated;


-- =====================================================================
-- SECTION 5 — PUTTING SOMETHING BACK
-- =====================================================================
-- Restoring is fiddly by hand: `bookings.during` is a GENERATED column,
-- so the obvious `insert ... select *` fails with
-- "cannot insert a non-DEFAULT value into column during". This function
-- rebuilds the row properly, naming every column and letting the
-- generated ones regenerate.
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

  -- Most recent archive entry for that reference, in case the same
  -- reference was deleted, restored and deleted again.
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
    -- Every column is named explicitly, and the generated `during`
    -- range is left out so Postgres recomputes it.
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
  else
    raise exception 'Unknown archived kind: %', rec.kind;
  end if;

  -- Clear the archive entry so the same row cannot be restored twice.
  delete from public.deleted_records d where d.id = rec.id;

  return query select true, rec.kind, p_reference;
end;
$$;

revoke all on function public.restore_deleted(text) from public;
grant execute on function public.restore_deleted(text) to authenticated;


-- See what has been deleted:
--
--   select deleted_at, kind, reference, deleted_email, reason
--   from public.deleted_records
--   order by deleted_at desc
--   limit 20;
--
-- Read the full original row:
--
--   select payload from public.deleted_records
--   where reference = 'SH-2608-ABC123';
--
-- Restore a deleted booking or enquiry with one call. Use the reference
-- exactly as it appears in the archive:
--
--   select * from public.restore_deleted('SH-2608-ABC123');
--
-- Restoring a BOOKING can fail with 23P01 if someone else has since
-- booked that room and time. That is correct behaviour, not a bug — the
-- slot genuinely is taken now, and you need to speak to one of them.
--
-- Housekeeping: the archive grows forever. To drop entries older than a
-- year, run this occasionally (or leave it — the rows are tiny):
--
--   delete from public.deleted_records
--   where deleted_at < now() - interval '1 year';
-- =====================================================================
