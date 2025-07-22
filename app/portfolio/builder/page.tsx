/* eslint-disable react/jsx-key */
"use client";

import {
  DndContext,
  DragEndEvent,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { nanoid } from "nanoid";
import { useState, useRef,useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadFileToSupabase } from "@/lib/utils";
import { PortfolioExportData } from "@/lib/portfolio/export";
import { templates, BuilderElement } from "@/lib/portfolio/templates";
import Image from "next/image";
import html2canvas from "html2canvas";

type Element = BuilderElement;

function DraggableItem({ id, children, fromSidebar }: { id: string; children: React.ReactNode; fromSidebar?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, data: { fromSidebar } });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-move flex justify-start px-4 gap-2 tracking-wide
     py-2 border rounded-md lockbutton text-center bg-white text-black">
      {children}
    </div>
  );
}

function CanvasItem({ id, x, y, children }: { id: string; x: number; y: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = {
    position: "absolute",
    left: x + (transform?.x ?? 0),
    top: y + (transform?.y ?? 0),
  } as React.CSSProperties;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-move">
      {children}
    </div>
  );
}

function SortableCanvasItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-move">
      {children}
    </div>
  );
}

interface TextBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}
type Corner = 'nw' | 'ne' | 'sw' | 'se';

interface ResizeState {
  id: string;            // box being resized
  corner: Corner;        // which corner is active
  startX: number;        // pointer position at drag start
  startY: number;
  startLeft: number;     // box position/dimensions at drag start
  startTop: number;
  startWidth: number;
  startHeight: number;
}
interface DragState {
    id: string;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
  }
