/* eslint-disable react/jsx-key */
"use client";
import "../../globals.css";

import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  useCallback,
  useLayoutEffect,
  useMemo,
  forwardRef,
} from "react";
import { ResizeHandle } from "./ResizeHandle";
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
import { uploadFileToSupabase } from "@/lib/utils";
import { PortfolioExportData } from "@/lib/portfolio/export";
import { templates } from "@/lib/portfolio/templates";
import Image from "next/image";
import { createFeedPost } from "@/lib/actions/feed.actions";
import { feed_post_type } from "@prisma/client";
import { Input } from "@/components/ui/input";
import styles from "./resize-handles.module.css"; // CSS module for handles
import { TextBoxRecord, ElementRecord } from "@/lib/portfolio/types";
import {
  CanvasProvider,
  useCanvasDispatch,
  useCanvasSelection,
  useCanvasUndo,
  useCanvasRedo,
  useCanvasElements,
} from "@/lib/portfolio/CanvasStoreProvider";
import type { UniqueIdentifier } from "@dnd-kit/core";
import { serialize, jsonToCanvasState } from "@/lib/portfolio/export";
import type { CanvasState } from "@/lib/portfolio/canvasStore";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isSafeYoutubeEmbed, isSafeHttpLink } from "@/lib/utils/validators";
import { getBoundingRect } from "@/lib/portfolio/selection";

type Corner = "nw" | "ne" | "sw" | "se";
type ResizeTarget = { id: string; kind: "text" | "image" | "video" | "link" };

type DrawMode = null | "text" | "image" | "video" | "link";

// px – change whenever you want
// const snap = (v: number) => Math.round(v / gridSize) * gridSize;

function mkElement(
  type: "image" | "video" | "link",
  pos: { x: number; y: number; width: number; height: number }
): ElementRecord {
  return {
    id: nanoid(),
    kind: type,
    content: "",
    src: "",
    ...pos,
  };
}
function fitIntoBox(boxW: number, boxH: number, natW: number, natH: number) {
  const scale = Math.min(boxW / natW, boxH / natH);
  return { width: Math.round(natW * scale), height: Math.round(natH * scale) };
}

function debounce<F extends (...args: any[]) => void>(fn: F, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
/* ---------- DroppableCanvas ---------- */
export interface DroppableCanvasHandle {
  startResize(
    e: React.PointerEvent,
    target: ResizeTarget,
    corner: Corner
  ): void;
}

interface DroppableCanvasProps {
  children: React.ReactNode;
  layout: "column" | "grid" | "free";
  color: string;
  drawMode: DrawMode;
  showGrid: boolean;
  gridSize: number;
  setDrawMode: React.Dispatch<React.SetStateAction<DrawMode>>;
  canvasRef: React.MutableRefObject<HTMLDivElement | null>;
  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
}
/* ---------- preview component ---------- */
interface PreviewProps {
  id: string;
  elements: ElementRecord[];
}

function CanvasItem({
  id,
  x,
  y,
  w,
  h,
  children,
}: {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  const dispatch = useCanvasDispatch();
  const mergedListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta) dispatch({ type: "toggleSelect", id });
      else dispatch({ type: "selectOne", id });
      // invoke the original pointerDown so the drag still starts
      (listeners as any).onPointerDown?.(e);
    },
  };
  const style: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    width: w,
    height: h,
    zIndex: 1,
  };
  // const handlePointerDown = (e: React.PointerEvent) => {
  const handleSelectCapture = (e: React.PointerEvent) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta) dispatch({ type: "toggleSelect", id });
    else dispatch({ type: "selectOne", id });
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...mergedListeners}
      {...attributes}
      // onPointerDown={handlePointerDown}
      onPointerDownCapture={handleSelectCapture}
      className="cursor-move"
    >
      {children}
    </div>
  );
}

function SortableCanvasItem({
  id,
  w,
  h,
  children,
}: {
  id: string;
  w: number;
  h: number;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const dispatch = useCanvasDispatch();
  const mergedListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta) dispatch({ type: "toggleSelect", id });
      else dispatch({ type: "selectOne", id });
      // invoke the original pointerDown so the drag still starts
      (listeners as any).onPointerDown?.(e);
    },
  };
  const style = {
    width: w,
    height: h,
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...mergedListeners}
      {...attributes}
      className="cursor-move"
    >
      {children}
    </div>
  );
}

/* ---------- EditableBox helper ---------- */
function EditableBox({
  box,
  onInput,
  onSelect,
}: {
  box: TextBoxRecord;
  onInput: (t: string) => void;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current && ref.current.innerText !== box.content) {
      ref.current.innerText = box.content;
    }
  }, [box.content]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className="w-full h-full px-3 py-2"
      style={{
        fontSize: box.fontSize,
        lineHeight: box.lineHeight,
        letterSpacing: box.letterSpacing,
        fontFamily: box.fontFamily,
        fontWeight: box.fontWeight,
        fontStyle: box.italic ? "italic" : undefined,
        whiteSpace: "pre-wrap",
        cursor: "text",
      }}
      onPointerDown={(e) => {
        onSelect();
        e.stopPropagation();
      }}
      onInput={(e) => onInput((e.target as HTMLElement).innerText)}
    />
  );
}

