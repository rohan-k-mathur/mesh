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
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadFileToSupabase } from "@/lib/utils";
import { PortfolioExportData } from "@/lib/portfolio/export";
import { templates, BuilderElement } from "@/lib/portfolio/templates";
import Image from "next/image";
import html2canvas from "html2canvas";
import { getUserFromCookies } from "@/lib/serverutils";
import { createRealtimePost } from "@/lib/actions/realtimepost.actions";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Element = BuilderElement;

function DraggableItem({
  id,
  children,
  fromSidebar,
}: {
  id: string;
  children: React.ReactNode;
  fromSidebar?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    data: { fromSidebar },
  });
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-move flex justify-start px-4 gap-2 tracking-wide
     py-2 border rounded-md lockbutton text-center bg-white text-black"
    >
      {children}
    </div>
  );
}

function CanvasItem({
  id,
  x,
  y,
  children,
}: {
  id: string;
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = {
    position: "absolute",
    left: x + (transform?.x ?? 0),
    top: y + (transform?.y ?? 0),
  } as React.CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-move"
    >
      {children}
    </div>
  );
}

function SortableCanvasItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-move"
    >
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
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontFamily?: string;
  fontWeight?: 400 | 500 | 600 | 700;
  italic?: boolean;
}
type Corner = "nw" | "ne" | "sw" | "se";

type ResizeTarget = { id: string; kind: "text" | "image" };
interface ResizeState {
  target: ResizeTarget; // element being resized
  corner: Corner; // which corner is active
  startX: number; // pointer position at drag start
  startY: number;
  startLeft: number; // element position/dimensions at drag start
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

function StylePanel({
  box,
  onChange,
}: {
  box: TextBox;
  onChange: (patch: Partial<TextBox>) => void;
}) {
  return (
    <div className="space-y-3 mt-6">
      <label className="block text-xs">
        Font&nbsp;Size
        <Input
          type="number"
          value={box.fontSize ?? 14}
          min={8}
          max={96}
          onChange={(e) => onChange({ fontSize: +e.target.value })}
        />
      </label>
      <label className="block text-xs">
        Line&nbsp;Height
        <Input
          type="number"
          step="0.05"
          value={box.lineHeight ?? 1.2}
          onChange={(e) => onChange({ lineHeight: +e.target.value })}
        />
      </label>
      <label className="block text-xs">
        Tracking
        <Input
          type="number"
          value={box.letterSpacing ?? 0}
          onChange={(e) => onChange({ letterSpacing: +e.target.value })}
        />
      </label>
      <Select
        value={box.fontFamily ?? "Inter"}
        onValueChange={(v) => onChange({ fontFamily: v })}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Inter">Inter</SelectItem>
          <SelectItem value="Times">Times</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <button
          className="border px-1"
          onClick={() =>
            onChange({ fontWeight: box.fontWeight === 700 ? 400 : 700 })
          }
        >
          <b>B</b>
        </button>
        <button
          className="border px-1"
          onClick={() => onChange({ italic: !box.italic })}
        >
          <i>I</i>
        </button>
      </div>
    </div>
  );
}
function DroppableCanvas({
  children,
  layout,
  color,
  isBlank,
  drawText,
  boxes,
  setBoxes,
  elements,
  setElements, 
  canvasRef,
  selectedId,
  setSelectedId,
  onResizeStart,
}: {
  children: React.ReactNode;
  layout: "column" | "grid" | "free";
  color: string;
  isBlank: boolean;
  drawText: boolean;
  boxes: TextBox[];
  elements: Element[];                              
  setBoxes: React.Dispatch<React.SetStateAction<TextBox[]>>;
  setElements: React.Dispatch<React.SetStateAction<Element[]>>; 
  canvasRef: React.MutableRefObject<HTMLDivElement | null>;
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  onResizeStart?: (
    fn: (
      e: React.PointerEvent,
      target: ResizeTarget,
      corner: Corner
    ) => void
  ) => void;
}) {
  const { setNodeRef } = useDroppable({ id: "canvas" });
  const layoutClass =
    layout === "free"
      ? "flex flex-col-auto flex-1 flex-row-auto gap-auto w-auto h-auto"
      : layout === "grid"
      ? "grid grid-cols-2 gap-2"
      : "flex flex-col gap-2";
  /* NEW ---------- */
  const [draft, setDraft] = useState<TextBox | null>(null);
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);

