"use client";

import { useState, useMemo } from "react";
import type { FsNode } from "@/types";
import { resolvePath, parentPath } from "@/lib/desktop/build-fs";
import { useDesktopStore } from "@/store/desktop";
import { filesBgContextMenu, filesItemContextMenu } from "@/lib/desktop/context-menus";

// SVG Icons
function FolderIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 3.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" fill="#87bf4e" stroke="#6a9e3a" />
      <path d="M2 10h20" stroke="#6a9e3a" opacity="0.5" />
    </svg>
  );
}

function FileTextIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" fill="#ececec" stroke="#bbb" />
      <polyline points="14 2 14 8 20 8" stroke="#bbb" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="#999" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="#999" />
      <line x1="10" y1="9" x2="8" y2="9" stroke="#999" />
    </svg>
  );
}

function FileImageIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="#e1f5fe" stroke="#0288d1" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="#0288d1" stroke="none" />
      <polyline points="21 15 16 10 5 21" stroke="#0288d1" fill="#b3e5fc" />
    </svg>
  );
}

function FileVideoIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" fill="#fce4ec" stroke="#c2185b" />
      <line x1="7" y1="2" x2="7" y2="22" stroke="#c2185b" />
      <line x1="17" y1="2" x2="17" y2="22" stroke="#c2185b" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="#c2185b" />
      <line x1="2" y1="7" x2="7" y2="7" stroke="#c2185b" />
      <line x1="2" y1="17" x2="7" y2="17" stroke="#c2185b" />
      <line x1="17" y1="17" x2="22" y2="17" stroke="#c2185b" />
      <line x1="17" y1="7" x2="22" y2="7" stroke="#c2185b" />
    </svg>
  );
}

function FileShortcutIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="#f9f9f9" stroke="#999" />
      <path d="M8 16h6v-6" stroke="var(--mint-green)" strokeWidth="2" />
      <line x1="8" y1="16" x2="15" y2="9" stroke="var(--mint-green)" strokeWidth="2" />
    </svg>
  );
}

type Props = { fs: FsNode };

