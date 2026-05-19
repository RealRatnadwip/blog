import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deletePost, getPostByIdAdmin, updatePost } from "@/lib/posts";
import type { PostStatus } from "@/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const post = await getPostByIdAdmin(id);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const patch: Record<string, unknown> = {};
    if (body.title !== undefined) patch.title = String(body.title).trim();
    if (body.content !== undefined) patch.content = body.content;
    if (body.excerpt !== undefined) patch.excerpt = String(body.excerpt);
    if (body.status !== undefined) patch.status = body.status as PostStatus;
    if (body.slug !== undefined) patch.slug = String(body.slug).trim();
    const post = await updatePost(id, patch);
    return NextResponse.json(post);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    await deletePost(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
