 "use client";
 import * as React from "react";
 
 export default function ProposalsCompareModal({
   open,
   onClose,
   rootMessageId,
   currentUserId,
   onOpenDrift,
   onMerged,
 }: {
   open: boolean;
   onClose: () => void;
   rootMessageId: string;
   currentUserId: string;
   onOpenDrift: (driftId: string) => void;
   onMerged?: () => void;
 }) {
   const [loading, setLoading] = React.useState(false);
   const [items, setItems] = React.useState<any[]>([]);
   const [err, setErr] = React.useState<string | null>(null);
 
   React.useEffect(() => {
     if (!open) return;
     setLoading(true);
     setErr(null);
     fetch(`/api/proposals/list?rootMessageId=${encodeURIComponent(rootMessageId)}`, {
       cache: "no-store",
     })
       .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(new Error(t)))))
       .then((d) => setItems(Array.isArray(d?.items) ? d.items : []))
       .catch((e) => setErr(e?.message || "Failed to load proposals"))
       .finally(() => setLoading(false));
   }, [open, rootMessageId]);
 
   async function mergeMostRecent(driftId: string) {
     try {
       // Find most recent text message in that proposal drift
       const r = await fetch(
         `/api/drifts/${encodeURIComponent(driftId)}/messages?userId=${encodeURIComponent(currentUserId)}`,
         { cache: "no-store" }
       );
       if (!r.ok) throw new Error(await r.text());
       const data = await r.json();
       const cols = Array.isArray(data?.messages) ? data.messages : [];
       const mostRecent = [...cols]
         .reverse()
         .find((m: any) => typeof m?.text === "string" && m.text.trim().length > 0);
       if (!mostRecent) {
         alert("No mergeable text found in this proposal.");
         return;
       }
       const resp = await fetch(`/api/proposals/merge`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           rootMessageId,
           proposalMessageId: mostRecent.id,
         }),
       });
       if (!resp.ok) {
         const msg = await resp.text();
         alert(msg || "Merge failed");
         return;
       }
       onMerged?.();
       onClose();
     } catch (e: any) {
       alert(e?.message || "Merge failed");
     }
   }
 
   if (!open) return null;
   return (
     <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40">
       <div className="w-[720px] max-w-[95vw] rounded-xl bg-white p-4 shadow-xl">
         <div className="flex items-center justify-between">
           <h2 className="text-lg font-semibold">Compare Proposals</h2>
           <button className="text-sm px-2 py-1 rounded bg-slate-100" onClick={onClose}>
             Close
           </button>
         </div>
         <div className="mt-3">
           {loading ? (
             <div className="text-sm text-slate-600">Loading…</div>
           ) : err ? (
             <div className="text-sm text-red-600">{err}</div>
           ) : items.length === 0 ? (
             <div className="text-sm text-slate-600">No proposals yet.</div>
           ) : (
             <div className="space-y-2">
               {items.map((d: any) => (
                 <div
                   key={String(d.id)}
                   className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2"
                 >
                   <div className="flex min-w-0 flex-col">
                     <div className="font-medium truncate">{d.title || `Proposal ${String(d.id)}`}</div>
                     <div className="text-xs text-slate-500">
                       Created {new Date(d.created_at).toLocaleString()}
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <button
                       className="text-xs rounded-md border px-2 py-1 hover:bg-slate-100"
                       onClick={() => onOpenDrift(String(d.id))}
                     >
                       Open
                     </button>
                     <button
                       className="text-xs rounded-md border px-2 py-1 bg-emerald-50 hover:bg-emerald-100"
                       onClick={() => mergeMostRecent(String(d.id))}
                       title="Merge the most recent text from this proposal into the original message"
                     >
                       ✅ Merge
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
         <p className="mt-3 text-xs text-slate-500">
           Tip: Merging updates the original message. For Sheaf messages, advanced merge will arrive next.
         </p>
       </div>
     </div>
   );
 }
 