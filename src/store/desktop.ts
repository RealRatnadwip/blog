"use client";

import type { ReactNode } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DesktopSettings, DesktopTheme, TextScale, FsNode } from "@/types";
import { buildVirtualFs, resolvePath } from "@/lib/desktop/build-fs";

export type WindowId =
  | "files"
  | "notes"
  | "post"
  | "settings"
  | "terminal"
  | "about"
  | "editor";

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
  fs: FsNode | null;
  initFs: (media: any[], posts?: any[]) => void;
  createDirectory: (parentPath: string, name: string) => boolean;
  createFile: (parentPath: string, name: string, content?: string, mimeType?: string) => boolean;
  deleteNode: (nodePath: string) => boolean;
  renameNode: (nodePath: string, newName: string) => boolean;
  saveFileContent: (nodePath: string, content: string) => boolean;
  setSoundEnabled: (enabled: boolean) => void;
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
  isLocked: boolean;
  isRebooting: boolean;
  isBooting: boolean;
  lockScreen: () => void;
  unlockScreen: () => void;
  rebootSystem: () => void;
}

const defaultSettings: DesktopSettings = {
  theme: "dark",
  textScale: "medium",
  soundEnabled: true,
};

const joinPath = (parent: string, name: string) => {
  return parent === "/" ? `/${name}` : `${parent}/${name}`;
};

const addNodeToTree = (node: FsNode, parentPath: string, newNode: FsNode): FsNode => {
  if (node.path === parentPath) {
    if (node.children?.some((c) => c.name === newNode.name)) {
      return node;
    }
    return {
      ...node,
      children: [...(node.children || []), newNode],
    };
  }
  if (node.type === "directory" && node.children) {
    return {
      ...node,
      children: node.children.map((child) => addNodeToTree(child, parentPath, newNode)),
    };
  }
  return node;
};

const deleteNodeFromTree = (node: FsNode, targetPath: string): FsNode => {
  if (node.type === "directory" && node.children) {
    return {
      ...node,
      children: node.children
        .filter((child) => child.path !== targetPath)
        .map((child) => deleteNodeFromTree(child, targetPath)),
    };
  }
  return node;
};

const fixChildPaths = (node: FsNode, oldParentPath: string, newParentPath: string): FsNode => {
  if (node.type === "directory" && node.children) {
    return {
      ...node,
      children: node.children.map((child) => {
        const relativePart = child.path.substring(oldParentPath.length);
        const newPath = `${newParentPath}${relativePart}`;
        const updated = { ...child, path: newPath };
        return fixChildPaths(updated, oldParentPath, newParentPath);
      }),
    };
  }
  return node;
};

const renameNodeInTree = (node: FsNode, targetPath: string, newName: string): FsNode => {
  if (node.type === "directory" && node.children) {
    return {
      ...node,
      children: node.children.map((child) => {
        if (child.path === targetPath) {
          const parent = targetPath.substring(0, targetPath.lastIndexOf("/"));
          const cleanParent = parent === "" ? "" : parent;
          const newPath = `${cleanParent}/${newName}`;
          let updatedChild = { ...child, name: newName, path: newPath };
          updatedChild = fixChildPaths(updatedChild, targetPath, newPath);
          return updatedChild;
        }
        return renameNodeInTree(child, targetPath, newName);
      }),
    };
  }
  return node;
};

const updateFileContentInTree = (node: FsNode, targetPath: string, content: string): FsNode => {
  if (node.path === targetPath && node.type === "file") {
    return {
      ...node,
      content,
    };
  }
  if (node.type === "directory" && node.children) {
    return {
      ...node,
      children: node.children.map((child) => updateFileContentInTree(child, targetPath, content)),
    };
  }
  return node;
};

let winCounter = 0;

