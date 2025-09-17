// components/citations/LibrarySearchModal.tsx
"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const fetcher = (u: string) => fetch(u, { cache: "no-store" }).then((r) => r.json());

export default function LibrarySearchModal({
  open,
  onOpenChange,
  onPick,
  trigger,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  onPick: (libraryPostId: string) => void;
  trigger?: React.ReactNode;
}) {
  const [selfOpen, setSelfOpen] = React.useState(false);
  const isControlled = typeof open === "boolean";
  const o = isControlled ? open! : selfOpen;
  const setO = isControlled ? (onOpenChange ?? (() => {})) : setSelfOpen;

  const [q, setQ] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [items, setItems] = React.useState<any[]>([]);

  async function search() {
    setBusy(true);
    try {
      const res = await fetcher(`/api/library/search?q=${encodeURIComponent(q)}`);
      setItems(res.items ?? []);
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={o} onOpenChange={setO}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Find a library item</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="Search your library…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="px-2 py-1 text-sm border rounded" onClick={search} disabled={busy}>
            {busy ? "…" : "Search"}
          </button>
        </div>

        <div className="mt-2 border rounded max-h-[50vh] overflow-y-auto">
          {items.map((it: any) => (
            <div key={it.id} className="px-2 py-1 text-sm flex items-center justify-between border-b last:border-0">
              <div className="truncate mr-2">{it.title || it.file_url}</div>
              <button
                className="px-2 py-0.5 text-xs border rounded"
                onClick={() => { onPick(it.id); setO(false); }}
              >
                Pick
              </button>
            </div>
          ))}
          {!items.length && <div className="p-2 text-[12px] text-slate-500">No results.</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
