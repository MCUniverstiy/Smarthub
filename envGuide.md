# Guide: .env

## What is this file?
`.env` is the **environment variables file**. It stores configuration that changes between environments (development, staging, production) and should NOT be committed to git (secrets like API keys, database URLs, etc.).

## What's in it?
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

Just one line. It tells Prisma (the database ORM) where to find the SQLite database file.

### What does `DATABASE_URL` mean?
- `file:` prefix means "use a local file-based database" (SQLite)
- `/home/z/my-project/db/custom.db` is the path to the database file
- This is a LOCAL development database — it only exists on this machine

## The .gitignore rule
Check `.gitignore` — it should include `.env`. This prevents secrets from being committed to GitHub. **Never commit `.env` files with real passwords or API keys.**

## When would you edit this file?
When you add a feature that needs external configuration:
```
# Database (already exists)
DATABASE_URL=file:/home/z/my-project/db/custom.db

# Optional email relay for the contact form — safe to leave blank.
# Enquiries are saved to Supabase and read at #/admin regardless.
FORMSPREE_ENDPOINT=https://formspree.io/f/your-real-id

# Analytics (when you add Plausible/Vercel Analytics)
NEXT_PUBLIC_ANALYTICS_DOMAIN=smarthubc.com

# Newsletter (when you set up Mailchimp/ConvertKit)
NEWSLETTER_API_KEY=your-api-key-here
```

## Rules for .env files
1. **Never commit it to git** (it should be in `.gitignore`)
2. **Never put spaces around `=`**: `KEY=value` not `KEY = value`
3. **No quotes needed for strings**: `KEY=hello` not `KEY="hello"` (quotes are optional)
4. **Comments start with `#`**: `# This is a comment`
5. **`NEXT_PUBLIC_` prefix**: Variables starting with `NEXT_PUBLIC_` are exposed to the browser. Use this for non-secret config (like analytics domain). Everything else is server-only.

## Accessing env vars in code
```typescript
// Server-side only (default):
const dbUrl = process.env.DATABASE_URL;

// Client-side (must start with NEXT_PUBLIC_):
const analyticsDomain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
```

## Common beginner questions

**Q: Is the database actually being used?**
A: No — the project has Prisma configured (`src/lib/db.ts`) but none of the pages use it. The database file exists but no data is read or written. It's available if you need to add a database later (e.g. for storing form submissions).

**Q: What happens if I delete this file?**
A: Prisma will throw an error when you try to use the database. Since we don't currently use the database, the site will still work fine — but `bun run db:push` would fail.

**Q: Should I create a `.env.local` file?**
A: Yes, for local development secrets. `.env.local` overrides `.env` and is also gitignored. Use `.env` for shared config and `.env.local` for personal secrets.