  /* --------------- */
  const ref = canvasRef;
    useEffect(() => {
        onResizeStart?.(handleResizeStart);
     }, [onResizeStart]);



  function startDraw(e: React.MouseEvent<HTMLDivElement>) {
    if (!drawText || e.target !== ref.current) return;
    setSelectedId(null);
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
    setBoxes((bs) => [
      ...bs,
      {
        id: nanoid(),
        x,
        y,
        width,
        height,
        text: "",
        fontSize: 14,
        lineHeight: 1.2,
      },
    ]);
    setDraft(null);
  }
  /* ---------- resize helpers ------------ */
  function handleResizeStart(
    e: React.PointerEvent,
    target: ResizeTarget,
    corner: Corner
  ) {
    e.stopPropagation();
    const rect = ref.current!.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
        const obj =
          target.kind === "text"
            ? boxes.find((b) => b.id === target.id)!    // use local `boxes`
            : elements.find((el) => el.id === target.id)!;

            // useEffect(() => {
            //   onResizeStart?.(handleResizeStart);
            // }, [onResizeStart]);

    setResizing({
      target,
      corner,
      startX,
      startY,
      startLeft: obj.x,
      startTop: obj.y,
      startWidth: obj.width,
      startHeight: obj.height,
    });
  }
  
  function handleBoxPointerDown(e: React.PointerEvent, b: TextBox) {
    // Ignore if we’re clicking a resize handle – they call handleResizeStart.
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;

    // Ignore if user clicks inside the text editor (it stops propagation).
    e.stopPropagation();

    setSelectedId(b.id);

    const rect = ref.current!.getBoundingClientRect();
    setDragging({
      id: b.id,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startLeft: b.x,
      startTop: b.y,
    });
  }
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setSelectedId(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  /* attach / detach window listeners when resizing */
  useEffect(() => {
    function onMove(ev: PointerEvent) {
      if (!resizing) return;
      const {
        startX,
        startY,
        corner,
        startLeft,
        startTop,
        startWidth,
        startHeight,
        target,
      } = resizing;
      const rect = ref.current!.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const dx = x - startX;
      const dy = y - startY;

      let left = startLeft;
      let top = startTop;
      let width = startWidth;
      let height = startHeight;

      switch (corner) {
        case "se":
          width = Math.max(20, startWidth + dx);
          height = Math.max(20, startHeight + dy);
          break;
        case "sw":
          width = Math.max(20, startWidth - dx);
          height = Math.max(20, startHeight + dy);
          left = startLeft + dx;
          break;
        case "ne":
          width = Math.max(20, startWidth + dx);
          height = Math.max(20, startHeight - dy);
          top = startTop + dy;
          break;
        case "nw":
          width = Math.max(20, startWidth - dx);
          height = Math.max(20, startHeight - dy);
          left = startLeft + dx;
          top = startTop + dy;
          break;
      }

      if (target.kind === "text") {
        setBoxes((bs) =>
          bs.map((b) =>
            b.id === target.id ? { ...b, x: left, y: top, width, height } : b
          )
        );
      } else {
        setElements((es) =>
          es.map((el) =>
            el.id === target.id ? { ...el, x: left, y: top, width, height } : el
          )
        );
      }
    }
    




       function onUp() {
            setResizing(null);          // <- clear the mode
          }

          if (resizing) {
                  window.addEventListener("pointermove", onMove);
                  window.addEventListener("pointerup", onUp);
                  return () => {
                    window.removeEventListener("pointermove", onMove);
                    window.removeEventListener("pointerup", onUp);
                  };
                }
  }, [resizing, setBoxes, setElements]);

  useEffect(() => {
    function onMove(ev: PointerEvent) {
      if (!dragging) return;
      const rect = ref.current!.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const dx = x - dragging.startX;
      const dy = y - dragging.startY;

      setBoxes((bs) =>
        bs.map((b) =>
          b.id === dragging.id
            ? { ...b, x: dragging.startLeft + dx, y: dragging.startTop + dy }
            : b
        )
      );
    }

    function onUp() {
      setDragging(null);
    }

    if (dragging) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    }
  }, [dragging, setBoxes]);

