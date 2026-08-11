import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import fs from "node:fs";

const sql = fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8");
const db = new PGlite({ extensions: { btree_gist } });

let pass = 0, fail = 0;
const ok = (n, c, extra = "") => { c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗ FAIL", n, extra)); };

// PGlite has no auth schema / roles. Shim just enough to run the script.
await db.exec(`
  create schema if not exists auth;
  create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
  end $$;
`);

console.log("\n=== 1. Script runs clean ===");
try { await db.exec(sql); ok("schema.sql executes without error", true); }
catch (e) { ok("schema.sql executes without error", false, e.message); console.error(e); process.exit(1); }

console.log("\n=== 2. Script is idempotent (re-runnable) ===");
try { await db.exec(sql); ok("second run succeeds, no duplicate errors", true); }
catch (e) { ok("second run succeeds", false, e.message); }

const rooms = await db.query("select id, capacity, rate, unit, is_exclusive from public.rooms order by sort_order");
console.log("\n=== 3. Catalogue matches booking-data.ts ===");
const expect = [
  ["meeting-a", 10, "500.00", "hour", true],
  ["hot-desk", 30, "350.00", "day", false],
  ["meeting-b", 10, "800.00", "hour", true],
  ["event-space", 30, "1000.00", "hour", true],
  ["meeting-c", 6, "300.00", "hour", true],
  ["director", 5, "300.00", "hour", true],
];
ok("6 rooms seeded exactly once (idempotent insert)", rooms.rows.length === 6, `got ${rooms.rows.length}`);
expect.forEach(([id, cap, rate, unit, excl], i) => {
  const r = rooms.rows[i];
  ok(`${id}: ${cap}pax ${rate}/${unit} exclusive=${excl}`,
    r.id === id && r.capacity === cap && String(r.rate) === rate && r.unit === unit && r.is_exclusive === excl,
    JSON.stringify(r));
});

// helper: future date that is a weekday, well past the 7-working-day rule
const far = (await db.query("select public.add_working_days(public.today_hk(), 20)::text d")).rows[0].d;
const near = (await db.query("select public.add_working_days(public.today_hk(), 25)::text d")).rows[0].d;

const book = (over = {}) => {
  const b = { name: "Ada Wong", email: "ada@example.com", phone: "+85245716234",
    company: "N/A", br: "N/A", room: "meeting-b", date: far,
    start: "10:00", end: "12:00", pax: 4, pay: "bank-transfer", ...over };
  return db.query(
    `insert into public.bookings (full_name,email,phone,company,br_number,room_id,booking_date,start_time,end_time,attendees,payment_method,source)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning reference, quoted_total, quoted_hours, status`,
    [b.name, b.email, b.phone, b.company, b.br, b.room, b.date, b.start, b.end, b.pax, b.pay, b.source ?? "website"]
  );
};
const expectFail = async (name, fn, match) => {
  try { await fn(); ok(name, false, "expected an error but it was ACCEPTED"); }
  catch (e) { ok(name, match ? (e.message + (e.hint || "")).toLowerCase().includes(match.toLowerCase()) : true, e.message); }
};

console.log("\n=== 4. add_working_days() matches the TypeScript twin ===");
// TS: addWorkingDays(Fri 2026-08-14, 7) -> 2026-08-25
const wd = await db.query("select public.add_working_days(date '2026-08-14', 7)::text d");
ok("Fri 2026-08-14 + 7 working days = 2026-08-25", wd.rows[0].d === "2026-08-25", wd.rows[0].d);
const wd2 = await db.query("select public.add_working_days(date '2026-08-14', 1)::text d");
ok("Fri + 1 working day skips the weekend = Mon 2026-08-17", wd2.rows[0].d === "2026-08-17", wd2.rows[0].d);

console.log("\n=== 5. A normal booking is accepted and priced ===");
const first = await book();
ok("insert returns a reference", /^SH-\d{4}-[A-Z0-9]{6}$/.test(first.rows[0].reference), first.rows[0].reference);
ok("status defaults to pending", first.rows[0].status === "pending");
// meeting-b 800/hr, 10:00-12:00 = 2h -> 1600
ok("meeting-b 10:00–12:00 quoted 1600.00", String(first.rows[0].quoted_total) === "1600.00", String(first.rows[0].quoted_total));

console.log("\n=== 6. ★ DOUBLE-BOOKING IS IMPOSSIBLE (the whole point) ===");
await expectFail("exact same slot rejected", () => book(), "conflicting key");
await expectFail("partial overlap 11:00–13:00 rejected", () => book({ start: "11:00", end: "13:00" }), "conflicting key");
await expectFail("fully enclosing 09:00–17:00 rejected", () => book({ start: "09:00", end: "17:00" }), "conflicting key");
await expectFail("fully enclosed 10:30–11:00 rejected", () => book({ start: "10:30", end: "11:00" }), "conflicting key");
// back-to-back MUST be allowed ('[)' bounds)
const backToBack = await book({ start: "12:00", end: "13:00" });
ok("back-to-back 12:00–13:00 IS allowed (no false clash)", !!backToBack.rows[0].reference);
const otherRoom = await book({ room: "meeting-c", pax: 4 });
ok("same time in a DIFFERENT room is allowed", !!otherRoom.rows[0].reference);
const otherDay = await book({ date: near });
ok("same room+time on a DIFFERENT day is allowed", !!otherDay.rows[0].reference);

console.log("\n=== 7. Cancelling releases the slot ===");
await db.query("update public.bookings set status='cancelled' where reference=$1", [first.rows[0].reference]);
const rebooked = await book();
ok("slot is bookable again after cancellation", !!rebooked.rows[0].reference);
await db.query("update public.bookings set status='cancelled' where reference=$1", [rebooked.rows[0].reference]);

console.log("\n=== 8. Form rules enforced by the database ===");
await expectFail("end before start rejected", () => book({ room: "director", start: "14:00", end: "11:00" }), "bookings_time_order");
await expectFail("start before 09:00 rejected", () => book({ room: "director", start: "08:00", end: "11:00" }), "bookings_start_window");
await expectFail("start after 17:00 rejected", () => book({ room: "director", start: "17:30", end: "18:00" }), "bookings_start_window");
await expectFail("end after 18:00 rejected", () => book({ room: "director", start: "16:00", end: "18:30" }), "bookings_end_window");
await expectFail("15-minute granularity rejected", () => book({ room: "director", start: "10:15", end: "11:00" }), "bookings_minute_step");
await expectFail("over capacity rejected (director holds 5)", () => book({ room: "director", pax: 6 }), "holds 5 people");
await expectFail("bad email rejected", () => book({ room: "director", email: "not-an-email" }), "email");
await expectFail("unknown room rejected", () => book({ room: "penthouse" }), "unknown room");
await expectFail("tomorrow rejected: under 7 working days",
  () => db.query(`insert into public.bookings (full_name,email,phone,room_id,booking_date,start_time,end_time,attendees,payment_method,source)
    values ('X','x@e.com','+85200000000','director', public.today_hk()+1,'10:00','11:00',2,'fps','website')`),
  "7 working days");

console.log("\n=== 9. Staff may bypass the lead time (source='admin') ===");
const walkIn = await db.query(`insert into public.bookings (full_name,email,phone,room_id,booking_date,start_time,end_time,attendees,payment_method,source)
  values ('Walk In','w@e.com','+85200000000','director', public.today_hk()+1,'10:00','11:00',2,'fps','admin') returning reference`);
ok("admin booking for tomorrow accepted", !!walkIn.rows[0].reference);

console.log("\n=== 10. Hot Desk is sold by the seat, not exclusively ===");
const hd = (pax, over = {}) => book({ room: "hot-desk", pax, start: "09:00", end: "17:00", ...over });
const h1 = await hd(20);
ok("20 of 30 seats booked", !!h1.rows[0].reference);
// hot-desk is a DAY rate: 350 flat regardless of 8 hours
ok("hot desk charged the flat day rate 350.00", String(h1.rows[0].quoted_total) === "350.00", String(h1.rows[0].quoted_total));
const h2 = await hd(10, { email: "b@example.com" });
ok("a second, overlapping hot-desk booking IS allowed (10 more seats)", !!h2.rows[0].reference);
await expectFail("31st seat rejected — capacity respected", () => hd(1, { email: "c@example.com" }), "seats are left");

console.log("\n=== 11. is_slot_available() tells the truth ===");
const avail = async (...a) => (await db.query("select public.is_slot_available($1,$2,$3,$4,$5) v", a)).rows[0].v;
ok("busy meeting-b slot reports unavailable", (await avail("meeting-b", far, "12:00", "13:00", 2)) === false);
ok("free meeting-b slot reports available", (await avail("meeting-b", far, "15:00", "16:00", 2)) === true);
ok("full hot desk reports unavailable", (await avail("hot-desk", far, "09:00", "17:00", 1)) === false);
ok("over-capacity request reports unavailable", (await avail("director", far, "09:00", "10:00", 99)) === false);

console.log("\n=== 12. room_busy_slots() leaks no personal data ===");
const busy = await db.query("select * from public.room_busy_slots('meeting-b', $1)", [far]);
const cols = busy.fields.map(f => f.name);
ok("returns only starts/ends/seats", JSON.stringify(cols) === '["starts","ends","seats"]', JSON.stringify(cols));
ok("no email/name/phone column present", !cols.some(c => /email|name|phone/.test(c)));

console.log("\n=== 13. request_booking() RPC ===");
const rpc = await db.query(
  `select * from public.request_booking('Bob Chan','bob@example.com','+85212345678','Acme','BR123',
     'event-space', $1::date, '14:00','16:00', 25, 'fps', 'Projector please')`, [far]);
ok("returns reference + total + hours", !!rpc.rows[0].reference && String(rpc.rows[0].total) === "2000.00", JSON.stringify(rpc.rows[0]));
const rpcRow = await db.query("select status, source, company from public.bookings where reference=$1", [rpc.rows[0].reference]);
ok("RPC forces status=pending, source=website", rpcRow.rows[0].status === "pending" && rpcRow.rows[0].source === "website");
await expectFail("RPC surfaces a friendly clash message",
  () => db.query(`select * from public.request_booking('Eve','eve@example.com','+85212345678','N/A','N/A',
     'event-space', $1::date, '15:00','16:00', 5, 'fps', null)`, [far]),
  "already booked for the selected time");

console.log("\n=== 14. Rate limit: max 5 pending per email per day ===");
let limited = false;
for (let i = 0; i < 8; i++) {
  try {
    await db.query(`insert into public.bookings (full_name,email,phone,room_id,booking_date,start_time,end_time,attendees,payment_method,source)
      values ('Spam','spam@example.com','+85200000000','meeting-a', $1::date, '09:00','10:00',1,'fps','website')`,
      [ (await db.query("select (public.add_working_days(public.today_hk(), $1))::text d",[30+i])).rows[0].d ]);
  } catch (e) { if (/24 hours/.test(e.message)) { limited = true; break; } }
}
ok("6th pending request from one email is blocked", limited);

console.log("\n=== 15. RLS is switched on everywhere ===");
const rls = await db.query(`select relname, relrowsecurity from pg_class
  where relname in ('rooms','bookings','staff') order by relname`);
rls.rows.forEach(r => ok(`RLS enabled on ${r.relname}`, r.relrowsecurity === true));
const pol = await db.query("select policyname, cmd from pg_policies where schemaname='public' order by policyname");
ok("policies created", pol.rows.length >= 6, JSON.stringify(pol.rows.map(p=>p.policyname)));
console.log("    policies:", pol.rows.map(p => `${p.policyname}(${p.cmd})`).join(", "));

console.log("\n=== 16. The anon key cannot read customer data ===");
// Simulate what the public website's key can actually do.
await db.exec("set role anon");
let anonRead = null;
try { const r = await db.query("select count(*)::int c from public.bookings"); anonRead = r.rows[0].c; }
catch (e) { anonRead = "denied:" + e.message.slice(0, 40); }
ok("anon SELECT on bookings returns 0 rows / denied", anonRead === 0 || String(anonRead).startsWith("denied"), String(anonRead));
let anonRooms = 0;
try { anonRooms = (await db.query("select count(*)::int c from public.rooms")).rows[0].c; } catch { }
ok("anon CAN still read the room catalogue", anonRooms === 6, String(anonRooms));
await expectFail("anon cannot insert a pre-confirmed booking",
  () => db.query(`insert into public.bookings (full_name,email,phone,room_id,booking_date,start_time,end_time,attendees,payment_method,status,source)
    values ('Hacker','h@e.com','+85200000000','director', $1::date,'09:00','10:00',1,'fps','confirmed','website')`, [far]));
await expectFail("anon cannot delete bookings",
  () => db.query("delete from public.bookings"));
await db.exec("reset role");

console.log(`\n${"=".repeat(58)}\nRESULT: ${pass} passed, ${fail} failed\n${"=".repeat(58)}`);
process.exit(fail ? 1 : 0);