// type ResizeTarget = { id: string; kind: "text" | "image" | "video" };
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
  box: TextBoxRecord;
  onChange: (patch: Partial<TextBoxRecord>) => void;
}) {
  return (
    <div className="flex flex-col space-y-3 mt-6 ">
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

 /* ---------- Rulers (top   left) ---------- */
 function Rulers({
     containerRef,
     gridSize,
   }: {
     containerRef: React.MutableRefObject<HTMLDivElement | null>;
     gridSize: number;
   }) {
     const [size, setSize] = useState({ w: 0, h: 0 });
     useEffect(() => {
       const el = containerRef.current;
       if (!el) return;
       const ro = new ResizeObserver((entries) => {
         for (const e of entries) {
           const cr = e.contentRect;
           setSize({ w: Math.floor(cr.width), h: Math.floor(cr.height) });
         }
       });
       ro.observe(el);
       return () => ro.disconnect();
     }, [containerRef]);
   
     const labelsX: number[] = [];
     const labelsY: number[] = [];
     for (let x = 0; x <= size.w; x += 100) labelsX.push(x);
     for (let y = 0; y <= size.h; y += 100) labelsY.push(y);
   
     const minor = gridSize;
     const major = gridSize * 5;
   
     return (
       <>
         {/* top ruler */}
         <div
           style={{
             position: "absolute",
             left: 0,
             right: 0,
             top: 0,
             height: 24,
             backgroundColor: "#f8fafc",
             pointerEvents: "none",
             borderBottom: "1px solid rgba(0,0,0,.1)",
             backgroundImage: `
               repeating-linear-gradient(to right, rgba(0,0,0,.15) 0, rgba(0,0,0,.15) 1px, transparent 1px, transparent ${minor}px),
               repeating-linear-gradient(to right, rgba(0,0,0,.30) 0, rgba(0,0,0,.30) 1px, transparent 1px, transparent ${major}px)
             `,
           }}
         />
         {/* left ruler */}
         <div
           style={{
             position: "absolute",
             left: 0,
             top: 0,
             bottom: 0,
             width: 24,
             backgroundColor: "#f8fafc",
             pointerEvents: "none",
             borderRight: "1px solid rgba(0,0,0,.1)",
             backgroundImage: `
               repeating-linear-gradient(to bottom, rgba(0,0,0,.15) 0, rgba(0,0,0,.15) 1px, transparent 1px, transparent ${minor}px),
               repeating-linear-gradient(to bottom, rgba(0,0,0,.30) 0, rgba(0,0,0,.30) 1px, transparent 1px, transparent ${major}px)
             `,
           }}
         />
         {/* top-left square */}
         <div
           style={{
             position: "absolute",
             left: 0,
             top: 0,
             width: 24,
             height: 24,
             backgroundColor: "#f8fafc",
             borderRight: "1px solid rgba(0,0,0,.1)",
             borderBottom: "1px solid rgba(0,0,0,.1)",
             pointerEvents: "none",
           }}
         />
         {/* numeric labels */}
         {labelsX.map((x) => (
           <div
             key={`tx-${x}`}
             style={{
               position: "absolute",
               left: x + 2,
               top: 0,
               height: 24,
               lineHeight: "24px",
               fontSize: 10,
               color: "rgba(0,0,0,.6)",
               transform: "translateX(0px)",
               pointerEvents: "none",
             }}
           >
             {x}
           </div>
         ))}
         {labelsY.map((y) => (
           <div
             key={`ty-${y}`}
             style={{
               position: "absolute",
               left: 0,
               top: y - 6,
               width: 24,
               textAlign: "right",
               fontSize: 10,
               color: "rgba(0,0,0,.6)",
               paddingRight: 2,
               pointerEvents: "none",
             }}
           >
             {y}
           </div>
         ))}
       </>
     );
   }
 /* ---------- Contextual toolbar over selection ---------- */
 function ContextToolbar({
     rect,
     element,
     onBold,
     onItalic,
     onDelete,
   }: {
     rect: { left: number; top: number; width: number; height: number };
     element: ElementRecord;
     onBold?: () => void;
     onItalic?: () => void;
     onDelete: () => void;
   }) {
     const centerX = rect.left +  rect.width / 2;
     const topY = Math.max(0, rect.top - 40);
     return (
       <div
         style={{
           position: "absolute",
           left: centerX,
           top: topY,
           transform: "translate(-50%,-4px)",
           zIndex: 20,
           pointerEvents: "auto",
         }}
         className="rounded-md border bg-white shadow-md px-2 py-1 flex items-center gap-2"
      >
         {element.kind === "text" && (
           <>
             <button className="px-1 border rounded text-sm" onClick={onBold} title="Bold">
               <b>B</b>
             </button>
             <button className="px-1 border rounded text-sm" onClick={onItalic} title="Italic">
               <i>I</i>
             </button>
           </>
         )}
         <button
           className="px-1 border rounded text-sm"
           onClick={onDelete}
           title="Delete"
           aria-label="Delete"
         >
           🗑
         </button>
       </div>
     );
   }
  

const DroppableCanvas = forwardRef<DroppableCanvasHandle, DroppableCanvasProps>(
  (
    {
      children,
      layout,
      color,
      drawMode,
      setDrawMode,
      showGrid,
      gridSize,
      canvasRef,
      selectedId,
      setSelectedId,
    },
    ref
  ) => {
    /* --- local state --- */
    const [draft, setDraft] = useState<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>(null);
    const [resizingState, setResizingState] = useState<ResizeState | null>(
      null
    );
    const [draggingState, setDraggingState] = useState<DragState | null>(null);
  
    const snap = useCallback(
      (v: number) => Math.round(v / gridSize) * gridSize,
      [gridSize]
    );
    const resizeRef = useRef<ResizeState | null>(null);
    const dragRef = useRef<DragState | null>(null);
    const { setNodeRef } = useDroppable({ id: "canvas" });
    const dispatch = useCanvasDispatch();
    const selection = useCanvasSelection();
    const elementsMap = useCanvasElements();
    const elements = useMemo(
      () => Array.from(elementsMap.values()),
      [elementsMap]
    );
    const boxes = useMemo(
      () =>
        elements.filter((e): e is TextBoxRecord => (e as any).kind === "text"),
      [elements]
    );
    
    const selectionBox = React.useMemo(() => {
      if (selection.length <= 1) return null;
      const map = new Map(
        elements.map((e) => [
          e.id,
          {
            x: e.x || 0,
            y: e.y || 0,
            width: e.width || 0,
            height: e.height || 0,
          },
        ])
      );
      return getBoundingRect(selection, map);
    }, [selection, elements]);
    const singleSelected: ElementRecord | null = React.useMemo(() => {
            if (selection.length !== 1) return null;
            const id = selection[0];
            return elements.find((e) => e.id === id) ?? null;
          }, [selection, elements]);
    //  const setResizing = (s: ResizeState | null) => {
    //   resizeRef.current = s;
    //   _setResizing(s);
    // };
    // const setDragging = (d: DragState | null) => {
    //   dragRef.current = d;
    //   _setDragging(d);
    // };

    

    /* --- imperative resize entry point (exposed to parent) --- */
    const handleResizeStart = useCallback(
      (e: React.PointerEvent, target: ResizeTarget, corner: Corner) => {
        e.stopPropagation();
        const rect = canvasRef.current!.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        const obj =
          target.kind === "text"
            ? boxes.find((b) => b.id === target.id)!
            : elements.find((el) => el.id === target.id)!;

        const payload: ResizeState = {
          target,
          corner,
          startX,
          startY,
          startLeft: obj.x,
          startTop: obj.y,
          startWidth: obj.width,
          startHeight: obj.height,
        };
        resizeRef.current = payload;
        setResizingState(payload);
      },
      [boxes, elements, canvasRef]
    );

    useImperativeHandle(ref, () => ({ startResize: handleResizeStart }), [
      handleResizeStart,
    ]);

    const handleBoxPointerDown = (
      e: React.PointerEvent,
      box: TextBoxRecord
    ) => {
      if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
      e.stopPropagation();
      setSelectedId(box.id);
      const rect = canvasRef.current!.getBoundingClientRect();
      const payload: DragState = {
        id: box.id,
        startX: e.clientX - rect.left,
        startY: e.clientY - rect.top,
        startLeft: box.x,
        startTop: box.y,
      };
      dragRef.current = payload;
      setDraggingState(payload);
    };

    /* --- pointer‑move / pointer‑up (global once) --- */
    useEffect(() => {
      const onMove = (ev: PointerEvent) => {
        const r = resizeRef.current,
          d = dragRef.current;
        if (r) {
          const rect = canvasRef.current!.getBoundingClientRect();
          const dx = snap(ev.clientX - rect.left) - r.startX;
          const dy = snap(ev.clientY - rect.top) - r.startY;
          const calc = (c: Corner, dx: number, dy: number) => {
            switch (c) {
              case "se":
                return {
                  l: r.startLeft,
                  t: r.startTop,
                  w: r.startWidth + dx,
                  h: r.startHeight + dy,
                };
              case "sw":
                return {
                  l: r.startLeft + dx,
                  t: r.startTop,
                  w: r.startWidth - dx,
                  h: r.startHeight + dy,
                };
              case "ne":
                return {
                  l: r.startLeft,
                  t: r.startTop + dy,
                  w: r.startWidth + dx,
                  h: r.startHeight - dy,
                };
              case "nw":
                return {
                  l: r.startLeft + dx,
                  t: r.startTop + dy,
                  w: r.startWidth - dx,
                  h: r.startHeight - dy,
                };
            }
          };
          const { l, t, w, h } = calc(r.corner, dx, dy);
          dispatch({
            type: "patch",
            id: r.target.id,
            patch: { x: l, y: t, width: w, height: h },
          });
        }
        if (d) {
          const rect = canvasRef.current!.getBoundingClientRect();

          const pointerX = ev.clientX - rect.left;
          const pointerY = ev.clientY - rect.top;

          const newLeft = snap(d.startLeft + pointerX - d.startX);
          const newTop = snap(d.startTop + pointerY - d.startY);

          dispatch({
            type: "patch",
            id: d.id,
            patch: { x: newLeft, y: newTop },
          });

          // const dx = snap(ev.clientX - rect.left) - d.startX;
          // const dy = snap(ev.clientY - rect.top)  - d.startY;
          // setBoxes((bs) =>
          //   bs.map((b) =>
          //     b.id === d.id
          //       ? { ...b, x: d.startLeft + dx, y: d.startTop + dy }
          //       : b
          //   )
          // );
        }
      };
      const onUp = () => {
        resizeRef.current = null;
        dragRef.current = null;
        setResizingState(null);
        setDraggingState(null);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    }, [canvasRef, dispatch]);

    /* ---------- draw new element ---------- */
    const isDrawing = drawMode !== null;

    const startDraw = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawing || e.target !== canvasRef.current) return;
      setSelectedId(null);
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = snap(e.clientX - rect.left);
      const y = snap(e.clientY - rect.top);
      setDraft({ x, y, width: 0, height: 0 });
    };

    const moveDraw = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDrawing || !draft) return;
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDraft((d) =>
        d ? { ...d, width: snap(x) - d.x, height: snap(y) - d.y } : null
      );
    };

    const endDraw = () => {
      if (!isDrawing || !draft) return;
      let { x, y, width, height } = draft;
      if (Math.abs(width) < 5 || Math.abs(height) < 5) {
        setDraft(null);
        setDrawMode(null);
        return;
      }
      if (width < 0) {
        x += width;
        width = -width;
      }
      if (height < 0) {
        y += height;
        height = -height;
      }
      const id = nanoid();
      switch (drawMode) {
        case "text":
          dispatch({
            type: "add",
            element: {
              id,
              x,
              y,
              width,
              height,
              kind: "text",
              content: "",
              fontSize: 14,
              lineHeight: 1.2,
            },
          });
          setSelectedId(id);
          break;
        case "image":
          dispatch({
            type: "add",
            element: mkElement("image", { x, y, width, height }),
          });
          break;
        case "video":
          dispatch({
            type: "add",
            element: mkElement("video", { x, y, width, height }),
          });
          break;
        case "link":
          dispatch({
            type: "add",
            element: mkElement("link", { x, y, width, height }),
          });
          break;
      }
      setDraft(null);
      setDrawMode(null);
    };

    /* --- JSX --- */
    const layoutClass =
      layout === "free"
        ? "flex flex-col grow gap-2"
        : layout === "grid"
        ? "grid grid-cols-2 gap-2"
        : "flex flex-col gap-2";

    return (
      <div
        ref={(node) => {
          setNodeRef(node);
          canvasRef.current = node;
        }}
        className={`relative flex-1 min-h-screen border border-dashed p-4 ${color} ${layoutClass}`}
        style={{
          cursor: isDrawing ? "crosshair" : "default",
          ...(showGrid && {
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,.06) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }),
        }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) dispatch({ type: "clearSelect" });
        }}
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
      >
        {children}

        

        {draft && (
          <div
            style={{
              left: draft.width < 0 ? draft.x + draft.width : draft.x,
              top: draft.height < 0 ? draft.y + draft.height : draft.y,
              width: Math.abs(draft.width),
              height: Math.abs(draft.height),
            }}
            className="absolute border border-dashed border-gray-400
               bg-white/50 pointer-events-none"
          />
        )}
        {selectionBox && (
          <div
            className="absolute border-2 border-blue-500/50"
            style={{
              left: selectionBox.left,
              top: selectionBox.top,
              width: selectionBox.width,
              height: selectionBox.height,
              pointerEvents: "none",
            }}
          />
        )}
        {singleSelected && (
           <ContextToolbar
             rect={
               selection.length > 1
                 ? (selectionBox as any)
                 : { left: singleSelected.x || 0, top: singleSelected.y || 0, width: singleSelected.width || 0, height: singleSelected.height || 0 }
             }
             element={singleSelected}
             onBold={
               singleSelected.kind === "text"
                 ? () =>
                     dispatch({
                       type: "patch",
                       id: singleSelected.id,
                       patch: {
                         fontWeight: (singleSelected as any).fontWeight === 700 ? 400 : 700,
                       },
                     })
                 : undefined
             }
             onItalic={
               singleSelected.kind === "text"
                 ? () =>
                     dispatch({
                       type: "patch",
                       id: singleSelected.id,
                       patch: { italic: !(singleSelected as any).italic },
                     })
                 : undefined
             }
             onDelete={() => dispatch({ type: "remove", id: singleSelected.id })}
           />
         )}
                <Rulers containerRef={canvasRef} gridSize={gridSize} />
      </div>
    );
  }
);
DroppableCanvas.displayName = "DroppableCanvas";

