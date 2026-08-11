-- =====================================================================
-- SMARTHUB — ROOM BOOKING BACKEND (Supabase / PostgreSQL)
-- =====================================================================
-- WHAT THIS SCRIPT DOES
--   Creates the whole booking backend in one go: the room catalogue,
--   the bookings table, every rule from the booking form enforced as a
--   real database constraint, and Row Level Security so the public
--   website can create bookings without ever being able to read anyone
--   else's personal data.
--
-- THE HEADLINE FEATURE
--   A Google Form cannot stop two people booking Meeting Room B at
--   10:00 on the same day — it just records both answers. This schema
--   makes that physically impossible: an EXCLUSION CONSTRAINT rejects
--   the second overlapping booking at the storage layer, even if both
--   requests arrive in the same millisecond from different servers.
--   The shared Hot Desk is handled differently (see SECTION 6): it has
--   30 seats, so it accepts concurrent bookings until the seats run out.
--
-- HOW TO RUN IT
--   Supabase Dashboard → SQL Editor → New query → paste → Run.
--   The script is IDEMPOTENT: running it twice is safe and will not
--   destroy existing bookings.
--
-- WHAT IT MIRRORS
--   src/lib/booking-data.ts — the room catalogue, rates and the
--   BOOKING_RULES object. If you change a rate in one place, change it
--   in the other. SECTION 3 is the copy of the catalogue.
--
-- CONVENTIONS
--   * All times are LOCAL Hong Kong wall-clock time. A booking is
--     "2026-09-01, 10:00–12:00" — not an instant on a global timeline —
--     so booking_date/start_time/end_time are date + time, never
--     timestamptz. "Today" is computed in Asia/Hong_Kong.
--   * Money is numeric(10,2) in HKD. Never float.
--   * Every constraint has an explicit, stable name so the web app can
--     map a Postgres error to a friendly message (see SECTION 11).
-- =====================================================================


-- =====================================================================
-- SECTION 1 — EXTENSIONS
-- =====================================================================
-- btree_gist lets a GiST index (which understands range overlap, &&)
-- also understand plain equality (=) on a text column. We need BOTH in
-- the same index to say "no two bookings for THE SAME ROOM may overlap".
create extension if not exists btree_gist;


-- =====================================================================
-- SECTION 2 — ENUM TYPES
-- =====================================================================
-- Enums are used for the small, stable value sets. The room list is NOT
-- an enum — it is a table with a foreign key — because adding a room
-- should be an INSERT, not an ALTER TYPE.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rate_unit') then
    create type public.rate_unit as enum ('hour', 'day');
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_method') then
    -- Matches PAYMENT_METHODS[].id in src/lib/booking-data.ts
    create type public.payment_method as enum ('bank-transfer', 'fps');
  end if;

  if not exists (select 1 from pg_type where typname = 'booking_status') then
    --  pending   : submitted by the website, awaiting the team
    --  confirmed : the team accepted it and payment is settled
    --  declined  : the team rejected it (clash, unsuitable, no payment)
    --  cancelled : withdrawn by the customer or the team
    create type public.booking_status as enum
      ('pending', 'confirmed', 'declined', 'cancelled');
  end if;
end $$;


-- =====================================================================
-- SECTION 3 — ROOMS (the catalogue)
-- =====================================================================
-- Mirrors ROOMS in src/lib/booking-data.ts. The website can read this
-- table publicly, so the rate table on /pricing can be driven from the
-- database instead of being hard-coded.
create table if not exists public.rooms (
  -- URL-safe slug, identical to the RoomId union in booking-data.ts
  id            text        primary key
                            check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en       text        not null,
  name_zh_hk    text        not null,
  name_zh_cn    text        not null,
  capacity      integer     not null check (capacity > 0),
  rate          numeric(10,2) not null check (rate >= 0),
  unit          public.rate_unit not null,

  -- TRUE  = the whole space is booked exclusively (meeting rooms).
  -- FALSE = a shared space sold by the seat (the Hot Desk).
  -- This single flag decides which anti-clash rule applies. See §6.
  is_exclusive  boolean     not null default true,

  -- The EXACT option string in the existing Google Form. Kept so the
  -- team can keep cross-checking database rows against the old sheet.
  form_value    text,

  is_active     boolean     not null default true,
  sort_order    integer     not null default 0,
  created_at    timestamptz not null default now()
);

