import { Node, mergeAttributes } from "@tiptap/core";

export const VideoBlock = Node.create({
  name: "videoBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return { src: { default: null } };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        playsinline: "true",
        preload: "metadata",
      }),
    ];
  },
});

export const ImageCompareBlock = Node.create({
  name: "imageCompare",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      before: { default: null },
      after: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-compare"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "image-compare" }),
    ];
  },
});
