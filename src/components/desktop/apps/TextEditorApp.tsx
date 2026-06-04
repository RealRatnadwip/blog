"use client";

import { useState, useEffect } from "react";
import { useDesktopStore } from "@/store/desktop";
import { resolvePath } from "@/lib/desktop/build-fs";

type Props = {
  winId: string;
  payload?: Record<string, unknown>;
};

export function TextEditorApp({ winId, payload }: Props) {
  const filePath = String(payload?.path || "");
  const { fs, saveFileContent, closeWindow } = useDesktopStore();
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);

  // Load content
  useEffect(() => {
    if (!fs || !filePath) return;
    const node = resolvePath(fs, filePath);
    if (node && node.type === "file") {
      setContent(node.content || "");
      setSaved(true);
    }
  }, [fs, filePath]);

  const handleSave = () => {
    if (!filePath) return;
    const success = saveFileContent(filePath, content);
    if (success) {
      setSaved(true);
      
      // Play a short click feedback sound if enabled
      const soundEnabled = useDesktopStore.getState().settings.soundEnabled;
      if (soundEnabled !== false) {
        try {
          const AudioContextClass = globalThis.AudioContext || (globalThis as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.02, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
          }
        } catch {
          // ignore sound error
        }
      }
    } else {
      alert("Error saving file!");
    }
  };

  const handleTextChange = (val: string) => {
    setContent(val);
    setSaved(false);
  };

  // Calculate lines/chars for status bar
  const charCount = content.length;
  const lineCount = content.split("\n").length;

  return (
    <div className="editor-app">
      <div className="editor-toolbar">
        <button
          type="button"
          className="editor-btn save"
          onClick={handleSave}
          disabled={saved}
        >
          {saved ? "✓ Saved" : "💾 Save"}
        </button>
        <button
          type="button"
          className="editor-btn"
          onClick={() => closeWindow(winId)}
        >
          ✕ Close
        </button>
        <span style={{ fontSize: "11px", color: "#888", marginLeft: "12px" }}>
          {filePath}
        </span>
      </div>
      <textarea
        className="editor-textarea"
        value={content}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="Type here..."
      />
      <div className="editor-status">
        <span>UTF-8</span>
        <span>
          Ln {lineCount}, Col {charCount}
        </span>
      </div>
    </div>
  );
}
