"use client";

import { useDesktopStore } from "@/store/desktop";
import { ClientClock } from "./ClientClock";
import { IconMintLogo } from "./icons";
import {
  panelAppContextMenu,
  startButtonContextMenu,
} from "@/lib/desktop/context-menus";

export function Panel() {
  const store = useDesktopStore();
  const {
    windows,
    activeId,
    startOpen,
    setStartOpen,
    focusWindow,
    toggleMinimize,
    showContextMenu,
    closeContextMenu,
  } = store;

  const openStartMenu = () => {
    closeContextMenu();
    setStartOpen(!startOpen);
  };

  const onStartContext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: startButtonContextMenu(store),
    });
  };

  const onAppContext = (e: React.MouseEvent, winId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const win = windows.find((w) => w.id === winId);
    if (!win) return;
    showContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: panelAppContextMenu(win, store),
    });
  };

  return (
    <footer className="mint-panel">
      <button
        type="button"
        className={`mint-start-btn${startOpen ? " active" : ""}`}
        onClick={openStartMenu}
        onContextMenu={onStartContext}
        aria-label="Menu"
        aria-expanded={startOpen}
      >
        <IconMintLogo size={18} />
        Menu
      </button>
      <div className="mint-panel-apps">
        {windows.map((w) => (
          <button
            key={w.id}
            type="button"
            className={activeId === w.id && !w.minimized ? "active" : ""}
            onClick={(e) => {
              if (e.detail === 1) {
                if (w.minimized || activeId !== w.id) focusWindow(w.id);
                else toggleMinimize(w.id);
              }
            }}
            onContextMenu={(e) => onAppContext(e, w.id)}
          >
            {w.title}
          </button>
        ))}
      </div>
      <div className="mint-panel-tray">
        <ClientClock />
      </div>
    </footer>
  );
}