comment on table public.rooms is
  'Bookable spaces. Mirrors ROOMS in src/lib/booking-data.ts.';
comment on column public.rooms.is_exclusive is
  'TRUE = one booking at a time (meeting rooms). FALSE = sold per seat up to capacity (hot desk).';

-- Seed / refresh the catalogue. ON CONFLICT keeps this re-runnable and
-- lets you edit a rate here and simply run the script again.
insert into public.rooms
  (id, name_en, name_zh_hk, name_zh_cn, capacity, rate, unit, is_exclusive, form_value, sort_order)
values
  ('meeting-a',   'Meeting Room A', '會議室 A',   '会议室 A',   10,  500.00, 'hour', true,  'Meeting Room A / 會議室 A / 会议室 A',        10),
  ('hot-desk',    'Hot Desk',       '共享工位',   '共享工位',   30,  350.00, 'day',  false, 'Hot Desk / 共享工位 / 共享工位',              20),
  ('meeting-b',   'Meeting Room B', '會議室 B',   '会议室 B',   10,  800.00, 'hour', true,  'Meeting Room B / 會議室 B / 会议室 B',        30),
  ('event-space', 'Event Space',    '活動場地',   '活动场地',   30, 1000.00, 'hour', true,  'Event Space / 活動場地 / 活动场地',           40),
  ('meeting-c',   'Meeting Room C', '會議室 C',   '会议室 C',    6,  300.00, 'hour', true,  'Meeting Room C / 會議室 C / 会议室 C',        50),
  ('director',    'Director Room',  '總監辦公室', '总监办公室',  5,  300.00, 'hour', true,  'Director Room / 總監辦公室 / 总监办公室',      60)
on conflict (id) do update set
  name_en      = excluded.name_en,
  name_zh_hk   = excluded.name_zh_hk,
  name_zh_cn   = excluded.name_zh_cn,
  capacity     = excluded.capacity,
  rate         = excluded.rate,
  unit         = excluded.unit,
  is_exclusive = excluded.is_exclusive,
  form_value   = excluded.form_value,
  sort_order   = excluded.sort_order;


-- =====================================================================
-- SECTION 4 — HELPER FUNCTIONS
-- =====================================================================

-- today_hk() — "today" as seen from Hong Kong, regardless of where the
-- Supabase project is hosted (their servers run in UTC).
create or replace function public.today_hk()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Hong_Kong')::date;
$$;

-- add_working_days() — the SQL twin of addWorkingDays() in
-- src/lib/booking-data.ts. Counts forward, skipping Sat/Sun.
-- extract(isodow) gives 1=Mon … 6=Sat, 7=Sun.
create or replace function public.add_working_days(p_from date, p_days integer)
returns date
language plpgsql
immutable
as $$
declare
  d     date := p_from;
  added integer := 0;
begin
  while added < p_days loop
    d := d + 1;
    if extract(isodow from d) < 6 then
      added := added + 1;
    end if;
  end loop;
  return d;
end;
$$;

-- earliest_booking_date() — the first date the public may book, i.e.
-- 7 working days from today. Drives both validation and the `min`
-- attribute on the date picker.
create or replace function public.earliest_booking_date()
returns date
language sql
stable
as $$
  select public.add_working_days(public.today_hk(), 7);
$$;

