# Where to get the Supabase keys

**What you need:** two values — a URL and a public key. Both come from the same
page. About 2 minutes.

---

## Quickest route

Open your project at [supabase.com/dashboard](https://supabase.com/dashboard),
then go to:

**Project Settings** (⚙️ bottom of the left sidebar) → **API Keys**

Or jump straight there — this URL works for whichever project you opened last:

```
https://supabase.com/dashboard/project/_/settings/api-keys
```

There is also a green **Connect** button at the top of the dashboard which
shows both values pre-filled for Next.js. Either is fine.

---

## Value 1 — the Project URL

Looks like:

```
https://abcdefghijklmnop.supabase.co
```

That middle part is your project reference — a random string, not something you
choose. Copy the whole URL including `https://`.

If you cannot see it on the API Keys page, it is also under **Project Settings
→ General → Project URL**, or in the **Connect** dialog.

---

## Value 2 — the public key

**This is where it gets confusing, so read this bit.**

Supabase changed how keys work in 2025. Depending on when your project was
created, you will see one of two things — and the site accepts either.

### If your project is newer (created from about November 2025)

You have a **publishable key**. On the **API Keys** tab you will see:

```
sb_publishable_ACJWlzQHlZjBrEguHvfOxg_abc123
```

Short, starts with `sb_publishable_`. Copy it and use:

```
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

> If the API Keys tab is empty, click **Create new API Keys**. Newer projects
> sometimes have not generated them yet.

### If your project is older

You have an **anon key** instead. It is on the **Legacy API Keys** tab — a very
long string starting `eyJ`:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...
```

Copy it and use:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Both work identically with this site. If you have both, use the publishable
one — Supabase is removing the legacy `anon` key at the end of 2026.

---

## ⚠️ The one you must NOT use

On the same page you will see a **secret key** (`sb_secret_...`) or, on older
projects, a **service_role** key.

**Do not put that one in the website.**

It bypasses every security rule in the database. With it, anyone who views your
page source could read every customer's name, email and phone number, and
confirm or delete any booking. The whole security model in
`supabase/schema.sql` assumes the browser only ever has the *public* key.

Telling them apart:

| | Public key ✅ | Secret key ❌ |
| --- | --- | --- |
| Looks like | `sb_publishable_...` or `eyJ...` | `sb_secret_...` or `eyJ...` |
| Dashboard label | "Publishable" / "anon" / "public" | "Secret" / "service_role" |
| Hidden by default? | No | Yes — you must click "Reveal" |
| Safe in the browser? | **Yes, by design** | **Never** |

**Rule of thumb: if you had to click "Reveal" to see it, it does not belong in
this website.** This site never needs the secret key for anything.

---

## Setting them locally

Create a file called `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-actual-key
```

Then restart the dev server — Next.js only reads env files at startup.

`.env.local` is gitignored, so it will not be committed. Do not rename it to
`.env` and commit that.

---

## Setting them on Vercel

1. Vercel dashboard → your project → **Settings** → **Environment Variables**
2. Add each one:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`, Value: your URL
   - Name: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, Value: your key
3. Tick **Production**, **Preview** and **Development** for both.
4. **Redeploy.**

> **Vercel does not apply new environment variables to existing deployments.**
> Until you redeploy, the live site will keep saying "No database connected"
> even though the variables are set. Deployments → ⋯ → **Redeploy**.

---

## Checking it worked

Visit `/#/admin` on your site:

| What you see | Meaning |
| --- | --- |
| "No database connected" | The variables are missing, misspelled, or you have not redeployed |
| "Staff sign in" | ✅ Keys are working — now create a login (`docs/staff-login.md`) |

Locally you can also check the browser console on any page. A wrong key
produces `Invalid API key`; a wrong URL produces a DNS or network error.

---

## Is it really safe to publish this key?

Yes — and it is worth understanding why, because it looks alarming.

The publishable/anon key identifies *the application*, not *a person*. It says
"this request came from the Smarthub website", nothing more. Supabase designed
it to be shipped in browser code.

What stops it being dangerous is row level security. Every table in
`supabase/schema.sql` has RLS enabled, and the policies grant this key exactly
two abilities:

- create a **pending** booking
- read the room list

It cannot list bookings, read anyone's email, confirm a booking, or delete
anything. We test that: `supabase/tests/schema.test.mjs` signs in as the `anon`
role and asserts it gets zero rows from the bookings table.

The danger is a public key on a database with RLS **off** — then it really is
an open door. That is not the case here, and the Security Advisor in your
Supabase dashboard will warn you if it ever becomes the case.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| "No database connected" on `#/admin` | Variables unset or not deployed | Check spelling, redeploy on Vercel |
| Still failing after setting them locally | Dev server was not restarted | Stop and restart `npm run dev` |
| `Invalid API key` in the console | Key truncated or from another project | Re-copy the whole value |
| Booking form works but nothing appears in the database | Site is falling back to the Google Form | Means the keys are not being read — see the first row |
| API Keys tab looks empty | New project, keys not generated | Click **Create new API Keys** |
| Cannot find the Legacy tab | New project — it does not have legacy keys | Use the publishable key |

---

## Related

- `docs/staff-login.md` — creating a login for the booking inbox
- `supabase/README.md` — running the SQL, the error map, decisions
