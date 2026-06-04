import type { FsNode } from "@/types";
import { resolvePath } from "./build-fs";

export type TerminalLine = { type: "in" | "out" | "err"; text: string };

const NERDY_ERRORS = [
  "Nice try. This kernel only runs on imagination v6.6.",
  "Permission denied: your clearance level is 'curious visitor'.",
  "bash: command blocked by Cinnamon security policy.",
  "Segmentation fault (core dumped into /dev/null).",
];

const HELP_TOPICS: Record<string, string> = {
  help: `help [-s TOPIC]
  Show this overview or detailed help for TOPIC.
  Topics: help, ls, cd, cat, echo, pwd, whoami, date, uname, neofetch, clear, history`,

  ls: `ls [-a] [-l] [-h] [PATH]
  List directory contents.
  -a    include hidden entries (names starting with .)
  -l    long listing format
  -h    human-readable sizes (with -l)`,

  cd: `cd [DIRECTORY]
  Change the shell working directory.
  Default: /home/guest`,

  cat: `cat FILE...
  Concatenate and print files.`,

  echo: `echo [-n] [STRING...]
  Print arguments. -n suppress trailing newline.`,

  pwd: `pwd
  Print working directory.`,

  whoami: `whoami
  Print effective user name (guest).`,

  date: `date [-u]
  Print system date. -u: UTC.`,

  uname: `uname [-a] [-r] [-m]
  Print system information.`,

  neofetch: `neofetch [--off] [--cpu] [--memory]
  System info banner. --off: disable art.`,

  clear: `clear
  Clear the terminal screen.`,

  history: `history [-c]
  Show command history. -c: clear history.`,
};

function hasFlag(args: string[], flag: string) {
  return args.includes(flag);
}

function stripFlags(args: string[]) {
  return args.filter((a) => !a.startsWith("-"));
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
}

function listDir(node: FsNode, flags: string[]): string {
  const long = hasFlag(flags, "-l");
  const all = hasFlag(flags, "-a");
  const human = hasFlag(flags, "-h");
  if (node.type !== "directory") return `ls: not a directory: ${node.path}`;

  let entries = node.children ?? [];
  if (!all) entries = entries.filter((e) => !e.name.startsWith("."));

  if (!long) {
    return entries.map((e) => e.name).join("  ") || "";
  }

  return entries
    .map((e) => {
      const type = e.type === "directory" ? "d" : "-";
      const size =
        e.type === "file" && human
          ? formatSize(4096)
          : e.type === "directory"
            ? "4096"
            : "4096";
      return `${type}rwxr-xr-x 1 guest guest ${size.padStart(6)} ${e.name}`;
    })
    .join("\n");
}

function neofetchAscii(
  offArt: boolean,
  sessionMins: number,
  resolution: string,
) {
  const art = offArt
    ? ""
    : `
       ▄▄▄▄▄▄▄
      █ Mint ██
     █  Blog  █
    █ Desktop █
   ███████████`;
  return `${art}
       ratna@ratnadwip.dev
       ───────────────────
       OS: Linux Mint 22 (Wilma) x86_64
       Host: Oracle Red Bull Racing Edition 🏎️
       Kernel: 6.6.2am-sleep-deprived
       Uptime: ${sessionMins} mins (session)
       Shell: bash (synthwave-fueled)
       Resolution: ${resolution}
       DE: Cinnamon (custom glassmorphism)
       Theme: Mint-Y-Glass [Cinnamon]
       CPU: CS Student Brain (Overclocked @ 2AM)
       GPU: Creative Engine (Premiere + Photoshop + Blender)
       Memory: 14 cups of Coffee / 16GB
       F1 Favorite: Oracle Red Bull Racing 🐂🏆
       Alignment: Chaotic Productive`.trim();
}

