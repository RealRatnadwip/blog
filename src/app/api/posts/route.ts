import { NextResponse } from 'next/server';
import { getPublishedPosts, getPostsByTag, searchPosts } from '@/lib/posts';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') ?? '';
  const tag = url.searchParams.get('tag') ?? '';

  if (tag) {
    const posts = await getPostsByTag(tag);
    return NextResponse.json({ data: posts });
  }

  if (search) {
    const posts = await searchPosts(search);
    return NextResponse.json({ data: posts });
  }

  const posts = await getPublishedPosts({ limit: 24 });
  return NextResponse.json({ data: posts });
}
