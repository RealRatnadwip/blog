import type { FsNode } from "@/types";
import type { NoteItem } from "@/components/desktop/apps/NotesApp";

interface MediaItem {
  id: string;
  public_path: string;
  media_type: string;
  mime_type: string;
}

export function buildVirtualFs(media: MediaItem[], posts: NoteItem[] = []): FsNode {
  const pictures = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "video");

  const file = (name: string, path: string, url: string, mime: string, content = ""): FsNode => ({
    name,
    type: "file",
    path,
    mediaUrl: url,
    mimeType: mime,
    content,
  });

  const noteFile = (name: string, path: string, content: string, slug: string): FsNode => ({
    name,
    type: "file",
    path,
    content,
    mimeType: "text/plain",
    slug,
  });

  const dir = (name: string, path: string, children: FsNode[]): FsNode => ({
    name,
    type: "directory",
    path,
    children,
  });

  return dir("/", "/", [
    dir("etc", "/etc", [
      file("hostname", "/etc/hostname", "", "text/plain", "ratna-desktop"),
      file("os-release", "/etc/os-release", "", "text/plain", "NAME=\"Linux Mint\"\nVERSION=\"22 (Wilma)\"\nID=linuxmint"),
    ]),
    dir("usr", "/usr", [
      dir("share", "/usr/share", [
        dir("icons", "/usr/share/icons", []),
      ]),
    ]),
    dir("home", "/home", [
      dir("guest", "/home/guest", [
        file(".bashrc", "/home/guest/.bashrc", "", "text/plain", "# ~/.bashrc\nexport PS1='\\u@blog:\\w\\$ '\nalias ll='ls -la'\nalias la='ls -A'"),
        file(".profile", "/home/guest/.profile", "", "text/plain", "# ~/.profile\nexport PATH=$PATH:$HOME/bin"),
        file("notes.txt", "/home/guest/notes.txt", "", "text/plain", "Blog posts are listed in the Notes application.\nOpen Menu → Notes or double-click the desktop icon."),
        dir("Desktop", "/home/guest/Desktop", [
          file("notes.desktop", "/home/guest/Desktop/notes.desktop", "", "text/plain", "[Desktop Entry]\nName=Notes\nExec=open notes"),
          file("files.desktop", "/home/guest/Desktop/files.desktop", "", "text/plain", "[Desktop Entry]\nName=Files\nExec=open files"),
        ]),
        dir("Documents", "/home/guest/Documents", [
          file("readme.txt", "/home/guest/Documents/readme.txt", "", "text/plain", "Welcome to my personal blog desktop!\nFeel free to explore my files or run bash terminal commands."),
          dir("My Blogs", "/home/guest/Documents/My Blogs", [
            ...posts.map((post) =>
              noteFile(
                `${post.title.replace(/[\/\\?%*:|"<>]/g, "-")}.note`,
                `/home/guest/Documents/My Blogs/${post.title.replace(/[\/\\?%*:|"<>]/g, "-")}.note`,
                post.excerpt || "Double-click this note to read the full blog post.",
                post.slug,
              )
            ),
          ]),
        ]),
        dir("Downloads", "/home/guest/Downloads", []),
        dir("Pictures", "/home/guest/Pictures", [
          ...pictures.map((m, i) =>
            file(
              `wallpaper-${String(i + 1).padStart(2, "0")}.webp`,
              `/home/guest/Pictures/wallpaper-${String(i + 1).padStart(2, "0")}.webp`,
              m.public_path,
              m.mime_type,
            )
          ),
        ]),
        dir("Videos", "/home/guest/Videos", [
          ...videos.map((m, i) =>
            file(
              `recording-${String(i + 1).padStart(2, "0")}.mp4`,
              `/home/guest/Videos/recording-${String(i + 1).padStart(2, "0")}.mp4`,
              m.public_path,
              m.mime_type,
            )
          ),
        ]),
      ]),
    ]),
  ]);
}

export function resolvePath(root: FsNode, path: string): FsNode | null {
  if (path === "/" || path === root.path) return root;
  const normalized = path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  if (normalized === "/") return root;
  const parts = normalized.split("/").filter(Boolean);
  let node: FsNode = root;
  for (const part of parts) {
    if (node.type !== "directory" || !node.children) return null;
    const next = node.children.find((c) => c.name === part);
    if (!next) return null;
    node = next;
  }
  return node;
}

export function parentPath(path: string): string {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join("/")}` : "/";
}
