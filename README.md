# Arch Terminal Blog

A modern full-stack blog platform built with **Next.js App Router**, **TailwindCSS**, **Supabase**, **Tiptap**, **Framer Motion**, and **Shiki**.

## Features

- Responsive public blog with featured posts and archive listing
- Search, tag filtering, and category-friendly archive views
- Dynamic post pages at `/post/[slug]`
- Syntax highlighted code blocks and embedded video support
- Admin dashboard at `/admin` with secure Supabase login
- Post creation, editing, drafts, archiving, private/unlisted support
- Media upload support for Supabase storage
- Terminal-inspired dark UI with glassmorphism and animated hover states
- Vercel-ready configuration and Supabase-compatible deployment

## Setup

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Update `.env.local` with your Supabase values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ADMIN_EMAIL`

3. Create your Supabase tables using `supabase_schema.sql`.

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Supabase Schema

The database schema is defined in `supabase_schema.sql` and includes:

- `posts`
- `tags`
- `media`
- `post_tags`
- `admin_users`

## Deployment

This application is compatible with Vercel free tier. Set your environment variables in Vercel, then deploy the repository.

### Recommended Vercel env vars

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ADMIN_EMAIL`

## Notes

- This project does not install dependencies automatically. Use your preferred package manager locally.
- The admin panel uses Supabase authentication and protects `/admin` routes with middleware.
- Use the `/admin` dashboard to manage posts, tags, and media.

## License

MIT
