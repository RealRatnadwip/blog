"use client";

import type { ReactNode } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DesktopSettings, DesktopTheme, TextScale } from "@/types";

export type WindowId =
  | "files"
  | "notes"
  | "post"
  | "settings"
  | "terminal"
  | "about";

export interface DesktopWindow {
  id: string;
  app: WindowId;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  payload?: Record<string, unknown>;
}

export interface ContextMenuItem {
  id: string;
  label?: string;
  shortcut?: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  action?: () => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface DesktopState {
  windows: DesktopWindow[];
  activeId: string | null;
  startOpen: boolean;
  contextMenu: ContextMenuState | null;
  settings: DesktopSettings;
  zCounter: number;
  openApp: (
    app: WindowId,
    title: string,
    payload?: Record<string, unknown>,
  ) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, w: number, h: number) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  setStartOpen: (open: boolean) => void;
  showContextMenu: (menu: ContextMenuState) => void;
  closeContextMenu: () => void;
  setTheme: (theme: DesktopTheme) => void;
  setTextScale: (scale: TextScale) => void;
}

const defaultSettings: DesktopSettings = {
  theme: "dark",
  textScale: "medium",
};

let winCounter = 0;

function defaultWindowRect(index: number) {
  const mobile =
    typeof globalThis.window !== "undefined" &&
    globalThis.window.innerWidth < 768;
  if (mobile) {
    const w = globalThis.window.innerWidth - 16;
    const h = globalThis.window.innerHeight - 120;
    return { x: 8, y: 48, w, h, maximized: true };
  }
  return {
    x: 80 + (index % 5) * 28,
    y: 56 + (index % 4) * 24,
    w: 680,
    h: 440,
    maximized: false,
  };
}

export const useDesktopStore = create<DesktopState>()(
  persist(
    (set, get) => ({
      windows: [],
      activeId: null,
      startOpen: false,
      contextMenu: null,
      settings: defaultSettings,
      zCounter: 10,
      openApp: (app, title, payload) => {
        const existing = get().windows.find(
          (w) =>
            w.app === app &&
            JSON.stringify(w.payload) === JSON.stringify(payload),
        );
        if (existing) {
          set((s) => ({
            activeId: existing.id,
            zCounter: s.zCounter + 1,
            windows: s.windows.map((w) =>
              w.id === existing.id
                ? { ...w, minimized: false, z: s.zCounter + 1 }
                : w,
            ),
            startOpen: false,
            contextMenu: null,
          }));
          return;
        }
        const id = `${app}-${++winCounter}`;
        const rect = defaultWindowRect(winCounter);
        const w: DesktopWindow = {
          id,
          app,
          title,
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h,
          z: get().zCounter + 1,
          minimized: false,
          maximized: rect.maximized,
          payload,
        };
        set((s) => ({
          windows: [...s.windows, w],
          activeId: id,
          zCounter: s.zCounter + 1,
          startOpen: false,
          contextMenu: null,
        }));
      },
      closeWindow: (id) =>
        set((s) => ({
          windows: s.windows.filter((w) => w.id !== id),
          activeId: s.activeId === id ? null : s.activeId,
        })),
      focusWindow: (id) =>
        set((s) => ({
          activeId: id,
          zCounter: s.zCounter + 1,
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, z: s.zCounter + 1, minimized: false } : w,
          ),
          contextMenu: null,
        })),
      moveWindow: (id, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
        })),
      resizeWindow: (id, w, h) =>
        set((s) => ({
          windows: s.windows.map((win) =>
            win.id === id ? { ...win, w, h } : win,
          ),
        })),
      toggleMinimize: (id) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, minimized: !w.minimized } : w,
          ),
        })),
      toggleMaximize: (id) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === id ? { ...w, maximized: !w.maximized } : w,
          ),
        })),
      setStartOpen: (open) =>
        set({ startOpen: open, contextMenu: open ? null : get().contextMenu }),
      showContextMenu: (menu) => set({ contextMenu: menu, startOpen: false }),
      closeContextMenu: () => set({ contextMenu: null }),
      setTheme: (theme) =>
        set((s) => ({ settings: { ...s.settings, theme } })),
      setTextScale: (textScale) =>
        set((s) => ({ settings: { ...s.settings, textScale } })),
    }),
    {
      name: "mint-desktop-settings",
      partialize: (s) => ({ settings: s.settings }),
    },
  ),
);
