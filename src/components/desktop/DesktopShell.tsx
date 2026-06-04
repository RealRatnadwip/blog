"use client";

import { useEffect, useMemo, useState } from "react";
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
import { TextEditorApp } from "./apps/TextEditorApp";
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
    <div className="about-app" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <img src="/me.jpg" style={{ width: "64px", height: "64px", borderRadius: "50%", border: "2px solid var(--mint-green)", objectFit: "cover" }} alt="RealRatnadwip" />
        <div>
          <h3 style={{ margin: 0 }}>Ratnadwip Sarkar</h3>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>CS Student · Audio Engineer · Editor</span>
        </div>
      </div>
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        Welcome to my portfolio OS desktop environment! I'm a Computer Science undergraduate from West Bengal who lives between code editors, audio consoles, motorsport highlights, and unfinished 2 AM side projects.
      </p>
      <p style={{ margin: 0, lineHeight: 1.5 }}>
        This interface is modeled as a Cinnamon-style Linux desktop. Open <strong>Files</strong> to check out pictures/videos, double-click text files to edit/save them, or open the <strong>Terminal</strong> and try typing commands like <code>neofetch</code>, <code>f1</code>, or <code>dtmf</code>.
      </p>
    </div>
  );
}

function playStartupSound() {
  const AudioContextClass = globalThis.AudioContext || (globalThis as any).webkitAudioContext;
  if (!AudioContextClass) return;

  const soundEnabled = useDesktopStore.getState().settings.soundEnabled;
  if (soundEnabled === false) return;

  try {
    const ctx = new AudioContextClass();
    const dest = ctx.destination;

    // Create a compressor to make it sound warm and rich
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.05;
    comp.release.value = 0.25;
    comp.connect(dest);

    // Notes: C3 (130.81), G3 (196.00), C4 (261.63), E4 (329.63), G4 (392.00), C5 (523.25)
    const notes = [130.81, 196.00, 261.63, 329.63, 392.00, 523.25];
    const now = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = index < 2 ? "triangle" : "sine";
      osc.frequency.value = freq;

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(100, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.3 + index * 0.1);
      filter.Q.value = 1;

      gain.gain.setValueAtTime(0, now);
      const start = now + index * 0.08;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.06, start + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.5);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(comp);

      osc.start(start);
      osc.stop(start + 3);
    });
  } catch (err) {
    console.warn("Could not play startup sound", err);
  }
}

export function DesktopShell({
  posts,
  media,
  initialSlug,
  initialPostTitle,
  dbWarning,
}: Props) {
  const {
    windows,
    settings,
    openApp,
    fs,
    initFs,
    isLocked,
    isRebooting,
    isBooting,
    unlockScreen,
  } = useDesktopStore();
  const [playedSound, setPlayedSound] = useState(false);

  console.log("DesktopShell render: isLocked =", isLocked, "isRebooting =", isRebooting, "isBooting =", isBooting);

  useEffect(() => {
    if (isRebooting) {
      setPlayedSound(false);
    }
  }, [isRebooting]);
  const [lockTime, setLockTime] = useState("");
  const [lockDate, setLockDate] = useState("");

  useEffect(() => {
    initFs(media, posts);
  }, [media, posts, initFs]);

  useEffect(() => {
    if (initialSlug) {
      openApp("post", initialPostTitle ?? initialSlug, { slug: initialSlug });
    }
  }, [initialSlug, initialPostTitle, openApp]);

  useEffect(() => {
    if (!isLocked) return;
    const tick = () => {
      const now = new Date();
      setLockTime(
        now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
      setLockDate(
        now.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isLocked]);

  const handleInteraction = () => {
    if (!playedSound) {
      playStartupSound();
      setPlayedSound(true);
    }
  };

  const scaleClass = `text-scale-${settings.textScale}`;
  const themeClass = settings.theme === "light" ? "theme-light" : "theme-dark";

  return (
    <div
      className={`mint-desktop ${themeClass} ${scaleClass}`}
      onContextMenu={(e) => e.preventDefault()}
      onClickCapture={handleInteraction}
      onPointerDownCapture={handleInteraction}
    >
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
            {win.app === "files" && fs && <FilesApp fs={fs as FsNode} />}
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
            {win.app === "terminal" && fs && <TerminalApp fs={fs as FsNode} />}
            {win.app === "editor" && <TextEditorApp winId={win.id} payload={win.payload} />}
            {win.app === "about" && <AboutApp />}
          </WindowFrame>
        ))}
      </main>
      <StartMenu posts={posts} />
      <Panel />
      <ContextMenu />

      {isLocked && (
        <div className="mint-lock-screen" style={{ backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" }}>
          <div className="lock-content">
            <div className="lock-clock">
              <div className="lock-time">{lockTime || "—:—"}</div>
              <div className="lock-date">{lockDate || "— —"}</div>
            </div>
            <div className="lock-user-card">
              <img src="/me.jpg" className="lock-avatar" alt="RealRatnadwip" />
              <h2 className="lock-username">RealRatnadwip</h2>
              <span className="lock-user-role">Mint Desktop Admin</span>
              <button type="button" className="lock-signin-btn" onClick={() => {
                console.log("Lockscreen button clicked to unlock");
                unlockScreen();
              }}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fake Modern Reboot Screen */}
      {isRebooting && (
        <div className="mint-reboot-screen">
          <div className="reboot-content">
            <div className="mint-boot-spinner" />
            <div className="reboot-text">Restarting Mint Desktop...</div>
            <div className="reboot-subtext">Closing applications and saving settings</div>
          </div>
        </div>
      )}

      {/* Fake Boot Screen */}
      {isBooting && (
        <div className="mint-boot-overlay">
          <div className="mint-boot-spinner" />
          <p>Starting desktop…</p>
        </div>
      )}
    </div>
  );
}
