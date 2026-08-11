# Deployment Guide — Smarthub Connect

This guide walks you through getting the site from this project onto GitHub and then live on Vercel. No prior deployment experience needed.

---

## Overview (the big picture)

The flow is:

```
Your computer  →  GitHub (code storage)  →  Vercel (hosting)  →  Live website
```

1. **GitHub** stores your code and tracks changes. Vercel watches your GitHub repo.
2. **Vercel** builds and hosts the website. Every time you push code to GitHub, Vercel automatically rebuilds and deploys the site.
3. Your **custom domain** (smarthubc.com) points to Vercel so visitors see your site.

---

## Before You Start — Checklist

Make sure you have these accounts (all free):

- [ ] **GitHub account** — https://github.com/signup
- [ ] **Vercel account** — https://vercel.com/signup (sign up WITH your GitHub account — it links them automatically)
- [ ] **Supabase account** (bookings + contact enquiries) — https://supabase.com (free tier is plenty)
- [ ] **Git installed on your computer** — check by running `git --version` in terminal. If not installed: https://git-scm.com/downloads

---

## Step 1: Prep the Code (already done — just verify)

I've already cleaned up the project for deployment. Here's what was changed:

| What | Why |
|---|---|
| Removed `output: "standalone"` from `next.config.ts` | Vercel handles builds natively — standalone mode is for custom servers |
| Fixed `build` script in `package.json` (was copying files to standalone folder) | Vercel runs `next build` directly |
| Added `postinstall: "prisma generate"` to `package.json` | So the Prisma client builds correctly on Vercel |
| Contact form writes to Supabase; the Formspree relay is optional | Formspree's free tier is 50 submissions/month, too low to depend on |
| Created `.env.example` with all needed env vars | Template for what env vars you need to set |
| Updated `.gitignore` to exclude junk (logs, screenshots, .zscripts, etc.) | So you don't pollute GitHub with sandbox files |

**Test that the build works:**
```bash
bun run build
```
Should say "✓ Compiled successfully". (I already verified this — it works.)

---

## Step 2: Push the Code to GitHub

### Option A: Using the GitHub website (easiest, no Git CLI needed)

