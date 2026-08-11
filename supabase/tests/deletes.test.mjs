import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import fs from "node:fs";

const db = new PGlite({ extensions: { btree_gist } });
let pass=0, fail=0;
const ok=(n,c,x="")=>c?(pass++,console.log("  ✓",n)):(fail++,console.log("  ✗ FAIL",n,x));

await db.exec(`create schema if not exists auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create or replace function auth.uid() returns uuid language sql stable as $$ select current_setting('test.uid',true)::uuid $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  end $$;`);
await db.exec(fs.readFileSync("supabase/schema.sql","utf8"));
await db.exec(fs.readFileSync("supabase/enquiries.sql","utf8"));
await db.exec(fs.readFileSync("supabase/deletes.sql","utf8"));
await db.exec(fs.readFileSync("supabase/deletes.sql","utf8"));
ok("deletes.sql installs and is idempotent", true);

// staff + non-staff identities
await db.query("insert into auth.users (email) values ('boss@smarthubc.com'),('stranger@gmail.com')");
const boss=(await db.query("select id from auth.users where email='boss@smarthubc.com'")).rows[0].id;
const stranger=(await db.query("select id from auth.users where email='stranger@gmail.com'")).rows[0].id;
await db.query("insert into public.staff (user_id,email) select id,email from auth.users where email='boss@smarthubc.com'");

const mkBooking = async () => (await db.query(
  `select * from public.request_booking('Jane Chan','jane@e.com','+852 9876 5432','AcmeCo','N/A','meeting-b',
   public.earliest_booking_date(),'10:00','12:00',4,'fps',null)`)).rows[0].reference;
const mkEnquiry = async (em='ask@e.com') => (await db.query(
  `select * from public.submit_enquiry('Ask Person','${em}',null,null,'company-formation','Question here')`)).rows[0].reference;

console.log("\n=== 1. Staff can delete, and the row really goes ===");
let ref = await mkBooking();
await db.exec(`set test.uid='${boss}'`); await db.exec("set role authenticated");
const d = await db.query("select * from public.delete_booking($1,$2)",[ref,"test booking"]);
ok("delete_booking reports deleted=true", d.rows[0].deleted===true);
await db.exec("reset role");
ok("booking is gone from the table", (await db.query("select count(*) c from public.bookings where reference=$1",[ref])).rows[0].c==0);

console.log("\n=== 2. ...but it is archived, not vaporised ===");
const arc=(await db.query("select * from public.deleted_records where reference=$1",[ref])).rows[0];
ok("archived row exists", !!arc);
ok("kind recorded", arc.kind==="booking");
ok("who deleted it is recorded", arc.deleted_email==="boss@smarthubc.com");
ok("reason recorded", arc.reason==="test booking");
ok("full payload kept (name/email/room survive)",
   arc.payload.full_name==="Jane Chan" && arc.payload.email==="jane@e.com" && !!arc.payload.room_id,
   JSON.stringify(arc.payload).slice(0,120));

console.log("\n=== 3. Deleting frees the slot for someone else ===");
const ref2 = await mkBooking();
ok("same room+time is bookable again after the delete", !!ref2, ref2);

console.log("\n=== 4. A deleted booking can be restored ===");
await db.query(`select * from public.request_booking('Temp','t@e.com','+852 1111 1111','C','N/A','meeting-c',
  public.earliest_booking_date(),'14:00','15:00',2,'fps',null)`);
const refC=(await db.query("select reference from public.bookings where room_id='meeting-c'")).rows[0].reference;
await db.exec(`set test.uid='${boss}'`); await db.exec("set role authenticated");
await db.query("select * from public.delete_booking($1)",[refC]);
await db.exec("reset role");
await db.exec(`set test.uid='${boss}'`); await db.exec("set role authenticated");
const rr = await db.query("select * from public.restore_deleted($1)",[refC]);
await db.exec("reset role");
ok("restore_deleted reports success", rr.rows[0].restored===true);
const back=(await db.query("select full_name,start_time,during from public.bookings where reference=$1",[refC])).rows[0];
ok("restored booking is back with its data intact", back?.full_name==="Temp", JSON.stringify(back));
ok("the generated 'during' range was rebuilt", !!back?.during, String(back?.during));
ok("archive entry cleared so it cannot be restored twice",
   (await db.query("select count(*) c from public.deleted_records where reference=$1",[refC])).rows[0].c==0);

