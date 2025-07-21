"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { nanoid } from "nanoid";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFileToSupabase } from "@/lib/utils";
import { PortfolioExportData } from "@/lib/portfolio/export";
import Image from "next/image";

interface Element {
  id: string;
  type: "text" | "image" | "box" | "link";
  content?: string;
  src?: string;
  href?: string;
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
  const [color, setColor] = useState("bg-white");
  const [layout, setLayout] = useState<"column" | "grid">("column");
  const router = useRouter();

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    if (over?.id === "canvas" && active.data.current?.fromSidebar) {
      setElements((els) => [
        ...els,
        { id: nanoid(), type: active.id as Element["type"], content: "", src: "" },
      ]);
    }
  }

  async function handleImageSelect(id: string, file: File) {
    const res = await uploadFileToSupabase(file);
    if (!res.error) {
      setElements((els) =>
        els.map((el) => (el.id === id ? { ...el, src: res.fileURL } : el))
      );
    }
  }

  function serialize(): PortfolioExportData {
    const text = elements
      .filter((e) => e.type === "text" && e.content)
      .map((e) => e.content)
      .join("\n");
    const images = elements
      .filter((e) => e.type === "image" && e.src)
      .map((e) => e.src as string);
    const links = elements
      .filter((e) => e.type === "link" && e.href)
      .map((e) => e.href as string);
    return { text, images, links, layout, color };
  }

  async function handlePublish() {
    const data = serialize();
    const res = await fetch("/api/portfolio/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const { url } = await res.json();
      router.push(url);
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
          <DraggableItem id="link" fromSidebar>
            Link
          </DraggableItem>
        </div>
        <DroppableCanvas>
          {elements.map((el) => (
            <div key={el.id} className="p-2 border bg-white space-y-2">
              {el.type === "text" && (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="text-block outline-none"
                  onInput={(e) =>
                    setElements((els) =>
                      els.map((it) =>
                        it.id === el.id
                          ? { ...it, content: (e.target as HTMLElement).innerText }
                          : it
                      )
                    )
                  }
                >
                  {el.content || "Edit text"}
                </div>
              )}
              {el.type === "image" && (
                <div>
                  {el.src ? (
                    <Image
                      src={el.src}
                      alt="uploaded"
                      width={200}
                      height={200}
                      className="object-cover portfolio-img-frame"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageSelect(el.id, file);
                      }}
                    />
                  )}
                </div>
              )}
              {el.type === "box" && (
                <div className="w-20 h-20 border bg-gray-200" />
              )}
              {el.type === "link" && (
                <input
                  className="border p-1 text-sm"
                  placeholder="https://example.com"
                  value={el.href || ""}
                  onChange={(e) =>
                    setElements((els) =>
                      els.map((it) =>
                        it.id === el.id ? { ...it, href: e.target.value } : it
                      )
                    )
                  }
                />
              )}
            </div>
          ))}
        </DroppableCanvas>
        <div className="w-40 border-l p-2 bg-gray-100 space-y-4">
          <div>
            <p className="text-sm mb-1">Background</p>
            <select
              className="w-full border p-1"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option value="bg-white">White</option>
              <option value="bg-gray-200">Gray</option>
              <option value="bg-blue-200">Blue</option>
            </select>
          </div>
          <div>
            <p className="text-sm mb-1">Layout</p>
            <select
              className="w-full border p-1"
              value={layout}
              onChange={(e) => setLayout(e.target.value as "column" | "grid")}
            >
              <option value="column">Column</option>
              <option value="grid">Grid</option>
            </select>
          </div>
          <button
            className="w-full mt-4 bg-blue-500 text-white py-1 rounded"
            onClick={handlePublish}
          >
            Publish
          </button>
        </div>
      </div>
    </DndContext>
  );
}
