"use client";

import { useState, useEffect } from "react";
import { useDesktopStore } from "@/store/desktop";
import { PostContent } from "../PostContent";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [postContent, setPostContent] = useState<Record<string, unknown> | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Filter posts based on search query
  const filteredPosts = posts.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) ||
      (p.excerpt && p.excerpt.toLowerCase().includes(query))
    );
  });

  // Fetch selected post content
  useEffect(() => {
    if (!selectedSlug) {
      setPostContent(null);
      setLoadError("");
      return;
    }
    setLoadingPost(true);
    setLoadError("");
    fetch(`/api/public/post/${selectedSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setLoadError(data.error);
        } else {
          setPostContent(data.content);
        }
        setLoadingPost(false);
      })
      .catch(() => {
        setLoadError("Failed to load note content");
        setLoadingPost(false);
      });
  }, [selectedSlug]);

  const activeNote = posts.find((x) => x.slug === selectedSlug);

  return (
    <div className="notes-app">
      {/* Left Sidebar */}
      <div className="notes-sidebar">
        <div className="notes-search-container">
          <input
            type="text"
            className="notes-search-input"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ul className="notes-list">
          {filteredPosts.map((p) => {
            const isActive = selectedSlug === p.slug;
            return (
              <li key={p.slug} className={`notes-list-item${isActive ? " active" : ""}`}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(p.slug)}
                >
                  <strong className="notes-list-title">{p.title}</strong>
                  {p.excerpt && <span className="notes-list-excerpt">{p.excerpt}</span>}
                  {p.published_at && (
                    <span className="notes-list-date">
                      {new Date(p.published_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {filteredPosts.length === 0 && (
            <li className="notes-preview-empty" style={{ padding: "20px 10px", fontSize: "12px" }}>
              No notes found.
            </li>
          )}
        </ul>
      </div>

      {/* Right Preview Pane */}
      <div className="notes-preview-pane">
        {selectedSlug && activeNote ? (
          <>
            <header className="notes-preview-header">
              <div className="notes-preview-title-section">
                <h2 className="notes-preview-title">{activeNote.title}</h2>
                {activeNote.published_at && (
                  <span className="notes-preview-date">
                    Published on {new Date(activeNote.published_at).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </span>
                )}
              </div>
              <div className="notes-preview-actions">
                <button
                  type="button"
                  className="notes-action-btn"
                  onClick={() => {
                    onOpen(activeNote.slug);
                    openApp("post", activeNote.title, { slug: activeNote.slug });
                  }}
                  title="Open post in a separate window"
                >
                  ↗️ Pop Out
                </button>
              </div>
            </header>
            <div className="notes-preview-content">
              {loadingPost && (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                  <div className="mint-boot-spinner" style={{ width: "24px", height: "24px" }} />
                </div>
              )}
              {loadError && (
                <p style={{ color: "var(--danger)", fontSize: "13px", padding: "12px" }}>{loadError}</p>
              )}
              {!loadingPost && !loadError && postContent && (
                <PostContent content={postContent} />
              )}
            </div>
          </>
        ) : (
          <div className="notes-preview-empty">
            <span className="notes-preview-empty-icon">📝</span>
            <h3 style={{ margin: "0 0 4px" }}>No Note Selected</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "260px", margin: 0 }}>
              Select a blog post from the sidebar list to view its contents here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