-- booking_reference() — short human-friendly code for emails and
-- invoices, e.g. "SH-2608-4KQ9TW".
create or replace function public.booking_reference()
returns text
language sql
volatile
as $$
  select 'SH-'
      || to_char(now() at time zone 'Asia/Hong_Kong', 'YYMM')
      || '-'
      || upper(substr(translate(gen_random_uuid()::text, '-01lo', ''), 1, 6));
$$;


-- =====================================================================
-- SECTION 5 — STAFF (who is allowed to see bookings)
-- =====================================================================
-- A row here grants a Supabase Auth user access to the booking inbox.
-- Add yourself after running this script:
--
--   insert into public.staff (user_id, email)
--   select id, email from auth.users where email = 'you@smarthubc.com';
--
create table if not exists public.staff (
  user_id    uuid primary key,
  email      text,
  role       text not null default 'admin',
  created_at timestamptz not null default now()
);

comment on table public.staff is
  'Allow-list of Supabase Auth users who may read and manage bookings.';

-- is_staff() — TRUE when the caller is a logged-in member of the team.
-- Used by every "the office can see everything" policy below. Defined
-- here, AFTER public.staff, because Postgres parses a SQL function body
-- at creation time and would reject a reference to a missing table.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = auth.uid()
  );
$$;


-- =====================================================================
-- SECTION 6 — BOOKINGS
-- =====================================================================
create table if not exists public.bookings (
  id              uuid        primary key default gen_random_uuid(),
  reference       text        not null unique default public.booking_reference(),

  -- ---- who ----------------------------------------------------------
  full_name       text        not null check (length(btrim(full_name)) between 1 and 120),
  email           text        not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone           text        not null check (length(btrim(phone)) between 6 and 32),
  -- The form asks people to type "N/A" when they have no company / BR
  -- number, so these are NOT NULL with a default rather than nullable.
  company         text        not null default 'N/A',
  br_number       text        not null default 'N/A',

  -- ---- what ---------------------------------------------------------
  room_id         text        not null references public.rooms (id) on update cascade,
  booking_date    date        not null,
  start_time      time        not null,
  end_time        time        not null,
  attendees       integer     not null check (attendees > 0),
  payment_method  public.payment_method not null,

  -- ---- bookkeeping (filled in by triggers, see §7) --------------------
  status          public.booking_status not null default 'pending',
  quoted_hours    numeric(5,2),
  quoted_total    numeric(10,2),
  -- Denormalised from rooms.is_exclusive so the exclusion constraint
  -- below can test it. A constraint may only look at the row itself,
  -- never at another table, so the trigger copies the flag in.
  is_exclusive    boolean     not null default true,

  -- ---- admin ---------------------------------------------------------
  notes           text,
  internal_note   text,
  source          text        not null default 'website',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- ---- the time span, as a range Postgres can index ------------------
  -- '[)' = start inclusive, end exclusive, so a 10:00–11:00 booking and
  -- an 11:00–12:00 booking do NOT count as overlapping. That is exactly
  -- what you want for back-to-back meetings.
  during          tsrange generated always as (
                    tsrange(booking_date + start_time,
                            booking_date + end_time, '[)')
                  ) stored,

  -- ---- the rules from the booking form, as real constraints ----------
  constraint bookings_time_order
    check (end_time > start_time),
  constraint bookings_start_window
    check (start_time >= time '09:00' and start_time <= time '17:00'),
  constraint bookings_end_window
    check (end_time   >= time '10:00' and end_time   <= time '18:00'),
  constraint bookings_minute_step
    check (extract(minute from start_time) in (0, 30)
       and extract(minute from end_time)   in (0, 30)
       and extract(second from start_time) = 0
       and extract(second from end_time)   = 0),
  constraint bookings_source_known
    check (source in ('website', 'google-form', 'phone', 'walk-in', 'admin'))
);

comment on table public.bookings is
  'Room booking requests. Overlaps are prevented by bookings_no_overlap.';
