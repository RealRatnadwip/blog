"use client";

import { useEffect, useMemo } from "react";
import { useDesktopStore } from "@/store/desktop";
import { WindowFrame } from "./WindowFrame";
import { StartMenu } from "./StartMenu";
import { Panel } from "./Panel";
import { ContextMenu } from "./ContextMenu";
import { FilesApp } from "./apps/FilesApp";
import { NotesApp, type NoteItem } from "./apps/NotesApp";
import { PostApp } from "./apps/PostApp";
import { SettingsApp } from "./apps/SettingsApp";
import { TerminalApp } from "./apps/TerminalApp";
import { buildVirtualFs } from "@/lib/desktop/build-fs";
import { DesktopIcons } from "./DesktopIcons";
import type { FsNode } from "@/types";

type MediaItem = {
  id: string;
  public_path: string;
  media_type: string;
  mime_type: string;
};

type Props = {
  posts: NoteItem[];
  media: MediaItem[];
  initialSlug?: string;
  initialPostTitle?: string;
  dbWarning?: string | null;
};

function AboutApp() {
  return (
    <div className="about-app">
      <h3>Linux Mint Blog Desktop</h3>
      <p>
        Cinnamon-style shell for this blog. Notes lists posts; Files holds
        optimized media; Terminal runs a simulated bash with real path logic.
      </p>
    </div>
  );
}

export function DesktopShell({
  posts,
  media,
  initialSlug,
  initialPostTitle,
  dbWarning,
}: Props) {
  const { windows, settings, openApp } = useDesktopStore();
  const fs = useMemo(() => buildVirtualFs(media), [media]);

  useEffect(() => {
    if (initialSlug) {
      openApp("post", initialPostTitle ?? initialSlug, { slug: initialSlug });
    }
  }, [initialSlug, initialPostTitle, openApp]);

  const scaleClass = `text-scale-${settings.textScale}`;
  const themeClass = settings.theme === "light" ? "theme-light" : "theme-dark";

  return (
    <div className={`mint-desktop ${themeClass} ${scaleClass}`}>
      {dbWarning && (
        <div className="mint-db-banner" role="status">
          {dbWarning}
        </div>
      )}
      <div className="mint-wallpaper">
        <DesktopIcons />
      </div>
      <main className="mint-workspace">
        {windows.map((win) => (
          <WindowFrame key={win.id} win={win}>
            {win.app === "files" && <FilesApp fs={fs as FsNode} />}
            {win.app === "notes" && (
              <NotesApp
                posts={posts}
                onOpen={(slug) => {
                  const p = posts.find((x) => x.slug === slug);
                  openApp("post", p?.title ?? slug, { slug });
                }}
              />
            )}
            {win.app === "post" && (
              <PostApp slug={String(win.payload?.slug ?? "")} />
            )}
            {win.app === "settings" && <SettingsApp />}
            {win.app === "terminal" && <TerminalApp fs={fs as FsNode} />}
            {win.app === "about" && <AboutApp />}
          </WindowFrame>
        ))}
      </main>
      <StartMenu />
      <Panel />
      <ContextMenu />
    </div>
  );
}
