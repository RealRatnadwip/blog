"use client";

import { useMemo, useState } from "react";

type TipTapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

function CompareSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="compare-slider">
      <img src={after} alt="" className="compare-after" />
      <div className="compare-before-wrap" style={{ width: `${pos}%` }}>
        <img src={before} alt="" className="compare-before" />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="compare-range"
        aria-label="Compare slider"
      />
    </div>
  );
}

function renderText(node: TipTapNode): React.ReactNode {
  let el: React.ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") el = <strong>{el}</strong>;
    if (mark.type === "italic") el = <em>{el}</em>;
    if (mark.type === "underline") el = <u>{el}</u>;
    if (mark.type === "strike") el = <s>{el}</s>;
    if (mark.type === "code") el = <code>{el}</code>;
    if (mark.type === "link")
      el = (
        <a href={String(mark.attrs?.href ?? "#")} target="_blank" rel="noreferrer">
          {el}
        </a>
      );
  }
  const text = node.text ?? "";
  const compare = text.match(/^\[compare:(.+)\|(.+)\]$/);
  if (compare) {
    return <CompareSlider before={compare[1]} after={compare[2]} />;
  }
  return el;
}

function renderNode(node: TipTapNode, key: number): React.ReactNode {
  const kids = node.content?.map((c, i) => renderNode(c, i));
  switch (node.type) {
    case "doc":
      return <article key={key}>{kids}</article>;
    case "paragraph":
      return <p key={key}>{kids}</p>;
    case "heading": {
      const level = Number(node.attrs?.level ?? 1);
      if (level === 1) return <h1 key={key}>{kids}</h1>;
      if (level === 2) return <h2 key={key}>{kids}</h2>;
      if (level === 3) return <h3 key={key}>{kids}</h3>;
      return <h4 key={key}>{kids}</h4>;
    }
    case "bulletList":
      return <ul key={key}>{kids}</ul>;
    case "orderedList":
      return <ol key={key}>{kids}</ol>;
    case "listItem":
      return <li key={key}>{kids}</li>;
    case "blockquote":
      return <blockquote key={key}>{kids}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{node.content?.map((c) => c.text).join("")}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return (
        <figure key={key} className="post-figure">
          <img src={String(node.attrs?.src ?? "")} alt="" loading="lazy" />
        </figure>
      );
    case "videoBlock":
      return (
        <figure key={key} className="post-figure">
          <video
            src={String(node.attrs?.src ?? "")}
            controls
            playsInline
            preload="metadata"
          />
        </figure>
      );
    case "imageCompare":
      return (
        <CompareSlider
          key={key}
          before={String(node.attrs?.before ?? "")}
          after={String(node.attrs?.after ?? "")}
        />
      );
    case "youtube":
      return (
        <div key={key} className="post-video-embed">
          <iframe
            src={String(node.attrs?.src ?? "")}
            title="YouTube"
            allowFullScreen
          />
        </div>
      );
    case "text":
      return <span key={key}>{renderText(node)}</span>;
    default:
      return <div key={key}>{kids}</div>;
  }
}

export function PostContent({ content }: { content: Record<string, unknown> }) {
  const tree = useMemo(() => {
    const root = content as TipTapNode;
    if (!root.content) return null;
    return root.content.map((n, i) => renderNode(n, i));
  }, [content]);

  return <div className="post-content">{tree}</div>;
}