comment on column public.bookings.during is
  'Generated [start, end) range used by the anti-double-booking index.';

-- ---------------------------------------------------------------------
-- THE ANTI-DOUBLE-BOOKING CONSTRAINT
-- ---------------------------------------------------------------------
-- Reads as: "there may not exist two rows where the room is the same
-- AND the time ranges overlap" — but only for rooms booked exclusively
-- and only for bookings that still hold the room (pending/confirmed).
-- A declined or cancelled booking releases its slot automatically.
--
-- Because this is enforced by a unique GiST index, it holds under
-- concurrency. Two simultaneous requests for the same slot cannot both
-- win: one commits, the other fails with SQLSTATE 23P01.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_no_overlap'
  ) then
    alter table public.bookings
      add constraint bookings_no_overlap
      exclude using gist (
        room_id WITH =,
        during  WITH &&
      )
      where (is_exclusive and status in ('pending', 'confirmed'));
  end if;
end $$;

-- Indexes for the day view / inbox the office will use.
create index if not exists bookings_date_room_idx
  on public.bookings (booking_date, room_id);
create index if not exists bookings_status_created_idx
  on public.bookings (status, created_at desc);
create index if not exists bookings_email_idx
  on public.bookings (lower(email));


-- =====================================================================
-- SECTION 7 — TRIGGERS (the rules a CHECK constraint cannot express)
-- =====================================================================
-- A CHECK constraint may only read its own row and must be immutable.
-- Anything that needs today's date, or a lookup in `rooms`, has to be a
-- trigger. All of these run BEFORE INSERT so they finish before the
-- exclusion constraint is evaluated.

create or replace function public.bookings_prepare()
returns trigger
language plpgsql
as $$
declare
  r public.rooms%rowtype;
  v_hours   numeric(5,2);
  v_seats   integer;
begin
  -- ---- 0. time order, checked FIRST ------------------------------------
  -- The `during` generated column is computed after this trigger but
  -- before the CHECK constraints, and building a backwards tsrange
  -- raises a raw, untranslatable Postgres error. Catching it here means
  -- the app gets a message it can map instead of a database internal.
  if new.end_time <= new.start_time then
    raise exception 'The end time must be later than the start time'
      using errcode = 'check_violation',
            hint = 'bookings_time_order';
  end if;

  -- ---- 1. look up the room -------------------------------------------
  select * into r from public.rooms where id = new.room_id;
  if not found then
    raise exception 'Unknown room "%"', new.room_id
      using errcode = 'foreign_key_violation';
  end if;
  if not r.is_active then
    raise exception 'Room "%" is not currently bookable', r.name_en
      using errcode = 'check_violation';
  end if;

  -- copy the flag the exclusion constraint needs
  new.is_exclusive := r.is_exclusive;

  -- ---- 2. capacity ----------------------------------------------------
  if new.attendees > r.capacity then
    raise exception
      'Room % holds % people, but % were requested', r.name_en, r.capacity, new.attendees
      using errcode = 'check_violation',
            hint = 'bookings_capacity';
  end if;

  -- ---- 3. lead time: 7 working days -----------------------------------
  -- Only enforced for public/website bookings. Staff taking a booking
  -- over the phone can override it by inserting with source='admin'.
  if new.source = 'website'
     and new.booking_date < public.earliest_booking_date() then
    raise exception
      'Bookings need at least 7 working days'' notice — the earliest available date is %',
      public.earliest_booking_date()
      using errcode = 'check_violation',
            hint = 'bookings_lead_time';
  end if;

  -- ---- 4. price quote --------------------------------------------------
  -- Mirrors estimateCost() in src/lib/booking-data.ts: per-day rooms are
  -- charged one flat rate, hourly rooms round UP to the next full hour.
  v_hours := extract(epoch from (new.end_time - new.start_time)) / 3600.0;
  new.quoted_hours := v_hours;
  new.quoted_total := case
    when r.unit = 'day' then r.rate
    else ceil(v_hours) * r.rate
  end;

  -- ---- 5. shared rooms: sell by the seat -------------------------------
  -- The Hot Desk is not exclusive, so the exclusion constraint above
  -- skips it. Instead we check that the seats already committed for any
  -- overlapping slot, plus this request, stay within capacity.
  -- The advisory lock serialises concurrent requests for the same room
  -- and day so two bookings cannot both read "5 seats taken" and both
  -- claim the last 25.
  if not r.is_exclusive then
    perform pg_advisory_xact_lock(hashtext(new.room_id || new.booking_date::text));

    select coalesce(sum(b.attendees), 0) into v_seats
    from public.bookings b
    where b.room_id = new.room_id
      and b.status in ('pending', 'confirmed')
      and b.id is distinct from new.id
      and b.during && tsrange(new.booking_date + new.start_time,
                              new.booking_date + new.end_time, '[)');

    if v_seats + new.attendees > r.capacity then
      raise exception
        'Only % of % seats are left at the % for that time', 
        r.capacity - v_seats, r.capacity, r.name_en
        using errcode = 'check_violation',
              hint = 'bookings_seats_sold_out';
    end if;
  end if;

  -- ---- 6. tidy up ------------------------------------------------------
  new.email     := lower(btrim(new.email));
  new.full_name := btrim(new.full_name);
  new.company   := coalesce(nullif(btrim(new.company),   ''), 'N/A');
  new.br_number := coalesce(nullif(btrim(new.br_number), ''), 'N/A');
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists bookings_prepare_trg on public.bookings;
create trigger bookings_prepare_trg
  before insert or update of
    room_id, booking_date, start_time, end_time, attendees, status
  on public.bookings
  for each row execute function public.bookings_prepare();


