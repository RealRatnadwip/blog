"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { AdminEditor } from '@/components/admin-editor';
import { MediaUploader } from '@/components/media-uploader';
import { Button, GlassPanel, Input, TagPill } from '@/components/ui';
import type { Post, Tag } from '@/lib/types';

const defaultDraft = {
  id: '',
  title: '',
  slug: '',
  excerpt: '',
  featured_image: '',
  status: 'draft',
  is_featured: false,
  content_html: '<p></p>',
  tags: '',
  published_at: '',
};

export default function AdminPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [session, setSession] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState({ ...defaultDraft });
  const [editorHtml, setEditorHtml] = useState(defaultDraft.content_html);
  const [loginCredentials, setLoginCredentials] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(Boolean(data?.session));
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(Boolean(session));
      if (session) {
        loadAdminData();
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (session) {
      loadAdminData();
    }
  }, [session]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [postsResponse, tagsResponse] = await Promise.all([
        fetch('/api/admin/posts').then((res) => res.json()),
        fetch('/api/admin/tags').then((res) => res.json()),
      ]);
      setPosts(postsResponse?.data ?? []);
      setTags(tagsResponse?.data ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setAuthError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginCredentials.email,
      password: loginCredentials.password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    if (data.session) {
      setSession(true);
      setLoading(false);
      loadAdminData();
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(false);
    setDraft({ ...defaultDraft });
    setEditorHtml(defaultDraft.content_html);
    setPosts([]);
    setTags([]);
  }

  async function handleSavePost() {
    setMessage('Saving post…');
    const payload = {
      ...draft,
      content_html: editorHtml,
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
    try {
      const response = await fetch('/api/admin/posts', {
        method: draft.id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
        headers: { 'content-type': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save post');
      setMessage('Post saved successfully.');
      setDraft({ ...defaultDraft });
      setEditorHtml(defaultDraft.content_html);
      loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage((error as Error).message);
    }
  }

  async function handleSelectPost(post: Post) {
    setDraft({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      featured_image: post.featured_image ?? '',
      status: post.status,
      is_featured: post.is_featured,
      content_html: post.content_html,
      tags: post.tags.map((tag) => tag.name).join(', '),
      published_at: post.published_at ?? '',
    });
    setEditorHtml(post.content_html);
  }

  async function handleDeletePost(postId: string) {
    if (!window.confirm('Delete this post permanently?')) return;
    setMessage('Deleting post…');
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'DELETE',
        body: JSON.stringify({ id: postId }),
        headers: { 'content-type': 'application/json' },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to delete post');
      setMessage('Post removed.');
      setDraft({ ...defaultDraft });
      setEditorHtml(defaultDraft.content_html);
      loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage((error as Error).message);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-text">
        <div className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
          <GlassPanel className="p-10 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">admin portal</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Loading dashboard…</h1>
          </GlassPanel>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-background text-text">
        <div className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
          <GlassPanel className="max-w-xl p-10">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">admin login</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Secure access</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">Log in with your Supabase admin account to manage posts, tags, and drafts.</p>
            <form className="mt-8 space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm uppercase tracking-[0.35em] text-slate-500">Email</label>
                <Input value={loginCredentials.email} onChange={(event) => setLoginCredentials({ ...loginCredentials, email: event.target.value })} placeholder="admin@example.com" type="email" />
              </div>
              <div>
                <label className="block text-sm uppercase tracking-[0.35em] text-slate-500">Password</label>
                <Input value={loginCredentials.password} onChange={(event) => setLoginCredentials({ ...loginCredentials, password: event.target.value })} placeholder="Supabase password" type="password" />
              </div>
              {authError ? <p className="text-sm text-rose-300">{authError}</p> : null}
              <Button type="submit" className="w-full">Sign in</Button>
            </form>
          </GlassPanel>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text">
      <div className="px-6 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">admin dashboard</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Manage your terminal blog</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">Create posts, publish drafts, manage tags, and keep your feed aligned with the Arch-inspired aesthetic.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setDraft({ ...defaultDraft })}>
                New draft
              </Button>
              <Button type="button" variant="ghost" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
            <section className="space-y-6">
              <GlassPanel className="p-8">
                <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr] lg:items-center">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">current draft</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">{draft.id ? 'Editing existing post' : 'Start a fresh draft'}</h2>
                  </div>
                  <div className="grid gap-3">
                    <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Post title" />
                    <Input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="Post slug (optional)" />
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="p-8 space-y-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
                  <Input value={draft.excerpt} onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })} placeholder="Post excerpt" />
                  <Input value={draft.featured_image} onChange={(event) => setDraft({ ...draft, featured_image: event.target.value })} placeholder="Featured image URL" />
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_0.48fr]">
                  <Input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="Comma-separated tags" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-700/90 bg-slate-950/80 px-4 py-3">
                      <input checked={draft.is_featured} onChange={(event) => setDraft({ ...draft, is_featured: event.target.checked })} type="checkbox" className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-accent focus:ring-accent" />
                      <span className="text-sm text-slate-300">Feature post</span>
                    </div>
                    <select className="rounded-2xl border border-slate-700/90 bg-slate-950/80 px-4 py-3 text-slate-100 outline-none" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                      <option value="private">Private</option>
                      <option value="unlisted">Unlisted</option>
                    </select>
                  </div>
                </div>
              </GlassPanel>

              <GlassPanel className="p-8">
                <AdminEditor initialHtml={editorHtml} onChange={setEditorHtml} />
              </GlassPanel>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-400">{message || 'Posts and drafts are stored in Supabase.'}</div>
                <div className="flex flex-wrap gap-3">
                  {draft.id ? (
                    <Button type="button" variant="danger" onClick={() => draft.id && handleDeletePost(draft.id)}>
                      Delete
                    </Button>
                  ) : null}
                  <Button type="button" onClick={handleSavePost}>
                    Save post
                  </Button>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <GlassPanel className="p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">published posts</p>
                <div className="mt-5 space-y-4">
                  {posts.length ? (
                    posts.map((post) => (
                      <div key={post.id} className="rounded-3xl border border-slate-700/70 bg-slate-950/80 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-white">{post.title}</h3>
                            <p className="mt-1 text-xs text-slate-500">{post.status} — {post.reading_time} min</p>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => handleSelectPost(post)}>
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">No posts available yet.</p>
                  )}
                </div>
              </GlassPanel>

              <GlassPanel className="p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400">tags</p>
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.35em] text-slate-200">{tags.length}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.length ? tags.map((tag) => <TagPill key={tag.id} label={`#${tag.name}`} />) : <p className="text-sm text-slate-500">No tags created yet.</p>}
                </div>
              </GlassPanel>

              <MediaUploader />
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
