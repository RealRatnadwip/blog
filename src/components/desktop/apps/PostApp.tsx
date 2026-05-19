"use client";

import { useEffect, useState } from "react";
import { PostContent } from "../PostContent";
import { ClientTime } from "../ClientTime";
import type { Post } from "@/types";

type Props = { slug: string };

export function PostApp({ slug }: Props) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/public/post/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPost(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load post");
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <p className="post-loading">Loading…</p>;
  if (error || !post) return <p className="post-error">{error || "Not found"}</p>;

  return (
    <article className="post-app-article">
      <header>
        <h1>{post.title}</h1>
        {post.published_at && (
          <ClientTime iso={post.published_at} options={{ dateStyle: "medium", timeStyle: "short" }} />
        )}
      </header>
      <PostContent content={post.content} />
    </article>
  );
}