export function runCommand(
  input: string,
  cwd: string,
  fs: FsNode,
  history: string[],
  env: { sessionMins: number; resolution: string },
): {
  lines: TerminalLine[];
  newCwd: string;
  newHistory: string[];
} {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [], newCwd: cwd, newHistory: history };

  const parts = trimmed.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];
  const cmd = parts[0] ?? "";
  const args = parts.slice(1).map((a) => a.replace(/^['"]|['"]$/g, ""));

  const lines: TerminalLine[] = [{ type: "in", text: `${cwd}$ ${trimmed}` }];
  const newHistory = [...history, trimmed].slice(-100);

  const helpTopic = (topic: string) => {
    const t = HELP_TOPICS[topic];
    lines.push({
      type: "out",
      text: t ?? `No help for '${topic}'. Try \`help\` for topics.`,
    });
  };

  switch (cmd) {
    case "help": {
      if (hasFlag(args, "-h") || args[0] === "--help") {
        lines.push({ type: "out", text: HELP_TOPICS.help });
        break;
      }
      const topic = stripFlags(args)[0];
      if (topic) {
        helpTopic(topic);
        break;
      }
      lines.push({
        type: "out",
        text: `GNU bash-style help (simulated)\n\n${Object.keys(HELP_TOPICS).join(", ")}, dtmf, f1, synth\n\nUse: help TOPIC   e.g. help ls`,
      });
      break;
    }
    case "clear":
      return {
        lines: [{ type: "out", text: "__CLEAR__" }],
        newCwd: cwd,
        newHistory,
      };
    case "history": {
      if (hasFlag(args, "-c")) {
        return { lines: [], newCwd: cwd, newHistory: [] };
      }
      lines.push({
        type: "out",
        text: history.map((h, i) => `${i + 1}  ${h}`).join("\n") || "(empty)",
      });
      break;
    }
    case "pwd":
      lines.push({ type: "out", text: cwd });
      break;
    case "whoami":
      lines.push({ type: "out", text: "guest" });
      break;
    case "date": {
      const d = hasFlag(args, "-u") ? new Date().toUTCString() : new Date().toString();
      lines.push({ type: "out", text: d });
      break;
    }
    case "uname": {
      if (hasFlag(args, "-a")) {
        lines.push({
          type: "out",
          text: "Linux ratna-desktop 6.6.2am-sleep-deprived #1 SMP x86_64 GNU/Linux",
        });
      } else if (hasFlag(args, "-r")) {
        lines.push({ type: "out", text: "6.6.2am-sleep-deprived" });
      } else if (hasFlag(args, "-m")) {
        lines.push({ type: "out", text: "x86_64" });
      } else {
        lines.push({ type: "out", text: "Linux" });
      }
      break;
    }
    case "neofetch": {
      lines.push({
        type: "out",
        text: neofetchAscii(
          hasFlag(args, "--off"),
          env.sessionMins,
          env.resolution,
        ),
      });
      break;
    }
    case "echo": {
      const noNl = hasFlag(args, "-n");
      const text = stripFlags(args).join(" ");
      lines.push({ type: "out", text: noNl ? text : text + "\n" });
      break;
    }
    case "ls": {
      const flags = args.filter((a) => a.startsWith("-"));
      const pathArgs = stripFlags(args);
      const target = pathArgs[0] ?? cwd;
      const node = resolvePath(fs, target);
      if (!node) {
        lines.push({ type: "err", text: `ls: cannot access '${target}': No such file or directory` });
        break;
      }
      lines.push({ type: "out", text: listDir(node, flags) });
      break;
    }
    case "cd": {
      const target = stripFlags(args)[0] ?? "/home/guest";
      let next = target;
      if (target === "~" || target === "") next = "/home/guest";
      else if (!target.startsWith("/")) {
        next = `${cwd}/${target}`.replace(/\/+/g, "/");
      }
      const parts = next.split("/").filter(Boolean);
      const resolved: string[] = [];
      for (const p of parts) {
        if (p === "..") resolved.pop();
        else if (p !== ".") resolved.push(p);
      }
      next = "/" + resolved.join("/");
      const node = resolvePath(fs, next);
      if (!node || node.type !== "directory") {
        lines.push({ type: "err", text: `cd: ${target}: No such file or directory` });
        break;
      }
      return { lines, newCwd: next, newHistory };
    }
    case "cat": {
      const files = stripFlags(args);
      if (!files.length) {
        lines.push({ type: "err", text: "cat: missing file operand" });
        break;
      }
      for (const f of files) {
        const path = f.startsWith("/") ? f : `${cwd}/${f}`;
        const node = resolvePath(fs, path);
        if (!node) {
          lines.push({ type: "err", text: `cat: ${f}: No such file or directory` });
          continue;
        }
        if (node.type === "directory") {
          lines.push({ type: "err", text: `cat: ${f}: Is a directory` });
          continue;
        }
        if (node.content !== undefined) {
          lines.push({ type: "out", text: node.content });
        } else if (node.name === "notes.txt") {
          lines.push({
            type: "out",
            text: "Blog posts are listed in the Notes application.\nOpen Menu → Notes or double-click the desktop icon.",
          });
        } else if (node.name === ".bashrc") {
          lines.push({
            type: "out",
            text: "# ~/.bashrc\nexport PS1='\\u@blog:\\w\\$ '\nalias ll='ls -la'\nalias la='ls -A'\nplay-chord",
          });
        } else if (node.mediaUrl) {
          lines.push({
            type: "out",
            text: `[binary ${node.mimeType ?? "file"} — open in Files app: ${node.name}]`,
          });
        } else {
          lines.push({ type: "out", text: "" });
        }
      }
      break;
    }
    case "dtmf":
    case "rdtmf": {
      lines.push({
        type: "out",
        text: "rDTMF Keypad Decoder v1.0.2 Initiated.\nPress keys to play dual-tone multi-frequency signals.\nDecoding keypad tones in real-time...\n__DTMF__",
      });
      break;
    }
    case "f1":
    case "race":
    case "telemetry": {
      lines.push({
        type: "out",
        text: `🏎️ Oracle Red Bull Racing Telemetry - Monaco GP Sector 3\n────────────────────────────────────────────────────────\n[Car] Red Bull RB20 (Honda RBPTH002)\n[Driver] RealRatnadwip\n[Telemetry] Speed: 324 km/h | RPM: 12,100 | DRS: Active | Gear: 8\n[Tires] Softs (C5 - 3 laps old)\n[Radio] "Okay Max, Checo is behind. Box for softs, let's go for fastest lap."\n[Status] P1 - Gap to P2: +12.4s\n[Team Alignment] Oracle Red Bull Racing Fan 🐂🏆`,
      });
      break;
    }
    case "synth":
    case "audio": {
      lines.push({
        type: "out",
        text: "Ableton Live audio engine initialized.\nTry typing `dtmf` for DTMF wave synthesis,\nor adjust system volume in the panel Quick Settings.",
      });
      break;
    }
    case "sudo":
    case "apt":
    case "pacman":
    case "docker":
    case "kubectl":
    case "rm":
    case "chmod":
    case "reboot":
    case "shutdown":
      lines.push({
        type: "err",
        text: NERDY_ERRORS[history.length % NERDY_ERRORS.length],
      });
      break;
    default:
      if (hasFlag(args, "-h") || args.includes("--help")) {
        lines.push({
          type: "err",
          text: `bash: ${cmd}: command not found (no manual entry)`,
        });
      } else {
        lines.push({
          type: "err",
          text: `bash: ${cmd}: command not found`,
        });
      }
  }

  return { lines, newCwd: cwd, newHistory };
}
