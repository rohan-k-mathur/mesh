/* eslint-disable react/jsx-key */
"use client";

import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    PointerSensor,
    closestCenter,
    type Modifier,
    useSensor,
    useSensors,

    useDraggable,
    useDroppable,
  } from "@dnd-kit/core";
  

  import { useRef, useMemo } from "react";

  import { shallow } from "zustand/shallow";          // ✅ correct path
  import { restrictToParentElement } from "@dnd-kit/modifiers";
  
  import {
    useSortable,
    SortableContext,
    rectSortingStrategy,
    arrayMove,
  } from "@dnd-kit/sortable";
  
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import Image from "next/image";
import { Rnd } from "react-rnd";
import { create } from "zustand";
 import { devtools, persist } from "zustand/middleware";
 import { immer } from "zustand/middleware/immer";   // ✅ NEW
 import { useDebouncedCallback } from "use-debounce";
import clsx from "clsx";

import { uploadFileToSupabase } from "@/lib/utils";
import { templates } from "@/lib/portfolio/templates";
import type { PortfolioExportData } from "@/lib/portfolio/export";

// -----------------------------------------------------------------------------
// 1. Types
// -----------------------------------------------------------------------------

type ElementBase = { id: string };
type TextEl = ElementBase & {
  type: "text";
  content: string;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
};
type ImgEl = ElementBase & {
  type: "image";
  src?: string;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
};
type BoxEl = ElementBase & {
  type: "box";
  w?: number;
  h?: number;
  x?: number;
  y?: number;
};
type LinkEl = ElementBase & {
  type: "link";
  href?: string;
  content: string;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
};

export type BuilderElement = TextEl | ImgEl | BoxEl | LinkEl;

// For template mode (sortable), we only care about order
type ElementOrder = string[];

interface BuilderState {
  elements: Record<string, BuilderElement>;
  order: ElementOrder;
  color: string;
  layout: "column" | "grid";
  template: string;
  // actions
  addElement: (el: BuilderElement) => void;
  updateElement: (id: string, patch: Partial<BuilderElement>) => void;
  deleteElement: (id: string) => void;
  move: (activeId: string, overId: string) => void;
  resetWithTemplate: (tplName: string) => void;
}

const useBuilderStore = create<BuilderState>()(
  devtools(
    persist(
      immer((set, get) => ({
        elements: {},
        order: [],
        color: "bg-white",
        layout: "column",
        template: "",
        addElement: (el) =>
          set((s) => {
            s.elements[el.id] = el;
            s.order.push(el.id);
          }),
        updateElement: (id, patch) =>
          set((s) => {
            Object.assign(s.elements[id], patch);
          }),
        deleteElement: (id) =>
          set((s) => {
            delete s.elements[id];
            s.order = s.order.filter((x) => x !== id);
          }),
        move: (active, over) =>
          set((s) => {
            const old = s.order.indexOf(active);
            const nw = s.order.indexOf(over);
            s.order = arrayMove(s.order, old, nw);
          }),
        resetWithTemplate: (name) =>
          set((s) => {
            const tpl = templates.find((t) => t.name === name);
            if (!tpl) return;
            s.elements = {};
            s.order = [];
            tpl.elements.forEach((e) => {
              const id = nanoid();
              s.elements[id] = { ...e, id };
              s.order.push(id);
            });
            s.color = tpl.color;
            s.layout = tpl.layout;
            s.template = name;
          }),
      })),
      { name: "portfolio-builder" }
    )
  )
);

// useBuilderStore.subscribe(
//   (s) => s,
//   (next, prev) => {
//     const diff = Object.keys(next).filter(
//       (k) => next[k as keyof typeof next] !== prev[k as keyof typeof prev]
//     );
//     diff.length && console.log("%c[Store] changed:", "color:GoldenRod", diff);
//   }
// );