// function computeResize(corner: Corner, start: Dim, dx: number, dy: number) {
//   switch (corner) {
//     case "se": return { w: start.width + dx,  h: start.height + dy,  l: start.left,          t: start.top          };
//     case "sw": return { w: start.width - dx,  h: start.height + dy,  l: start.left + dx,     t: start.top          };
//     case "ne": return { w: start.width + dx,  h: start.height - dy,  l: start.left,          t: start.top + dy     };
//     case "nw": return { w: start.width - dx,  h: start.height - dy,  l: start.left + dx,     t: start.top + dy     };
//     default:   return start;                // satisfies TS exhaustiveness
//   }
// }
// const handleBoxPointerDown = (e: React.PointerEvent, box: TextBoxRecord) => {
//   if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
//   e.stopPropagation();
//   setSelectedId(box.id);
//   const rect = canvasRef.current!.getBoundingClientRect();
//   setDragging({
//     id: box.id,
//     startX: e.clientX - rect.left,
//     startY: e.clientY - rect.top,
//     startLeft: box.x,
//     startTop: box.y,
//   });
// };

//     /* imperative handle exposed to parent */
//     useImperativeHandle(ref, () => ({ startResize: handleResizeStart }), [
//       handleResizeStart,
//     ]);

//     /* ---------- update routines used by global listener ---------- */
//     const updateResize = (ev: PointerEvent, s: ResizeState) => {
//       const rect = canvasRef.current!.getBoundingClientRect();
//       const dx = ev.clientX - rect.left - s.startX;
//       const dy = ev.clientY - rect.top  - s.startY;

