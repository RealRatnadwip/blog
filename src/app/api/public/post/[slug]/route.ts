import { NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/posts";
import { safePublicQuery } from "@/lib/supabase/safe-query";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params;
  const result = await safePublicQuery(null, () => getPostBySlug(slug));

  if (!result.data) {
    if (!result.ok) {
      return NextResponse.json(
        { error: "Not found", warning: result.error },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const post = result.data;
  return NextResponse.json({
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    published_at: post.published_at,
    ...(result.ok ? {} : { warning: result.error }),
  });
}
