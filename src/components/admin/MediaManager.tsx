"use client";

import { useEffect, useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import type { MediaAsset } from "@/types";

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function MediaManager() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia() {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      if (!res.ok) throw new Error("Failed to fetch media assets");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAssets(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const isImage = file.type.startsWith("image/");
      let payload: Blob = file;

      if (isImage) {
        payload = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: "image/webp",
        });
      }

      const form = new FormData();
      form.append("file", payload, isImage ? "upload.webp" : file.name);

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      // Reload list to get fresh records with full metadata
      await fetchMedia();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this media asset permanently?")) return;

    try {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setAssets((prev) => prev.filter((asset) => asset.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function copyUrl(id: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  }

  const filteredAssets = assets.filter((asset) => {
    if (filter === "all") return true;
    return asset.media_type === filter;
  });

  return (
    <div className="media-manager">
      <div className="media-manager-header">
        <div className="media-filters">
          <button
            type="button"
            className={`media-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`media-filter-btn ${filter === "image" ? "active" : ""}`}
            onClick={() => setFilter("image")}
          >
            Images
          </button>
          <button
            type="button"
            className={`media-filter-btn ${filter === "video" ? "active" : ""}`}
            onClick={() => setFilter("video")}
          >
            Videos
          </button>
        </div>
      </div>

      {uploadError && <p className="admin-error media-upload-error">{uploadError}</p>}

      <div
        className={`media-uploader-zone ${dragActive ? "drag-active" : ""} ${
          uploading ? "uploading" : ""
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="media-file-input"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        {uploading ? (
          <div className="media-upload-status">
            <span className="media-spinner" />
            <p>Optimizing and uploading media asset…</p>
          </div>
        ) : (
          <div className="media-upload-prompt">
            <span className="media-upload-icon">📂</span>
            <p>Drag and drop a file here, or click to browse</p>
            <small>Supports high-res Images and MP4 Videos up to 48MB</small>
          </div>
        )}
      </div>

      {loading ? (
        <div className="media-grid-loading">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <p className="admin-empty media-empty">No media assets found.</p>
      ) : (
        <div className="media-grid">
          {filteredAssets.map((asset) => (
            <div key={asset.id} className="media-card">
              <div className="media-card-preview">
                {asset.media_type === "image" ? (
                  <img
                    src={asset.public_path}
                    alt={asset.storage_key}
                    loading="lazy"
                  />
                ) : (
                  <video
                    src={asset.public_path}
                    preload="metadata"
                    playsInline
                    muted
                  />
                )}
                <span className={`media-type-badge ${asset.media_type}`}>
                  {asset.media_type}
                </span>
              </div>
              <div className="media-card-info">
                <p className="media-card-title" title={asset.storage_key}>
                  {asset.storage_key}
                </p>
                <div className="media-card-meta">
                  <span>{formatBytes(asset.size_bytes)}</span>
                  {asset.width && asset.height && (
                    <span>
                      • {asset.width}×{asset.height}
                    </span>
                  )}
                </div>
                <div className="media-card-actions">
                  <button
                    type="button"
                    className={`media-btn-copy ${copiedId === asset.id ? "copied" : ""}`}
                    onClick={() => copyUrl(asset.id, asset.public_path)}
                  >
                    {copiedId === asset.id ? "✓ Copied!" : "📋 Copy URL"}
                  </button>
                  <button
                    type="button"
                    className="media-btn-delete"
                    onClick={() => handleDelete(asset.id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
