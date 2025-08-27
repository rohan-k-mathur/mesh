'use client';
import { useState } from 'react';

export default function CitePicker({ claimId }: { claimId: string }) {
  const [url, setUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<string|undefined>();
   const [copied, setCopied] = useState(false);

   function buildCslJSON() {
     // Very minimal “webpage” CSL object; expand later if you fetch metadata.
     const now = new Date();
     const csl = {
       id: url,
       type: 'webpage',
       title: excerpt ? excerpt.slice(0, 120) : url, // fallback
       URL: url,
       accessed: { 'date-parts': [[now.getFullYear(), now.getMonth() + 1, now.getDate()]] },
     };
     return csl;
   }

   async function copyCsl() {
     try {
       const csl = buildCslJSON();
       await navigator.clipboard.writeText(JSON.stringify(csl, null, 2));
       setCopied(true);
       setTimeout(()=>setCopied(false), 1200);
     } catch (e:any) {
       setStatus('Copy failed: ' + e?.message ?? 'unknown');
     }
   }

  async function snapshot() {
    setStatus('saving…');
    const res = await fetch('/api/snapshots', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, excerpt }),
    }).then(r=>r.json());
    if (res.error) return setStatus(res.error);

    // Create citation row
    const res2 = await fetch(`/api/claims/${claimId}/citations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ uri: url, excerptHash: res.excerptHash, snapshotKey: res.snapshotKey }),
    }).then(r=>r.json());

    if (res2.error) setStatus(res2.error);
    else setStatus('Saved');
  }

  return (
    <div className="space-y-2">
      <input className="w-full border px-2 py-1 text-sm rounded" placeholder="Source URL" value={url} onChange={e=>setUrl(e.target.value)} />
      <textarea className="w-full border px-2 py-1 text-sm rounded" rows={3} placeholder="Paste exact excerpt…" value={excerpt} onChange={e=>setExcerpt(e.target.value)} />
      <div className="flex items-center gap-2">
        <button className="text-xs px-2 py-1 rounded bg-amber-500 text-white" onClick={snapshot}>Attach citation</button>
         <button
           className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
           title="Copy a minimal CSL-JSON record for this citation"
           onClick={copyCsl}
           disabled={!url}
         >
           {copied ? 'CSL copied ✓' : 'Copy CSL JSON'}
         </button>
      </div>
      {status && <div className="text-xs text-neutral-600">{status}</div>}
    </div>
  );
}

// 'use client';
// import { useState } from 'react';

// export default function CitePicker({ claimId }: { claimId: string }) {
//   const [url, setUrl] = useState('');
//   const [excerpt, setExcerpt] = useState('');
//   const [status, setStatus] = useState<string|undefined>();

//   async function snapshot() {
//     setStatus('saving…');
//     const res = await fetch('/api/snapshots', {
//       method: 'POST',
//       headers: { 'content-type': 'application/json' },
//       body: JSON.stringify({ url, excerpt }),
//     }).then(r=>r.json());
//     if (res.error) return setStatus(res.error);

//     // Create citation row
//     const res2 = await fetch(`/api/claims/${claimId}/citations`, {
//       method: 'POST',
//       headers: { 'content-type': 'application/json' },
//       body: JSON.stringify({ uri: url, excerptHash: res.excerptHash, snapshotKey: res.snapshotKey }),
//     }).then(r=>r.json());

//     if (res2.error) setStatus(res2.error);
//     else setStatus('Saved');
//   }

//   return (
//     <div className="space-y-2">
//       <input className="w-full border px-2 py-1 text-sm rounded" placeholder="Source URL" value={url} onChange={e=>setUrl(e.target.value)} />
//       <textarea className="w-full border px-2 py-1 text-sm rounded" rows={3} placeholder="Paste exact excerpt…" value={excerpt} onChange={e=>setExcerpt(e.target.value)} />
//       <button className="text-xs px-2 py-1 rounded bg-amber-500 text-white" onClick={snapshot}>Attach citation</button>
//       {status && <div className="text-xs text-neutral-600">{status}</div>}
//     </div>
//   );
// }
