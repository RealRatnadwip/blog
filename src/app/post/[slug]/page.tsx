import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/lib/posts';
import { extractHeadingsFromHtml, formatDisplayDate } from '@/lib/utils';
import { highlightHtmlContent } from '@/lib/highlight';
import { GlassPanel, TagPill } from '@/components/ui';
import { BeforeAfterSlider, BeforeAfterData } from '@/components/before-after';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Post not found' };

  return {
    title: `${post.title} · Arch Terminal Blog`,
    description: post.excerpt ?? 'A modern Linux-inspired post from the terminal blog.',
    openGraph: {
      title: post.title,
      description: post.excerpt,
    },
  };
}

function parseBeforeAfter(html: string): { cleanedHtml: string; data: BeforeAfterData | null } {
  const marker = /<!--\s*before-after:(.*?)-->/s;
  const match = html.match(marker);
  let data: BeforeAfterData | null = null;
  let cleanedHtml = html;

  if (match?.[1]) {
    const params = match[1]
      .split(';')
      .map((chunk) => chunk.split('=').map((part) => part.trim()))
      .filter((pair) => pair.length === 2)
      .reduce<Record<string, string>>((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    if (params.before && params.after) {
      data = {
        before: params.before,
        after: params.after,
        labelBefore: params.labelBefore ?? 'Before',
        labelAfter: params.labelAfter ?? 'After',
        caption: params.caption ?? 'Visual comparison',
      };
    }

    cleanedHtml = html.replace(marker, '');
  }

  return { cleanedHtml, data };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const { cleanedHtml, data } = parseBeforeAfter(post.content_html);
  const contentHtml = await highlightHtmlContent(cleanedHtml);
  const headings = extractHeadingsFromHtml(cleanedHtml);

  return (
    <main className="min-h-screen bg-background text-text">
      <div className="relative isolate overflow-hidden px-6 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <GlassPanel className="p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <TagPill key={tag.slug} label={`#${tag.name}`} href={`/tag/${tag.slug}`} />
                  ))}
                </div>
                <h1 className="text-4xl font-semibold text-white">{post.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                  <span>{formatDisplayDate(post.published_at)}</span>
                  <span className="text-slate-600">•</span>
                  <span>{post.reading_time} min read</span>
                </div>
                <p className="max-w-3xl text-base leading-7 text-slate-300">{post.excerpt ?? 'A polished technical post with live code, terminal design, and responsive media.'}</p>
              </div>
              <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-6 text-sm text-slate-300">
                <p className="uppercase tracking-[0.35em] text-slate-400">post metadata</p>
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Status</span>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.35em] text-slate-200">{post.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Featured</span>
                    <span className="text-slate-200">{post.is_featured ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.8fr_0.85fr]">
            <article className="prose prose-invert max-w-none rounded-[2rem] border border-slate-700/60 bg-slate-950/80 p-8 shadow-glow prose-img:rounded-3xl prose-img:border prose-img:border-slate-800 prose-a:text-accent prose-code:text-accent prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
              <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
            </article>

            <aside className="hidden lg:block">
              <GlassPanel className="p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">table of contents</p>
                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  {headings.length ? (
                    headings.map((heading) => {
                      const indentClass = heading.level === 4 ? 'pl-8' : heading.level === 3 ? 'pl-4' : 'pl-0';
                      return (
                        <a
                          key={heading.id}
                          href={`#${heading.id}`}
                          className={`${indentClass} block rounded-2xl px-3 py-2 text-slate-300 transition hover:bg-slate-900 hover:text-white`}
                        >
                          {heading.title}
                        </a>
                      );
                    })
                  ) : (
                    <p className="text-slate-500">No headings available yet.</p>
                  )}
                </div>
              </GlassPanel>

              {data ? <BeforeAfterSlider data={data} /> : null}
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
