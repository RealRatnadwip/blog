"use client";

import { useDesktopStore } from "@/store/desktop";
import type { DesktopTheme, TextScale } from "@/types";

export function SettingsApp() {
  const { settings, setTheme, setTextScale, setSoundEnabled } = useDesktopStore();

  return (
    <div className="settings-app">
      <h3>Appearance & Sounds</h3>
      <label className="settings-row">
        Theme
        <select
          value={settings.theme}
          onChange={(e) => setTheme(e.target.value as DesktopTheme)}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </label>
      <label className="settings-row">
        Text size
        <select
          value={settings.textScale}
          onChange={(e) => setTextScale(e.target.value as TextScale)}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </label>
      <label className="settings-row">
        System Sounds
        <select
          value={settings.soundEnabled !== false ? "on" : "off"}
          onChange={(e) => setSoundEnabled(e.target.value === "on")}
        >
          <option value="on">Enabled</option>
          <option value="off">Disabled</option>
        </select>
      </label>
      <p className="settings-hint">
        Settings are saved in your browser for this device.
      </p>
    </div>
  );
}
