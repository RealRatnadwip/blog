export type PostStatus =
  | "published"
  | "draft"
  | "archived"
  | "private"
  | "unlinked";

export interface Post {
  id: string;
  slug: string;
  title: string;
  content: Record<string, unknown>;
  excerpt: string;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface MediaAsset {
  id: string;
  storage_key: string;
  public_path: string;
  mime_type: string;
  media_type: "image" | "video";
  width: number | null;
  height: number | null;
  size_bytes: number;
  created_at: string;
}

export type DesktopTheme = "light" | "dark";
export type TextScale = "small" | "medium" | "large";

export interface DesktopSettings {
  theme: DesktopTheme;
  textScale: TextScale;
}

export interface FsNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FsNode[];
  mediaUrl?: string;
  mimeType?: string;
}