function DroppableCanvas({
  children,
  layout,
  color,
  isBlank,
  drawText,
  boxes,
  setBoxes,
  canvasRef,
}: {
  children: React.ReactNode;
  layout: "column" | "grid" | "free";
  color: string;
  isBlank: boolean;
  drawText: boolean;
  boxes: TextBox[];
  setBoxes: React.Dispatch<React.SetStateAction<TextBox[]>>;
  canvasRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
    const { setNodeRef } = useDroppable({ id: "canvas" });
    const layoutClass = layout === "free"
    ? "flex flex-col-auto flex-1 flex-row-auto gap-auto w-auto h-auto"
    : layout === "grid"
    ? "grid grid-cols-2 gap-2"
    : "flex flex-col gap-2";
   /* NEW ---------- */
   const [draft, setDraft]   = useState<TextBox | null>(null);
   const [resizing, setResizing] = useState<ResizeState | null>(null);
   const [dragging, setDragging] = useState<DragState | null>(null);

   /* --------------- */
  const ref = canvasRef;

  function startDraw(e: React.MouseEvent<HTMLDivElement>) {
    if (!drawText || e.target !== ref.current) return;
    const rect = ref.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDraft({ id: "", x, y, width: 0, height: 0, text: "" });
  }

  function moveDraw(e: React.MouseEvent<HTMLDivElement>) {
    if (!drawText || !draft) return;
    const rect = ref.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDraft((d) => (d ? { ...d, width: x - d.x, height: y - d.y } : null));
  }

  function endDraw() {
    if (!drawText || !draft) return;
    let { x, y, width, height } = draft;
    if (Math.abs(width) < 5 || Math.abs(height) < 5) {
      setDraft(null);
      return;
    }
    if (width < 0) {
      x += width;
      width = Math.abs(width);
    }
    if (height < 0) {
      y += height;
      height = Math.abs(height);
    }
    setBoxes((bs) => [...bs, { id: nanoid(), x, y, width, height, text: "" }]);
    setDraft(null);
  }
  /* ---------- resize helpers ------------ */
  function handlePointerDown(e: React.PointerEvent, b: TextBox, corner: Corner) {
    e.stopPropagation();
    const rect = ref.current!.getBoundingClientRect();
    setResizing({
      id: b.id,
      corner,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startLeft: b.x,
      startTop:  b.y,
      startWidth: b.width,
      startHeight: b.height,
    });
  }
  function handleBoxPointerDown(e: React.PointerEvent, b: TextBox) {
    // Ignore if we’re clicking a resize handle – they call handlePointerDown.
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;
  
    // Ignore if user clicks inside the text editor (it stops propagation).
    e.stopPropagation();
  
    const rect = ref.current!.getBoundingClientRect();
    setDragging({
      id: b.id,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startLeft: b.x,
      startTop: b.y,
    });
  }
  /* attach / detach window listeners when resizing */
  useEffect(() => {
    function onMove(ev: PointerEvent) {
      if (!resizing) return;
      const { startX, startY, corner, startLeft, startTop, startWidth, startHeight } = resizing;
      const rect = ref.current!.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const dx = x - startX;
      const dy = y - startY;

      setBoxes(bs =>
        bs.map(b => {
          if (b.id !== resizing.id) return b;

          let left  = startLeft;
          let top   = startTop;
          let width = startWidth;
          let height= startHeight;

          switch (corner) {
            case 'se':
              width  = Math.max(20, startWidth  + dx);
              height = Math.max(20, startHeight + dy);
              break;
            case 'sw':
              width  = Math.max(20, startWidth  - dx);
              height = Math.max(20, startHeight + dy);
              left   = startLeft + dx;
              break;
            case 'ne':
              width  = Math.max(20, startWidth  + dx);
              height = Math.max(20, startHeight - dy);
              top    = startTop  + dy;
              break;
            case 'nw':
              width  = Math.max(20, startWidth  - dx);
              height = Math.max(20, startHeight - dy);
              left   = startLeft + dx;
              top    = startTop  + dy;
              break;
          }
          return { ...b, x: left, y: top, width, height };
        }),
      );
    }

    function onUp() {
      setResizing(null);
    }

    if (resizing) {
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      return () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
    }
  }, [resizing, setBoxes]);

  useEffect(() => {
    function onMove(ev: PointerEvent) {
      if (!dragging) return;
      const rect = ref.current!.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const dx = x - dragging.startX;
      const dy = y - dragging.startY;
  
      setBoxes(bs =>
        bs.map(b =>
          b.id === dragging.id ? { ...b, x: dragging.startLeft + dx, y: dragging.startTop + dy } : b
        ),
      );
    }
  
    function onUp() {
      setDragging(null);
    }
  
    if (dragging) {
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      return () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
    }
  }, [dragging, setBoxes]);

  function updateText(id: string, text: string) {
    setBoxes((bs) => bs.map((b) => (b.id === id ? { ...b, text } : b)));
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        ref.current = node;
      }}
      className={`relative flex-1 min-h-screen border border-dashed p-4 ${color} ${layoutClass} grid-background`}
      style={{ cursor: drawText ? (draft ? "crosshair" : "crosshair") : "default" }}
      onMouseDown={drawText ? startDraw : undefined}
      onMouseMove={drawText ? moveDraw : undefined}
      onMouseUp={drawText ? endDraw : undefined}
    >
      {children}
      {boxes.map((box) => (

<div
  key={box.id}
  onPointerDown={(e) => handleBoxPointerDown(e, box)}
  style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
  className="absolute border-2 border-r-4 border-l-4 border-r-solid border-l-solid custom-scrollbar border-dashed border-gray-400 bg-white text-xs outline-none overflow-hidden cursor-move 
 justify-center"
>
{/* corner handles */}
{(['nw','ne','sw','se'] as Corner[]).map(corner => (
  <div
    key={corner}
    onPointerDown={(e) => handlePointerDown(e, box, corner)}
    className={`resize-handle handle-${corner}`}
  />
))}

{/* editable text area */}
<div
  onPointerDown={(e) => e.stopPropagation()}

  ref={el => {
    /* keep DOM in sync **only** when the box text
       changes because of something *other* than typing
       (e.g. loading, undo, etc.)                    */
    if (el && el.innerText !== box.text) {
      el.innerText = box.text;
    }
  }}            contentEditable
            suppressContentEditableWarning
            className="w-full h-full px-3 py-2"
            style={{ cursor: 'text' }}
            onInput={e => updateText(box.id, (e.target as HTMLElement).innerText)}

          >
            {/* {box.text} */}
          </div>
        </div>
      ))}

{/* 
        <div
          key={box.id}
          style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
          className="absolute border border-dashed border-gray-400 bg-white text-xs p-1 outline-none resize overflow-auto"
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => updateText(box.id, (e.target as HTMLElement).innerText)}
        >
          {box.text}
        </div>
      ))} */}
      {draft && (
        <div
          style={{
            left: draft.width < 0 ? draft.x + draft.width : draft.x,
            top: draft.height < 0 ? draft.y + draft.height : draft.y,
            width: Math.abs(draft.width),
            height: Math.abs(draft.height),
          }}
          className="absolute border border-dashed border-gray-400 bg-white/50 pointer-events-none"
        />
      )}
    </div>
  );
}