// restoring an enquiry too
const eTmp = await mkEnquiry('restore@e.com');
await db.exec(`set test.uid='${boss}'`); await db.exec("set role authenticated");
await db.query("select * from public.delete_enquiry($1)",[eTmp]);
const er = await db.query("select * from public.restore_deleted($1)",[eTmp]);
await db.exec("reset role");
ok("enquiry restores too", er.rows[0].restored===true &&
   (await db.query("select count(*) c from public.enquiries where reference=$1",[eTmp])).rows[0].c==1);

console.log("\n=== 5. Enquiries delete the same way ===");
const eref = await mkEnquiry();
await db.exec(`set test.uid='${boss}'`); await db.exec("set role authenticated");
const ed = await db.query("select * from public.delete_enquiry($1,$2)",[eref,"spam"]);
ok("delete_enquiry works", ed.rows[0].deleted===true);
await db.exec("reset role");
ok("enquiry archived with its message", 
   (await db.query("select payload from public.deleted_records where reference=$1",[eref])).rows[0].payload.message==="Question here");

console.log("\n=== 6. Double-delete is quiet, not an error ===");
await db.exec(`set test.uid='${boss}'`); await db.exec("set role authenticated");
const again = await db.query("select * from public.delete_booking($1)",[ref]);
ok("deleting an already-deleted booking returns deleted=false, no exception", again.rows[0].deleted===false);
await db.exec("reset role");

console.log("\n=== 7. ★ Nobody else can delete anything ===");
const victim = await mkBooking2();
async function mkBooking2(){ return (await db.query(
  `select * from public.request_booking('Victim','v@e.com','+852 2222 2222','V','N/A','director',
   public.earliest_booking_date(),'11:00','12:00',2,'fps',null)`)).rows[0].reference; }

// anon
await db.exec("set role anon");
let blocked=false;
try{ await db.query("select * from public.delete_booking($1)",[victim]); }catch(e){ blocked=true; }
ok("anon cannot call delete_booking", blocked);
let blockedDirect=false;
try{ const r=await db.query("delete from public.bookings"); blockedDirect = r.affectedRows===0; }catch(e){ blockedDirect=true; }
ok("anon cannot DELETE the table directly", blockedDirect);
await db.exec("reset role");

// signed in, not staff
await db.exec(`set test.uid='${stranger}'`); await db.exec("set role authenticated");
let nsBlocked=false;
try{ await db.query("select * from public.delete_booking($1)",[victim]); }
catch(e){ nsBlocked = /only staff/i.test(e.message); }
ok("signed-in non-staff cannot delete (explicit staff check)", nsBlocked);
let nsArchive=true;
try{ nsArchive = (await db.query("select * from public.deleted_records")).rows.length===0; }catch(e){ nsArchive=true; }
ok("non-staff cannot read the archive", nsArchive);
let nsRestore=false;
try{ await db.query("select * from public.restore_deleted($1)",[ref]); }
catch(e){ nsRestore = /only staff/i.test(e.message); }
ok("non-staff cannot restore", nsRestore);
await db.exec("reset role");
ok("the victim booking is still there", (await db.query("select count(*) c from public.bookings where reference=$1",[victim])).rows[0].c==1);

console.log("\n=== 8. No raw DELETE grant exists (archive cannot be bypassed) ===");
const g=await db.query(`select has_table_privilege('authenticated','public.bookings','delete') b,
                               has_table_privilege('authenticated','public.enquiries','delete') e`);
ok("authenticated has no direct DELETE on bookings", g.rows[0].b===false);
ok("authenticated has no direct DELETE on enquiries", g.rows[0].e===false);

console.log(`\n${"=".repeat(56)}\nRESULT: ${pass} passed, ${fail} failed\n${"=".repeat(56)}`);
process.exit(fail?1:0);
