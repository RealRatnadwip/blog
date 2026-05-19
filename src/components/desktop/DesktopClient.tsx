"use client";

import { useEffect, useState } from "react";
import { DesktopShell } from "./DesktopShell";
import type { NoteItem } from "./apps/NotesApp";

type MediaItem = {
  id: string;
  public_path: string;
  media_type: string;
  mime_type: string;
};

type Props = {
  initialSlug?: string;
  initialPostTitle?: string;
};

function parsePosts(json: unknown): NoteItem[] {
  if (Array.isArray(json)) return json as NoteItem[];
  if (json && typeof json === "object" && "posts" in json) {
    const posts = (json as { posts: unknown }).posts;
    return Array.isArray(posts) ? (posts as NoteItem[]) : [];
  }
  return [];
}

function parseMedia(json: unknown): MediaItem[] {
  if (Array.isArray(json)) return json as MediaItem[];
  if (json && typeof json === "object" && "media" in json) {
    const media = (json as { media: unknown }).media;
    return Array.isArray(media) ? (media as MediaItem[]) : [];
  }
  return [];
}

function parseWarning(json: unknown): string | null {
  if (json && typeof json === "object" && "warning" in json) {
    const w = (json as { warning: unknown }).warning;
    return typeof w === "string" ? w : null;
  }
  return null;
}

export function DesktopClient({ initialSlug, initialPostTitle }: Props) {
  const [posts, setPosts] = useState<NoteItem[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [dbWarning, setDbWarning] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [postsRes, mediaRes] = await Promise.all([
          fetch("/api/public/posts"),
          fetch("/api/public/media"),
        ]);
        const postsJson = postsRes.ok ? await postsRes.json() : [];
        const mediaJson = mediaRes.ok ? await mediaRes.json() : [];

        if (cancelled) return;

        setPosts(parsePosts(postsJson));
        setMedia(parseMedia(mediaJson));
        setDbWarning(parseWarning(postsJson) ?? parseWarning(mediaJson));
      } catch {
        if (!cancelled) {
          setDbWarning("Could not reach the blog API. The desktop will run offline.");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="mint-boot">
        <div className="mint-boot-spinner" />
        <p>Starting desktop…</p>
      </div>
    );
  }

  return (
    <DesktopShell
      posts={posts}
      media={media}
      dbWarning={dbWarning}
      initialSlug={initialSlug}
      initialPostTitle={initialPostTitle}
    />
  );
}
