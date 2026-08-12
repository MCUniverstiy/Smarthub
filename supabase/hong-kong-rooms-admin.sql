-- =====================================================================
-- HONG KONG ROOMS — make the six Wan Chai rooms editable from admin
-- =====================================================================
-- WHY THIS EXISTS
--
-- The six Wan Chai rooms were hardcoded in src/lib/booking-data.ts. The
-- copy in `public.rooms` was only there so the booking engine had rates
-- and capacities to enforce: the public pages never read it. Editing a
-- room in the admin dashboard therefore changed nothing a visitor saw.
--
-- This script makes `public.rooms` the source of truth for the public
-- site too, by adding the columns the website needs (photo, description
-- per language, icon) and seeding them from the values that were in the
-- code.
--
-- WHY NOT `global_listings`?
--
-- Because `public.bookings.room_id` is a foreign key to `public.rooms`,
-- and the booking trigger prices every Hong Kong request from
-- `rooms.rate` / `rooms.unit`, enforces capacity from `rooms.capacity`
-- and decides hot-desk seat-sharing from `rooms.is_exclusive`. Moving
-- the Wan Chai rooms into `global_listings` would mean rebuilding the
-- overlap prevention, the seat counting and the quoting. `global_listings`
-- stays what it is: the partner-office network in China, Singapore and
-- Cyprus, which is request-only and has no such engine behind it.
--
-- SAFE TO RE-RUN. Every statement is idempotent.
--
-- HOW TO RUN
--   Supabase dashboard → SQL Editor → New query → paste → Run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- SECTION 1 — THE EDITABLE COLUMNS
-- ---------------------------------------------------------------------
-- `add column if not exists` means running this twice does nothing the
-- second time, and running it against a database that already has the
-- columns is a no-op rather than an error.

alter table public.rooms add column if not exists blurb_en    text not null default '';
alter table public.rooms add column if not exists blurb_zh_hk text not null default '';
alter table public.rooms add column if not exists blurb_zh_cn text not null default '';
alter table public.rooms add column if not exists image_url   text;
alter table public.rooms add column if not exists emoji       text;

comment on column public.rooms.blurb_en is
  'One-line description shown on the room card. Was ROOMS[].blurb.en in booking-data.ts.';
comment on column public.rooms.image_url is
  'Photo shown on the room card. A path like /conferenceRoom.jpeg serves from public/, or paste any full URL.';
comment on column public.rooms.emoji is
  'Small icon on the room card and in the Google Form. Optional.';


-- ---------------------------------------------------------------------
-- SECTION 2 — SEED FROM WHAT WAS IN THE CODE
-- ---------------------------------------------------------------------
-- Only fills blanks. `where ... = ''` and `where image_url is null` mean
-- that once a member of staff has edited a room, re-running this script
-- will NOT overwrite their wording with the original copy.

update public.rooms set
  blurb_en    = case when blurb_en    = '' then v.blurb_en    else blurb_en    end,
  blurb_zh_hk = case when blurb_zh_hk = '' then v.blurb_zh_hk else blurb_zh_hk end,
  blurb_zh_cn = case when blurb_zh_cn = '' then v.blurb_zh_cn else blurb_zh_cn end,
  image_url   = coalesce(image_url, v.image_url),
  emoji       = coalesce(emoji, v.emoji)
from (values
  ('meeting-a',
   'Bright boardroom with display screen — ideal for client meetings.',
   '光猛董事房，配顯示屏——最適合客戶會議。',
   '明亮董事房，配显示屏——最适合客户会议。',
   '/conferenceRoom.jpeg', '🏢'),
  ('hot-desk',
   'Drop-in desk in the shared work area, charged per day.',
   '共享工作區即用工位，以日計算。',
   '共享工作区即用工位，以日计算。',
   '/hotDesk.jpeg', '💻'),
  ('meeting-b',
   'Premium boardroom with video conferencing and harbour-side light.',
   '高級董事房，設視像會議設備，臨海採光。',
   '高级董事房，设视频会议设备，临海采光。',
   '/mainAreaKaraoke.jpeg', '🏢'),
  ('event-space',
   'Open floor for seminars, launches and training — AV included.',
   '開放式場地，適合講座、發布會及培訓，附影音設備。',
   '开放式场地，适合讲座、发布会及培训，附影音设备。',
   '/mainAreaChairs.jpeg', '🎤'),
  ('meeting-c',
   'Compact huddle room for interviews and small reviews.',
   '小型會議室，適合面試及小組討論。',
   '小型会议室，适合面试及小组讨论。',
   '/sofaRoom.jpeg', '🏢'),
  ('director',
   'Private executive room for confidential discussions.',
   '私密行政房間，適合機密商談。',
   '私密行政房间，适合机密商谈。',
   '/managerRoom.jpeg', '👔')
) as v(id, blurb_en, blurb_zh_hk, blurb_zh_cn, image_url, emoji)
where public.rooms.id = v.id;


-- ---------------------------------------------------------------------
-- SECTION 3 — LET STAFF WRITE
-- ---------------------------------------------------------------------
-- The `rooms_staff_write` policy in schema.sql already says a staff
-- member may change any row. But RLS only decides WHICH rows a role may
-- touch; the role also needs a table-level GRANT to touch the table at
-- all. schema.sql grants only `select` on rooms, so without this an
-- admin edit fails with "permission denied for table rooms".
--
-- `authenticated` is every signed-in user, but the policy still calls
-- is_staff(), so a signed-in non-staff user updates zero rows.

grant select, update on public.rooms to authenticated;

-- Belt and braces: recreate the policy in case this database predates it.
drop policy if exists rooms_staff_write on public.rooms;
create policy rooms_staff_write
  on public.rooms for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- The public still reads only active rooms. Unchanged, restated so this
-- script is a complete description of who can do what to this table.
drop policy if exists rooms_public_read on public.rooms;
create policy rooms_public_read
  on public.rooms for select
  to anon, authenticated
  using (is_active);


-- =====================================================================
-- CHECK IT WORKED
-- =====================================================================
--
--   select id, name_en, capacity, rate, unit, is_active, image_url
--   from public.rooms order by sort_order;
--
-- Six rows, each with an image_url. Then open the admin dashboard,
-- Hong Kong rooms, change a rate and reload the booking page.
--
-- To take a room off the website without deleting its booking history:
--
--   update public.rooms set is_active = false where id = 'meeting-c';
--
-- =====================================================================
