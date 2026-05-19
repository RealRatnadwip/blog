"use client";

import { useRef, useCallback, type ReactNode } from "react";
import { useDesktopStore, type DesktopWindow } from "@/store/desktop";
import { windowContextMenu } from "@/lib/desktop/context-menus";

type Props = { win: DesktopWindow; children: ReactNode };

export function WindowFrame({ win, children }: Props) {
  const store = useDesktopStore();
  const {
    closeWindow,
    focusWindow,
    moveWindow,
    resizeWindow,
    toggleMinimize,
    toggleMaximize,
    showContextMenu,
    activeId,
  } = store;
  const drag = useRef<{ x: number; y: number; wx: number; wy: number } | null>(
    null,
  );
  const resize = useRef<{ x: number; y: number; w: number; h: number } | null>(
    null,
  );

  const onTitleDown = useCallback(
    (e: React.PointerEvent) => {
      if (win.maximized || e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest(".mint-window-controls")) return;
      focusWindow(win.id);
      drag.current = {
        x: e.clientX,
        y: e.clientY,
        wx: win.x,
        wy: win.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [focusWindow, win],
  );

  const onTitleMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return;
      moveWindow(
        win.id,
        drag.current.wx + e.clientX - drag.current.x,
        drag.current.wy + e.clientY - drag.current.y,
      );
    },
    [moveWindow, win.id],
  );

  const onTitleUp = useCallback((e: React.PointerEvent) => {
    drag.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onTitleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: windowContextMenu(win, store),
    });
  };

  const onResizeDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      focusWindow(win.id);
      resize.current = {
        x: e.clientX,
        y: e.clientY,
        w: win.w,
        h: win.h,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [focusWindow, win],
  );

  const onResizeMove = useCallback(
    (e: React.PointerEvent) => {
      if (!resize.current) return;
      resizeWindow(
        win.id,
        Math.max(320, resize.current.w + e.clientX - resize.current.x),
        Math.max(200, resize.current.h + e.clientY - resize.current.y),
      );
    },
    [resizeWindow, win.id],
  );

  const onResizeUp = useCallback((e: React.PointerEvent) => {
    resize.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  if (win.minimized) return null;

  const active = activeId === win.id;
  const style = win.maximized
    ? { left: 0, top: 0, width: "100%", height: "calc(100% - 40px)" }
    : { left: win.x, top: win.y, width: win.w, height: win.h };

  return (
    <section
      className={`mint-window${active ? " active" : ""}`}
      style={{ ...style, zIndex: win.z }}
      onMouseDown={() => focusWindow(win.id)}
    >
      <header
        className="mint-window-titlebar"
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={onTitleUp}
        onContextMenu={onTitleContext}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <span className="mint-window-title">{win.title}</span>
        <div className="mint-window-controls">
          <button
            type="button"
            aria-label="Minimize"
            onClick={() => toggleMinimize(win.id)}
          />
          <button
            type="button"
            aria-label="Maximize"
            onClick={() => toggleMaximize(win.id)}
          />
          <button
            type="button"
            aria-label="Close"
            className="close"
            onClick={() => closeWindow(win.id)}
          />
        </div>
      </header>
      <div className="mint-window-body">{children}</div>
      {!win.maximized && (
        <span
          className="mint-window-resize"
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeUp}
        />
      )}
    </section>
  );
}
