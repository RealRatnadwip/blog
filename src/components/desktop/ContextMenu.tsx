"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDesktopStore } from "@/store/desktop";

export function ContextMenu() {
  const menu = useDesktopStore((s) => s.contextMenu);
  const close = useDesktopStore((s) => s.closeContextMenu);
  const menuRef = useRef<HTMLDivElement>(null);
  const openedAt = useRef(0);

  useEffect(() => {
    if (!menu) return;
    openedAt.current = Date.now();

    const onPointerDown = (e: PointerEvent) => {
      // Ignore right/middle button (menu opens on contextmenu)
      if (e.button !== 0) return;
      if (Date.now() - openedAt.current < 250) return;
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      close();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const onScroll = () => close();

    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menu, close]);

  if (!menu || typeof document === "undefined") return null;

  const menuHeight = menu.items.filter((i) => !i.separator).length * 36 + 16;
  const left = Math.min(menu.x, window.innerWidth - 240);
  const top = Math.min(menu.y, window.innerHeight - menuHeight);

  return createPortal(
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left,
        top,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
      }}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
    >
      {menu.items.map((item) =>
        item.separator ? (
          <hr key={item.id} />
        ) : (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={item.danger ? "danger" : ""}
            onClick={() => {
              item.action?.();
              close();
            }}
          >
            {item.icon && <span className="ctx-icon">{item.icon}</span>}
            {item.label}
            {item.shortcut && <kbd>{item.shortcut}</kbd>}
          </button>
        ),
      )}
    </div>,
    document.body,
  );
}