// -----------------------------------------------------------------------------
// 2. Util – snap to 8 px grid
// -----------------------------------------------------------------------------
const snap8: Modifier = ({ transform }) => ({
  ...transform,
  x: Math.round(transform.x / 8) * 8,
  y: Math.round(transform.y / 8) * 8,
});

// -----------------------------------------------------------------------------
// 3. Toolbar items
// -----------------------------------------------------------------------------
function ToolbarButton({ type, label }: { type: BuilderElement["type"]; label: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `tool-${type}`,
    data: { fromToolbar: true, type },
  });
  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      {...attributes}
      {...listeners}
      className="cursor-move select-none p-1 border rounded bg-white text-center text-sm"
    >
      {label}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. Canvas
// -----------------------------------------------------------------------------
function Canvas() {
  const { setNodeRef } = useDroppable({ id: "canvas" });
 // ✅ tuple  + shallow ⇒ stable
  const color = useBuilderStore(s => s.color); const template = useBuilderStore(s => s.template); const layout = useBuilderStore(s => s.layout); const order = useBuilderStore(s => s.order); const elements = useBuilderStore(s => s.elements);
      /* debug – proves Canvas renders only when store really changes */
  console.log(
    "%c[Canvas] render",
    "color:LightSeaGreen",
    { orderLen: order.length }
  );
  const layoutClass =
    template === ""
      ? ""
      : layout === "grid"
      ? "grid grid-cols-2 gap-4"
      : "flex flex-col gap-4";
      console.log("%c[Canvas] render", "color:LightSeaGreen");
  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "relative flex-1 min-h-screen border border-dashed p-4 overflow-auto",
        color,
        layoutClass,
        "bg-[length:20px_20px] bg-[linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)]" // light grid background
      )}
    >
      <SortableContext items={order} strategy={rectSortingStrategy}>
        {order.map((id) => (
          <BlockWrapper key={id} id={id} />
        ))}
      </SortableContext>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 5. Block Wrapper (draggable or sortable based on template mode)
