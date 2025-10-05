// 'use client';
// import * as React from 'react';
// import useSWR from 'swr';

// const f = (u:string)=>fetch(u,{cache:'no-store'}).then(r=>r.json());

// export default function KbEditorPage({ params }: { params:{ id:string } }) {
//   const { data: meta, mutate: mMeta } = useSWR(`/api/kb/pages/${params.id}`, f);
//   const { data: blk, mutate: mBlk  } = useSWR(`/api/kb/pages/${params.id}/blocks`, f);
//   const [title, setTitle] = React.useState<string>('');
//   const [busy, setBusy] = React.useState(false);
//   React.useEffect(()=>{ if (meta?.page?.title!=null) setTitle(meta.page.title); }, [meta?.page?.title]);

//   async function saveTitle() {
//     setBusy(true);
//     try {
//       const r = await fetch(`/api/kb/pages/${params.id}`, {
//         method:'PATCH', headers:{'Content-Type':'application/json'},
//         body: JSON.stringify({ title })
//       });
//       if (!r.ok) throw new Error(await r.text());
//       mMeta();
//     } finally { setBusy(false); }
//   }

//   async function addBlock(kind: string) {
//     const dataJson: any = {};
//     if (kind==='text') dataJson.md = 'New text…';
//     if (kind==='claim') { dataJson.id = prompt('Claim id?') || ''; if (!dataJson.id) return; }
//     if (kind==='argument') { dataJson.id = prompt('Argument id?') || ''; if (!dataJson.id) return; }
//     if (kind==='room_summary') { dataJson.id = prompt('Deliberation (room) id?') || ''; if (!dataJson.id) return; }
//     if (kind==='sheet') { dataJson.id = prompt('Sheet id?') || ''; if (!dataJson.id) return; }
//     if (kind==='transport') { dataJson.fromId = prompt('From room id?') || ''; dataJson.toId = prompt('To room id?') || ''; if (!dataJson.fromId || !dataJson.toId) return; }

//     const r = await fetch(`/api/kb/pages/${params.id}/blocks`, {
//       method:'POST', headers:{'Content-Type':'application/json'},
//       body: JSON.stringify({ type: kind, dataJson, live: true })
//     });
//     if (!r.ok) alert('Create failed'); else mBlk();
//   }

//   if (!meta || !blk) return <div className="p-6 text-sm text-slate-600">Loading editor…</div>;

//   return (
//     <div className="mx-auto max-w-4xl px-4 py-6">
//       {/* Header */}
//       <div className="flex items-center justify-between gap-3 mb-4">
//         <input
//           value={title} onChange={e=>setTitle(e.target.value)}
//           className="flex-1 text-xl font-semibold bg-transparent outline-none border-b border-transparent focus:border-slate-300"
//         />
//         <div className="flex items-center gap-2">
//           <button onClick={saveTitle} disabled={busy} className="px-2 py-1 border rounded">{busy?'Saving…':'Save'}</button>
//           <a className="px-2 py-1 border rounded" href={`/kb/pages/${params.id}/view`} target="_blank" rel="noreferrer">View</a>
//         </div>
//       </div>

//       {/* Add toolbar */}
//       <div className="mb-3 flex flex-wrap gap-2 text-[12px]">
//         {['text','claim','argument','room_summary','sheet','transport'].map(k=>(
//           <button key={k} className="px-2 py-1 border rounded hover:bg-slate-50" onClick={()=>addBlock(k)}>{k}</button>
//         ))}
//       </div>

//       {/* Blocks list */}
//       <ul className="space-y-3">
//         {(blk.blocks || []).map((b:any, i:number) => (
//           <li key={b.id} className="rounded-lg border bg-white/80">
//             <div className="flex items-center justify-between px-3 py-2 border-b">
//               <div className="text-[12px] text-slate-600">#{i+1} • {b.type} • {b.live ? 'live' : 'pinned'}</div>
//               <div className="flex items-center gap-2 text-[12px]">
//                 <button className="px-1.5 py-0.5 border rounded" onClick={()=>reorder(b, i-1)} disabled={i===0}>↑</button>
//                 <button className="px-1.5 py-0.5 border rounded" onClick={()=>reorder(b, i+1)} disabled={i===(blk.blocks.length-1)}>↓</button>
//                 {b.type==='text' && (
//                   <button className="px-1.5 py-0.5 border rounded" onClick={()=>editText(b)}>edit</button>
//                 )}
//                 <button className="px-1.5 py-0.5 border rounded" onClick={()=>togglePin(b)}>{b.live?'pin':'unpin'}</button>
//                 <button className="px-1.5 py-0.5 border rounded text-rose-600" onClick={()=>del(b)}>delete</button>
//               </div>
//             </div>
//             <div className="p-3">
//               {/* Simple preview for editor */}
//               <pre className="text-[11px] bg-slate-50 border rounded p-2 overflow-auto max-h-48">{JSON.stringify(b, null, 2)}</pre>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );

//   async function editText(b:any) {
//     const md = prompt('Edit text:', String(b?.dataJson?.md ?? '')) ?? undefined;
//     if (md==null) return;
//     await fetch(`/api/kb/blocks/${b.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ dataJson: { ...b.dataJson, md } }) });
//     mBlk();
//   }

//   async function togglePin(b:any) {
//     const live = !b.live;
//     const payload: any = { live };
//     if (live === false) {
//       // Snapshot current transclusion payload (client-side simple snap for MVP)
//       payload.pinnedJson = { _note:'snapshot', ref: b.dataJson, at: new Date().toISOString() };
//     }
//     await fetch(`/api/kb/blocks/${b.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
//     mBlk();
//   }

//   async function del(b:any) {
//     if (!confirm('Delete block?')) return;
//     await fetch(`/api/kb/blocks/${b.id}`, { method:'DELETE' }); mBlk();
//   }

//   async function reorder(b:any, toIndex:number) {
//     const list = blk.blocks.slice();
//     if (toIndex<0 || toIndex>=list.length) return;
//     // naive swap ords
//     const other = list[toIndex];
//     await fetch(`/api/kb/blocks/${b.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ord: other.ord }) });
//     await fetch(`/api/kb/blocks/${other.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ord: b.ord }) });
//     mBlk();
//   }
// }
// app/(kb)/kb/pages/[id]/edit/page.tsx
import { prisma } from '@/lib/prismaclient';
import KbEditor from './ui/KbEditor';
import { getUserFromCookies } from '@/lib/serverutils';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function Page({ params }:{ params:{ id:string } }) {
  const user = await getUserFromCookies(); if (!user) redirect('/login');
  const page = await prisma.kbPage.findUnique({ where:{ id: params.id }, select:{ id:true, spaceId:true } });
  if (!page) redirect('/kb'); // or notFound()
  return <KbEditor pageId={page.id} spaceId={page.spaceId} />;
}
