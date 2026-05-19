import type { ContextMenuItem } from "@/store/desktop";
import type { DesktopWindow, WindowId } from "@/store/desktop";

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