//       /* compute position/size */
//       let { left, top, width: w, height: h } = (() => {
//         switch (s.corner) {
//           case "se": return { left: s.startLeft,           top: s.startTop,
//                               width: Math.max(20, s.startWidth  + dx),
//                               height: Math.max(20, s.startHeight + dy) };
//           case "sw": return { left: s.startLeft + dx,      top: s.startTop,
//                               width: Math.max(20, s.startWidth  - dx),
//                               height: Math.max(20, s.startHeight + dy) };
//           case "ne": return { left: s.startLeft,           top: s.startTop + dy,
//                               width: Math.max(20, s.startWidth  + dx),
//                               height: Math.max(20, s.startHeight - dy) };
//           case "nw": return { left: s.startLeft + dx,      top: s.startTop + dy,
//                               width: Math.max(20, s.startWidth  - dx),
//                               height: Math.max(20, s.startHeight - dy) };
//         }
//       })();

//       if (s.target.kind === "text") {
//         setBoxes(bs => bs.map(b =>
//           b.id === s.target.id ? { ...b, x: left, y: top, width: w, height: h } : b
//         ));
//       } else {
//         setElements(es => es.map(el =>
//           el.id === s.target.id ? { ...el, x: left, y: top, width: w, height: h } : el
//         ));
//       }
//     };

//     const updateDrag = (ev: PointerEvent, d: DragState) => {
//       const rect = canvasRef.current!.getBoundingClientRect();
//       const dx = ev.clientX - rect.left - d.startX;
//       const dy = ev.clientY - rect.top  - d.startY;
//       setBoxes(bs => bs.map(b =>
//         b.id === d.id ? { ...b, x: d.startLeft + dx, y: d.startTop + dy } : b
//       ));
//     };

//     /* ---------- global pointer listeners (mount once) ---------- */
//     useEffect(() => {
//       const onMove = (ev: PointerEvent) => {
//         if (resizeRef.current) updateResize(ev, resizeRef.current);
//         if (dragRef.current)   updateDrag(ev,   dragRef.current);
//       };
//       const onUp = () => {
//         resizeRef.current = null;
//         dragRef.current   = null;
//         _setResizing(null);
//         _setDragging(null);
//       };
//       window.addEventListener("pointermove", onMove);
//       window.addEventListener("pointerup",   onUp);
//       return () => {
//         window.removeEventListener("pointermove", onMove);
//         window.removeEventListener("pointerup",   onUp);
//       };
//     }, []);

//     /* ---------- JSX ---------- */
//     const layoutClass =
//       layout === "free"
//         ? "flex flex-col grow gap-2"
//         : layout === "grid"
//         ? "grid grid-cols-2 gap-2"
//         : "flex flex-col gap-2";

