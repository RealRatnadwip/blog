"use client";

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { VideoBlock, ImageCompareBlock } from "@/lib/tiptap/extensions";

const lowlight = createLowlight(common);

function ResizableImageComponent({ node, updateAttributes, selected }: any) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const [width, setWidth] = useState(node.attrs.width || "100%");
  const widthRef = useRef(node.attrs.width || "100%");

  useEffect(() => {
    setWidth(node.attrs.width || "100%");
    widthRef.current = node.attrs.width || "100%";
  }, [node.attrs.width]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);

    const startX = e.clientX;
    const startWidth = imgRef.current ? imgRef.current.clientWidth : 200;
    const parentWidth = containerRef.current?.parentElement ? containerRef.current.parentElement.clientWidth : 500;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidthPx = Math.max(50, startWidth + deltaX);
      const newWidthPercent = Math.min(100, Math.round((newWidthPx / parentWidth) * 100));
      const nextWidth = `${newWidthPercent}%`;
      setWidth(nextWidth);
      widthRef.current = nextWidth;
    };

    const handleMouseUp = () => {
      setResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      updateAttributes({ width: widthRef.current });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const displayWidth = width.endsWith("%") ? `calc(${width} - 8px)` : width;

  return (
    <NodeViewWrapper
      ref={containerRef}
      className={`resizable-image-wrapper ${selected ? "is-selected" : ""}`}
      style={{
        display: "inline-block",
        width: displayWidth,
        position: "relative",
        userSelect: "none",
        margin: "4px",
        verticalAlign: "top",
      }}
    >
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt=""
        style={{
          width: "100%",
          display: "block",
          borderRadius: "4px",
          outline: selected ? "2px solid #87bf4e" : "none",
          transition: resizing ? "none" : "outline 0.15s ease",
        }}
      />
      {selected && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: "absolute",
            bottom: "4px",
            right: "4px",
            width: "12px",
            height: "12px",
            background: "#87bf4e",
            border: "2px solid white",
            cursor: "nwse-resize",
            borderRadius: "2px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            zIndex: 10,
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) => element.getAttribute("width") || element.style.width || "100%",
        renderHTML: (attributes) => {
          const w = attributes.width || "100%";
          const displayWidth = w.endsWith("%") ? `calc(${w} - 8px)` : w;
          return {
            width: attributes.width,
            style: `width: ${displayWidth}; max-width: 100%; height: auto; display: inline-block; vertical-align: top; margin: 4px;`,
          };
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

type Props = {
  content: Record<string, unknown>;
  onChange: (json: Record<string, unknown>) => void;
};

async function uploadFile(file: File): Promise<string> {
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
  form.append("file", payload, "upload.bin");
  const res = await fetch("/api/media/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

export function RichEditor({ content, onChange }: Props) {
  const hydrated = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      CustomImage.configure({ inline: false, allowBase64: false }),
      VideoBlock,
      ImageCompareBlock,
      CodeBlockLowlight.configure({ lowlight }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      Placeholder.configure({ placeholder: "Start writing your post…" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      HorizontalRule,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as Record<string, unknown>),
    editorProps: {
      attributes: {
        class: "admin-editor-surface",
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        event.preventDefault();
        const file = files[0];
        if (file.type.startsWith("image/")) {
          uploadFile(file)
            .then((url) => {
              const { schema } = view.state;
              const node = schema.nodes.image.create({ src: url });
              const pos = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              })?.pos;
              if (pos != null) {
                view.dispatch(view.state.tr.insert(pos, node));
              }
            })
            .catch((err) => alert(err.message));
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor || hydrated.current) return;
    if (content && Object.keys(content).length > 0) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    hydrated.current = true;
  }, [editor, content]);

  const setHeading = useCallback(
    (level: 1 | 2 | 3) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    [editor],
  );

  const addImage = useCallback(async () => {
    const file = await pickFile("image/*");
    if (!file || !editor) return;
    try {
      const url = await uploadFile(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    }
  }, [editor]);

  const addCompare = useCallback(async () => {
    if (!editor) return;
    const beforeFile = await pickFile("image/*");
    if (!beforeFile) return;
    const afterFile = await pickFile("image/*");
    if (!afterFile) return;
    try {
      const [before, after] = await Promise.all([
        uploadFile(beforeFile),
        uploadFile(afterFile),
      ]);
      editor
        .chain()
        .focus()
        .insertContent({
          type: "imageCompare",
          attrs: { before, after },
        })
        .run();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    }
  }, [editor]);

  const addVideo = useCallback(async () => {
    const file = await pickFile("video/*");
    if (!file || !editor) return;
    try {
      const url = await uploadFile(file);
      editor
        .chain()
        .focus()
        .insertContent({ type: "videoBlock", attrs: { src: url } })
        .run();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    }
  }, [editor]);

  const addYoutube = useCallback(() => {
    const url = prompt("Paste YouTube URL");
    if (url?.trim() && editor) {
      editor.commands.setYoutubeVideo({ src: url.trim() });
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return <div className="admin-editor-loading">Loading editor…</div>;
  }

  const tool = (
    label: string,
    action: () => void,
    active?: boolean,
    title?: string,
  ) => (
    <button
      key={label}
      type="button"
      title={title ?? label}
      className={`admin-toolbar-btn${active ? " active" : ""}`}
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="admin-editor-wrap">
      <div className="admin-toolbar">
        {tool("B", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "Bold")}
        {tool("I", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "Italic")}
        {tool("U", () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), "Underline")}
        {tool("S", () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"), "Strikethrough")}
        <span className="admin-toolbar-sep" />
        {tool("H1", () => setHeading(1), editor.isActive("heading", { level: 1 }), "Heading 1")}
        {tool("H2", () => setHeading(2), editor.isActive("heading", { level: 2 }), "Heading 2")}
        {tool("H3", () => setHeading(3), editor.isActive("heading", { level: 3 }), "Heading 3")}
        {tool("¶", () => editor.chain().focus().setParagraph().run(), editor.isActive("paragraph"), "Paragraph")}
        <span className="admin-toolbar-sep" />
        {tool("•", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"), "Bullet list")}
        {tool("1.", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"), "Numbered list")}
        {tool("❝", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"), "Quote")}
        {tool("</>", () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"), "Code block")}
        {tool("—", () => editor.chain().focus().setHorizontalRule().run(), false, "Horizontal rule")}
        <span className="admin-toolbar-sep" />
        {tool("Link", addLink, editor.isActive("link"), "Insert link")}
        {tool("Image", addImage, false, "Upload image")}
        {tool("Compare", addCompare, false, "Before/after images")}
        {tool("Video", addVideo, false, "Upload video")}
        {tool("YT", addYoutube, editor.isActive("youtube"), "YouTube embed")}
        <span className="admin-toolbar-sep" />
        {tool("←", () => editor.chain().focus().setTextAlign("left").run(), editor.isActive({ textAlign: "left" }), "Align left")}
        {tool("↔", () => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }), "Center")}
        {tool("→", () => editor.chain().focus().setTextAlign("right").run(), editor.isActive({ textAlign: "right" }), "Align right")}
        {tool("Undo", () => editor.chain().focus().undo().run(), false, "Undo")}
        {tool("Redo", () => editor.chain().focus().redo().run(), false, "Redo")}
        {editor.isActive("image") && (
          <>
            <span className="admin-toolbar-sep" />
            <span style={{ fontSize: "11px", fontWeight: "bold", alignSelf: "center", color: "#666", marginRight: "4px" }}>Image Size:</span>
            {tool("25%", () => editor.chain().focus().updateAttributes("image", { width: "25%" }).run(), editor.getAttributes("image").width === "25%", "Quarter Width")}
            {tool("33%", () => editor.chain().focus().updateAttributes("image", { width: "33%" }).run(), editor.getAttributes("image").width === "33%", "Third Width")}
            {tool("50%", () => editor.chain().focus().updateAttributes("image", { width: "50%" }).run(), editor.getAttributes("image").width === "50%", "Half Width")}
            {tool("100%", () => editor.chain().focus().updateAttributes("image", { width: "100%" }).run(), !editor.getAttributes("image").width || editor.getAttributes("image").width === "100%", "Full Width")}
          </>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
