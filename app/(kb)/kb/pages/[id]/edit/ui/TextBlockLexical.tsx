// app/(kb)/kb/pages/[id]/edit/ui/TextBlockLexical.tsx
'use client';
import * as React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getRoot, $createParagraphNode, $createTextNode, EditorState } from 'lexical';

type Props = {
  blockId: string;
  initialState?: any;               // lexical JSON
  onInsertBlock: (kind: 'claim'|'argument'|'sheet'|'room_summary'|'transport'|'image'|'link') => void;
  onSave: (nextJson: any, maybeMd: string) => void;
};

export default function TextBlockLexical({ blockId, initialState, onInsertBlock, onSave }: Props) {
  const [open, setOpen] = React.useState(false);

  const initialConfig = React.useMemo(() => ({
    namespace: `kb-text-${blockId}`,
    // This function runs inside an update; you can mutate the document directly.
   editorState: (editor: any) => {
     if (initialState) {
       // initialState can be a serialized editor state (string or object produced by state.toJSON()).
       const parsed = editor.parseEditorState(initialState);
       editor.setEditorState(parsed);
       return;
     }
     // Create an empty paragraph to start typing into.
     const root = $getRoot();
     if (root.getFirstChild() == null) {
       const paragraph = $createParagraphNode();
       paragraph.append($createTextNode(''));
       root.append(paragraph);
     }
   },
    onError: (e: any) => console.error('Lexical error', e),
    theme: {
      paragraph: 'mb-2',
      text: { bold:'font-semibold', italic:'italic', underline:'underline' }
    }
  }), [blockId, initialState]);

  // crude “/” menu: open when slash typed on empty selection
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setOpen(v => !v); }
  };

  const debouncedSave = React.useRef<any>(null);
  const handleChange = (state: EditorState) => {
    if (debouncedSave.current) clearTimeout(debouncedSave.current);
    debouncedSave.current = setTimeout(() => {
      let md = '';
      state.read(() => {
        // super-simple: join paragraphs as lines (Phase‑B: add proper serialize)
        const root = $getRoot();
        const txt = root.getTextContent();
        md = txt ?? '';
      });
      onSave(state.toJSON(), md);
    }, 400);
  };

  return (
    <div className="relative">
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="min-h-[80px] px-3 py-2 outline-none"
              onKeyDown={onKeyDown}
              aria-label="KB text block editor"
            />
          }
          placeholder={<div className="px-3 py-2 text-sm text-slate-400">Type “/” (with Ctrl/Cmd) for inserts…</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} />
      </LexicalComposer>

      {open && (
        <div className="absolute z-20 mt-1 w-56 rounded-md border bg-white shadow-lg">
          {([
            ['claim','Insert Claim'],
            ['argument','Insert Argument'],
            ['sheet','Insert Sheet'],
            ['room_summary','Insert Room summary'],
            ['transport','Insert Transport'],
            ['image','Insert Image'],
            ['link','Insert Link'],
          ] as const).map(([kind,label]) => (
            <button
              key={kind}
              className="block w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50"
              onClick={() => { setOpen(false); onInsertBlock(kind); }}
            >{label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
