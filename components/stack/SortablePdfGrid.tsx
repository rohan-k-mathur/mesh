// components/stack/SortablePdfGrid.tsx
"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import PdfLightbox from "@/components/modals/PdfLightbox";
import { removeFromStack, setStackOrder } from "@/lib/actions/stack.actions";

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL!;
function deriveThumbFromPdfUrl(fileUrl?: string|null) {
  if (!fileUrl) return null;
  const m = fileUrl.match(/\/storage\/v1\/object\/public\/pdfs\/(.+)\.pdf$/i);
  return m ? `${SUPA}/storage/v1/object/public/pdf-thumbs/${m[1]}.png` : null;
}

/** Minimal shape we need for tiles */
export type StackPostTile = {
  id: string;
  title?: string | null;
  file_url: string;
  thumb_urls?: string[] | null;
};

type Props = {
  stackId: string;
  posts: StackPostTile[];     // MUST be in the current order (you already do this)
  editable: boolean;
};

export default function SortablePdfGrid({ stackId, posts, editable }: Props) {
  // local optimistic order
  const [items, setItems] = React.useState<StackPostTile[]>(posts);

  React.useEffect(() => {
    // keep in sync if server revalidates
    setItems(posts);
  }, [posts]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  // Hidden form to invoke the server action `setStackOrder` on drag end
  const formRef = React.useRef<HTMLFormElement>(null);
  const orderInputRef = React.useRef<HTMLInputElement>(null);

  function onDragEnd(evt: any) {
    const { active, over } = evt;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((it) => it.id === String(active.id));
    const newIndex = items.findIndex((it) => it.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next); // optimistic

    // submit new order to the server
    const ids = next.map((i) => i.id);
    if (orderInputRef.current) orderInputRef.current.value = JSON.stringify(ids);
   if (formRef.current) formRef.current.requestSubmit(submitBtnRef.current ?? undefined);
  }
const submitBtnRef = React.useRef<HTMLButtonElement>(null);
  return (
    <>
      {/* Hidden form posts to setStackOrder (server action) */}
      {editable && (
        <form action={setStackOrder} method="POST" ref={formRef} className="hidden">
          <input type="hidden" name="stackId" value={stackId} />
          <input type="hidden" name="orderJson" ref={orderInputRef} />
           <button type="submit" ref={submitBtnRef} className="hidden" />
        </form>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={editable ? onDragEnd : undefined}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={rectSortingStrategy}
        >
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((p) => (
              <SortableTile
                key={p.id}
                tile={p}
                editable={editable}
                stackId={stackId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}

function SortableTile({
  tile,
  editable,
  stackId,
}: {
  tile: StackPostTile;
  editable: boolean;
  stackId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tile.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,.12)" : undefined,
  };

  const cover = tile.thumb_urls?.[0]
    ?? deriveThumbFromPdfUrl(tile.file_url)
    ?? "/assets/PDF.svg";
  const title = tile.title || "PDF";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-lg border overflow-hidden bg-white"
    >
      <PdfLightbox
        trigger={
          <img
            src={cover}
            alt={title}
            className="w-full aspect-[4/3] object-cover cursor-pointer select-none"
            draggable={false}
          />
        }
            postId={tile.id}   // let the lightbox fetch a fresh (signed) URL
    title={title}
        // fileUrl={tile.file_url}
        // title={title}
      />

      {/* Drag handle */}
      {editable && (
        <button
          className="absolute top-2 left-2 p-1 rounded bg-white/90 border opacity-0 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          {/* 6-dot handle icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="13" cy="3" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
          </svg>
        </button>
      )}

      {/* Cite popover */}
      {editable && (
        <div className="absolute bottom-2 left-2">
          <CiteButton libraryPostId={tile.id} />
        </div>
      )}

      {/* Remove button on hover */}
      {editable && (
        <form action={removeFromStack} method="POST" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
          <input type="hidden" name="stackId" value={stackId} />
          <input type="hidden" name="postId" value={tile.id} />
          <button
            className="px-2 py-1 text-xs rounded bg-white/90 border"
            type="submit"
          >
            ⌫
          </button>
        </form>
      )}
    </div>
  );
}

function CiteButton({ libraryPostId }: { libraryPostId: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative ">
      <button className="px-2 py-1 text-xs rounded-lg bg-white/90 border" onClick={() => setOpen((x) => !x)}>Cite</button>
      {open && (
        <div className="relative z-20 mt-1 w-44 rounded border bg-slate-50 shadow-lg border-[2px] border-indigo-300">
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-200"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("composer:cite", { detail: { libraryPostId, mode: "quick" } }));
            }}
          >
            Quick cite
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-200"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent("composer:cite", { detail: { libraryPostId, mode: "details" } }));
            }}
          >
            Cite with details…
          </button>
        </div>
      )}
    </div>
  );
}
