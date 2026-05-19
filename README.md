# Blog Desktop (Linux Mint themed CMS)

A personal blog at `blog.yourdomain.com` with:

- **Public site**: Linux Mint–style desktop (Notes, Files, Terminal, Settings)
- **Admin CMS** at `/admin` (single user, credentials from `.env`)
- **Posts** at `/{slug}` (e.g. `/af3rjiw93`)
- **Stack**: Next.js 16, Supabase (DB + Storage), Vercel

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run SQL from [`supabase/schema.sql`](supabase/schema.sql) in the SQL Editor.
3. Create a **public** storage bucket named `blog-media`.
4. Copy **Project URL**, **anon key**, and **service role key**.

### 2. Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | CMS login (only you) |
| `AUTH_SECRET` | Session signing (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_SUPABASE_*` | Client + public reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Server uploads & admin API |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (e.g. `https://blog.example.com`) |

### 3. Local dev

```bash
npm install
npm run dev
```

- Desktop: http://localhost:3000  
- Admin: http://localhost:3000/admin  

### 4. Vercel + custom domain

1. Push repo to GitHub and import in Vercel.
2. Add the same env vars in **Project → Settings → Environment Variables**.
3. Add domain `blog.example.com` in Vercel → Domains.
4. Point DNS (CNAME) to Vercel as instructed.

## Post statuses

| Status | Behavior |
|--------|----------|
| `published` | Visible on desktop & direct URL |
| `draft` | Admin only |
| `archived` | Hidden from public |
| `private` | Hidden from public |
| `unlinked` | Not listed in Notes; URL may still work if published before — set to draft/private to fully hide |

## Media privacy

- Uploads are **compressed on the server** (images → WebP via Sharp).
- Storage keys are **random hashes**; original filenames are never stored.
- Only optimized public URLs are saved in the database.

## Admin editor

TipTap-based editor supports bold/italic, headings, lists, code blocks, links, images, videos, YouTube embeds, and image compare markers (`[compare:before|after]` rendered as a slider on the desktop).