export function FilesApp({ fs: dummyFs }: Props) {
  const {
    fs,
    createDirectory,
    createFile,
    deleteNode,
    renameNode,
    openApp,
    showContextMenu,
  } = useDesktopStore();

  const [path, setPath] = useState("/home/guest");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressValue, setAddressValue] = useState("/home/guest");
  const [showHidden, setShowHidden] = useState(false);

  // Properties popup state
  const [propertiesNode, setPropertiesNode] = useState<FsNode | null>(null);

  // Slideshow media list state
  const [mediaList, setMediaList] = useState<FsNode[]>([]);
  const [mediaIndex, setMediaIndex] = useState(-1);

  // Current active filesystem node
  const activeFs = fs || dummyFs;
  const currentNode = resolvePath(activeFs, path) ?? activeFs;

  // Filtered children entries
  const entries = useMemo(() => {
    if (currentNode.type !== "directory" || !currentNode.children) return [];
    
    let items = currentNode.children.filter(
      (e) => showHidden || !e.name.startsWith(".")
    );

    if (searchQuery.trim()) {
      items = items.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return items;
  }, [currentNode, showHidden, searchQuery]);

  function navigateTo(targetPath: string) {
    setPath(targetPath);
    setAddressValue(targetPath);
    setSelectedPath(null);
    setSearchQuery("");
  }

  function handleOpen(entry: FsNode) {
    if (entry.type === "directory") {
      navigateTo(entry.path);
    } else {
      // 1. Check if blog post shortcut link
      if (entry.slug) {
        openApp("post", entry.name.replace(".note", ""), { slug: entry.slug });
      }
      // 2. Check if media file
      else if (entry.mediaUrl) {
        // Collect other media in the same directory for slideshow
        const currentMedia = entries.filter((e) => e.type === "file" && e.mediaUrl);
        setMediaList(currentMedia);
        const idx = currentMedia.findIndex((m) => m.path === entry.path);
        setMediaIndex(idx);
      }
      // 3. Check if desktop shortcut file
      else if (entry.name.endsWith(".desktop")) {
        if (entry.name === "notes.desktop") openApp("notes", "Notes");
        else if (entry.name === "files.desktop") openApp("files", "Files");
      }
      // 4. Otherwise, treat as editable text file
      else {
        openApp("editor", `Text Editor - ${entry.name}`, { path: entry.path });
      }
    }
  }

  // Sidebar shortcuts configuration
  const sidebarPlaces = [
    { label: "Home", path: "/home/guest", icon: "🏠" },
    { label: "Desktop", path: "/home/guest/Desktop", icon: "🖥️" },
    { label: "Documents", path: "/home/guest/Documents", icon: "📄" },
    { label: "Downloads", path: "/home/guest/Downloads", icon: "📥" },
    { label: "Pictures", path: "/home/guest/Pictures", icon: "🖼️" },
    { label: "Videos", path: "/home/guest/Videos", icon: "🎬" },
    { label: "File System", path: "/", icon: "📁" },
  ];

  // Address bar submission
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolved = resolvePath(activeFs, addressValue);
    if (resolved && resolved.type === "directory") {
      navigateTo(resolved.path);
      setIsEditingAddress(false);
    } else {
      alert("Folder not found!");
      setAddressValue(path);
      setIsEditingAddress(false);
    }
  };

  // Right-click empty background area
  const onBgContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: filesBgContextMenu(path, {
        createFile: (parent, name) => createFile(parent, name, ""),
        createDirectory: (parent, name) => createDirectory(parent, name),
        openTerminal: (dirPath) => openApp("terminal", "Terminal", { cwd: dirPath }),
        showProperties: (node) => setPropertiesNode(node),
        dirNode: currentNode,
      }),
    });
  };

  // Right-click file/folder item
  const onItemContextMenu = (e: React.MouseEvent, item: FsNode) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPath(item.path);
    showContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: filesItemContextMenu(item, {
        open: (node) => handleOpen(node),
        rename: (newName) => renameNode(item.path, newName),
        deleteNode: (nodePath) => deleteNode(nodePath),
        copyPath: (nodePath) => {
          navigator.clipboard.writeText(nodePath);
          alert("Path copied to clipboard!");
        },
        showProperties: (node) => setPropertiesNode(node),
      }),
    });
  };

  // Click outside to deselect
  const handlePaneClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest(".files-grid-item")) {
      setSelectedPath(null);
    }
  };

  const crumbs = path.split("/").filter(Boolean);

  return (
    <div className="files-app" onContextMenu={onBgContextMenu} onClick={handlePaneClick}>
      {/* Toolbar */}
      <nav className="files-toolbar">
        <button
          type="button"
          className="files-tool-btn"
          onClick={() => navigateTo(parentPath(path))}
          disabled={path === "/"}
          title="Back"
        >
          🡨
        </button>
        <button
          type="button"
          className="files-tool-btn"
          onClick={() => navigateTo("/home/guest")}
          title="Home"
        >
          🏠
        </button>

        {isEditingAddress ? (
          <form onSubmit={handleAddressSubmit} style={{ flex: 1, display: "flex" }}>
            <input
              type="text"
              className="files-address-input"
              value={addressValue}
              onChange={(e) => setAddressValue(e.target.value)}
              onBlur={() => setIsEditingAddress(false)}
              autoFocus
            />
          </form>
        ) : (
          <div
            className="files-address-input"
            onClick={() => {
              setAddressValue(path);
              setIsEditingAddress(true);
            }}
            style={{ cursor: "text", userSelect: "none" }}
          >
            {path}
          </div>
        )}

        <input
          type="text"
          className="files-search-input"
          placeholder="Filter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <label className="files-hidden-toggle" style={{ userSelect: "none" }}>
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
          Show Hidden
        </label>
      </nav>

      {/* Main split */}
      <div className="files-container">
        {/* Left Sidebar */}
        <aside className="files-sidebar">
          <div className="files-sidebar-section">
            <h4>Places</h4>
            <ul className="files-sidebar-list">
              {sidebarPlaces.map((place) => (
                <li
                  key={place.path}
                  className={`files-sidebar-item${path === place.path ? " active" : ""}`}
                >
                  <button type="button" onClick={() => navigateTo(place.path)}>
                    <span>{place.icon}</span>
                    <span>{place.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="files-main-pane">
          {/* Breadcrumbs */}
          <div className="files-breadcrumb">
            <button type="button" onClick={() => navigateTo("/")}>
              Root
            </button>
            {crumbs.map((part, i) => {
              const p = "/" + crumbs.slice(0, i + 1).join("/");
              return (
                <span key={p}>
                  <span className="bc-sep">/</span>
                  <button type="button" onClick={() => navigateTo(p)}>
                    {part}
                  </button>
                </span>
              );
            })}
          </div>

          {/* Grid View */}
          <div className="files-grid-scroll">
            <div className="files-grid">
              {entries.map((e) => {
                const isSelected = selectedPath === e.path;
                return (
                  <div
                    key={e.path}
                    className={`files-grid-item${isSelected ? " selected" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPath(isSelected ? null : e.currentTarget.dataset.path || null);
                    }}
                    onDoubleClick={(evt) => {
                      evt.stopPropagation();
                      handleOpen(e);
                    }}
                    onContextMenu={(evt) => onItemContextMenu(evt, e)}
                    data-path={e.path}
                  >
                    <div className="item-icon-wrapper">
                      {e.type === "directory" ? (
                        <FolderIcon />
                      ) : e.mediaUrl ? (
                        e.mimeType?.startsWith("video/") ? (
                          <FileVideoIcon />
                        ) : (
                          <img src={e.mediaUrl} className="item-img-preview" alt="" />
                        )
                      ) : e.name.endsWith(".desktop") ? (
                        <FileShortcutIcon />
                      ) : e.mimeType?.startsWith("image/") ? (
                        <FileImageIcon />
                      ) : (
                        <FileTextIcon />
                      )}
                    </div>
                    <span className="item-name">{e.name}</span>
                  </div>
                );
              })}

              {entries.length === 0 && (
                <div className="files-empty-prompt">
                  This folder is empty. Right-click here to create a new folder/file.
                </div>
              )}
            </div>
          </div>

          {/* Status Bar */}
          <footer className="files-status-bar">
            <span>{entries.length} items</span>
            <span>guest@mint-os:read-write</span>
          </footer>
        </main>
      </div>

      {/* Properties Modal */}
      {propertiesNode && (
        <div className="properties-overlay" onClick={() => setPropertiesNode(null)}>
          <div className="properties-dialog" onClick={(e) => e.stopPropagation()}>
            <header className="properties-header">
              <span>Properties - {propertiesNode.name}</span>
              <button
                type="button"
                style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer", fontSize: "14px" }}
                onClick={() => setPropertiesNode(null)}
              >
                ✕
              </button>
            </header>
            <div className="properties-body">
              <div className="properties-row">
                <label>Name:</label>
                <span>{propertiesNode.name}</span>
              </div>
              <div className="properties-row">
                <label>Type:</label>
                <span>{propertiesNode.type === "directory" ? "Folder (Directory)" : "File"}</span>
              </div>
              <div className="properties-row">
                <label>Path:</label>
                <span>{propertiesNode.path}</span>
              </div>
              {propertiesNode.mimeType && (
                <div className="properties-row">
                  <label>Mime-type:</label>
                  <span>{propertiesNode.mimeType}</span>
                </div>
              )}
              <div className="properties-row">
                <label>Size:</label>
                <span>
                  {propertiesNode.type === "directory"
                    ? `${propertiesNode.children?.length || 0} items`
                    : propertiesNode.content
                    ? `${propertiesNode.content.length} bytes`
                    : "1.2 KB"}
                </span>
              </div>
            </div>
            <footer className="properties-footer">
              <button
                type="button"
                className="qs-footer-btn"
                onClick={() => setPropertiesNode(null)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Media Slideshow Viewer */}
      {mediaIndex !== -1 && mediaList.length > 0 && (
        <div className="media-viewer-overlay">
          <header className="media-viewer-header">
            <span className="media-viewer-title">
              {mediaList[mediaIndex].name} ({mediaIndex + 1}/{mediaList.length})
            </span>
            <button
              type="button"
              className="media-viewer-close"
              onClick={() => setMediaIndex(-1)}
            >
              ✕
            </button>
          </header>

          <div className="media-viewer-content">
            {mediaList.length > 1 && (
              <button
                type="button"
                className="media-nav-btn prev"
                onClick={() => setMediaIndex((idx) => (idx - 1 + mediaList.length) % mediaList.length)}
              >
                🡨
              </button>
            )}

            {mediaList[mediaIndex].mimeType?.startsWith("video/") ? (
              <video src={mediaList[mediaIndex].mediaUrl} controls autoPlay playsInline />
            ) : (
              <img src={mediaList[mediaIndex].mediaUrl} alt="" />
            )}

            {mediaList.length > 1 && (
              <button
                type="button"
                className="media-nav-btn next"
                onClick={() => setMediaIndex((idx) => (idx + 1) % mediaList.length)}
              >
                🡪
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