-- touch updated_at on every write
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bookings_touch_trg on public.bookings;
create trigger bookings_touch_trg
  before update on public.bookings
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------
-- Light anti-spam: the same email may not stack up more than 5 pending
-- requests in 24 hours. Stops a script filling the office inbox.
-- ---------------------------------------------------------------------
create or replace function public.bookings_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent integer;
begin
  if new.source <> 'website' then
    return new;
  end if;

  select count(*) into recent
  from public.bookings b
  where lower(b.email) = lower(new.email)
    and b.status = 'pending'
    and b.created_at > now() - interval '24 hours';

  if recent >= 5 then
    raise exception
      'Too many booking requests from this email address in the last 24 hours'
      using errcode = 'check_violation',
            hint = 'bookings_rate_limit';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_rate_limit_trg on public.bookings;
create trigger bookings_rate_limit_trg
  before insert on public.bookings
  for each row execute function public.bookings_rate_limit();


-- =====================================================================
-- SECTION 8 — ROW LEVEL SECURITY
-- =====================================================================
-- The website talks to Supabase with the ANON key, which is public — it
-- ships inside the JavaScript bundle and anyone can read it. RLS is
-- therefore the only thing standing between that key and your customer
-- list. The rules below are deliberately strict:
--
--   anon           → may INSERT a pending booking. May not SELECT,
--                    UPDATE or DELETE anything. Not even its own row.
--   staff          → full read/write on bookings.
--   service_role   → bypasses RLS entirely (used by server-side code).
--
-- "Cannot read its own row" sounds harsh, but a booking has no secret
-- the customer needs back, and anything less means a stranger with the
-- anon key can enumerate names, emails and phone numbers. The insert
-- returns the reference number to the caller via the RPC in §9.

alter table public.rooms    enable row level security;
alter table public.staff    enable row level security;
alter table public.bookings enable row level security;

-- ---- rooms: world-readable catalogue --------------------------------
drop policy if exists rooms_public_read on public.rooms;
create policy rooms_public_read
  on public.rooms for select
  to anon, authenticated
  using (is_active);

