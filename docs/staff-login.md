# Creating a staff login for the booking inbox

**Who this is for:** whoever runs the Supabase project. About 3 minutes.

**What you get at the end:** you can go to `yoursite.com/#/admin`, sign in, and
see every booking with Confirm / Decline / Cancel buttons.

---

## Why this is two steps and not one

This trips people up, so it is worth 30 seconds up front.

There are **two separate things**, and you need both:

| | What it is | Where it lives |
| --- | --- | --- |
| **An account** | An email + password that can sign in | Supabase's own `auth.users` table |
| **A staff pass** | Permission to *see bookings* | Our `public.staff` table |

Having an account gets you through the front door. It does **not** get you into
the booking inbox. That is deliberate: it means a stranger can sign up to your
Supabase project and still see absolutely nothing, because the security rules
on the bookings table check the staff list, not merely "are you signed in".

So: **Step 1 creates the account. Step 2 grants the staff pass.**

---

## Step 1 — Create the account

1. Open your project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the left sidebar click **Authentication**.
3. Click **Users** (top of the Authentication section).
4. Top right, click **Add user** → **Create new user**.
5. Fill in:
   - **Email** — the address the person will sign in with, e.g.
     `boss@smarthubc.com`
   - **Password** — pick a strong one; they can change it later
   - **Auto Confirm User** — ✅ **tick this box**
6. Click **Create user**.

> **Tick "Auto Confirm User".** If you leave it unticked, Supabase marks the
> account as awaiting email confirmation and sign-in fails with
> `Email not confirmed` — which looks like a wrong password and is genuinely
> confusing to debug.

You should now see the email listed under Users. **Copy the email exactly as it
appears here** — you need it character-for-character in Step 2.

---

## Step 2 — Grant the staff pass

1. In the left sidebar click **SQL Editor**.
2. Click **New query**.
3. Paste this, replacing `you@smarthubc.com` with the email from Step 1:

```sql
insert into public.staff (user_id, email)
select id, email from auth.users where email = 'you@smarthubc.com'
on conflict (user_id) do nothing
returning user_id, email;
```

4. Press **Run** (or Ctrl/Cmd + Enter).

### Read the result carefully

| What you see | What it means | What to do |
| --- | --- | --- |
| A row with a `user_id` and the email | ✅ Worked | Go to Step 3 |
| `Success. No rows returned` | ❌ **The email matched no account** | Nothing was added. See below. |

**This is the one real trap.** If the email is even slightly off — a typo,
`.com` vs `.com.hk`, a stray space, different capitalisation — the query finds
nobody, inserts nothing, and reports **success anyway**. There is no error
message. I tested this exact case; it fails completely silently.

If you got "No rows returned", list the accounts that actually exist and copy
one from the output:

```sql
select id, email, email_confirmed_at from auth.users order by created_at desc;
```

Then run the insert again with the exact email from that list.

---

## Step 3 — Confirm it worked

Run this in the SQL Editor:

```sql
select s.email,
       s.role,
       (u.id is not null) as has_login,
       (u.email_confirmed_at is not null) as can_sign_in
from public.staff s
left join auth.users u on u.id = s.user_id;
```

You want a row where **`has_login` and `can_sign_in` are both `true`**.

- `has_login = false` → the staff row points at an account that no longer
  exists. Delete the row and redo Step 2.
- `can_sign_in = false` → the account was created without **Auto Confirm
  User**. Fix it with:

  ```sql
  update auth.users
  set email_confirmed_at = now()
  where email = 'you@smarthubc.com';
  ```

---

## Step 4 — Sign in

1. Go to `yoursite.com/#/admin` (or `localhost:3000/#/admin` locally).
2. Enter the email and password from Step 1.

You should land on the booking inbox.

> The `#/admin` page is not linked from the navbar, footer or sitemap — you
> have to type the URL. **That is convenience, not security.** The real
> protection is the staff list: anyone can visit the URL, but without a row in
> `public.staff` they see an empty page.

---

## Adding more people later

Repeat Step 1 for each person, then run Step 2 with their email. Or add several
at once:

```sql
insert into public.staff (user_id, email)
select id, email from auth.users
where email in ('alice@smarthubc.com', 'ben@smarthubc.com')
on conflict (user_id) do nothing
returning email;
```

The `returning` line tells you how many were actually added — if you expected
two and got one, one of the emails does not match an account.

## Removing someone

```sql
delete from public.staff where email = 'leaver@smarthubc.com';
```

They lose access to the inbox immediately, but their login still exists. To
remove the login too, delete the user under **Authentication → Users**.

---

## Locking the front door (recommended)

By default anyone can create an account on your Supabase project. They will not
see any bookings — the staff list stops that — but if nobody outside the team
ever needs an account, turn signups off:

**Project Settings → Authentication → User Signups → "Allow new users to sign
up" → off → Save.**

You can still create accounts yourself with **Add user**, which is exactly what
Step 1 does. This does not affect the booking form; visitors booking a room are
anonymous and never sign in.

---

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| "This account has no access" | Signed in, but no `public.staff` row | Step 2, then check Step 3 |
| `Invalid login credentials` | Wrong password, or no such account | Reset password under Authentication → Users |
| `Email not confirmed` | **Auto Confirm User** was not ticked | The `update auth.users` snippet in Step 3 |
| "No database connected" | The site has no Supabase env vars | Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Inbox loads but is empty | No bookings yet, or the status filter is hiding them | Click the **All** chip |
| `relation "public.staff" does not exist` | `supabase/schema.sql` has not been run | Run it — see `supabase/README.md` |
| **`Success. No rows returned`** on Step 2 | **Email did not match any account** | List `auth.users` and copy the exact email |

---

## What "staff" actually controls

For the curious. Every security policy on the bookings table calls this:

```sql
create or replace function public.is_staff()
returns boolean
as $$
  select exists (
    select 1 from public.staff s where s.user_id = auth.uid()
  );
$$;
```

`auth.uid()` is whoever is signed in right now. So the question the database
asks on **every single query** is "is this person's id in the staff table?" If
not, the query returns zero rows — not an error, just nothing.

That is why this cannot be bypassed from the browser: it is not the page
deciding what to show, it is the database deciding what to send.
