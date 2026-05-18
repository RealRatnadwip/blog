import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import supabaseAdmin from '@/lib/supabase/server';
import { generateReadingTime, slugify } from '@/lib/utils';

async function ensureAuthenticated() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies().getAll().map((cookie) => ({ name: cookie.name, value: cookie.value })),
      },
    }
  );
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

function apiError(message: string, status = 400) {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function buildPostPayload(body: { title?: string; slug?: string; content_html?: string; excerpt?: string; featured_image?: string; status?: string; is_featured?: boolean; published_at?: string; tags?: string[] }) {
  const publishedAt = body.status === 'published' ? body.published_at || new Date().toISOString() : null;
  return {
    title: body.title,
    slug: body.slug || slugify(body.title || ''),
    content_html: body.content_html,
    excerpt: body.excerpt || '',
    featured_image: body.featured_image || null,
    status: body.status || 'draft',
    is_featured: Boolean(body.is_featured),
    published_at: publishedAt,
    reading_time: body.content_html ? generateReadingTime(body.content_html) : 1,
  };
}

export async function GET() {
  const session = await ensureAuthenticated();
  if (!session) return apiError('Unauthorized', 401);

  const { data, error } = await supabaseAdmin.from('posts').select('*').order('created_at', { ascending: false });
  if (error) return apiError(error.message, 500);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const session = await ensureAuthenticated();
  if (!session) return apiError('Unauthorized', 401);

  const body = await request.json();
  if (!body.title || !body.content_html) {
    return apiError('Title and content are required');
  }

  const postPayload = buildPostPayload(body);
  const { data, error } = await supabaseAdmin.from('posts').insert(postPayload).select('*').single();
  if (error || !data) {
    return apiError(error?.message || 'Failed to create post', 500);
  }

  if (Array.isArray(body.tags)) {
    const tags = body.tags.map((name: string) => ({ name, slug: slugify(name) }));
    const { data: tagData, error: tagError } = await supabaseAdmin.from('tags').upsert(tags, { onConflict: 'slug' }).select('*');
    if (tagError) {
      return apiError(tagError.message, 500);
    }
    await supabaseAdmin.from('post_tags').insert(
      (tagData ?? []).map((tag: { id: string }) => ({ post_id: data.id, tag_id: tag.id }))
    );
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const session = await ensureAuthenticated();
  if (!session) return apiError('Unauthorized', 401);

  const body = await request.json();
  if (!body.id) {
    return apiError('Missing post id');
  }

  const postPayload = buildPostPayload(body);
  const { data, error } = await supabaseAdmin.from('posts').update(postPayload).eq('id', body.id).select('*').single();
  if (error || !data) {
    return apiError(error?.message || 'Failed to update post', 500);
  }

  if (Array.isArray(body.tags)) {
    const tags = body.tags.map((name: string) => ({ name, slug: slugify(name) }));
    const { data: tagData, error: tagError } = await supabaseAdmin.from('tags').upsert(tags, { onConflict: 'slug' }).select('*');
    if (tagError) {
      return apiError(tagError.message, 500);
    }
    await supabaseAdmin.from('post_tags').delete().eq('post_id', data.id);
    if (tagData?.length) {
      await supabaseAdmin.from('post_tags').insert(
        tagData.map((tag: { id: string }) => ({ post_id: data.id, tag_id: tag.id }))
      );
    }
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const session = await ensureAuthenticated();
  if (!session) return apiError('Unauthorized', 401);

  const body = await request.json();
  if (!body.id) {
    return apiError('Missing post id');
  }

  const { error } = await supabaseAdmin.from('posts').delete().eq('id', body.id);
  if (error) {
    return apiError(error.message, 500);
  }

  return NextResponse.json({ success: true });
}