function defaultWindowRect(index: number, app: WindowId) {
  const mobile =
    typeof globalThis.window !== "undefined" &&
    globalThis.window.innerWidth < 768;
  if (mobile) {
    const w = globalThis.window.innerWidth - 16;
    const h = globalThis.window.innerHeight - 120;
    return { x: 8, y: 48, w, h, maximized: true };
  }
  if (app === "editor") {
    return {
      x: 120 + (index % 5) * 28,
      y: 80 + (index % 4) * 24,
      w: 600,
      h: 460,
      maximized: false,
    };
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
      fs: null,
      isLocked: false,
      isRebooting: false,
      isBooting: false,

      initFs: (media, posts = []) => {
        if (!get().fs) {
          set({ fs: buildVirtualFs(media, posts) });
        }
      },

      createDirectory: (parentPath, name) => {
        const root = get().fs;
        if (!root) return false;
        const targetNode = resolvePath(root, parentPath);
        if (!targetNode || targetNode.type !== "directory") return false;
        
        // check duplicate
        if (targetNode.children?.some((c) => c.name === name)) return false;

        const newDir: FsNode = {
          name,
          type: "directory",
          path: joinPath(parentPath, name),
          children: [],
        };
        const updatedFs = addNodeToTree(root, parentPath, newDir);
        set({ fs: updatedFs });
        return true;
      },

      createFile: (parentPath, name, content = "", mimeType = "text/plain") => {
        const root = get().fs;
        if (!root) return false;
        const targetNode = resolvePath(root, parentPath);
        if (!targetNode || targetNode.type !== "directory") return false;

        // check duplicate
        if (targetNode.children?.some((c) => c.name === name)) return false;

        const newFile: FsNode = {
          name,
          type: "file",
          path: joinPath(parentPath, name),
          content,
          mimeType,
        };
        const updatedFs = addNodeToTree(root, parentPath, newFile);
        set({ fs: updatedFs });
        return true;
      },

      deleteNode: (nodePath) => {
        const root = get().fs;
        if (!root || nodePath === "/" || nodePath === "/home" || nodePath === "/home/guest") return false;
        const updatedFs = deleteNodeFromTree(root, nodePath);
        set({ fs: updatedFs });
        return true;
      },

      renameNode: (nodePath, newName) => {
        const root = get().fs;
        if (!root || nodePath === "/" || nodePath === "/home" || nodePath === "/home/guest") return false;
        
        // Find parent path
        const parent = nodePath.substring(0, nodePath.lastIndexOf("/"));
        const parentPathStr = parent === "" ? "/" : parent;
        const parentNode = resolvePath(root, parentPathStr);
        if (parentNode?.children?.some((c) => c.name === newName)) return false;

        const updatedFs = renameNodeInTree(root, nodePath, newName);
        set({ fs: updatedFs });
        return true;
      },

      saveFileContent: (nodePath, content) => {
        const root = get().fs;
        if (!root) return false;
        const updatedFs = updateFileContentInTree(root, nodePath, content);
        set({ fs: updatedFs });
        return true;
      },

      setSoundEnabled: (soundEnabled) => {
        set((s) => ({ settings: { ...s.settings, soundEnabled } }));
      },

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
        const rect = defaultWindowRect(winCounter, app);
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
      lockScreen: () => {
        console.log("lockScreen called in store");
        set({ isLocked: true, startOpen: false, contextMenu: null });
      },
      unlockScreen: () => {
        console.log("unlockScreen called in store");
        set({ isLocked: false });
      },
      rebootSystem: () => {
        console.log("rebootSystem called in store");
        set({ isRebooting: true, startOpen: false, contextMenu: null });
        setTimeout(() => {
          set({
            windows: [],
            activeId: null,
            isLocked: false,
            isRebooting: false,
            isBooting: true,
            fs: null,
          });
          setTimeout(() => {
            set({ isBooting: false });
            console.log("Reboot finished");
          }, 2500);
        }, 1800);
      },
    }),
    {
      name: "mint-desktop-settings",
      partialize: (s) => ({ settings: s.settings }),
    },
  ),
);
