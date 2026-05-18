-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users are managed by Supabase Auth, but we can add an admin_users table for custom checks
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media table for uploads
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content_html TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived', 'private', 'unlisted')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    reading_time INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Post Tags relation
CREATE TABLE IF NOT EXISTS public.post_tags (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- RLS Policies

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "Admins have full access to admin_users" ON public.admin_users FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins have full access to media" ON public.media FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
CREATE POLICY "Admins have full access to tags" ON public.tags FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
CREATE POLICY "Admins have full access to posts" ON public.posts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
CREATE POLICY "Admins have full access to post_tags" ON public.post_tags FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Public read access
CREATE POLICY "Public can view media" ON public.media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view tags" ON public.tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public can view published posts" ON public.posts FOR SELECT TO anon, authenticated USING (status = 'published' OR status = 'unlisted');
CREATE POLICY "Public can view post tags" ON public.post_tags FOR SELECT TO anon, authenticated USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
