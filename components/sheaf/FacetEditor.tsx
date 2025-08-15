'use client';

import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export type JSONContent = Record<string, any>;

export function FacetEditor(props: {
  value: JSONContent | null;
  onChange: (next: JSONContent) => void;
  placeholder?: string;
}) {
  const { value, onChange, placeholder } = props;

  const editor = useEditor({
    extensions: [StarterKit],
    content: value ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as JSONContent);
    },
  });

  React.useEffect(() => {
    if (!editor) return;
    // external updates
    if (value) editor.commands.setContent(value as any, false);
  }, [value, editor]);

  return (
    <div className="rounded border bg-white/80 px-3 py-2">
      {!value && placeholder ? (
        <div className="text-xs text-slate-400 mb-1">{placeholder}</div>
      ) : null}
      <EditorContent editor={editor} />
    </div>
  );
}