//     return (
//       <div
//         ref={(node) => {
//           canvasRef.current = node;
//         }}
//         className={`relative flex-1 min-h-screen border border-dashed p-4 ${color} ${layoutClass}`}
//         style={{ cursor: isDrawing ? "crosshair" : "default" }}
//         onMouseDown={(e) => {
//           if (e.target === canvasRef.current) setSelectedId(null);
//           if (isDrawing) startDraw(e);
//         }}
//         onMouseMove={isDrawing ? moveDraw : undefined}
//         onMouseUp={isDrawing ? endDraw : undefined}
//       >
//         {children}

//         {/* --- render text boxes --- */}
//         {boxes.map((box) => (
//           <div
//             key={box.id}
//             style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
//             className="absolute border-2 border-dashed border-gray-400 bg-white cursor-move"
//             onPointerDown={(e) => {
//               if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
//               e.stopPropagation();
//               const rect = canvasRef.current!.getBoundingClientRect();
//               setDragging({
//                 id: box.id,
//                 startX: e.clientX - rect.left,
//                 startY: e.clientY - rect.top,
//                 startLeft: box.x,
//                 startTop: box.y,
//               });
//               setSelectedId(box.id);
//             }}
//           >
//             {/* resize handles */}
//             {(["nw", "ne", "sw", "se"] as Corner[]).map((c) => (
//               <div
//                 key={c}
//                 className={`${styles[`handle-${c}`]}`}
//                 onPointerDown={(e) =>
//                   handleResizeStart(e, { id: box.id, kind: "text" }, c)
//                 }
//               />
//             ))}

//             {/* editable text */}
//             <EditableBox
//               box={box}
//               onInput={(t) => setBoxes(bs =>
//                 bs.map(b => (b.id === box.id ? { ...b, text: t } : b))
//               )}
//             />
//           </div>
//         ))}

//         {/* selection draft rectangle */}
//         {draft && (
//           <div
//             style={{
//               left: draft.width < 0 ? draft.x + draft.width : draft.x,
//               top: draft.height < 0 ? draft.y + draft.height : draft.y,
//               width: Math.abs(draft.width),
//               height: Math.abs(draft.height),
//             }}
//             className="absolute border border-dashed border-gray-400 bg-white/50 pointer-events-none"
//           />
//         )}
//       </div>
//     );
//   }
// );
// DroppableCanvas.displayName = "DroppableCanvas";

