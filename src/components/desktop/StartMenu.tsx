"use client";

import { useDesktopStore } from "@/store/desktop";
import { useEffect, useRef } from "react";
import {
  IconAbout,
  IconFiles,
  IconNotes,
  IconSettings,
  IconTerminal,
} from "./icons";

const APPS = [
  { id: "notes" as const, label: "Notes", desc: "Blog posts", Icon: IconNotes },
  { id: "files" as const, label: "Files", desc: "Pictures & videos", Icon: IconFiles },
  { id: "terminal" as const, label: "Terminal", desc: "Command line", Icon: IconTerminal },
  { id: "settings" as const, label: "Settings", desc: "Appearance", Icon: IconSettings },
  { id: "about" as const, label: "About", desc: "This desktop", Icon: IconAbout },
];

export function StartMenu() {
  const { startOpen, setStartOpen, openApp, closeContextMenu } = useDesktopStore();
  const menuRef = useRef<HTMLUListElement>(null);
  const focusedIndexRef = useRef(-1);

  useEffect(() => {
    if (!startOpen) return;
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
      <nav className="start-menu" role="menu">
        <div className="start-menu-header">
          <span className="start-avatar" />
          <div>
            <strong>guest</strong>
            <span>Blog Desktop · Linux Mint style</span>
          </div>
        </div>
        <p className="start-menu-search-hint">All Applications</p>
        <ul ref={menuRef}>
          {APPS.map((app) => (
            <li key={app.id}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeContextMenu();
                  openApp(app.id, app.label);
                }}
              >
                <app.Icon size={28} />
                <span>
                  {app.label}
                  <small>{app.desc}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <footer className="start-menu-footer">
          <button type="button" onClick={() => setStartOpen(false)}>
            Close
          </button>
        </footer>
      </nav>
    </>
  );
}
