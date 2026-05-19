"use client";

import { useDesktopStore } from "@/store/desktop";
import { IconFiles, IconNotes, IconTerminal } from "./icons";
import { desktopContextMenu } from "@/lib/desktop/context-menus";

const ICONS = [
  { app: "notes" as const, label: "Notes", Icon: IconNotes },
  { app: "files" as const, label: "Files", Icon: IconFiles },
  { app: "terminal" as const, label: "Terminal", Icon: IconTerminal },
];

export function DesktopIcons() {
  const store = useDesktopStore();
  const { openApp, showContextMenu, closeContextMenu } = store;

  const open = (app: (typeof ICONS)[number]["app"], label: string) => {
    closeContextMenu();
    openApp(app, label);
  };

  const openDesktopMenu = (clientX: number, clientY: number) => {
    showContextMenu({
      x: clientX,
      y: clientY,
      items: desktopContextMenu(store),
    });
  };

  const onDesktopPointer = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".mint-desktop-icon")) return;
    e.preventDefault();
    e.stopPropagation();
    // Left-click on empty desktop toggles menu; right-click always opens
    if (e.type === "click" && useDesktopStore.getState().contextMenu) {
      closeContextMenu();
      return;
    }
    openDesktopMenu(e.clientX, e.clientY);
  };

  return (
    <div
      className="mint-desktop-icons-area"
      onContextMenu={onDesktopPointer}
      onClick={onDesktopPointer}
    >
      <div className="mint-desktop-icons">
        {ICONS.map(({ app, label, Icon }) => (
          <button
            key={app}
            type="button"
            className="mint-desktop-icon"
            onClick={(e) => {
              e.stopPropagation();
              open(app, label);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              open(app, label);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              showContextMenu({
                x: e.clientX,
                y: e.clientY,
                items: [
                  {
                    id: "open",
                    label: `Open ${label}`,
                    action: () => open(app, label),
                  },
                  { id: "sep", separator: true },
                  ...desktopContextMenu(store).slice(0, 3),
                ],
              });
            }}
          >
            <Icon size={40} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
