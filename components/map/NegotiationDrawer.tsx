'use client';
import * as React from 'react';

type Post = { id: string; user?: string; text: string; ts: string };
export default function NegotiationDrawer({ nodeId, open, onClose }: { nodeId?: string; open: boolean; onClose: ()=>void }) {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    if (!nodeId || !open) return;
    // stub fetch; replace with your route
    fetch(`/api/map/threads?nodeId=${encodeURIComponent(nodeId)}`)
      .then(r => r.ok ? r.json() : [])
      .then(setPosts)
      .catch(()=>setPosts([]));
  }, [nodeId, open]);

  async function send() {
    if (!nodeId || !text.trim()) return;
    const body = { nodeId, text };
    await fetch('/api/map/threads', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    setPosts(p => [...p, { id: Math.random().toString(36).slice(2), text, ts: new Date().toISOString() }]);
    setText('');
  }

  return (
    <div className={`fixed top-0 right-0 h-full w-96 bg-white border-l shadow-lg transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-3 border-b flex items-center justify-between">
        <b className="text-sm">Negotiate meaning</b>
        <button className="text-xs underline" onClick={onClose}>Close</button>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto h-[calc(100%-110px)]">
        <div className="text-[11px] text-neutral-600">
          Use this thread to disambiguate terms, propose minimal edits, or mark unresolved disagreements.
        </div>
        {posts.map(p => (
          <div key={p.id} className="p-2 border rounded text-sm">
            <div className="text-[10px] text-neutral-500">{new Date(p.ts).toLocaleString()}</div>
            {p.text}
          </div>
        ))}
      </div>
      <div className="p-3 border-t">
        <textarea className="w-full border rounded p-2 text-sm" rows={2} placeholder="Propose a definition, edit, or clarifying question…" value={text} onChange={e=>setText(e.target.value)} />
        <div className="mt-2 flex gap-2">
          <button className="px-2 py-1 border rounded text-xs" onClick={send}>Post</button>
          {/* quick outcomes */}
          <button className="px-2 py-1 border rounded text-xs" onClick={()=>setText(t=>`${t}${t?'\n':''}✅ Minimal edit agreed: ...`)}>Mark edit agreed</button>
          <button className="px-2 py-1 border rounded text-xs" onClick={()=>setText(t=>`${t}${t?'\n':''}⚠️ Ambiguous: needs evidence`)}>Flag ambiguous</button>
        </div>
      </div>
    </div>
  );
}
