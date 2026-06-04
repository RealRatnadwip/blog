"use client";

import { useDesktopStore } from "@/store/desktop";
import { useEffect, useRef, useState } from "react";
import { ClientClock } from "./ClientClock";
import { IconMintLogo } from "./icons";
import {
  panelAppContextMenu,
  startButtonContextMenu,
} from "@/lib/desktop/context-menus";

// SVG Icons
function IconWifi({ connected = true, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {connected ? (
        <>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
        </>
      ) : (
        <>
          <line x1="1" y1="1" x2="23" y2="23" stroke="#e74c3c" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" opacity="0.4" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.83-2.84" />
          <path d="M12 20h.01" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}

function IconVolume({ level = 50, muted = false, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {muted || level === 0 ? (
        <>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" stroke="#e74c3c" />
          <line x1="17" y1="9" x2="23" y2="15" stroke="#e74c3c" />
        </>
      ) : (
        <>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {level > 0 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
          {level > 50 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
        </>
      )}
    </svg>
  );
}

function IconBattery({ percent = 85, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
      <line x1="23" y1="11" x2="23" y2="13" strokeWidth="3" />
      <rect
        x="3"
        y="8"
        width={Math.round((percent / 100) * 14)}
        height="8"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function IconBluetooth({ active = true, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {active ? (
        <path d="m7 7 10 10-5 5V2l5 5L7 17" />
      ) : (
        <>
          <path d="m7 7 10 10-5 5V2l5 5L7 17" opacity="0.4" />
          <line x1="1" y1="1" x2="23" y2="23" stroke="#e74c3c" />
        </>
      )}
    </svg>
  );
}

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
    settings,
    setTheme,
    setTextScale,
    setSoundEnabled,
    lockScreen,
  } = store;

  // Local UI Popover state
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Local Tray widgets simulation state
  const [wifiConnected, setWifiConnected] = useState(true);
  const [bluetoothActive, setBluetoothActive] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(65);
  const [batteryPercent, setBatteryPercent] = useState(88);

  const qsRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLDivElement>(null);

  // Close popups on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        showQuickSettings &&
        qsRef.current &&
        !qsRef.current.contains(target) &&
        !target.closest(".tray-widget-group")
      ) {
        setShowQuickSettings(false);
      }
      if (
        showCalendar &&
        calRef.current &&
        !calRef.current.contains(target) &&
        !target.closest(".tray-clock-btn")
      ) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showQuickSettings, showCalendar]);

  const openStartMenu = () => {
    closeContextMenu();
    setShowQuickSettings(false);
    setShowCalendar(false);
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

  // Calendar dates generation logic
  const now = new Date();
  const currentMonthName = now.toLocaleString("default", { month: "long" });
  const currentYear = now.getFullYear();
  const currentDate = now.getDate();

  const calendarDays = (() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];
    // Prev month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        num: prevTotalDays - i,
        current: false,
        key: `prev-${prevTotalDays - i}`,
      });
    }
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        num: i,
        current: true,
        key: `curr-${i}`,
      });
    }
    // Next month padding days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        num: i,
        current: false,
        key: `next-${i}`,
      });
    }
    return days;
  })();

  const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <footer
      className="mint-panel"
      style={{
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
      }}
    >
      {/* Start Button */}
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

      {/* Taskbar Windows list */}
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

      {/* System Tray (Network, Sound, Power, Calendar) */}
      <div className="mint-panel-tray">
        <div
          className="tray-widget-group"
          onClick={() => {
            setShowCalendar(false);
            setShowQuickSettings(!showQuickSettings);
          }}
          title="Quick Settings"
        >
          <IconWifi connected={wifiConnected} size={15} />
          <IconVolume level={volumeLevel} muted={!settings.soundEnabled} size={15} />
          <IconBattery percent={batteryPercent} size={16} />
        </div>

        <button
          type="button"
          className="tray-clock-btn"
          onClick={() => {
            setShowQuickSettings(false);
            setShowCalendar(!showCalendar);
          }}
          title="Calendar"
        >
          <ClientClock />
        </button>
      </div>

      {/* Quick Settings Popover */}
      {showQuickSettings && (
        <div
          ref={qsRef}
          className="tray-popover quick-settings-popover"
          style={{
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
          }}
        >
          <div className="qs-user-profile">
            <img src="/me.jpg" className="start-user-avatar" alt="RealRatnadwip" />
            <div className="start-user-info">
              <strong className="start-username">RealRatnadwip</strong>
              <span className="start-user-subtitle">Mint Desktop Admin</span>
            </div>
          </div>

          <div className="qs-toggles">
            <button
              type="button"
              className={`qs-toggle-btn${wifiConnected ? " active" : ""}`}
              onClick={() => setWifiConnected(!wifiConnected)}
            >
              <IconWifi connected={wifiConnected} size={16} />
              <span>{wifiConnected ? "Wi-Fi: On" : "Wi-Fi: Off"}</span>
            </button>
            <button
              type="button"
              className={`qs-toggle-btn${bluetoothActive ? " active" : ""}`}
              onClick={() => setBluetoothActive(!bluetoothActive)}
            >
              <IconBluetooth active={bluetoothActive} size={16} />
              <span>{bluetoothActive ? "BT: On" : "BT: Off"}</span>
            </button>
            <button
              type="button"
              className={`qs-toggle-btn${settings.soundEnabled ? " active" : ""}`}
              onClick={() => setSoundEnabled(!settings.soundEnabled)}
            >
              <IconVolume level={volumeLevel} muted={!settings.soundEnabled} size={16} />
              <span>{settings.soundEnabled ? "Sounds: On" : "Sounds: Off"}</span>
            </button>
            <button
              type="button"
              className="qs-toggle-btn"
              onClick={() => setTheme(settings.theme === "dark" ? "light" : "dark")}
            >
              <span>{settings.theme === "dark" ? "🌙 Dark" : "☀️ Light"}</span>
              <span>Theme</span>
            </button>
          </div>

          <div className="qs-slider-group">
            <div className="qs-slider-label">
              <span>System Volume</span>
              <span>{settings.soundEnabled ? `${volumeLevel}%` : "Muted"}</span>
            </div>
            <div className="qs-slider-row">
              <IconVolume level={volumeLevel} muted={!settings.soundEnabled} size={16} />
              <input
                type="range"
                min="0"
                max="100"
                value={volumeLevel}
                onChange={(e) => {
                  setVolumeLevel(Number(e.target.value));
                  if (!settings.soundEnabled && Number(e.target.value) > 0) {
                    setSoundEnabled(true);
                  }
                }}
                className="qs-slider"
              />
            </div>
          </div>

          <div className="qs-slider-group">
            <div className="qs-slider-label">
              <span>Text Scale</span>
              <span style={{ textTransform: "capitalize" }}>{settings.textScale}</span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["small", "medium", "large"] as const).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setTextScale(sc)}
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    fontSize: "11px",
                    borderRadius: "4px",
                    border: "none",
                    background: settings.textScale === sc ? "var(--mint-green)" : "rgba(255,255,255,0.08)",
                    color: settings.textScale === sc ? "#000" : "inherit",
                    cursor: "pointer",
                    fontWeight: settings.textScale === sc ? "bold" : "normal",
                  }}
                >
                  {sc === "small" ? "A-" : sc === "medium" ? "A" : "A+"}
                </button>
              ))}
            </div>
          </div>

          <div className="qs-footer">
            <button
              type="button"
              className="qs-footer-btn"
              onClick={() => {
                console.log("QS Lock Screen button clicked!");
                setShowQuickSettings(false);
                lockScreen();
              }}
            >
              🔒 Lock Screen
            </button>
            <button
              type="button"
              className="qs-footer-btn"
              onClick={() => setShowQuickSettings(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Calendar Clock Popover */}
      {showCalendar && (
        <div
          ref={calRef}
          className="tray-popover calendar-popover"
          style={{
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
          }}
        >
          <div className="cal-header">
            <span>{currentMonthName} {currentYear}</span>
          </div>

          <div className="cal-grid-days">
            {weekdayLabels.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>

          <div className="cal-grid-dates">
            {calendarDays.map((day) => (
              <span
                key={day.key}
                className={`cal-cell${day.current ? " current-month" : " other-month"}${
                  day.current && day.num === currentDate ? " today" : ""
                }`}
              >
                {day.num}
              </span>
            ))}
          </div>
        </div>
      )}
    </footer>
  );
}