drop policy if exists rooms_staff_write on public.rooms;
create policy rooms_staff_write
  on public.rooms for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- ---- staff: a member may see the allow-list, nobody else ------------
drop policy if exists staff_self_read on public.staff;
create policy staff_self_read
  on public.staff for select
  to authenticated
  using (public.is_staff());

-- ---- bookings: write-only for the public ----------------------------
drop policy if exists bookings_public_insert on public.bookings;
create policy bookings_public_insert
  on public.bookings for insert
  to anon, authenticated
  with check (
    -- The public may only ever create a PENDING request from the site.
    -- Without this, anyone could insert status='confirmed' and walk in.
    status = 'pending'
    and source = 'website'
    and internal_note is null
  );

drop policy if exists bookings_staff_read on public.bookings;
create policy bookings_staff_read
  on public.bookings for select
  to authenticated
  using (public.is_staff());

drop policy if exists bookings_staff_write on public.bookings;
create policy bookings_staff_write
  on public.bookings for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());


-- =====================================================================
-- SECTION 9 — PUBLIC API (the only functions the website calls)
-- =====================================================================
-- These are SECURITY DEFINER, meaning they run with the owner's rights
-- and can therefore look at the bookings table even though `anon`
-- cannot. Each one returns the absolute minimum: availability functions
-- leak no names, no emails, no phone numbers — only "busy" or "free".

-- ---------------------------------------------------------------------
-- room_busy_slots() — what is already taken for a room on a day.
-- Feeds the booking form so it can grey out unavailable times.
-- ---------------------------------------------------------------------
create or replace function public.room_busy_slots(p_room text, p_date date)
returns table (starts time, ends time, seats integer)
language sql
stable
security definer
set search_path = public
as $$
  select b.start_time, b.end_time, b.attendees
  from public.bookings b
  where b.room_id = p_room
    and b.booking_date = p_date
    and b.status in ('pending', 'confirmed')
  order by b.start_time;
$$;

