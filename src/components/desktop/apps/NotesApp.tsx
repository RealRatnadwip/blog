"use client";

import { useDesktopStore } from "@/store/desktop";

export interface NoteItem {
  slug: string;
  title: string;
  excerpt: string;
  published_at: string | null;
}

type Props = {
  posts: NoteItem[];
  onOpen: (slug: string) => void;
};

export function NotesApp({ posts, onOpen }: Props) {
  const openApp = useDesktopStore((s) => s.openApp);

  return (
    <div className="notes-app">
      <ul>
        {posts.map((p) => (
          <li key={p.slug}>
            <button
              type="button"
              onClick={() => {
                onOpen(p.slug);
                openApp("post", p.title, { slug: p.slug });
              }}
            >
              <strong>{p.title}</strong>
              {p.excerpt && <p>{p.excerpt}</p>}
              {p.published_at && (
                <time>{new Date(p.published_at).toLocaleDateString()}</time>
              )}
            </button>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="notes-empty">No published notes yet.</li>
        )}
      </ul>
    </div>
  );
}
