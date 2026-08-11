// Concurrency proof: two transactions racing for the SAME slot.
// A naive "SELECT then INSERT if free" app check passes both. The
// exclusion constraint must let exactly one win.
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import fs from "node:fs";

const db = new PGlite({ extensions: { btree_gist } });
await db.exec(`
  create schema if not exists auth;
  create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  end $$;
`);
await db.exec(fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
const far = (await db.query("select public.add_working_days(public.today_hk(), 20)::text d")).rows[0].d;

const ins = (who) => db.query(
  `insert into public.bookings (full_name,email,phone,room_id,booking_date,start_time,end_time,attendees,payment_method,source)
   values ($1,$2,'+85200000000','meeting-a',$3::date,'10:00','11:00',2,'fps','website') returning reference`,
  [who, `${who.toLowerCase().replace(/ /g,".")}@example.com`, far]);

// Both "check availability" first — both see a free room.
const a1 = (await db.query("select public.is_slot_available('meeting-a',$1::date,'10:00','11:00',2) v",[far])).rows[0].v;
const a2 = (await db.query("select public.is_slot_available('meeting-a',$1::date,'10:00','11:00',2) v",[far])).rows[0].v;
console.log(`Both callers saw the slot as free: ${a1} / ${a2}  <- an app-only check would accept BOTH`);

const results = await Promise.allSettled([ins("Racer One"), ins("Racer Two")]);
const won = results.filter(r => r.status === "fulfilled");
const lost = results.filter(r => r.status === "rejected");
console.log(`\nFired 2 simultaneous bookings for meeting-a ${far} 10:00–11:00`);
console.log(`  committed: ${won.length}`);
console.log(`  rejected : ${lost.length}  ${lost.map(l => "(" + l.reason.code + ": " + l.reason.message + ")").join("")}`);

const rows = await db.query(
  "select count(*)::int c from public.bookings where room_id='meeting-a' and booking_date=$1 and status in ('pending','confirmed')", [far]);
const pass = won.length === 1 && lost.length === 1 && rows.rows[0].c === 1;
console.log(`  rows actually stored: ${rows.rows[0].c}`);
console.log(`\n${pass ? "✓ PASS" : "✗ FAIL"} — exactly one booking survives the race.`);
process.exit(pass ? 0 : 1);
