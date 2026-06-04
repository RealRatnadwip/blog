"use client";

import { useDesktopStore } from "@/store/desktop";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  IconAbout,
  IconFiles,
  IconNotes,
  IconSettings,
  IconTerminal,
} from "./icons";
import type { NoteItem } from "./apps/NotesApp";

const APPS = [
  { id: "notes" as const, label: "Notes", desc: "Read and manage blog posts", Icon: IconNotes },
  { id: "files" as const, label: "Files", desc: "Explore Pictures, Videos & Documents", Icon: IconFiles },
  { id: "terminal" as const, label: "Terminal", desc: "Execute commands on overclocked bash", Icon: IconTerminal },
  { id: "settings" as const, label: "Settings", desc: "Customize desktop appearance & sounds", Icon: IconSettings },
  { id: "about" as const, label: "About", desc: "Meet Ratnadwip Sarkar, the developer", Icon: IconAbout },
];

function IconPower({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10" />
    </svg>
  );
}

type Props = {
  posts?: NoteItem[];
};

export function StartMenu({ posts = [] }: Props) {
  const { startOpen, setStartOpen, openApp, closeContextMenu, rebootSystem } = useDesktopStore();
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const focusedIndexRef = useRef(-1);

  // Filter apps
  const filteredApps = useMemo(() => {
    if (!searchQuery.trim()) return APPS;
    return APPS.filter(
      (app) =>
        app.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Filter documents
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, posts]);

  useEffect(() => {
    if (!startOpen) {
      setSearchQuery("");
      return;
    }
    focusedIndexRef.current = -1;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStartOpen(false);
        return;
      }

      const items = menuRef.current?.querySelectorAll("button");
      if (!items) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusedIndexRef.current = Math.min(focusedIndexRef.current + 1, items.length - 1);
        (items[focusedIndexRef.current] as HTMLButtonElement).focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusedIndexRef.current = Math.max(focusedIndexRef.current - 1, 0);
        (items[focusedIndexRef.current] as HTMLButtonElement).focus();
      } else if (e.key === "Enter") {
        e.preventDefault();
        (items[focusedIndexRef.current] as HTMLButtonElement)?.click();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [startOpen, setStartOpen]);

  if (!startOpen) return null;

  return (
    <>
      <button
        type="button"
        className="start-menu-backdrop"
        aria-label="Close menu"
        onClick={() => setStartOpen(false)}
      />
      <nav className="start-menu" style={{ backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" }} role="menu">
        {/* Left column (Narrow Sidebar) */}
        <div className="start-menu-left">
          <div className="start-menu-left-top">
            {APPS.map((app) => (
              <button
                key={app.id}
                type="button"
                className="start-sidebar-btn"
                title={app.label}
                onClick={() => {
                  closeContextMenu();
                  openApp(app.id, app.label);
                  setStartOpen(false);
                }}
              >
                <app.Icon size={20} />
              </button>
            ))}
          </div>
          <button
            type="button"
            className="start-sidebar-btn"
            style={{ color: "#e74c3c" }}
            title="Reboot System"
            onClick={() => {
              rebootSystem();
            }}
          >
            <IconPower size={20} />
          </button>
        </div>

        {/* Right column (Search & Content) */}
        <div className="start-menu-right">
          <div className="start-user-area">
            <img src="/me.jpg" className="start-user-avatar" alt="RealRatnadwip" />
            <div className="start-user-info">
              <strong className="start-username">RealRatnadwip</strong>
              <span className="start-user-subtitle">CS Undergrad · Chaotic Productive</span>
            </div>
          </div>

          <div className="start-search-wrap">
            <span className="start-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search applications and documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="start-search-input"
              autoFocus
            />
          </div>

          <div className="start-scroll-area" ref={menuRef}>
            {searchQuery.trim() === "" ? (
              <>
                <h4>Applications</h4>
                <ul className="start-app-list">
                  {APPS.map((app) => (
                    <li key={app.id} className="start-app-item">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          closeContextMenu();
                          openApp(app.id, app.label);
                          setStartOpen(false);
                        }}
                      >
                        <app.Icon size={24} />
                        <span className="start-app-label">
                          <span className="start-app-name">{app.label}</span>
                          <span className="start-app-desc">{app.desc}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                {posts.length > 0 && (
                  <>
                    <h4>Recent Documents</h4>
                    <ul className="start-app-list">
                      {posts.slice(0, 4).map((post) => (
                        <li key={post.slug} className="start-app-item">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              closeContextMenu();
                              openApp("post", post.title, { slug: post.slug });
                              setStartOpen(false);
                            }}
                          >
                            <span style={{ fontSize: "20px", display: "inline-block", padding: "0 2px" }}>📄</span>
                            <span className="start-app-label">
                              <span className="start-app-name">{post.title}</span>
                              <span className="start-app-desc">{post.excerpt || "Blog Post"}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            ) : (
              <>
                {filteredApps.length > 0 && (
                  <>
                    <h4>Matching Apps</h4>
                    <ul className="start-app-list">
                      {filteredApps.map((app) => (
                        <li key={app.id} className="start-app-item">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              closeContextMenu();
                              openApp(app.id, app.label);
                              setStartOpen(false);
                            }}
                          >
                            <app.Icon size={24} />
                            <span className="start-app-label">
                              <span className="start-app-name">{app.label}</span>
                              <span className="start-app-desc">{app.desc}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {filteredPosts.length > 0 && (
                  <>
                    <h4>Matching Documents</h4>
                    <ul className="start-app-list">
                      {filteredPosts.map((post) => (
                        <li key={post.slug} className="start-app-item">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              closeContextMenu();
                              openApp("post", post.title, { slug: post.slug });
                              setStartOpen(false);
                            }}
                          >
                            <span style={{ fontSize: "20px", display: "inline-block", padding: "0 2px" }}>📄</span>
                            <span className="start-app-label">
                              <span className="start-app-name">{post.title}</span>
                              <span className="start-app-desc">{post.excerpt || "Blog Post"}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {filteredApps.length === 0 && filteredPosts.length === 0 && (
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", padding: "12px" }}>
                    No apps or documents matched.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
