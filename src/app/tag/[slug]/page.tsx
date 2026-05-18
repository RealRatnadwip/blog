import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostsByTag, getTagBySlug } from '@/lib/posts';
import { GlassPanel } from '@/components/ui';
import { PostCard } from '@/components/blog';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const tag = await getTagBySlug(params.slug);
  if (!tag) return { title: 'Tag not found' };

  return {
    title: `#${tag.name} · Arch Terminal Blog`,
    description: `Browse posts tagged with ${tag.name}`,
  };
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const tag = await getTagBySlug(params.slug);
  if (!tag) notFound();

  const posts = await getPostsByTag(params.slug);
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="relative isolate overflow-hidden px-6 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_0.8fr]">
            <section className="space-y-8">
              <GlassPanel className="p-8">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">category</p>
                <h1 className="mt-4 text-4xl font-semibold text-white">#{tag.name}</h1>
                <p className="mt-4 text-sm leading-7 text-slate-300">Explore posts that match the {tag.name} workflow, tooling, and terminal style.</p>
              </GlassPanel>

              <div className="grid gap-6">
                {posts.length ? posts.map((post) => <PostCard key={post.slug} post={post} />) : (
                  <GlassPanel className="p-8 text-center text-slate-400">
                    No published posts found for this category yet.
                  </GlassPanel>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <GlassPanel className="p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">browse archive</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">Search the archive for different tags and discover archived posts.</p>
                <Link href="/archives" className="mt-6 inline-flex rounded-full border border-slate-700/80 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-slate-900">
                  View archive
                </Link>
              </GlassPanel>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
