"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Post } from '@/lib/types';
import { formatDisplayDate } from '@/lib/utils';
import { GlassPanel, LoadingSkeleton, TagPill } from './ui';

export function FeatureCard({ post }: { post: Post }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="group overflow-hidden rounded-[2rem] border border-slate-700/70 bg-slate-950/80 shadow-glow backdrop-blur-xl"
    >
      {post.featured_image ? (
        <div className="relative h-56 overflow-hidden rounded-t-[2rem]">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
      ) : null}
      <div className="p-6">
        <div className="flex flex-wrap gap-2 pb-3">
          {post.tags.map((tag) => (
            <TagPill key={tag.slug} label={`#${tag.name}`} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold text-white">{post.title}</h3>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-blue-300">
            {formatDisplayDate(post.published_at)}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-300">{post.excerpt ?? 'A crisp technical story awaits inside.'}</p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <Link href={`/post/${post.slug}`} className="text-sm font-semibold text-accent transition hover:text-accentSoft">
            Read article →
          </Link>
          <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.35em] text-slate-300">
            {post.reading_time} min
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950/70 p-5 transition shadow-lg shadow-transparent hover:border-accent/30 hover:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{post.title}</h3>
        <span className="text-xs uppercase tracking-[0.35em] text-slate-500">{post.reading_time} min</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{post.excerpt ?? 'No excerpt available yet.'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <TagPill key={tag.slug} label={`#${tag.name}`} href={`/tag/${tag.slug}`} />
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Link href={`/post/${post.slug}`} className="text-sm font-semibold text-accent transition hover:text-accentSoft">
          View post
        </Link>
        <time className="text-xs uppercase tracking-[0.35em] text-slate-500">{formatDisplayDate(post.published_at)}</time>
      </div>
    </motion.article>
  );
}

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    setStatus('loading');

    fetch(`/api/posts?search=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setResults(data?.data ?? []);
        setStatus('idle');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error);
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, [query]);

  return (
    <GlassPanel className="p-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">search posts</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Find technical notes, tutorials, and stories.</h2>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-xs uppercase tracking-[0.35em] text-slate-500" htmlFor="search-input">
              search
            </label>
            <input
              id="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type keywords or tags..."
              className="w-full rounded-2xl border border-slate-700/90 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="rounded-3xl border border-slate-700/70 bg-slate-950/70 p-4">
            {status === 'loading' ? (
              <LoadingSkeleton />
            ) : status === 'error' ? (
              <p className="text-sm text-rose-300">Unable to fetch search results.</p>
            ) : query.length < 2 ? (
              <p className="text-sm text-slate-400">Enter at least two characters to search.</p>
            ) : results.length ? (
              <div className="space-y-4">
                {results.slice(0, 5).map((post) => (
                  <article key={post.id} className="rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4">
                    <Link href={`/post/${post.slug}`} className="text-sm font-semibold text-accent hover:text-accentSoft">
                      {post.title}
                    </Link>
                    <p className="mt-2 text-xs text-slate-400">{post.excerpt ?? 'Read the full article.'}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No posts found for that query.</p>
            )}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
