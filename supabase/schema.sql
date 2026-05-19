-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  content jsonb not null default '{}',
  excerpt text default '',
  status text not null default 'draft'
    check (status in ('published', 'draft', 'archived', 'private', 'unlinked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_key text not null unique,
  public_path text not null,
  mime_type text not null,
  media_type text not null check (media_type in ('image', 'video')),
  width int,
  height int,
  size_bytes int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_status_idx on posts (status);
create index if not exists posts_slug_idx on posts (slug);
create index if not exists media_type_idx on media_assets (media_type);

alter table posts enable row level security;
alter table media_assets enable row level security;

create policy "public read published posts"
  on posts for select
  using (status = 'published');

create policy "public read media"
  on media_assets for select
  using (true);

-- Storage bucket (create in Dashboard): blog-media, public read
-- Policy: authenticated service role uploads via API only

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists posts_updated_at on posts;
create trigger posts_updated_at
  before update on posts
  for each row execute function set_updated_at();
