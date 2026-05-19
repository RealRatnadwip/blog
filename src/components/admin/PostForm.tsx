"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichEditor } from "./RichEditor";
import type { Post, PostStatus } from "@/types";

const STATUSES: { value: PostStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
  { value: "private", label: "Private" },
  { value: "unlinked", label: "Unlinked" },
];

type Props = {
  post?: Post;
};

export function PostForm({ post }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [content, setContent] = useState<Record<string, unknown>>(
    post?.content ?? { type: "doc", content: [] },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setSaving(true);
    setError("");
    try {
      const body = { title, excerpt, slug, status, content };
      const res = post
        ? await fetch(`/api/posts/${post.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-form">
      {error && <p className="admin-error">{error}</p>}
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label>
        Slug (URL id)
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto-generated if empty"
        />
      </label>
      <label>
        Excerpt
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
        />
      </label>
      <label>
        Status
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PostStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <RichEditor content={content} onChange={setContent} />
      <div className="admin-form-actions">
        <button type="button" className="admin-btn" onClick={() => router.back()}>
          Cancel
        </button>
        <button
          type="button"
          className="admin-btn primary"
          disabled={saving || !title.trim()}
          onClick={save}
        >
          {saving ? "Saving…" : "Save post"}
        </button>
      </div>
    </div>
  );
}