-- ---------------------------------------------------------------------
-- is_slot_available() — the question the booking form actually asks.
-- Handles both kinds of room: exclusive rooms must have no overlap at
-- all, the shared hot desk must simply have enough seats left.
-- ---------------------------------------------------------------------
create or replace function public.is_slot_available(
  p_room      text,
  p_date      date,
  p_start     time,
  p_end       time,
  p_attendees integer default 1
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r     public.rooms%rowtype;
  taken integer;
begin
  select * into r from public.rooms where id = p_room and is_active;
  if not found or p_end <= p_start or p_attendees > r.capacity then
    return false;
  end if;

  select coalesce(sum(b.attendees), 0) into taken
  from public.bookings b
  where b.room_id = p_room
    and b.status in ('pending', 'confirmed')
    and b.during && tsrange(p_date + p_start, p_date + p_end, '[)');

  if r.is_exclusive then
    return taken = 0;
  end if;
  return taken + p_attendees <= r.capacity;
end;
$$;

-- ---------------------------------------------------------------------
-- request_booking() — the single call the website makes to book a room.
--
-- Why an RPC instead of a plain INSERT? Because the browser needs the
-- reference number and the price back, but RLS (correctly) forbids the
-- public from SELECTing the bookings table. A SECURITY DEFINER function
-- can insert the row and hand back just those two safe fields.
--
-- It also turns database errors into messages a human can read, so the
-- form can say "that slot has just been taken" instead of
-- "23P01 conflicting key value violates exclusion constraint".
-- ---------------------------------------------------------------------
create or replace function public.request_booking(
  p_full_name  text,
  p_email      text,
  p_phone      text,
  p_company    text,
  p_br_number  text,
  p_room_id    text,
  p_date       date,
  p_start      time,
  p_end        time,
  p_attendees  integer,
  p_payment    public.payment_method,
  p_notes      text default null
)
returns table (reference text, total numeric, hours numeric)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  new_row public.bookings%rowtype;
begin
  insert into public.bookings (
    full_name, email, phone, company, br_number,
    room_id, booking_date, start_time, end_time,
    attendees, payment_method, notes, status, source
  ) values (
    p_full_name, p_email, p_phone,
    coalesce(nullif(btrim(p_company),  ''), 'N/A'),
    coalesce(nullif(btrim(p_br_number),''), 'N/A'),
    p_room_id, p_date, p_start, p_end,
    p_attendees, p_payment, p_notes, 'pending', 'website'
  )
  returning * into new_row;

  return query select new_row.reference, new_row.quoted_total, new_row.quoted_hours;

exception
  -- 23P01 = exclusion_violation, raised by bookings_no_overlap
  when exclusion_violation then
    raise exception
      'That room is already booked for the selected time. Please choose another slot.'
      using errcode = '23P01';
end;
$$;

-- ---------------------------------------------------------------------
-- Grants. RLS decides who may touch a table; GRANT decides who may see
-- the function at all. The public roles get exactly these three.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.rooms to anon, authenticated;
grant insert on public.bookings to anon, authenticated;

-- Staff need to read and update bookings from the admin page. RLS still
-- decides WHICH rows they see (the policies above call is_staff()), but
-- without a table-level GRANT the role cannot touch the table at all.
-- A signed-in user who is NOT in public.staff gets zero rows, not an
-- error — which is exactly what we want.
grant select, update on public.bookings to authenticated;
grant select on public.staff to authenticated;

revoke all on function public.request_booking(
  text, text, text, text, text, text, date, time, time, integer,
  public.payment_method, text) from public;
grant execute on function public.request_booking(
  text, text, text, text, text, text, date, time, time, integer,
  public.payment_method, text) to anon, authenticated;

grant execute on function public.room_busy_slots(text, date) to anon, authenticated;
grant execute on function public.is_slot_available(text, date, time, time, integer) to anon, authenticated;
grant execute on function public.earliest_booking_date() to anon, authenticated;

-- The admin page calls is_staff() to decide whether to show the inbox.
-- Safe to expose: it only ever reports on the CALLER's own account.
grant execute on function public.is_staff() to authenticated;


-- =====================================================================
-- SECTION 10 — THE OFFICE INBOX (a convenience view for staff)
-- =====================================================================
-- security_invoker makes the view respect the RLS of whoever queries
-- it, so this cannot become a back door around the policies in §8.
create or replace view public.bookings_inbox
with (security_invoker = true)
as
select
  b.reference,
  b.status,
  b.booking_date,
  b.start_time,
  b.end_time,
  r.name_en          as room,
  b.attendees,
  b.full_name,
  b.email,
  b.phone,
  b.company,
  b.br_number,
  b.payment_method,
  b.quoted_total,
  b.notes,
  b.internal_note,
  b.created_at
from public.bookings b
join public.rooms r on r.id = b.room_id
order by b.booking_date, b.start_time;

comment on view public.bookings_inbox is
  'Staff-facing list of bookings. Respects RLS via security_invoker.';

grant select on public.bookings_inbox to authenticated;


-- =====================================================================
-- SECTION 11 — ERROR REFERENCE (for the web app)
-- =====================================================================
-- Map these to friendly, translated messages in the booking form:
--
--   SQLSTATE 23P01  ................ the slot is already taken
--   hint 'bookings_capacity' ....... too many attendees for that room
--   hint 'bookings_lead_time' ...... less than 7 working days' notice
--   hint 'bookings_seats_sold_out' . hot desk has no seats left
--   hint 'bookings_rate_limit' ..... too many requests from one email
--   constraint 'bookings_time_order' ... end time is before start time
--   constraint 'bookings_start_window' . start outside 09:00–17:00
--   constraint 'bookings_end_window' ... end outside 10:00–18:00
--   constraint 'bookings_minute_step' .. not on the hour or half hour
-- =====================================================================
