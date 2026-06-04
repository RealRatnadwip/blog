import type { ContextMenuItem } from "@/store/desktop";
import type { DesktopWindow, WindowId } from "@/store/desktop";
import type { FsNode } from "@/types";

type Actions = {
  openApp: (app: WindowId, title: string, payload?: Record<string, unknown>) => void;
  closeWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focusWindow: (id: string) => void;
  setStartOpen: (open: boolean) => void;
};

export function desktopContextMenu(actions: Actions): ContextMenuItem[] {
  return [
    {
      id: "new-notes",
      label: "Open Notes",
      action: () => actions.openApp("notes", "Notes"),
    },
    {
      id: "new-files",
      label: "Open Files",
      action: () => actions.openApp("files", "Files"),
    },
    { id: "sep1", separator: true },
    {
      id: "terminal",
      label: "Open Terminal",
      action: () => actions.openApp("terminal", "Terminal"),
    },
    {
      id: "settings",
      label: "System Settings",
      action: () => actions.openApp("settings", "Settings"),
    },
    { id: "sep2", separator: true },
    {
      id: "menu",
      label: "Applications Menu",
      action: () => actions.setStartOpen(true),
    },
  ];
}

export function windowContextMenu(
  win: DesktopWindow,
  actions: Actions,
): ContextMenuItem[] {
  return [
    {
      id: "min",
      label: "Minimize",
      action: () => actions.toggleMinimize(win.id),
    },
    {
      id: "max",
      label: win.maximized ? "Restore" : "Maximize",
      action: () => actions.toggleMaximize(win.id),
    },
    { id: "sep", separator: true },
    {
      id: "close",
      label: "Close",
      shortcut: "Alt+F4",
      danger: true,
      action: () => actions.closeWindow(win.id),
    },
  ];
}

export function panelAppContextMenu(
  win: DesktopWindow,
  actions: Actions,
): ContextMenuItem[] {
  return [
    {
      id: "restore",
      label: win.minimized ? "Restore" : "Show",
      action: () => actions.focusWindow(win.id),
    },
    {
      id: "min",
      label: "Minimize",
      disabled: win.minimized,
      action: () => actions.toggleMinimize(win.id),
    },
    { id: "sep", separator: true },
    {
      id: "close",
      label: "Close Window",
      danger: true,
      action: () => actions.closeWindow(win.id),
    },
  ];
}

export function startButtonContextMenu(actions: Actions): ContextMenuItem[] {
  return [
    {
      id: "open",
      label: "Open Menu",
      action: () => actions.setStartOpen(true),
    },
    {
      id: "terminal",
      label: "Terminal",
      action: () => actions.openApp("terminal", "Terminal"),
    },
    {
      id: "settings",
      label: "Settings",
      action: () => actions.openApp("settings", "Settings"),
    },
  ];
}

export function filesBgContextMenu(
  path: string,
  actions: {
    createFile: (parent: string, name: string) => void;
    createDirectory: (parent: string, name: string) => void;
    openTerminal: (path: string) => void;
    showProperties: (node: FsNode) => void;
    dirNode: FsNode;
  }
): ContextMenuItem[] {
  return [
    {
      id: "new-file",
      label: "Create New Document",
      action: () => {
        const name = prompt("Enter file name (e.g. notes.txt):", "Untitled.txt");
        if (name) actions.createFile(path, name);
      },
    },
    {
      id: "new-folder",
      label: "Create New Folder",
      action: () => {
        const name = prompt("Enter folder name:", "Untitled Folder");
        if (name) actions.createDirectory(path, name);
      },
    },
    { id: "sep1", separator: true },
    {
      id: "open-terminal-here",
      label: "Open Terminal Here",
      action: () => actions.openTerminal(path),
    },
    { id: "sep2", separator: true },
    {
      id: "properties",
      label: "Properties",
      action: () => actions.showProperties(actions.dirNode),
    },
  ];
}

export function filesItemContextMenu(
  item: FsNode,
  actions: {
    open: (node: FsNode) => void;
    rename: (path: string) => void;
    deleteNode: (path: string) => void;
    copyPath: (path: string) => void;
    showProperties: (node: FsNode) => void;
  }
): ContextMenuItem[] {
  return [
    {
      id: "open",
      label: item.type === "directory" ? "Open Folder" : "Open",
      action: () => actions.open(item),
    },
    { id: "sep1", separator: true },
    {
      id: "rename",
      label: "Rename...",
      action: () => {
        const newName = prompt(`Rename "${item.name}" to:`, item.name);
        if (newName && newName !== item.name) actions.rename(newName);
      },
    },
    {
      id: "copy-path",
      label: "Copy Path",
      action: () => actions.copyPath(item.path),
    },
    {
      id: "delete",
      label: "Delete",
      danger: true,
      action: () => actions.deleteNode(item.path),
    },
    { id: "sep2", separator: true },
    {
      id: "properties",
      label: "Properties",
      action: () => actions.showProperties(item),
    },
  ];
}