1. Go to https://github.com/new
2. **Repository name**: `smarthub-connect` (or whatever you want)
3. **Description**: `Smarthub Connect Limited — Hong Kong corporate services website`
4. **Visibility**: **Private** (recommended — it's a client project)
5. **Do NOT** check "Add a README" or ".gitignore" or "license" — we already have these
6. Click **Create repository**
7. GitHub shows you a page with instructions. Look for the section **"...or push an existing repository from the command line"**. Copy those commands.

The commands will look like:
```bash
git remote add origin https://github.com/YOUR_USERNAME/smarthub-connect.git
git branch -M main
git push -u origin main
```

### Option B: Using GitHub Desktop (GUI, no command line)

1. Download GitHub Desktop: https://desktop.github.com/
2. Sign in with your GitHub account
3. Click **File → Add Local Repository**
4. Browse to your project folder
5. Click **publish repository**
6. Keep it **Private**

### Option C: Using the command line (full Git workflow)

If you haven't initialized Git yet in this project:
```bash
cd /path/to/your/project
git init
git add .
git commit -m "Initial commit: Smarthub Connect trilingual website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/smarthub-connect.git
git push -u origin main
```

If Git is already initialized (check by running `git status`):
```bash
git add .
git commit -m "Prep for Vercel deployment"
git push
```

---

## Step 3: Connect to Vercel and Deploy

1. Go to https://vercel.com/new
2. You'll see a list of your GitHub repos. Find `smarthub-connect` and click **Import**.
3. Vercel auto-detects Next.js — you don't need to change any build settings.
4. **Before clicking Deploy**, scroll down to **Environment Variables** and add these:

   | Name | Value | Environments |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-REF.supabase.co` | Production, Preview, Development |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Production, Preview, Development |

   Where to find both: [`docs/supabase-keys.md`](docs/supabase-keys.md).
   Never paste a `sb_secret_...` or `service_role` key here — those bypass
   all security rules and `NEXT_PUBLIC_` ships them to every visitor.

   There is **no Formspree variable to set.** The contact form writes to
   Supabase and the enquiries show up at `#/admin`. `NEXT_PUBLIC_FORMSPREE_ENDPOINT`
   exists but is optional and can stay empty.

5. Click **Deploy**. Vercel will build the site (takes 1–2 minutes).
6. When done, you'll see a success page with a temporary URL like `smarthub-connect-abc123.vercel.app`. Click it to view your live site.

🎉 **Your site is now live on the internet!**

---

## Step 4: Add Your Custom Domain (smarthubc.com)

Right now your site lives at `smarthub-connect-abc123.vercel.app`. To make it live at `smarthubc.com`:

1. In your Vercel project, go to **Settings → Domains**
2. Type `smarthubc.com` and click **Add**
3. Also add `www.smarthubc.com` (redirects to the non-www version)
4. Vercel shows you DNS records to add. They look like:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
5. **Log into your domain registrar** (where you bought `smarthubc.com` — could be GoDaddy, Namecheap, Cloudflare, etc.)
6. Find **DNS settings** and add the records Vercel gave you
7. Wait 5–30 minutes for DNS to propagate
8. Vercel will automatically detect the DNS change and issue an SSL certificate (free, automatic HTTPS)

---

## Step 5: Set Up the Database (bookings + contact form)

1. Supabase dashboard → **SQL Editor** → **New query**
2. Paste all of `supabase/schema.sql` → **Run** (this is the room booking system)
3. New query → paste all of `supabase/enquiries.sql` → **Run** (this is the contact form)
4. New query → paste all of `supabase/deletes.sql` → **Run** (lets you delete
   bookings and enquiries from `#/admin`, with an undo)
5. Create your staff login so you can read them — full walkthrough in
   [`docs/staff-login.md`](docs/staff-login.md)

**Test it:** Go to your live site, fill in the contact form, submit. Then open
`https://yourdomain.com/#/admin`, sign in, and click the **Enquiries** tab. Your
test message should be there.

**Optional — get an email when one arrives:** run
[`supabase/notify-email.sql`](supabase/notify-email.sql). Without it, enquiries
are stored safely but nothing pings you, so someone has to check `#/admin`.

---

## Step 6: Future Updates (how to make changes)

Every time you change code and push to GitHub, Vercel automatically rebuilds and deploys:

```bash
# Make your changes...
git add .
git commit -m "Update pricing page"
git push
```

Vercel detects the push, builds a new version (1-2 min), and swaps it in. Zero downtime.

### Preview deployments
Vercel also creates a **preview URL** for every push (before merging to main). You can share this with your boss to review changes before they go live. Once approved, merge the PR and it goes to production.

---

## Optional: Add Analytics (Plausible)

1. Sign up at https://plausible.io (9-day free trial, then $9/month)
2. Add your site (`smarthubc.com`)
3. They'll give you a snippet like:
   ```html
   <script defer data-domain="smarthubc.com" src="https://plausible.io/js/script.js"></script>
   ```
4. Add this snippet to `src/app/layout.tsx` inside the `<head>` tag
5. Push to GitHub → Vercel auto-deploys → analytics starts working

---

## Troubleshooting

### Build fails on Vercel
- Check the **Build Logs** in Vercel (click your deployment → Logs)
- Common causes:
  - TypeScript error (run `bun run lint` locally to check)
  - `lockfile had changes, but lockfile is frozen` — `package.json` and
    `bun.lock` disagree. Run `bun install` locally and commit the updated
    `bun.lock`.

### Images not loading
- The site uses Unsplash images. If they don't load, check that `images.unsplash.com` is in `next.config.ts → images.remotePatterns` (it is)
- When you replace them with real photos, add your image CDN domain to `remotePatterns`

### Contact form shows error
The form only shows an error when **nothing** stored the enquiry.
- Have you run `supabase/schema.sql` **and** `supabase/enquiries.sql` in the
  Supabase SQL editor? The second one creates the enquiries table.
- Are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  set in Vercel — and did you **redeploy** after adding them? Env vars only
  take effect on the next build.
- Check the browser console for the actual error.

### Enquiries arrive but nobody notices them
They are in `#/admin` → **Enquiries**. To get an email alert as well, run
[`supabase/notify-email.sql`](supabase/notify-email.sql).

### Domain not working
- DNS hasn't propagated yet (can take up to 24 hours, usually 5-30 min)
- Check https://dnschecker.org to see if your domain resolves globally
- Verify DNS records match what Vercel showed you

### Site is slow
- Vercel Edge Network is fast globally, but check if images are huge
- Next.js Image component auto-optimizes, but if you upload 10MB photos, that's still slow
- Compress images before uploading (use https://squoosh.app)

---

## Quick Reference — What Lives Where

| Thing | Where |
|---|---|
| Source code | This project folder → GitHub repo |
| Live website | Vercel (auto-deployed from GitHub) |
| Custom domain | Your domain registrar (DNS points to Vercel) |
| Contact form enquiries | Supabase → `#/admin` → Enquiries tab |
| Room bookings | Supabase → `#/admin` → Bookings tab, and the Google Sheet |
| Environment variables | Vercel → Settings → Environment Variables |
| Build logs | Vercel → your deployment → Logs |
| Analytics (optional) | Plausible dashboard |

---

## Need Help?

- **Vercel docs**: https://vercel.com/docs/getting-started
- **GitHub docs**: https://docs.github.com/en
- **Supabase docs**: https://supabase.com/docs
- **Next.js deployment guide**: https://nextjs.org/docs/app/building-your-application/deploying

You've got this. The site is ready — just follow the steps above.
