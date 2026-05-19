"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { runCommand, type TerminalLine } from "@/lib/desktop/terminal";
import type { FsNode } from "@/types";

type Props = { fs: FsNode };

export function TerminalApp({ fs }: Props) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      type: "out",
      text: "guest@blog:~$ Welcome. Type `help` for commands, `help ls` for details.",
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
      const candidates = ["help", "ls", "cd", "cat", "clear", "pwd", "neofetch", "history", "echo", "date", "whoami", "uname"];
      const match = candidates.find((c) => c.startsWith(partial));
      if (match) setInput(match + " ");
    }
  }

  return (
    <div className="terminal-app">
      <div className="terminal-output">
        {lines.map((line, i) => (
          <div key={i} className={`terminal-line ${line.type}`}>
            {line.text}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form className="terminal-input-row" onSubmit={submit}>
        <span className="terminal-prompt">guest@blog:{cwd.replace(/^\/home\/guest/, "~")}$</span>
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
