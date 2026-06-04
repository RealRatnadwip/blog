"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { runCommand, type TerminalLine } from "@/lib/desktop/terminal";
import type { FsNode } from "@/types";
import { useDesktopStore } from "@/store/desktop";

type Props = { fs: FsNode };

function DtmfKeypad() {
  const [digits, setDigits] = useState("");
  
  // DTMF Frequencies: row x col
  const dtmfFrequencies: Record<string, [number, number]> = {
    "1": [697, 1209], "2": [697, 1336], "3": [697, 1477], "A": [697, 1633],
    "4": [770, 1209], "5": [770, 1336], "6": [770, 1477], "B": [770, 1633],
    "7": [852, 1209], "8": [852, 1336], "9": [852, 1477], "C": [852, 1633],
    "*": [941, 1209], "0": [941, 1336], "#": [941, 1477], "D": [941, 1633],
  };

  const playTone = (key: string) => {
    const freqs = dtmfFrequencies[key];
    if (!freqs) return;
    const [row, col] = freqs;
    
    // Play sound via Web Audio API
    const AudioContextClass = globalThis.AudioContext || (globalThis as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const soundEnabled = useDesktopStore.getState().settings.soundEnabled;
    if (soundEnabled === false) {
      setDigits(prev => prev + key);
      return;
    }
    
    try {
      const ctx = new AudioContextClass();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.frequency.value = row;
      osc2.frequency.value = col;
      
      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.3);
      osc2.stop(ctx.currentTime + 0.3);
    } catch {}
    
    setDigits(prev => prev + key);
  };

  const keys = [
    ["1", "2", "3", "A"],
    ["4", "5", "6", "B"],
    ["7", "8", "9", "C"],
    ["*", "0", "#", "D"]
  ];

  return (
    <div className="dtmf-interactive-wrapper" onClick={(e) => e.stopPropagation()}>
      <div className="dtmf-display">
        {digits || "Press keys to dial..."}
      </div>
      <div className="dtmf-grid">
        {keys.map((row, r) => (
          <div key={r} style={{ display: "contents" }}>
            {row.map((k) => (
              <button
                key={k}
                type="button"
                className="dtmf-key"
                onClick={() => playTone(k)}
              >
                {k}
              </button>
            ))}
          </div>
        ))}
      </div>
      <button
        type="button"
        style={{
          background: "transparent",
          border: "none",
          color: "#777",
          fontSize: "10px",
          textAlign: "right",
          cursor: "pointer",
          marginTop: "4px"
        }}
        onClick={() => setDigits("")}
      >
        Clear digits
      </button>
    </div>
  );
}

export function TerminalApp({ fs }: Props) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      type: "out",
      text: "guest@ratnadwip.dev:~$ Welcome! Type \`help\` for commands. Try running \`neofetch\` or \`dtmf\`.",
    },
  ]);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("/home/guest");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottom = useRef<HTMLDivElement>(null);
  const started = useRef(Date.now());

  const env = useMemo(
    () => ({
      sessionMins: Math.max(0, Math.floor((Date.now() - started.current) / 60000)),
      resolution:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "1920x1080",
    }),
    [lines.length],
  );

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const { lines: out, newCwd, newHistory } = runCommand(
      input,
      cwd,
      fs,
      history,
      env,
    );
    if (out.some((l) => l.text === "__CLEAR__")) {
      setLines([]);
    } else {
      setLines((prev) => [...prev, ...out]);
    }
    setCwd(newCwd);
    setHistory(newHistory);
    setInput("");
    setHistIdx(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setInput(history[next]);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      const next = histIdx + 1;
      if (next >= history.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(next);
        setInput(history[next]);
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const partial = input.trim();
      const candidates = ["help", "ls", "cd", "cat", "clear", "pwd", "neofetch", "history", "echo", "date", "whoami", "uname", "dtmf", "f1", "synth"];
      const match = candidates.find((c) => c.startsWith(partial));
      if (match) setInput(match + " ");
    }
  }

  return (
    <div className="terminal-app" onClick={() => {}}>
      <div className="terminal-output">
        {lines.map((line, i) => {
          if (line.text === "__DTMF__") {
            return <DtmfKeypad key={i} />;
          }
          return (
            <div key={i} className={`terminal-line ${line.type}`}>
              {line.text}
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form className="terminal-input-row" onSubmit={submit}>
        <span className="terminal-prompt">guest@ratnadwip.dev:{cwd.replace(/^\/home\/guest/, "~")}$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoFocus
          aria-label="Terminal input"
        />
      </form>
    </div>
  );
}
