import { NextResponse } from "next/server";
import { getPublishedPosts } from "@/lib/posts";
import { safePublicQuery } from "@/lib/supabase/safe-query";

export async function GET() {
  const result = await safePublicQuery([], () => getPublishedPosts());
  const body = result.data.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    published_at: p.published_at,
    updated_at: p.updated_at,
  }));

  if (!result.ok) {
    return NextResponse.json(
      { posts: body, warning: result.error },
      { status: 200 },
    );
  }

  return NextResponse.json(body);
}
