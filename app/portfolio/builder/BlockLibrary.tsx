"use client";
import React from "react";
import useSWR, { useSWRConfig } from "swr";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, RefreshCw, Trash2, Plus } from "lucide-react";

const fetcher = (u: string) =>
  fetch(u, { cache: "no-store" }).then((r) => r.json());

export default function BlockLibrary({
  onInsert,
}: {
  onInsert: (component: string, props: any) => void;
}) {
  const { mutate } = useSWRConfig();
  const { user } = useAuth();

  const ownerId = user?.userId
    ? String(user.userId)
    : process.env.NEXT_PUBLIC_DEV_OWNER_ID ?? null;

  const key = ownerId ? `/api/blocks?ownerId=${ownerId}` : null;

  const { data, error, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 30000,
  });

  const items: {
    id: string;
    component: string;
    props: any;
    thumbnail?: string;
  }[] = data?.items ?? [];

  const refresh = () => {
    if (key) mutate(key);
  };

  async function regenerate(id: string) {
    try {
      const res = await fetch(`/api/blocks/${id}/thumbnail`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      refresh();
      toast.success("Thumbnail updated");
    } catch {
      toast.error("Failed to regenerate thumbnail");
    }
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Delete this block? This won’t affect pages where you already used it."
      )
    )
      return;
    try {
      const res = await fetch(`/api/blocks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      refresh();
      toast.success("Block deleted");
    } catch {
      toast.error("Failed to delete block");
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-500">Blocks</p>
        <button
          type="button"
          className="text-[11px] px-2 py-0.5 rounded border bg-white/70"
          onClick={refresh}
          disabled={!key}
          title="Refresh"
        >
          Refresh
        </button>
      </div>

      {!ownerId && (
        <div className="text-xs text-slate-500">
          Sign in to see your Block Library.
        </div>
      )}

      {error && ownerId && (
        <div className="text-xs text-red-600">Failed to load blocks.</div>
      )}

      {isLoading && ownerId && (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-full aspect-[4/3] rounded-md bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {ownerId && !isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((b) => (
 <div
 key={b.id}
 className="group relative w-full aspect-[4/3] rounded-md overflow-hidden bg-white border border-slate-200 hover:shadow"
 title={`Insert ${b.component}`}
>
 {/* Hover actions overlay (above everything) */}
 <div className="absolute inset-0 z-10 pointer-events-none">
   <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button
           type="button"
           variant="ghost"
           size="icon"
           className="pointer-events-auto h-4 w-4 rounded-full bg-slate-700/40 hover:bg-black/55 text-white shadow focus-visible:ring-2 focus-visible:ring-white/80"
           onMouseDown={(e) => e.stopPropagation()}
           onClick={(e) => e.stopPropagation()}
           aria-label="Block actions"
           title="Block actions"
         >
           <MoreVertical className="h-3 w-3" />
         </Button>
       </DropdownMenuTrigger>

       <DropdownMenuContent
         align="end"
         sideOffset={6}
         className="w-44"
         // prevent the menu click from falling through to card
         onMouseDown={(e) => e.stopPropagation()}
         onClick={(e) => e.stopPropagation()}
       >
         <DropdownMenuItem
           className="gap-2"
           onClick={() => onInsert(b.component, { ...b.props })}
         >
           <Plus className="h-4 w-4" />
           Insert
         </DropdownMenuItem>

         <DropdownMenuItem
           className="gap-2"
           onClick={async () => {
             await fetch(`/api/blocks/${b.id}/thumbnail`, { method: "POST" });
             refresh();
           }}
         >
           <RefreshCw className="h-4 w-4" />
           Regenerate thumbnail
         </DropdownMenuItem>

         <DropdownMenuSeparator />

         <DropdownMenuItem
           className="gap-2 text-red-600 focus:text-red-600"
           onClick={async () => {
             if (!confirm("Delete this block? Pages that already use it are not affected.")) return;
             await fetch(`/api/blocks/${b.id}`, { method: "DELETE" });
             refresh();
           }}
         >
           <Trash2 className="h-4 w-4" />
           Delete
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>
   </div>
 </div>

 {/* Main “Insert” layer – not a button; clickable div */}
 <div
   className="absolute inset-0 z-0 cursor-pointer"
   role="button"
   tabIndex={0}
   onClick={() => onInsert(b.component, { ...b.props })}
   onKeyDown={(e) => {
     if (e.key === "Enter" || e.key === " ") onInsert(b.component, { ...b.props });
   }}
 >
   {b.thumbnail ? (
     <img
       src={b.thumbnail}
       alt={`${b.component} thumbnail`}
       className="absolute inset-0 w-full h-full object-cover"
       loading="lazy"
       decoding="async"
       draggable={false}
     />
   ) : (
     <div className="absolute inset-0 grid place-items-center text-[11px] text-slate-500">
       No thumbnail
     </div>
   )}
 </div>

 {/* Caption bar (unchanged) */}
 <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-white/70 backdrop-blur text-[11px] text-slate-700 z-0">
   {b.component}
 </div>
</div>
))}
        </div>
      )}

      {ownerId && !isLoading && !items.length && (
        <div className="text-xs text-slate-400">No blocks yet.</div>
      )}
    </div>
  );
}
