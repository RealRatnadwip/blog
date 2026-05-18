import supabaseAdmin from '@/lib/supabase/server';
import { generateReadingTime, slugify } from '@/lib/utils';
import type { Post, Tag } from '@/lib/types';

function attachTagsToPosts(posts: Array<Post>, rows: Array<{ tags?: Tag | null; post_id: string }>) {
  const tagsByPost = rows.reduce<Record<string, Tag[]>>((acc, row) => {
    const tag = row.tags;
    if (!tag) return acc;
    const postId = row.post_id;
    if (!acc[postId]) acc[postId] = [];
    acc[postId].push({ id: tag.id, name: tag.name, slug: tag.slug });
    return acc;
  }, {});

  return posts.map((post) => ({
    ...post,
    tags: tagsByPost[post.id] ?? [],
  }));
}

async function loadTagsForPosts(posts: Array<Post>) {
  if (!posts.length) return posts;
  const postIds = posts.map((post) => post.id);
  const { data, error } = await supabaseAdmin
    .from('post_tags')
    .select('post_id, tags(id, name, slug)')
    .in('post_id', postIds);

  if (error) {
    console.error('Unable to load tags for posts', error.message);
    return posts.map((post) => ({ ...post, tags: [] }));
  }

  return attachTagsToPosts(posts, (data as unknown as Array<{ tags?: Tag | null; post_id: string }>) ?? []);
}

export async function getFeaturedPosts(): Promise<Post[]> {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(3);

  if (error || !data) {
    console.error('Failed to fetch featured posts', error?.message);
    return [];
  }

  return await loadTagsForPosts(data as Post[]);
}

export async function getPublishedPosts({
  limit = 12,
  offset = 0,
}: {
  limit?: number;
  offset?: number;
} = {}): Promise<Post[]> {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    console.error('Failed to fetch posts', error?.message);
    return [];
  }

  return await loadTagsForPosts(data as Post[]);
}

export async function getTopTags(): Promise<Tag[]> {
  const { data, error } = await supabaseAdmin.from('tags').select('*').order('name');
  if (error || !data) {
    console.error('Unable to fetch tags', error?.message);
    return [];
  }
  return data as Tag[];
}

export async function getPostsByTag(tagSlug: string): Promise<Post[]> {
  const tag = await getTagBySlug(tagSlug);
  if (!tag) return [];

  const { data: relations, error: relationError } = await supabaseAdmin
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tag.id);

  if (relationError || !relations?.length) {
    if (relationError) console.error('Failed to fetch post tags', relationError.message);
    return [];
  }

  const postIds = relations.map((relation: { post_id: string }) => relation.post_id);
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .in('id', postIds)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error || !data) {
    console.error('Failed to fetch posts by tag', error?.message);
    return [];
  }

  return await loadTagsForPosts(data as Post[]);
}

export async function getPostBySlug(slug: string, options?: { preview?: boolean }): Promise<Post | null> {
  const query = supabaseAdmin.from('posts').select('*').eq('slug', slug).limit(1);
  if (!options?.preview) {
    query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error || !data || !data.length) {
    console.error('Post not found', error?.message);
    return null;
  }

  const post = data[0] as Post;
  const tags = await getTagsForPost(post.id);
  return { ...post, tags };
}

export async function getTagsForPost(postId: string): Promise<Tag[]> {
  const { data, error } = await supabaseAdmin
    .from('post_tags')
    .select('tags(id, name, slug)')
    .eq('post_id', postId);

  if (error || !data) {
    console.error('Cannot fetch tags for post', error?.message);
    return [];
  }

  return (data as unknown as { tags: Tag }[]).map((row) => row.tags);
}

export async function searchPosts(queryString: string): Promise<Post[]> {
  const query = queryString.trim();
  if (!query) return [];

  const wildcard = `%${query}%`;
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*')
    .or(`title.ilike.${wildcard},excerpt.ilike.${wildcard},content_html.ilike.${wildcard}`)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error || !data) {
    console.error('Search query failed', error?.message);
    return [];
  }

  return await loadTagsForPosts(data as Post[]);
}

export async function upsertTags(tagNames: string[]) {
  const slugs = tagNames.map((name) => ({ name, slug: slugify(name) }));
  const { data, error } = await supabaseAdmin.from('tags').upsert(slugs, { onConflict: 'slug' }).select('*');

  if (error || !data) {
    console.error('Tag upsert failed', error?.message);
    return [];
  }

  return data as Tag[];
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const { data, error } = await supabaseAdmin.from('tags').select('*').eq('slug', slug).limit(1);
  if (error || !data || !data.length) return null;
  return data[0] as Tag;
}

export async function upsertPost(post: Partial<Post> & { tags?: string[] }) {
  const now = new Date().toISOString();
  const publishedAt = post.status === 'published' ? post.published_at ?? now : post.published_at ?? null;
  const input = {
    ...post,
    published_at: publishedAt,
    reading_time: post.content_html ? generateReadingTime(post.content_html) : 1,
  };

  const { data, error } = await supabaseAdmin.from('posts').upsert(input, { onConflict: 'slug' }).select('*').single();
  if (error || !data) {
    throw new Error(error?.message || 'Unable to save post');
  }

  if (post.tags?.length) {
    const savedTags = await upsertTags(post.tags);
    await supabaseAdmin.from('post_tags').delete().eq('post_id', data.id);
    await supabaseAdmin.from('post_tags').insert(savedTags.map((tag) => ({ post_id: data.id, tag_id: tag.id })));
  }

  return { ...data, tags: await getTagsForPost(data.id) } as Post;
}

export async function deletePost(postId: string) {
  const { error } = await supabaseAdmin.from('posts').delete().eq('id', postId);
  if (error) {
    throw new Error(error.message);
  }
}
