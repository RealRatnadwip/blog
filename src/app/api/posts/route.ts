import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createPost, getAllPostsAdmin } from "@/lib/posts";
import { generateSlug } from "@/lib/slug";
import type { PostStatus } from "@/types";

export async function GET() {
  try {
    await requireAdmin();
    const posts = await getAllPostsAdmin();
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    const status = (body.status ?? "draft") as PostStatus;
    const slug = body.slug?.trim() || generateSlug();
    const post = await createPost({
      title,
      content: body.content ?? {},
      excerpt: body.excerpt ?? "",
      status,
      slug,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create post";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