export default function PortfolioBuilder() {
  const [elements, setElements] = useState<Element[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState("bg-white");
  const [layout, setLayout] = useState<"column" | "grid" | "free">("free");
  const [template, setTemplate] = useState<string>("");
  const [drawText, setDrawText] = useState(false);
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([]);
  const router = useRouter();

  function handleDragEnd(event: DragEndEvent) {
    const { over, active, delta } = event;
    if (active.data.current?.fromSidebar) {
      if (over) {
        const pointer = event.activatorEvent as PointerEvent;
        const rect = canvasRef.current?.getBoundingClientRect();
        const x = rect ? pointer.clientX - rect.left : 0;
        const y = rect ? pointer.clientY - rect.top : 0;
        setElements((els) => [
          ...els,
          template === ""
            ? { id: nanoid(), type: active.id as Element["type"], content: "", src: "", x, y }
            : { id: nanoid(), type: active.id as Element["type"], content: "", src: "" },
        ]);
      }
      return;
    }

    if (template === "") {
      setElements((els) =>
        els.map((e) =>
          e.id === active.id ? { ...e, x: (e.x || 0) + delta.x, y: (e.y || 0) + delta.y } : e
        )
      );
    } else if (over && active.id !== over.id) {
      setElements((els) => {
        const oldIndex = els.findIndex((e) => e.id === active.id);
        const newIndex = els.findIndex((e) => e.id === over.id);
        return arrayMove(els, oldIndex, newIndex);
      });
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
  function buildAbsoluteExport() {
    // 1️⃣  From drag‑dropped template elements
    const absoluteElems = elements
      .filter(e => typeof e.x === "number" && typeof e.y === "number")
      .map(e => ({
        id: e.id,
        type: e.type,
        x: e.x!,
        y: e.y!,
        width:  e.type === "image" ? 300 : 200, // you could store width/height too
        height: e.type === "image" ? 300 : 32,
        content: e.content,
        src: e.src,
        href: e.href,
      }));
  
    // 2️⃣  From text boxes we drew
    const absoluteText = textBoxes.map(b => ({
      id: b.id,
      type: "text-box",
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      content: b.text,
    }));
  
    return [...absoluteElems, ...absoluteText];
  }
  function serialize(): PortfolioExportData {
    const textFromElements = elements
      .filter((e) => e.type === "text" && e.content)
      .map((e) => e.content)
      .join("\n");
    const textFromBoxes = textBoxes.map((b) => b.text).join("\n");
    const text = [textFromElements, textFromBoxes].filter(Boolean).join("\n");
    const images = elements
      .filter((e) => e.type === "image" && e.src)
      .map((e) => e.src as string);
    const links = elements
      .filter((e) => e.type === "link" && e.href)
      .map((e) => e.href as string);
    return { text, images, links, layout, color };
  }
  async function handlePublish() {
    if (!canvasRef.current) return;
    const node = canvasRef.current;
  
    /* 0️⃣  Toggle “clean mode” so resize handles & dashed borders disappear */
    node.classList.add("publishing");
  
    try {
      /* 1️⃣  Ensure all remote images and custom fonts are ready */
      await Promise.all([
        document.fonts.ready,
        ...Array.from(node.querySelectorAll("img")).map(
          img =>
            img.complete
              ? Promise.resolve()
              : new Promise(res => {
                  const done = () => {
                    img.removeEventListener("load", done);
                    img.removeEventListener("error", done);
                    res(null);
                  };
                  img.addEventListener("load", done);
                  img.addEventListener("error", done);
                }),
        ),
      ]);
  
      /* 2️⃣  Compute the exact canvas size (it may be taller than the viewport) */
      const width  = node.scrollWidth;
      const height = node.scrollHeight;
  
      /* 3️⃣  Render to bitmap */
      const bitmap = await html2canvas(node, {
        backgroundColor: null,   // keep transparent; change to '#fff' if preferred
        useCORS: true,
        width,
        height,
        scrollX: -window.scrollX, // guarantees 0,0 alignment even if user scrolled
        scrollY: -window.scrollY,
        scale: window.devicePixelRatio, // crisp on Retina without huge file
      });
  
      /* 4️⃣  Convert → Blob */
      const blob: Blob | null = await new Promise(res => bitmap.toBlob(res, "image/png"));
      if (!blob) return;
  
      /* 5️⃣  Upload the PNG (Supabase helper unchanged) */
      const fileName = `portfolio/snapshot-${Date.now()}.png`;
      const { fileURL, error } = await uploadFileToSupabase(
        new File([blob], fileName, { type: "image/png" }),
      );
      if (error) {
        console.error(error);
        return;
      }
  
      /* 6️⃣  POST the usual payload + snapshot URL */
    //   const payload = {
    //     ...serialize(),
    //     snapshot: fileURL,
    //     snapshotWidth: width,   // optional: let the public page know natural size
    //     snapshotHeight: height,
    //   };
    const payload = {
        ...serialize(),          // legacy keys
        absolutes: buildAbsoluteExport(),   // NEW
                snapshot: fileURL,
        snapshotWidth: width,   // optional: let the public page know natural size
        snapshotHeight: height,
      };
  
      const res = await fetch("/api/portfolio/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (res.ok) {
        const { url } = await res.json();
        router.push(url);
      }
    } finally {
      /* 🔚  Always restore the editing chrome, even if something threw */
      node.classList.remove("publishing");
    }
  }

  function applyTemplate(name: string) {
    const tpl = templates.find((t) => t.name === name);
    if (!tpl) return;
    setTemplate(name);
    setLayout(tpl.layout);
    setColor(tpl.color);
    setElements(tpl.elements.map((e) => ({ ...e, id: nanoid(), x: 0, y: 0 })));
  }

  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="flex h-screen">
        <div className=" flex-grow-0 flex-shrink-0 border-r py-2 px-4 space-y-4  mt-12">
          <button
            className={` flex gap-2 justify-start px-4 py-2 rounded-md l
            flex-grow-0 flex-shrink-0 lockbutton tracking-wide ${drawText ? "bg-slate-300 cursor-crosshair" : "bg-white"}`}
            onClick={() => setDrawText((d) => !d)}
          >
            {drawText ? "Text Box" : "Text Box"}
            <Image
                  src="/assets/text--creation.svg"
                  alt={"globe"}
                  className="p-0 flex-grow-0 flex-shrink-0"

                  width={24}
                  height={24}
                />
          </button>
          {/* <DraggableItem id="text" fromSidebar>
            Text
          </DraggableItem> */}
          <DraggableItem id="image" fromSidebar>
            Image
            <Image
                  src="/assets/image.svg"
                  alt={"globe"}
                  className="p-0 flex-grow-0 flex-shrink-0"

                  width={24}
                  height={24}
                />
          </DraggableItem>
          
          <DraggableItem id="link" fromSidebar>
            Link
            <Image
                  src="/assets/link.svg"
                  alt={"globe"}
                  className="mr-2"

                  width={24}
                  height={24}
                />
          </DraggableItem>
        </div>
        <DroppableCanvas
          layout={layout}
          color={color}
          isBlank={template === ""}
          drawText={drawText}
          boxes={textBoxes}
          setBoxes={setTextBoxes}
          canvasRef={canvasRef}
        >
            {elements.map((el) => (
              template === "" ? (
                <CanvasItem key={el.id} id={el.id} x={el.x} y={el.y}>
                  <div className="p-2 border-[1px]  border-black bg-white space-y-2">
                    {el.type === "text" && (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="text-block outline-none"
                        onPointerDown={(e) => e.stopPropagation()}
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
                      <div className="p-1 border-[1px] border-transparent ">
                        {el.src ? (
                          <Image
                            src={el.src}
                            alt="uploaded"
                            width={300}
                            height={300}
                            sizes="(max-height: 200px) 50vw, 33vw"
                           className="object-cover w-fit h-fit portfolio-img-frame"
                          />
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            className=" w-full p-1"
                            onPointerDown={(e) => e.stopPropagation()}
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
                        onPointerDown={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setElements((els) =>
                            els.map((it) =>
                              it.id === el.id ? { ...it, href: e.target.value } : it
                            )
                          )
                        }
                      />
                    )}
                    <button
                      className=" rounded-md mt-2 lockbutton ml-2"
                      onClick={() =>
                        setElements((els) => els.filter((it) => it.id !== el.id))
                      }
                    >
                      <Image
                  src="/assets/trash-can.svg"
                  alt={"globe"}
                  className="justify-center  "

                  width={24}
                  height={24}
                />
                    </button>
                  </div>
                </CanvasItem>
              ) : (
                <SortableCanvasItem key={el.id} id={el.id}>
                  <div className="p-2 border bg-white space-y-2">
                    {el.type === "text" && (
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="text-block outline-none"
                        onPointerDown={(e) => e.stopPropagation()}
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
                            onPointerDown={(e) => e.stopPropagation()}
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
                        onPointerDown={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          setElements((els) =>
                            els.map((it) =>
                              it.id === el.id ? { ...it, href: e.target.value } : it
                            )
                          )
                        }
                      />
                    )}
                    <button
                      className="text-xs text-red-500"
                      onClick={() =>
                        setElements((els) => els.filter((it) => it.id !== el.id))
                      }
                    >
                           <Image
                  src="/assets/trash-can.svg"
                  alt={"globe"}
                  className="mr-2"

                  width={24}
                  height={24}
                />

                    </button>
                  </div>
                </SortableCanvasItem>
              )
            ))}
        </DroppableCanvas>
        <div className="w-fit border-l px-4 py-2 mt-8 space-y-4">
          <div className="rounded-xl bg-transparent border-[1px] border-black p-3 ">
            <p className="text-sm mb-1">Template</p>
            <select
              className="w-full rounded-xl lockbutton mt-1 border-black bg-gray-100 border-[1px] p-1"
              value={template}
              onChange={(e) => applyTemplate(e.target.value)}
            >
              <option value="">Blank</option>
              {templates.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl bg-transparent border-[1px] border-black p-3 ">
            <p className="text-sm mb-1">Background</p>
            <select
              className="w-full rounded-xl lockbutton mt-1 border-black bg-gray-100 border-[1px] p-1"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option value="bg-white">White</option>
              <option value="bg-gray-200">Gray</option>
              <option value="bg-blue-200">Blue</option>
            </select>
          </div>
          <div className="rounded-xl bg-transparent border-[1px] border-black p-3 ">
            <p className="text-sm mb-1">Layout</p>
            <select
              className="w-full rounded-xl lockbutton mt-1 border-black bg-gray-100 border-[1px] p-1"
              value={layout}
              onChange={(e) => setLayout(e.target.value as "column" | "grid" | "free")}
            >             
             <option value="free">Free</option>

              <option value="column">Column</option>
              <option value="grid">Grid</option>

            </select>
          </div>
          <button
            className="w-full  bg-gray-100 border-black border-[1px] lockbutton  text-black  px-1 py-2 
            tracking-wide text-[1.1rem] rounded-xl"
            onClick={handlePublish}
          >
            Publish
          </button>
        </div>
      </div>
    </DndContext>
  );
}

