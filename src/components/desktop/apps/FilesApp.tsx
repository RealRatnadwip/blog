"use client";

import { useState } from "react";
import type { FsNode } from "@/types";
import { resolvePath, parentPath } from "@/lib/desktop/build-fs";

type Props = { fs: FsNode };

export function FilesApp({ fs }: Props) {
  const [path, setPath] = useState("/home/guest");
  const [preview, setPreview] = useState<FsNode | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const node = resolvePath(fs, path) ?? fs;
  const entries =
    node.type === "directory"
      ? (node.children ?? []).filter(
          (e) => showHidden || !e.name.startsWith("."),
        )
      : [];

  function openEntry(entry: FsNode) {
    if (entry.type === "directory") {
      setPath(entry.path);
      setPreview(null);
    } else {
      setPreview(entry);
    }
  }

  const crumbs = path.split("/").filter(Boolean);

  return (
    <div className="files-app">
      <nav className="files-toolbar">
        <button
          type="button"
          onClick={() => {
            setPath(parentPath(path));
            setPreview(null);
          }}
          disabled={path === "/"}
        >
          ← Back
        </button>
        <button type="button" onClick={() => setPath("/home/guest")}>
          Home
        </button>
        <label className="files-hidden-toggle">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
          Show hidden
        </label>
      </nav>
      <div className="files-breadcrumb">
        <button type="button" onClick={() => setPath("/")}>
          /
        </button>
        {crumbs.map((part, i) => {
          const p = "/" + crumbs.slice(0, i + 1).join("/");
          return (
            <span key={p}>
              <span className="bc-sep">/</span>
              <button type="button" onClick={() => setPath(p)}>
                {part}
              </button>
            </span>
          );
        })}
      </div>
      <div className="files-split">
        <ul className="files-list">
          {entries.map((e) => (
            <li key={e.path}>
              <button
                type="button"
                onClick={() => openEntry(e)}
                onDoubleClick={() => openEntry(e)}
              >
                <span className={`files-icon ${e.type}`} aria-hidden />
                <span className="files-name">{e.name}</span>
              </button>
            </li>
          ))}
          {entries.length === 0 && (
            <li className="files-empty">This folder is empty.</li>
          )}
        </ul>
        <div className="files-preview">
          {preview?.mediaUrl ? (
            preview.mimeType?.startsWith("video/") ? (
              <video src={preview.mediaUrl} controls playsInline />
            ) : (
              <img src={preview.mediaUrl} alt="" />
            )
          ) : (
            <p>Select a file to preview</p>
          )}
        </div>
      </div>
    </div>
  );
}