// -----------------------------------------------------------------------------
function BlockWrapper({ id }: { id: string }) {
  const template = useBuilderStore(s => s.template);
  const el = useBuilderStore((s) => s.elements[id]);
  const update = useBuilderStore((s) => s.updateElement);
  const del = useBuilderStore((s) => s.deleteElement);


  const draggable = useDraggable({
    id,
    data: { type: "block" },
    disabled: template !== ""        // <– off in template mode
  });

  const sortable  = useSortable({
    id,
    data: { type: "block" },
    disabled: template === ""        // <– off in free‑form mode
  });

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition    // only defined when sortable is live
  } = template === "" ? draggable : sortable;

  const style: React.CSSProperties =
    template === ""
      ? {
          position: "absolute",
          left: (el.x ?? 0) + (transform?.x ?? 0),
          top: (el.y ?? 0) + (transform?.y ?? 0),
        }
      : { transform: CSS.Transform.toString(transform), transition };

  // Helpers
  const debouncedContent = useDebouncedCallback((txt: string) => {
    update(id, { content: txt });
  }, 300);

  // Render per element type ---------------------------------------------------
  let inner: React.ReactNode = null;

  switch (el.type) {
    case "text":
      inner = (
        <div
          contentEditable
          suppressContentEditableWarning
          className="outline-none whitespace-pre-wrap"
          onInput={(e) => debouncedContent((e.target as HTMLElement).innerText)}
        >
          {el.content || "Edit text"}
        </div>
      );
      break;
    case "image":
      inner = el.src ? (
        <Image
          src={el.src}
          alt="uploaded"
          width={el.w ?? 200}
          height={el.h ?? 200}
          className="object-cover"
        />
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadImage(id, file);
          }}
        />
      );
      break;
    case "box":
      inner = <div className="w-full h-full bg-gray-200" />;
      break;
    case "link":
      inner = (
        <input
          className="border p-1 text-sm w-full"
          placeholder="https://example.com"
          defaultValue={el.href}
          onBlur={(e) => update(id, { href: e.target.value })}
        />
      );
      break;
  }

  // Absolute mode resizable wrapper
  const block = template === "" ? (
    <Rnd
      default={{
        x: el.x ?? 0,
        y: el.y ?? 0,
        width: el.w ?? 200,
        height: el.h ?? (el.type === "text" ? 100 : 200),
      }}
      bounds="parent"
      onDragStop={(_, d) => update(id, { x: d.x, y: d.y })}
      onResizeStop={(_, __, ref, delta, pos) =>
        update(id, {
          w: ref.offsetWidth,
          h: ref.offsetHeight,
          x: pos.x,
          y: pos.y,
        })
      }
    >
      <div className="p-2 border bg-white space-y-2 h-full w-full">{inner}</div>
    </Rnd>
  ) : (
    <div className="p-2 border bg-white space-y-2">{inner}</div>
  );

  async function uploadImage(elId: string, file: File) {
    const res = await uploadFileToSupabase(file);
    if (!res.error) update(elId, { src: res.fileURL });
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {block}
      <button
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
        onClick={() => del(id)}
        aria-label="delete"
      >
        ×
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 6. Main Component
// -----------------------------------------------------------------------------
export default function PortfolioBuilder() {

  const router = useRouter();
  const sensorsRef = useRef(
        useSensors(
          useSensor(PointerSensor, {
            activationConstraint: { distance: 4 }, // optional
          })
        )
      );
// after sensorsRef
//const sensors = sensorsRef.current;
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
);
const modifiers = useMemo<Modifier[]>(() => [restrictToParentElement, snap8], []);  // const sensors = useSensors(useSensor(PointerSensor));
  // const modifiers = useMemo(() => [restrictToParentElement, snap8], []);
  // const add = useBuilderStore((s) => s.addElement);
  // const move = useBuilderStore((s) => s.move);
  // const resetTpl = useBuilderStore((s) => s.resetWithTemplate);
  const add      = useBuilderStore((s) => s.addElement);
  const update   = useBuilderStore((s) => s.updateElement);   // ← NEW
  const move     = useBuilderStore((s) => s.move);
  const resetTpl = useBuilderStore((s) => s.resetWithTemplate);
  // const { template, order, elements, layout, color } = useBuilderStore((s) => ({
  //   template: s.template,
  //   order: s.order,
  //   elements: s.elements,
  //   layout: s.layout,
  //   color: s.color,
  // }));
  const [color, template, layout, order, elements] = useBuilderStore(
      (s) => [s.color, s.template, s.layout, s.order, s.elements],
       shallow
     );
    
     console.log(
        "%c[Builder] render",
        "color:HotPink",
        { template, layout, orderLen: order.length }
      );

    /* ▶ ADD: log when builder slice changes */
    console.log(
      "%c[Builder] render",
      "color:HotPink",
      { template, layout, orderLen: order.length }
    );
  // ---------------------------------------------------------------------------
  // DnD Handlers
  // ---------------------------------------------------------------------------
  function onDragEnd(e: DragEndEvent) {
    const { active, over, delta } = e;

    // Dropped a toolbar item
     /* 1 – dropped a new toolbar item */
  if (active.data.current?.fromToolbar) {
    if (over?.id === "canvas") {
      const pt = e.activatorEvent as PointerEvent;
      const rect = (over.rect ?? { left: 0, top: 0 }) as DOMRect;
      add(
        makeElement(active.data.current.type as BuilderElement["type"], {
          x: pt.clientX - rect.left,
          y: pt.clientY - rect.top,
        })
      );
    }
    return;
  }

  /* 2 – move existing block in absolute mode */
  if (template === "" && over?.id === "canvas") {
    const id = active.id as string;
     const el = elements?.[id];
     if (el) {
      update(id, { x: (el.x ?? 0) + delta.x, y: (el.y ?? 0) + delta.y });
    }
    return;
  }

    // // Absolute mode: update coordinates
    // if (template === "" && over?.id === "canvas") {
    //   const id = active.id as string;
    //   const el = elements[id];
    //   if (!el) return;
    //   add({
    //     ...el,
    //     x: (el.x ?? 0) + delta.x,
    //     y: (el.y ?? 0) + delta.y,
    //   });
    //   update(id, {               // ✅ simple in‑place patch
    //       x: (el.x ?? 0) + delta.x,
    //       y: (el.y ?? 0) + delta.y,
    //     });
    //   return;
    // }

    // Template mode: re‑order list
    if (template !== "" && over && active.id !== over.id) {
      move(active.id as string, over.id as string);
    }
  

  // ---------------------------------------------------------------------------
  // Publish
  // ---------------------------------------------------------------------------
  async function publish() {
    const data: PortfolioExportData = {
      text: Object.values(elements)
        .filter((e) => e.type === "text" && e.content)
        .map((e) => (e as TextEl).content)
        .join("\n"),
      images: Object.values(elements)
        .filter((e) => e.type === "image" && e.src)
        .map((e) => (e as ImgEl).src!) as string[],
      links: Object.values(elements)
        .filter((e) => e.type === "link" && e.href)
        .map((e) => (e as LinkEl).href!) as string[],
      layout,
      color,
    };
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
     <DndContext
       sensors={sensors}
       collisionDetection={closestCenter}
       modifiers={modifiers}                          // ✅ stable ref
       onDragEnd={onDragEnd}
     >
      {/* ===== Left Sidebar =================================================== */}
      <aside className="w-40 border-r p-2 bg-gray-100 space-y-2 select-none">
        <ToolbarButton type="text" label="Text" />
        <ToolbarButton type="image" label="Image" />
        <ToolbarButton type="box" label="Box" />
        <ToolbarButton type="link" label="Link" />
        <hr />
        <p className="text-xs font-semibold">Template</p>
        <select
          value={template}
          onChange={(e) => resetTpl(e.target.value)}
          className="w-full border p-1 text-sm"
        >
          <option value="">Blank</option>
          {templates.map((t) => (
            <option key={t.name} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </aside>

      {/* ===================== Canvas ======================================== */}
      <Canvas />

      {/* ============ Right Sidebar ========================================== */}
      <aside className="w-40 border-l p-2 bg-gray-100 space-y-4">
        <p className="text-xs font-semibold">Background</p>
        <select
          value={color}
          onChange={(e) => useBuilderStore.setState({ color: e.target.value })}
          className="w-full border p-1 text-sm"
        >
          <option value="bg-white">White</option>
          <option value="bg-gray-200">Gray</option>
          <option value="bg-blue-200">Blue</option>
        </select>

        <p className="text-xs font-semibold">Layout</p>
        <select
          value={layout}
          onChange={(e) =>
            useBuilderStore.setState({ layout: e.target.value as "column" | "grid" })
          }
          className="w-full border p-1 text-sm"
        >
          <option value="column">Column</option>
          <option value="grid">Grid</option>
        </select>

        <button
          onClick={publish}
          className="w-full bg-blue-600 text-white py-1 rounded font-semibold"
        >
          Publish
        </button>
      </aside>

      {/* Optional Drag Preview */}
      <DragOverlay>{/* could render ghost preview here */}</DragOverlay>
    </DndContext>
  );
}

// -----------------------------------------------------------------------------
// 7. Helpers
// -----------------------------------------------------------------------------
function makeElement(
  type: BuilderElement["type"],
  pos: { x: number; y: number }
): BuilderElement {
  switch (type) {
    case "text":
      return { id: nanoid(), type, content: "Edit text", ...pos };
    case "image":
      return { id: nanoid(), type, ...pos };
    case "box":
      return { id: nanoid(), type, ...pos };
    case "link":
      return { id: nanoid(), type, href: "", content: "link text", ...pos };
  }
}
}