  function updateText(id: string, text: string) {
    setBoxes((bs) => bs.map((b) => (b.id === id ? { ...b, text } : b)));
  }

  function canvasMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === ref.current) {
      setSelectedId(null);
    }
    if (drawText) startDraw(e);
  }
  const resizeStartRef = useRef<
  (e: React.PointerEvent, t: ResizeTarget, c: Corner) => void
>();
// thin wrapper the JSX can call
const proxyResizeStart = (
  e: React.PointerEvent,
  target: ResizeTarget,
  corner: Corner
) => resizeStartRef.current?.(e, target, corner);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        ref.current = node;
      }}
      className={`relative flex-1 min-h-screen border border-dashed p-4 ${color} ${layoutClass} grid-background`}
      style={{
        cursor: drawText ? (draft ? "crosshair" : "crosshair") : "default",
      }}
      onMouseDown={canvasMouseDown}
      onMouseMove={drawText ? moveDraw : undefined}
      onMouseUp={drawText ? endDraw : undefined}
    >
      {children}
      {boxes.map((box) => (
        <div
          key={box.id}
          onPointerDown={(e) => handleBoxPointerDown(e, box)}
          style={{
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
          }}
          className="absolute border-2 border-r-4 border-l-4 border-r-solid border-l-solid custom-scrollbar border-dashed border-gray-400 bg-white text-xs outline-none overflow-hidden cursor-move 
 justify-center"
        >
          {/* corner handles */}
          {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
        <div
          key={corner}
          onPointerDown={(e) =>
            handleResizeStart(e, { id: box.id, kind: "text" }, corner)
          }
          className={`resize-handle handle-${corner}`}
        />
      ))}
<button
     className="absolute bottom-1 right-1 p-[2px] rounded
                bg-white/80 hover:bg-red-500/90"
     onClick={(e) => {
       e.stopPropagation();          // don’t start a drag
       setBoxes((bs) => bs.filter((b) => b.id !== box.id));
     }}
   >
     <Image src="/assets/trash-can.svg" alt="delete" width={14} height={14} />
   </button>
          {/* editable text area */}
          <div
            onPointerDown={(e) => e.stopPropagation()} 
            ref={(el) => {
              /* keep DOM in sync **only** when the box text
       changes because of something *other* than typing
       (e.g. loading, undo, etc.)                    */
              if (el && el.innerText !== box.text) {
                el.innerText = box.text;
              }
            }}
            contentEditable
            onFocus={() => setSelectedId(box.id)}
            suppressContentEditableWarning
            className="w-full h-full px-3 py-2"
            style={{
              cursor: "text",
              fontSize: box.fontSize,
              lineHeight: box.lineHeight,
              letterSpacing: box.letterSpacing,
              fontFamily: box.fontFamily,
              fontWeight: box.fontWeight,
              fontStyle: box.italic ? "italic" : undefined,
              whiteSpace: "pre-wrap",
            }}
            onInput={(e) =>
              updateText(box.id, (e.target as HTMLElement).innerText)
            }
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const router = useRouter();
  const handleResizeStart = (
    e: React.PointerEvent,
    target: ResizeTarget,
    corner: Corner,
  ) => {
    canvasHandleResizeStart.current?.(e, target, corner); // delegate
  };

/* --- inside PortfolioBuilder --- */
const resizeStartRef = useRef<
  (e: React.PointerEvent, t: ResizeTarget, c: Corner) => void
>();

// thin wrapper the JSX can call
const proxyResizeStart = (
  e: React.PointerEvent,
  target: ResizeTarget,
  corner: Corner
) => resizeStartRef.current?.(e, target, corner);


  // Keep a ref so DroppableCanvas gives us its real implementation
  const canvasHandleResizeStart = useRef<
    (e: React.PointerEvent, target: ResizeTarget, corner: Corner) => void
  >(null);



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
            ? {
                id: nanoid(),
                type: active.id as Element["type"],
                content: "",
                src: "",
                x,
                y,
                width: active.id === "image" ? 300 : 200,
                height: active.id === "image" ? 300 : 32,
              }
            : {
                id: nanoid(),
                type: active.id as Element["type"],
                content: "",
                src: "",
                width: active.id === "image" ? 200 : 200,
                height: active.id === "image" ? 200 : 32,
              },
        ]);
      }
      return;
    }

    if (template === "") {
      setElements((els) =>
        els.map((e) =>
          e.id === active.id
            ? { ...e, x: (e.x || 0) + delta.x, y: (e.y || 0) + delta.y }
            : e
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
  function getImageSizeFromFile(file: File): Promise<{ w: number; h: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        resolve({ w: img.naturalWidth, h: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  async function getImageSizeFromUrl(url: string) {
    return new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.crossOrigin = "anonymous"; // just in case
      img.src = url;
    });
  }
  async function handleImageSelect(id: string, file: File) {
    const res = await uploadFileToSupabase(file);
    // if (upload.error) return;
    const { w, h } = await getImageSizeFromFile(file);

    if (!res.error) {
      setElements((els) =>
        els.map((el) =>
          el.id === id
            ? { ...el, src: res.fileURL, width: w, height: h, natW: w, natH: h }
            : el
        )
      );
    }
  }

  function recordNaturalSize(id: string, w: number, h: number) {
    setElements((els) =>
      els.map((el) => (el.id === id ? { ...el, natW: w, natH: h } : el))
    );
  }
  function buildAbsoluteExport() {
    // 1️⃣  From drag‑dropped template elements
    const absoluteElems = elements.map((e) => ({
      id: e.id,
      type: e.type,
      x: e.x ?? 0,
      y: e.y ?? 0,
      natW: e.natW,
      natH: e.natH,
      width: e.width,
      height: e.height,
      content: e.content,
      src: e.src,
      href: e.href,
    }));

    // 2️⃣  From text boxes we drew
    const absoluteText = textBoxes.map((b) => ({
      id: b.id,
      type: "text-box",
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      content: b.text,
      fontSize: b.fontSize,
      lineHeight: b.lineHeight,
      letterSpacing: b.letterSpacing,
      fontFamily: b.fontFamily,
      fontWeight: b.fontWeight,
      italic: b.italic,
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
    // if (!canvasRef.current) return;
    // const node = canvasRef.current;

    // /* 0️⃣  Toggle “clean mode” so resize handles & dashed borders disappear */
    // node.classList.add("publishing");

    // try {
    //   /* 1️⃣  Ensure all remote images and custom fonts are ready */
    //   await Promise.all([
    //     document.fonts.ready,
    //     ...Array.from(node.querySelectorAll("img")).map(
    //       img =>
    //         img.complete
    //           ? Promise.resolve()
    //           : new Promise(res => {
    //               const done = () => {
    //                 img.removeEventListener("load", done);
    //                 img.removeEventListener("error", done);
    //                 res(null);
    //               };
    //               img.addEventListener("load", done);
    //               img.addEventListener("error", done);
    //             }),
    //     ),
    //   ]);

    //   /* 2️⃣  Compute the exact canvas size (it may be taller than the viewport) */
    //   const width  = node.scrollWidth;
    //   const height = node.scrollHeight;

    //   /* 3️⃣  Render to bitmap */
    //   const bitmap = await html2canvas(node, {
    //     backgroundColor: null,   // keep transparent; change to '#fff' if preferred
    //     useCORS: true,
    //     width,
    //     height,
    //     scrollX: -window.scrollX, // guarantees 0,0 alignment even if user scrolled
    //     scrollY: -window.scrollY,
    //     scale: window.devicePixelRatio, // crisp on Retina without huge file
    //   });

    //   /* 4️⃣  Convert → Blob */
    //   const blob: Blob | null = await new Promise(res => bitmap.toBlob(res, "image/png"));
    //   if (!blob) return;

    //   /* 5️⃣  Upload the PNG (Supabase helper unchanged) */
    //   const fileName = `portfolio/snapshot-${Date.now()}.png`;
    //   const { fileURL, error } = await uploadFileToSupabase(
    //     new File([blob], fileName, { type: "image/png" }),
    //   );
    //   if (error) {
    //     console.error(error);
    //     return;
    //   }

    /* 6️⃣  POST the usual payload + snapshot URL */
    //   const payload = {
    //     ...serialize(),
    //     snapshot: fileURL,
    //     snapshotWidth: width,   // optional: let the public page know natural size
    //     snapshotHeight: height,
    //   };
    // const payload = {
    //     ...serialize(),          // legacy keys
    //     absolutes: buildAbsoluteExport(),   // NEW
    //             snapshot: fileURL,
    //     snapshotWidth: width,   // optional: let the public page know natural size
    //     snapshotHeight: height,
    //   };

    const payload = {
      ...serialize(),
      absolutes: buildAbsoluteExport(),
    };

    /* 2) POST to the export route – it now returns the PNG */
    const res = await fetch("/api/portfolio/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("export failed");

    const { url, snapshot } = await res.json();

    /* 3) Create the realtime post using the *server‑generated* PNG */
    await createRealtimePost({
      portfolio: { pageUrl: url, snapshot },
      imageUrl: snapshot, // thumbnail in the feed
      path: "/",
      coordinates: { x: 0, y: 0 },
      type: "PORTFOLIO",
      realtimeRoomId: "global",
    });

    router.push(url); // open the live page for the author
  }

  //      /***** 6️⃣  POST the payload *****/
  // const res = await fetch("/api/portfolio/export", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(payload),
  // });

  // /* ---- read only ONCE ---- */
  // const data = await res.json();   // <- body consumed exactly here

  // if (!res.ok) {
  //   throw new Error(data.error ?? "export failed");
  // }

  // const { url } = data;            // “/portfolio/abc123”
  //   //   //   if (res.ok) {
  //   //   //     const { url } = await res.json();
  //   //   //   }
  //   //     if (!res.ok) throw new Error("export failed");

  //   //     const { url } = await res.json();          // “/portfolio/abc123”

  //   //     /* ➋  Build the JSON the feed card expects */
  //   //     const postContent = JSON.stringify({
  //   //       pageUrl: url,           // required for new PortfolioCard
  //   //       snapshot: fileURL,      // optional – faster preview
  //   //     });
  //   //  /* ➌  Create the post in the feed */
  //   //  const user = await getUserFromCookies();

  //   await createRealtimePost({
  //     portfolio: { pageUrl: url, snapshot: fileURL },
  //     imageUrl: fileURL,          // gives the feed a thumbnail
  //     path: "/",
  //     coordinates: { x: 0, y: 0 },
  //     type: "PORTFOLIO",
  //     realtimeRoomId: "global",
  //   });

  //   router.push(url);

  function applyTemplate(name: string) {
    const tpl = templates.find((t) => t.name === name);
    if (!tpl) return;
    setTemplate(name);
    setLayout(tpl.layout);
    setColor(tpl.color);
    setElements(
      tpl.elements.map((e) => ({
        ...e,
        id: nanoid(),
        x: 0,
        y: 0,
        width: e.type === "image" ? 200 : 200,
        height: e.type === "image" ? 200 : 32,
      }))
    );
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
            flex-grow-0 flex-shrink-0 lockbutton tracking-wide ${
              drawText ? "bg-slate-300 cursor-crosshair" : "bg-white"
            }`}
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
          {selectedId && (
            <StylePanel
              box={textBoxes.find((b) => b.id === selectedId)!}
              onChange={(patch) =>
                setTextBoxes((bs) =>
                  bs.map((b) =>
                    b.id === selectedId ? { ...b, ...patch } : b
                  )
                )
              }
            />
          )}
        </div>
        <DroppableCanvas
          layout={layout}
          color={color}
          isBlank={template === ""}
          drawText={drawText}
          boxes={textBoxes}
          setBoxes={setTextBoxes}
           elements={elements}                     
          setElements={setElements}        
          canvasRef={canvasRef}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          onResizeStart={fn => (resizeStartRef.current = fn)}
        >
          {elements.map((el) =>
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
                              ? {
                                  ...it,
                                  content: (e.target as HTMLElement).innerText,
                                }
                              : it
                          )
                        )
                      }
                    >
                      {el.content || "Edit text"}
                    </div>
                  )}
                  {el.type === "image" && (
                    <div className="p-1 border-[1px] border-transparent">
                      <div className="relative inline-block">
                        {el.src ? (
                          <Image
                            src={el.src}
                            alt="uploaded"
                            width={el.width}
                            height={el.height}
                            className="object-cover portfolio-img-frame max-h-[400px]"
                            crossOrigin="anonymous"
                            onLoad={(e) =>
                              recordNaturalSize(
                                el.id,
                                (e.target as HTMLImageElement).naturalWidth,
                                (e.target as HTMLImageElement).naturalHeight
                              )
                            }
                          />
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full h-full p-1"
                            onPointerDown={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageSelect(el.id, file);
                            }}
                          />
                        )}
                        {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
                          <div
                            key={corner}
                              onPointerDown={(e) =>
                                    proxyResizeStart(e, { id: el.id, kind: "image" }, corner)
                                }
                            className={`resize-handle handle-${corner}`}
                          />
                        ))}
                      </div>
                      <button
                      className="rounded-md mt-5 lockbutton"
                      onPointerDown={(e) => e.stopPropagation()}   /* ⬅︎ PREVENT DRAG  */
                      onClick={(e) => {                            /* ⬅︎ ACTUAL DELETE */
                        e.stopPropagation();                       // safety for touch events
                        setElements((els) => els.filter((it) => it.id !== el.id));
                      }}
                  >
                    <Image
                      src="/assets/trash-can.svg"
                      alt={"globe"}
                      className="justify-center  "
                      width={14}
                      height={14}
                    />
                  </button>
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
                            it.id === el.id
                              ? { ...it, href: e.target.value }
                              : it
                          )
                        )
                      }
                    />
                  )}
             
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
                              ? {
                                  ...it,
                                  content: (e.target as HTMLElement).innerText,
                                }
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
                      <div className="relative inline-block">
                        {el.src ? (
                          <Image
                            src={el.src}
                            alt="uploaded"
                            width={el.width}
                            height={el.height}
                            className="object-cover portfolio-img-frame"
                            crossOrigin="anonymous"
                            onLoad={(e) =>
                              recordNaturalSize(
                                el.id,
                                (e.target as HTMLImageElement).naturalWidth,
                                (e.target as HTMLImageElement).naturalHeight
                              )
                            }
                          />
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full h-full"
                            onPointerDown={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageSelect(el.id, file);
                            }}
                          />
                        )}
                        {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
                          <div
                            key={corner}
                            onPointerDown={(e) =>
                              handleResizeStart(e, { id: el.id, kind: "image" }, corner)
                            }
                            className={`resize-handle handle-${corner}`}
                          />
                        ))}
                      </div>
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
                            it.id === el.id
                              ? { ...it, href: e.target.value }
                              : it
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
          )}
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
              onChange={(e) =>
                setLayout(e.target.value as "column" | "grid" | "free")
              }
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
