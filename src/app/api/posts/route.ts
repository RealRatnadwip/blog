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
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const title = String(payload.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const status = (payload.status ?? "draft") as PostStatus;
  const validStatuses: PostStatus[] = [
    "draft",
    "published",
    "archived",
    "private",
    "unlinked",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const slug = String(payload.slug ?? "").trim() || generateSlug();
  const content =
    typeof payload.content === "object" && payload.content !== null
      ? (payload.content as Record<string, unknown>)
      : {};

  try {
    const post = await createPost({
      title,
      content,
      excerpt: String(payload.excerpt ?? ""),
      status,
      slug,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create post";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
