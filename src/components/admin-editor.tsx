"use client";

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import CodeBlock from '@tiptap/extension-code-block';
import { Button } from './ui';

interface AdminEditorProps {
  initialHtml?: string;
  onChange: (html: string) => void;
}

export function AdminEditor({ initialHtml = '', onChange }: AdminEditorProps) {
  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false }),
        Placeholder.configure({ placeholder: 'Compose your article with headings, code, images, and prose styling.' }),
        Image,
        CodeBlock,
      ],
      content: initialHtml || '<p></p>',
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
    },
    [initialHtml]
  );

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(initialHtml || '<p></p>');
  }, [editor, initialHtml]);

  const insertImage = () => {
    const url = window.prompt('Enter image URL');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Paste a URL and press enter');
    if (url && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-700/70 bg-slate-950/80 p-4">
        <Button type="button" variant="ghost" onClick={() => editor?.chain().focus().toggleBold().run()}>
          Bold
        </Button>
        <Button type="button" variant="ghost" onClick={() => editor?.chain().focus().toggleItalic().run()}>
          Italic
        </Button>
        <Button type="button" variant="ghost" onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>
          Code block
        </Button>
        <Button type="button" variant="ghost" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
          H3
        </Button>
        <Button type="button" variant="ghost" onClick={addLink}>
          Add link
        </Button>
        <Button type="button" variant="ghost" onClick={insertImage}>
          Insert image
        </Button>
      </div>

      <div className="rounded-[2rem] border border-slate-700/70 bg-slate-950/80 p-4 text-slate-100 shadow-glow">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