function PortfolioBuilderInner({
  initialLayout = "free",
  initialColor = "bg-white",
}: {
  initialLayout?: "column" | "grid" | "free";
  initialColor?: string;
}) {
  //return <h1 style={{color:'red'}}>If you can see this, the file is routed correctly</h1>;
  const [showGrid, setShowGrid] = useState(true); // ← NEW

  const canvasRef = useRef<HTMLDivElement>(null);
  const [color, setColor] = useState(initialColor);
  const [layout, setLayout] = useState<"column" | "grid" | "free">(
    initialLayout
  );
  const [template, setTemplate] = useState<string>("");
  const [drawMode, setDrawMode] = useState<DrawMode>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [gridSize, setGridSize] = useState(30);

  const dispatch = useCanvasDispatch();
  const selection = useCanvasSelection();
  const undo = useCanvasUndo();
  const redo = useCanvasRedo();
  const elementsMap = useCanvasElements();
  const elements = useMemo(
    () => Array.from(elementsMap.values()),
    [elementsMap]
  );
  const textBoxes = useMemo(
    () => elements.filter((e): e is TextBoxRecord => e.kind === "text"),
    [elements]
  );
  const lastDrag = useRef({ x: 0, y: 0 });
  const snap = useCallback(
    (v: number) => Math.round(v / gridSize) * gridSize,
    [gridSize]
  );
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,[contenteditable]"))
        return;
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);
  // const handleResizeStart = (
  //   e: React.PointerEvent,
  //   target: ResizeTarget,
  //   corner: Corner
  // ) => {
  //   handleResizeStart.current?.(e, target, corner); // delegate
  // };
  const proxyResizeStart = (
    e: React.PointerEvent,
    target: ResizeTarget,
    corner: Corner
  ) => canvasHandle.current?.startResize(e, target, corner);

  // /* --- inside PortfolioBuilder --- */
  // const resizeStartRef = useRef<
  //   (e: React.PointerEvent, t: ResizeTarget, c: Corner) => void
  // >();

  // thin wrapper the JSX can call
  // const proxyResizeStart = (
  //   e: React.PointerEvent,
  //   target: ResizeTarget,
  //   corner: Corner
  // ) => resizeStartRef.current?.(e, target, corner);

  // Keep a ref so DroppableCanvas gives us its real implementation
  // const canvasHandleResizeStart = useRef<
  //   (e: React.PointerEvent, target: ResizeTarget, corner: Corner) => void
  // >(null);
  const canvasHandle = useRef<DroppableCanvasHandle>(null);

  const startResize = (
    e: React.PointerEvent,
    target: ResizeTarget,
    corner: Corner
  ) => canvasHandle.current?.startResize(e, target, corner);
  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    if (!selection.includes(id)) dispatch({ type: "selectOne", id });
    dispatch({ type: "groupDragStart" });
    lastDrag.current = { x: 0, y: 0 };
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { delta, active } = event;
 // snap movement to grid by comparing snapped cumulative deltas
     const prevSnapX = Math.round(lastDrag.current.x / gridSize) * gridSize;
     const prevSnapY = Math.round(lastDrag.current.y / gridSize) * gridSize;
     const currSnapX = Math.round(delta.x / gridSize) * gridSize;
     const currSnapY = Math.round(delta.y / gridSize) * gridSize;
     const dx = currSnapX - prevSnapX;
     const dy = currSnapY - prevSnapY;

    lastDrag.current = { x: delta.x, y: delta.y };
    dispatch({ type: "groupDrag", dx, dy });
  };

  function handleDragEnd(event: DragEndEvent) {
    const { over, active } = event;
    dispatch({
      type: "groupDragEnd",
      dx: lastDrag.current.x,
      dy: lastDrag.current.y,
    });
    lastDrag.current = { x: 0, y: 0 };
    if (template !== "" && over && active.id !== over.id) {
      const ids = elements.map((e) => e.id);
      const oldIndex = ids.findIndex((id) => id === active.id);
      const newIndex = ids.findIndex((id) => id === over.id);
      const newOrder = arrayMove(ids, oldIndex, newIndex);
      dispatch({ type: "reorder", order: newOrder });
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
    // const fit = fitIntoBox(el.width, el.height, w, h);

    if (!res.error) {
      dispatch({
        type: "patch",
        id,
        patch: { src: res.fileURL, natW: w, natH: h },
      });
    }
  }

  function recordNaturalSize(id: string, w: number, h: number) {
    dispatch({ type: "patch", id, patch: { natW: w, natH: h } });
  }
  function buildAbsoluteExport() {
    // 1️⃣  From drag‑dropped template elements
    const absoluteElems = elements.map((e) => ({
      id: e.id,
      type: e.kind,
      x: e.x ?? 0,
      y: e.y ?? 0,
      natW: e.natW,
      natH: e.natH,
      width: e.width,
      height: e.height,
      content: (e as any).content,
      src: (e as any).src,
      href: (e as any).href,
    }));

    // 2️⃣  From text boxes we drew
    const absoluteText = textBoxes.map((b) => ({
      id: b.id,
      type: "text",
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      content: b.content,
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
      .filter((e) => e.kind === "text" && (e as any).content)
      .map((e) => (e as any).content)
      .join("\n");
    const textFromBoxes = textBoxes.map((b) => b.content).join("\n");
    const text = [textFromElements, textFromBoxes].filter(Boolean).join("\n");
    const images = elements
      .filter((e) => e.kind === "image" && (e as any).src)
      .map((e) => (e as any).src as string);
    const links = elements
      .filter((e) => e.kind === "link" && (e as any).href)
      .map((e) => (e as any).href as string);
    return { text, images, links, layout, color };
  }
  async function handlePublish() {
    const payload = {
      ...serialize(),
      absolutes: buildAbsoluteExport(),
    };
    setShowGrid(false); // hide grid for snapshot/export

    /* 2) POST to the export route – it now returns the PNG */
    const res = await fetch("/api/portfolio/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("export failed");

    const { url, snapshot } = await res.json();

    await createFeedPost({
      caption: "", // or derive from textBoxes/elements
      imageUrl: snapshot ?? undefined, // thumbnail in the feed
      portfolio: { pageUrl: url, snapshot },
      type: feed_post_type.PORTFOLIO,
    });

    router.push(url); // open the live page for the author
  }

  function applyTemplate(name: string) {
    const tpl = templates.find((t) => t.name === name);
    if (!tpl) return;
    setTemplate(name);
    setLayout(tpl.layout);
    setColor(tpl.color);
    dispatch({ type: "setLayout", layout: tpl.layout });
    dispatch({ type: "setColor", color: tpl.color });
    dispatch({
      type: "replace",
      elements: tpl.elements.map((e) => ({
        id: nanoid(),
        kind: e.type,
        x: 0,
        y: 0,
        width: e.type === "image" ? 200 : 200,
        height: e.type === "image" ? 200 : 32,
        content: e.content,
        src: e.src,
        href: e.href,
      })),
    });
  }
  const sensors = useSensors(useSensor(PointerSensor));

  const handleStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    handleDragStart(event);
  };
  const handleMoveWrapper = (event: DragMoveEvent) => {
    handleDragMove(event);
  };
  const handleEnd = (event: DragEndEvent) => {
    handleDragEnd(event);
    setActiveId(null);
  };
  const selectedEl = elementsMap.get(selectedId ?? "");
  const isTextBox = selectedEl && selectedEl.kind === "text";
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleStart}
      onDragMove={handleMoveWrapper}
      onDragEnd={handleEnd}
      collisionDetection={pointerWithin}
    >
      {/* <DragOverlay zIndex={1000}>
          {activeId ? (
            <PreviewOfItem id={activeId} elements={elements} />
          ) : null}
        </DragOverlay> */}
      <div className="flex h-screen">
        <div className=" flex-grow-0 flex-shrink-0 border-r py-2 px-4 space-y-4  mt-12">
          <div className="flex flex-col gap-2 w-fit">
          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`text-[.9rem] lockbutton
            flex gap-2 w-full justify-start px-4 py-2 rounded-md l
             lockbutton tracking-wide
            ${
              showGrid ? "bg-slate-200" : "bg-white"
            }`}
          >
            {showGrid ? "Hide Grid" : "Show Grid"}
          </button>
          <label className="flex flex-col flex-1 justify-center items-center border-[1px] shadow-md shadow-black
           rounded-md w-fit bg-white text-center mt-2 py-1 ">
            Grid&nbsp;Size
            <input
              type="number"
              min={5}
              step={5}
              width={5}
              className="flex flex-1  mt-1 border justify-center items-center bg-slate-200 px-2 py-1 text-center"
              value={gridSize}
              onChange={(e) => setGridSize(Math.max(5, +e.target.value))}
            />
          </label>
          </div>
          <button
            className={` flex gap-2 w-full justify-start px-4 py-2 rounded-md l
             lockbutton tracking-wide ${
               drawMode === "text"
                 ? "bg-slate-300 cursor-crosshair"
                 : "bg-white"
             }`}
            onClick={() => setDrawMode((d) => (d === "text" ? null : "text"))}
            aria-label="Add text box"
          >
            {drawMode === "text" ? "Text Box" : "Text Box"}
            <Image
              src="/assets/text--creation.svg"
              alt={"text"}
              className="p-0 flex-grow-0 flex-shrink-0"
              width={24}
              height={24}
            />
          </button>

          <button
            className={` flex gap-2 w-full justify-start px-4 py-2 rounded-md l
             lockbutton tracking-wide ${
               drawMode === "image"
                 ? "bg-slate-300 cursor-crosshair"
                 : "bg-white"
             }`}
            onClick={() => setDrawMode((d) => (d === "image" ? null : "image"))}
            aria-label="Add image"
          >
            Image
            <Image
              src="/assets/image.svg"
              alt={"image"}
              className="p-0 flex-grow-0 flex-shrink-0"
              width={24}
              height={24}
            />
          </button>

          <button
            className={` flex gap-2 w-full justify-start px-4 py-2 rounded-md l
             lockbutton tracking-wide ${
               drawMode === "video"
                 ? "bg-slate-300 cursor-crosshair"
                 : "bg-white"
             }`}
            onClick={() => setDrawMode((d) => (d === "video" ? null : "video"))}
            aria-label="Add video"
          >
            Video
            <Image
              src="/assets/video--add.svg"
              alt={"video"}
              className="p-0 flex-grow-0 flex-shrink-0"
              width={24}
              height={24}
            />
          </button>

          <button
            className={` flex gap-2 w-full justify-start px-4 py-2 rounded-md l
             lockbutton tracking-wide ${
               drawMode === "link"
                 ? "bg-slate-300 cursor-crosshair"
                 : "bg-white"
             }`}
            onClick={() => setDrawMode((d) => (d === "link" ? null : "link"))}
            aria-label="Add link"
          >
            Link
            <Image
              src="/assets/link.svg"
              alt={"globe"}
              className="mr-2"
              width={24}
              height={24}
            />
          </button>
          {isTextBox && (
            <StylePanel
              box={selectedEl as TextBoxRecord}
              onChange={(patch) =>
                dispatch({ type: "patch", id: selectedId!, patch })
              }
            />
          )}
        </div>

        {/* ---------- canvas ---------- */}
        <DroppableCanvas
          ref={canvasHandle}
          layout={layout}
          color={color}
          drawMode={drawMode}
          setDrawMode={setDrawMode}
          showGrid={showGrid}
          gridSize={gridSize}
          canvasRef={canvasRef}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        >
          {elements.map((el) =>
            template === "" ? (
              <CanvasItem
                key={el.id}
                id={el.id}
                x={el.x}
                y={el.y}
                w={el.width}
                h={el.height}
              >
                {/* <div className="py-8 px-8 border-[1px] rounded-none border-black savebutton bg-white space-y-2"> */}
                <div
                  className="relative border-2 border-dashed
                border-gray-500/60 bg-white box-border "
                  style={{ width: el.width, height: el.height }}
                >
                  {el.kind === "text" && (
                    <>
                      <EditableBox
                        box={el as TextBoxRecord}
                        onSelect={() =>
                          dispatch({ type: "selectOne", id: el.id })
                        }
                        onInput={(content) =>
                          dispatch({
                            type: "patch",
                            id: el.id,
                            patch: { content },
                          })
                        }
                      />
                       <button
                         className="absolute top-1 right-1 rounded-md lockbutton"
                         onPointerDown={(e) => e.stopPropagation()}
                         onClick={(e) => {
                           e.stopPropagation();
                           dispatch({ type: "remove", id: el.id });
                         }}
                         aria-label="Delete"
                         title="Delete"
                       >
                         <Image src="/assets/trash-can.svg" alt="" width={14} height={14} />
                      </button>

                      {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                        <ResizeHandle
                          key={corner}
                          corner={corner}
                          onPointerDown={(ev) =>
                            startResize(ev, { id: el.id, kind: "text" }, corner)
                          }
                        />
                      ))}
                    </>
                  )}

                  {el.kind === "image" && (
                    <div
                      style={{
                        width: el.width,
                        height: el.height,
                        boxSizing: "border-box", // ← keeps border inside the rectangle
                      }}
                      className=" border-2 border-dashed border-gray-500/60 bg-white w-full "
                      // onPointerDown={(e) => handleDragEnd(e, el)}
                    >
                      <div className=" w-full h-full ">
                        {el.src ? (
                          <Image
                            src={el.src}
                            alt="uploaded"
                            width={400}
                            height={400}
                            draggable={false}
                            className="object-contain items-center justify-center w-full h-full"
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
                          <label className="flex flex-1 items-center justify-center  h-fit bg-slate-200  cursor-pointer">
                            <input
                              type="file"
                              draggable={false}
                              accept="image/*"
                              className="relative flex flex-1 justify-center items-center shadow-md w-full h-full rounded-xl p-3"
                              onPointerDown={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageSelect(el.id, file);
                              }}
                            />
                            {/* <span className="text-xs text-gray-600">Choose file</span> */}
                          </label>
                        )}
                        {/* {(["nw", "ne", "sw", "se"] as Corner[]).map(
                          (corner) => (
                            <div
                              key={corner}
                              onPointerDown={(e) =>
                                startResize(
                                  e,
                                  { id: el.id, kind: "image" },
                                  corner
                                )
                              }
                              className={`${styles.handle} ${styles[`handle-${corner}`]}`}

                              // className={`resize-handle rounded-full bg-black handle-${corner}`}
                            />
                          )
                        )} */}
                        {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                          <ResizeHandle
                            key={corner}
                            corner={corner}
                            onPointerDown={(ev) =>
                              startResize(
                                ev,
                                { id: el.id, kind: "image" },
                                corner
                              )
                            }
                          />
                        ))}
                      </div>
                      <button
                        className="flex flex-col rounded-md mt-2 ml-5 lockbutton "
                        onPointerDown={(e) =>
                          e.stopPropagation()
                        } /* ⬅︎ PREVENT DRAG  */
                        onClick={(e) => {
                          /* ⬅︎ ACTUAL DELETE */
                          e.stopPropagation(); // safety for touch events
                          dispatch({ type: "remove", id: el.id });
                        }}
                        aria-label="Delete"
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
                  {el.kind === "video" && (
                    <div className="p-1 border border-transparent">
                      {el.src ? (
                        <iframe
                          src={el.src}
                          width={el.width}
                          height={el.height}
                          className="pointer-events-none"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                      ) : (
                        <input
                          placeholder="https://www.youtube.com/embed/…"
                          className="w-full h-full p-1"
                          onPointerDown={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            dispatch({
                              type: "patch",
                              id: el.id,
                              patch: { src: e.target.value },
                            })
                          }
                        />
                      )}
                      {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
                        <div
                          key={corner}
                          onPointerDown={(e) =>
                            proxyResizeStart(
                              e,
                              { id: el.id, kind: "video" },
                              corner
                            )
                          }
                          className={`resize-handle handle-${corner}`}
                        />
                      ))}
                    </div>
                  )}
                  {el.kind === "box" && (
                    <div className="w-20 h-20 border bg-gray-200" />
                  )}
                  {el.kind === "link" && (
                    <input
                      className="border p-1 text-sm"
                      placeholder="https://example.com"
                      value={el.href || ""}
                      onPointerDown={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        dispatch({
                          type: "patch",
                          id: el.id,
                          patch: { href: e.target.value },
                        })
                      }
                    />
                  )}
                </div>
              </CanvasItem>
            ) : (
              <SortableCanvasItem
                key={el.id}
                id={el.id}
                w={el.width}
                h={el.height}
              >
                <div className="p-2 border bg-white space-y-2">
                  {el.kind === "text" && (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="text-block outline-none"
                      onPointerDown={(e) => e.stopPropagation()}
                      onInput={(e) =>
                        dispatch({
                          type: "patch",
                          id: el.id,
                          patch: {
                            content: (e.target as HTMLElement).innerText,
                          },
                        })
                      }
                    >
                      {el.content || "Edit text"}
                    </div>
                  )}
                  {el.kind === "image" && (
                    <div>
                      <div className="relative inline-block">
                        {el.src ? (
                          <Image
                            src={el.src}
                            alt="uploaded"
                            width={el.width}
                            height={el.height}
                            draggable={false}
                            className="object-contain "
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
                        {(["nw", "ne", "sw", "se"] as Corner[]).map(
                          (corner) => (
                            <div
                              key={corner}
                              onPointerDown={(e) =>
                                startResize(
                                  e,
                                  { id: box.id, kind: "text" },
                                  corner
                                )
                              }
                              className={`resize-handle handle-${corner}`}
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}
                  {el.kind === "video" && (
                    <div className="p-1 border border-transparent">
                      {el.src ? (
                        <iframe
                          src={el.src}
                          width={el.width}
                          height={el.height}
                          className="pointer-events-none"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                      ) : (
                        <input
                          placeholder="https://www.youtube.com/embed/..."
                          className="w-full h-full"
                          onPointerDown={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const url = e.target.value.trim();
                            if (!isSafeYoutubeEmbed(url)) return; // ignore invalid input

                            // `el` is already in scope (we're inside elements.map(render))
                            dispatch({
                              type: "patch",
                              id: el.id,
                              patch: { src: url },
                            });
                          }}
                        />
                      )}
                      {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
                        <div
                          key={corner}
                          onPointerDown={(e) =>
                            proxyResizeStart(
                              e,
                              { id: el.id, kind: "video" },
                              corner
                            )
                          }
                          className={`resize-handle handle-${corner}`}
                        />
                      ))}
                    </div>
                  )}
                  {el.kind === "box" && (
                    <div className="w-20 h-20 border bg-gray-200" />
                  )}
                  {el.kind === "link" && (
                    <input
                      className="border p-1 text-sm"
                      placeholder="https://example.com"
                      value={el.href || ""}
                      onPointerDown={(e) => e.stopPropagation()}
                      /* link input */
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        if (!isSafeHttpLink(v)) return; // bail out on invalid link

                        dispatch({
                          type: "patch",
                          id: el.id,
                          patch: { href: v },
                        });
                      }}
                    />
                  )}
                  <button
                    className="text-xs text-red-500"
                    onClick={() => dispatch({ type: "remove", id: el.id })}
                    aria-label="Delete"
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
              onChange={(e) => {
                setColor(e.target.value);
                dispatch({ type: "setColor", color: e.target.value });
              }}
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
              onChange={(e) => {
                const v = e.target.value as "column" | "grid" | "free";
                setLayout(v);
                dispatch({ type: "setLayout", layout: v });
              }}
            >
              <option value="free">Free</option>

              <option value="column">Column</option>
              <option value="grid">Grid</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={undo} title="Undo (⌘Z)" aria-label="Undo">
              <Image src="/assets/undo.svg" width={20} height={20} alt="" />
            </button>
            <button onClick={redo} title="Redo (⇧⌘Z)" aria-label="Redo">
              <Image src="/assets/redo.svg" width={20} height={20} alt="" />
            </button>
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
export default function PortfolioBuilder() {
  const projectId = "draft";
  const projectKey = `pbuilder:${projectId}`;

  // keep autosave as-is
  const saveDraft = useRef(
    debounce((s: CanvasState) => {
      try { localStorage.setItem(projectKey, serialize(s)); } catch {}
    }, 800)
  ).current;

  // undefined = not loaded yet; null = loaded but no draft
  const [initial, setInitial] = useState<CanvasState | null | undefined>(undefined);

  useEffect(() => {
    try {
      const json = localStorage.getItem(projectKey);
      if (json) {
        const obj = JSON.parse(json);
        setInitial(jsonToCanvasState(obj, projectKey));
      } else {
        setInitial(null);
      }
    } catch {
      setInitial(null);
    }
  }, [projectKey]);

  // Render an SSR-safe placeholder so server & first client paint match
  if (initial === undefined) {
    return <div className="flex h-screen" />; // or a small skeleton
  }

  const initialLayout = initial?.layout ?? "free";
  const initialColor  = initial?.color  ?? "bg-white";

  return (
    <CanvasProvider initial={initial} onChange={saveDraft}>
      <PortfolioBuilderInner
        initialLayout={initialLayout}
        initialColor={initialColor}
      />
    </CanvasProvider>
  );
}


function PreviewOfItem({ id, elements }: PreviewProps) {
  const el = elements.find((e) => e.id === id);

  if (!el) return null; // shouldn't happen

  switch (el.kind) {
    case "text":
      return (
        <div
          className="px-3 py-2 rounded border bg-white shadow-lg"
          style={{ fontSize: 12, lineHeight: 1 }}
        >
          {el.content}
        </div>
      );

    case "image":
      return (
        <Image
          src={el.src}
          alt=""
          className="shadow-xl justify-center w-full h-full"
          style={{
            width: el.width,
            height: el.height,
            objectFit: "contain",
            border: "2px solid #4b9eff",
          }}
          width={el.width || 0}
          height={el.height || 0}
          draggable={false}
        />
      );

    case "video":
      return (
        <div
          style={{
            width: el.width,
            height: el.height,
            background: "#000",
            display: "grid",
            placeItems: "center",
            color: "white",
          }}
        >
          🎥
        </div>
      );

    default:
      return null;
  }
}
