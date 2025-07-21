"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { nanoid } from "nanoid";
import { useState } from "react";

interface Element {
  id: string;
  type: "text" | "image" | "box";
}

function DraggableItem({ id, children, fromSidebar }: { id: string; children: React.ReactNode; fromSidebar?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, data: { fromSidebar } });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-move p-2 border rounded-md bg-white text-black">
      {children}
    </div>
  );
}

function DroppableCanvas({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: "canvas" });
  return (
    <div ref={setNodeRef} className="flex-1 min-h-screen border border-dashed p-4 space-y-2 bg-gray-50">
      {children}
    </div>
  );
}

export default function PortfolioBuilder() {
  const [elements, setElements] = useState<Element[]>([]);

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    if (over?.id === "canvas" && active.data.current?.fromSidebar) {
      setElements((els) => [...els, { id: nanoid(), type: active.id as Element["type"] }]);
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex h-screen">
        <div className="w-40 border-r p-2 space-y-2 bg-gray-100">
          <DraggableItem id="text" fromSidebar>
            Text
          </DraggableItem>
          <DraggableItem id="image" fromSidebar>
            Image
          </DraggableItem>
          <DraggableItem id="box" fromSidebar>
            Box
          </DraggableItem>
        </div>
        <DroppableCanvas>
          {elements.map((el) => (
            <div key={el.id} className="p-2 border bg-white" >{el.type}</div>
          ))}
        </DroppableCanvas>
        <div className="w-40 border-l p-2 bg-gray-100">
          <p className="text-sm text-gray-600">Style options coming soon...</p>
        </div>
      </div>
    </DndContext>
  );
}
