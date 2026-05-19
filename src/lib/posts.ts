import { createAnonClient, createServiceClient } from "./supabase/server";
import type { Post, PostStatus } from "@/types";

function mapPost(row: Record<string, unknown>): Post {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    content: (row.content as Record<string, unknown>) ?? {},
    excerpt: (row.excerpt as string) ?? "",
    status: row.status as PostStatus,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    published_at: (row.published_at as string) ?? null,
  };
}

export async function getPublishedPosts(): Promise<Post[]> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data ? mapPost(data) : null;
}

export async function getAllPostsAdmin(): Promise<Post[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getPostByIdAdmin(id: string): Promise<Post | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPost(data) : null;
}

export async function createPost(input: {
  title: string;
  content: Record<string, unknown>;
  excerpt?: string;
  status: PostStatus;
  slug?: string;
}): Promise<Post> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: input.title,
      content: input.content,
      excerpt: input.excerpt ?? "",
      status: input.status,
      slug: input.slug,
      published_at: input.status === "published" ? now : null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapPost(data);
}

export async function updatePost(
  id: string,
  input: Partial<{
    title: string;
    content: Record<string, unknown>;
    excerpt: string;
    status: PostStatus;
    slug: string;
  }>,
): Promise<Post> {
  const supabase = createServiceClient();
  const patch: Record<string, unknown> = { ...input };
  if (input.status === "published") {
    const existing = await getPostByIdAdmin(id);
    if (existing && !existing.published_at) {
      patch.published_at = new Date().toISOString();
    }
  }
  const { data, error } = await supabase
    .from("posts")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapPost(data);
}

export async function deletePost(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}
