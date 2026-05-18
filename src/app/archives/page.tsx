import Link from 'next/link';
import { getPublishedPosts, getTopTags } from '@/lib/posts';
import { GlassPanel } from '@/components/ui';
import { PostCard } from '@/components/blog';

export default async function Archives() {
  const [posts, tags] = await Promise.all([getPublishedPosts({ limit: 100 }), getTopTags()]);

  return (
    <main className="min-h-screen bg-background text-text">
      <div className="relative isolate overflow-hidden px-6 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_0.8fr]">
            <section className="space-y-8">
              <GlassPanel className="p-8">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">archive</p>
                <h1 className="mt-4 text-4xl font-semibold text-white">All published articles</h1>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  Browse the full timeline of technical posts, tutorials, and Linux-inspired stories.
                </p>
              </GlassPanel>

              <div className="grid gap-6">
                {posts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            </section>

            <aside className="space-y-6">
              <GlassPanel className="p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">tags</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.length ? (
                    tags.map((tag) => (
                      <Link key={tag.slug} href={`/tag/${tag.slug}`} className="rounded-full border border-slate-700/80 px-3 py-1 text-xs text-slate-200 transition hover:border-accent hover:text-white">
                        #{tag.name}
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No tags available yet.</p>
                  )}
                </div>
              </GlassPanel>

              <GlassPanel className="p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">admin</p>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  Manage drafts, publish posts, and keep the blog fresh at the secured admin dashboard.
                </p>
                <Link href="/admin" className="mt-6 inline-flex rounded-full border border-slate-700/80 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-slate-900">
                  Open admin panel
                </Link>
              </GlassPanel>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
