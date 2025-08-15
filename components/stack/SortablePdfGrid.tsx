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
    // PointerSensor with a small activation distance avoids accidental drags on click
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
    // Request submit (so it works in all browsers)
    if (formRef.current) formRef.current.requestSubmit();
  }

  // Readable small tile component
  return (
    <>
      {/* Hidden form posts to setStackOrder (server action) */}
      {editable && (
        <form action={setStackOrder} ref={formRef} className="hidden">
          <input type="hidden" name="stackId" value={stackId} />
          <input type="hidden" name="orderJson" ref={orderInputRef} />
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

  const cover = tile.thumb_urls?.[0] || "/assets/pdf-placeholder.png";
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
        fileUrl={tile.file_url}
        title={title}
      />

      {/* Drag handle (only when editable). Keep handle separate so clicks on the image open the lightbox. */}
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

      {/* Remove button on hover (still using your existing server action) */}
      {editable && (
        <form action={removeFromStack} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
          <input type="hidden" name="stackId" value={stackId} />
          <input type="hidden" name="postId" value={tile.id} />
          <button
            className="px-2 py-1 text-xs rounded bg-white/90 border"
            type="submit"
          >
            Remove
          </button>
        </form>
      )}
    </div>
  );
}
