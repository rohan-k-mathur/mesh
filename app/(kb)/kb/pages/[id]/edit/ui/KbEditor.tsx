// app/(kb)/kb/pages/[id]/edit/ui/KbEditor.tsx
'use client';
import * as React from 'react';
import useSWR from 'swr';
import TextBlockLexical from './TextBlockLexical';
import { KbTranscludeRenderer } from '@/components/kb/KbTranscludeRenderer';

type Block = { id:string; pageId:string; ord:number; type:string; live:boolean; dataJson:any; pinnedJson?:any; updatedAt:string };
const fetcher = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

export default function KbEditor({ pageId, spaceId }:{ pageId:string; spaceId:string }) {
  const { data, mutate } = useSWR<{ok:boolean; blocks:Block[]}>(`/api/kb/pages/${pageId}/blocks`, fetcher, { revalidateOnFocus:false });
  const blocks = data?.blocks ?? [];

  async function create(kind: string, data?: any) {
    await fetch('/api/kb/blocks', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ pageId, type: kind, data }) });
    mutate();
  }
  async function saveText(blockId: string, lexicalJson: any, md: string) {
    await fetch(`/api/kb/blocks/${blockId}`, { method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ dataJson: { lexical: lexicalJson, md } }) });
    mutate();
  }

  async function insertStructured(kind: string) {
    // Minimal capture: prompt for ids; in Phase‑B replace with pickers
    const ask = (q: string) => window.prompt(q) || '';
    if (kind === 'claim')      return create('claim',        { id: ask('Claim id (φ)…'), lens:'belpl' });
    if (kind === 'argument')   return create('argument',     { id: ask('Argument id (A0)…') });
    if (kind === 'sheet')      return create('sheet',        { id: ask('Sheet id…') });
    if (kind === 'room_summary') return create('room_summary', { id: ask('Deliberation (room) id…'), limit: 5 });
    if (kind === 'transport')  return create('transport',    { fromId: ask('From room id…'), toId: ask('To room id…') });
    if (kind === 'image')      return create('image',        { src: ask('Image URL…'), alt:'' });
    if (kind === 'link')       return create('link',         { href: ask('Link URL…'), text: ask('Link text…') });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button className="px-2 py-1 rounded border" onClick={()=>create('text')}>+ Text</button>
        <div className="text-slate-400 text-xs">Tip: inside a Text block press <kbd>Ctrl/Cmd</kbd> + <kbd>/</kbd> to insert structured blocks.</div>
        <a className="ml-auto px-2 py-1 rounded border"
           href={`/api/kb/pages/${pageId}/export?as=md`} target="_blank" rel="noopener noreferrer">Export .md</a>
      </div>

      {blocks.map((b) => (
        <div key={b.id} className="rounded-lg border bg-white/70 p-3">
          {b.type === 'text' ? (
            <TextBlockLexical
              blockId={b.id}
              initialState={b.dataJson?.lexical ?? null}
              onInsertBlock={(k)=>insertStructured(k)}
              onSave={(json, md)=>saveText(b.id, json, md)}
            />
          ) : (
            <KbTranscludeRenderer
              spaceId={spaceId}
              blocks={[b]}                           // renderer accepts an array and hydrates via /api/kb/transclude
              />
          )}
        </div>
      ))}

      {blocks.length === 0 && (
        <div className="rounded border border-dashed p-6 text-sm text-slate-600">
          This page has no content yet. Click <b>+ Text</b> to start, then use the slash‑menu to embed claims, arguments, sheets, a room summary, or a transport map.
        </div>
      )}
    </div>
  );
}
