import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import fs from "node:fs";

const db = new PGlite({ extensions: { btree_gist } });
let pass=0, fail=0;
const ok=(n,c,x="")=>c?(pass++,console.log("  ✓",n)):(fail++,console.log("  ✗ FAIL",n,x));
const expectFail=async(n,fn,m)=>{try{await fn();ok(n,false,"was ACCEPTED");}catch(e){ok(n,m?(e.message+(e.hint||"")).toLowerCase().includes(m.toLowerCase()):true,e.message.slice(0,60));}};

await db.exec(`create schema if not exists auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create or replace function auth.uid() returns uuid language sql stable as $$ select current_setting('test.uid',true)::uuid $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
    if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  end $$;`);

console.log("=== 1. Runs after schema.sql, and is idempotent ===");
await db.exec(fs.readFileSync("supabase/schema.sql","utf8"));
try{ await db.exec(fs.readFileSync("supabase/enquiries.sql","utf8")); ok("enquiries.sql executes",true);}catch(e){ok("enquiries.sql executes",false,e.message);process.exit(1);}
try{ await db.exec(fs.readFileSync("supabase/enquiries.sql","utf8")); ok("second run succeeds",true);}catch(e){ok("second run",false,e.message);}

console.log("\n=== 2. The happy path (what the contact form does) ===");
const r=await db.query(`select * from public.submit_enquiry('Jane Chan','JANE@Example.com ','+852 9876 5432','AcmeCo','company-formation','I need help incorporating.','contact-page','zh-HK')`);
ok("returns a reference", /^EN-\d{4}-[A-Z0-9]{6}$/.test(r.rows[0].reference), r.rows[0].reference);
const row=(await db.query("select * from public.enquiries where reference=$1",[r.rows[0].reference])).rows[0];
ok("email lowercased and trimmed", row.email==="jane@example.com", row.email);
ok("status defaults to new", row.status==="new");
ok("language captured for the reply", row.lang==="zh-HK");
ok("service captured", row.service==="company-formation");

console.log("\n=== 3. Optional fields really are optional ===");
const r2=await db.query(`select * from public.submit_enquiry('Bob','bob@e.com',null,null,null,'Just a question.')`);
ok("works with no phone/company/service", !!r2.rows[0].reference);
const row2=(await db.query("select phone,company,service,source from public.enquiries where reference=$1",[r2.rows[0].reference])).rows[0];
ok("blank phone stored as NULL not ''", row2.phone===null, JSON.stringify(row2));
ok("source defaults to contact-page", row2.source==="contact-page");

console.log("\n=== 4. Bad input rejected ===");
await expectFail("bad email rejected", ()=>db.query(`select * from public.submit_enquiry('X','not-an-email',null,null,null,'hi')`), "email");
await expectFail("empty message rejected", ()=>db.query(`select * from public.submit_enquiry('X','x@e.com',null,null,null,'   ')`), "message");
await expectFail("empty name rejected", ()=>db.query(`select * from public.submit_enquiry('  ','x@e.com',null,null,null,'hi')`), "full_name");
await expectFail("5001-char message rejected", ()=>db.query(`select * from public.submit_enquiry('X','x@e.com',null,null,null,$1)`,["z".repeat(5001)]), "message");
await expectFail("bad lang code rejected", ()=>db.query(`select * from public.submit_enquiry('X','x@e.com',null,null,null,'hi','contact-page','fr')`), "lang");

console.log("\n=== 5. Rate limit ===");
let limited=false;
for(let i=0;i<8;i++){
  try{ await db.query(`select * from public.submit_enquiry('Spam','spam@e.com',null,null,null,'msg ${i}')`); }
  catch(e){ if(/24 hours/.test(e.message)){limited=true;break;} }
}
ok("6th unanswered enquiry from one email is blocked", limited);

console.log("\n=== 6. ★ The public key cannot read anyone's messages ===");
await db.exec("set role anon");
for(const [n,q] of [["select enquiries","select * from public.enquiries"],
                    ["select enquiries_inbox","select * from public.enquiries_inbox"],
                    ["update enquiries","update public.enquiries set status='closed'"],
                    ["delete enquiries","delete from public.enquiries"]]){
  try{
    const res=await db.query(q);
    const leaked=JSON.stringify(res.rows).includes("jane@example.com");
    ok(`anon ${n}: no data`, !leaked && res.rows.length===0, `${res.rows.length} rows`);
  }catch(e){ ok(`anon ${n}: denied`, true); }
}
// but the RPC must still work for the public
try{
  const pr=await db.query(`select * from public.submit_enquiry('Anon Visitor','v@e.com',null,null,'virtual-office','Hello from the website')`);
  ok("anon CAN still submit via the RPC", !!pr.rows[0].reference);
}catch(e){ ok("anon CAN still submit via the RPC", false, e.message); }
await expectFail("anon cannot file a pre-closed enquiry",
  ()=>db.query(`insert into public.enquiries (full_name,email,message,status) values ('H','h@e.com','x','closed')`));
await expectFail("anon cannot attach an internal note",
  ()=>db.query(`insert into public.enquiries (full_name,email,message,internal_note) values ('H','h@e.com','x','sneaky')`));
await db.exec("reset role");

console.log("\n=== 7. Signed in but NOT staff sees nothing ===");
await db.query("insert into auth.users (email) values ('stranger@gmail.com')");
const sid=(await db.query("select id from auth.users where email='stranger@gmail.com'")).rows[0].id;
await db.exec(`set test.uid='${sid}'`); await db.exec("set role authenticated");
const nonstaff=await db.query("select * from public.enquiries_inbox");
ok("non-staff gets 0 rows", nonstaff.rows.length===0, `${nonstaff.rows.length} rows`);
await db.exec("reset role");

console.log("\n=== 8. Staff CAN read the inbox ===");
await db.query("insert into auth.users (email) values ('boss@smarthubc.com')");
const bid=(await db.query("select id from auth.users where email='boss@smarthubc.com'")).rows[0].id;
await db.query("insert into public.staff (user_id,email) select id,email from auth.users where email='boss@smarthubc.com'");
await db.exec(`set test.uid='${bid}'`); await db.exec("set role authenticated");
const inbox=await db.query("select * from public.enquiries_inbox");
ok("staff sees the enquiries", inbox.rows.length>0, `${inbox.rows.length} rows`);
ok("inbox exposes message + contact details", inbox.fields.map(f=>f.name).includes("message"));
await db.exec("reset role");

console.log(`\n${"=".repeat(56)}\nRESULT: ${pass} passed, ${fail} failed\n${"=".repeat(56)}`);
process.exit(fail?1:0);
