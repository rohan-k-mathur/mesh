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
import { createFeedPost }     from "@/lib/actions/feedpost.actions";
import { feed_post_type }     from "@prisma/client";
import { Input } from "@/components/ui/input";
import { useCallback, useImperativeHandle, useLayoutEffect } from "react";
import styles from "./resize-handles.module.css"; // CSS module for handles
import {
  forwardRef,  
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isSafeYoutubeEmbed, isSafeHttpLink } from "@/lib/utils/validators";


type Element = BuilderElement;

/*  PUBLIC handle that PortfolioBuilder will call     */
export interface DroppableCanvasHandle {
  startResize(
    e: React.PointerEvent,
    target: ResizeTarget,
    corner: Corner
  ): void;
}
/* -------------------------------------------------- */
interface DroppableCanvasProps {
  /* same props you passed before, *minus* onResizeStart */
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
}



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

type ResizeTarget = { id: string; kind: "text" | "image" | "video" };
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
/* -------------------------------------------------- */


// function DroppableCanvas({
//   children,
//   layout,
//   color,
//   isBlank,
//   drawText,
//   boxes,
//   setBoxes,
//   elements,
//   setElements, 
//   canvasRef,
//   selectedId,
//   setSelectedId,
//   onResizeStart,
// }: {
//   children: React.ReactNode;
//   layout: "column" | "grid" | "free";
//   color: string;
//   isBlank: boolean;
//   drawText: boolean;
//   boxes: TextBox[];
//   elements: Element[];                              
//   setBoxes: React.Dispatch<React.SetStateAction<TextBox[]>>;
//   setElements: React.Dispatch<React.SetStateAction<Element[]>>; 
//   canvasRef: React.MutableRefObject<HTMLDivElement | null>;
//   selectedId: string | null;
//   setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
//   onResizeStart?: (
//     fn: (
//       e: React.PointerEvent,
//       target: ResizeTarget,
//       corner: Corner
//     ) => void
//   ) => void;
// }) {
//   const { setNodeRef } = useDroppable({ id: "canvas" });
//   const layoutClass =
//     layout === "free"
//       ? "flex flex-col-auto flex-1 flex-row-auto gap-auto w-auto h-auto"
//       : layout === "grid"
//       ? "grid grid-cols-2 gap-2"
//       : "flex flex-col gap-2";
//   /* NEW ---------- */
//   const [draft, setDraft] = useState<TextBox | null>(null);
//   // const [resizing, setResizing] = useState<ResizeState | null>(null);
//   // const [dragging, setDragging] = useState<DragState | null>(null);
//      const [resizing, _setResizing] = useState<ResizeState | null>(null);
//    const [dragging, _setDragging] = useState<DragState | null>(null);
//    const resizeRef = useRef<ResizeState | null>(null);
//    const dragRef   = useRef<DragState | null>(null);

//    const setResizing = (s: ResizeState | null) => {
//      resizeRef.current = s;
//      _setResizing(s);
//    };
//    const setDragging = (d: DragState | null) => {
//      dragRef.current = d;
//      _setDragging(d);
//    };

//   /* --------------- */
//   const ref = canvasRef;
//     useEffect(() => {
//         onResizeStart?.(handleResizeStart);
//      }, [onResizeStart]);



//   function startDraw(e: React.MouseEvent<HTMLDivElement>) {
//     if (!drawText || e.target !== ref.current) return;
//     setSelectedId(null);
//     const rect = ref.current!.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     setDraft({ id: "", x, y, width: 0, height: 0, text: "" });
//   }

//   function moveDraw(e: React.MouseEvent<HTMLDivElement>) {
//     if (!drawText || !draft) return;
//     const rect = ref.current!.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
//     setDraft((d) => (d ? { ...d, width: x - d.x, height: y - d.y } : null));
//   }

//   function endDraw() {
//     if (!drawText || !draft) return;
//     let { x, y, width, height } = draft;
//     if (Math.abs(width) < 5 || Math.abs(height) < 5) {
//       setDraft(null);
//       return;
//     }
//     if (width < 0) {
//       x += width;
//       width = Math.abs(width);
//     }
//     if (height < 0) {
//       y += height;
//       height = Math.abs(height);
//     }
//     setBoxes((bs) => [
//       ...bs,
//       {
//         id: nanoid(),
//         x,
//         y,
//         width,
//         height,
//         text: "",
//         fontSize: 14,
//         lineHeight: 1.2,
//       },
//     ]);
//     setDraft(null);
//   }
//   /* ---------- resize helpers ------------ */
//   const handleResizeStart = useCallback(
//     (e: React.PointerEvent, target: ResizeTarget, corner: Corner) => {
//       e.stopPropagation();
//       const rect = ref.current!.getBoundingClientRect();
//       const startX = e.clientX - rect.left;
//       const startY = e.clientY - rect.top;
//       const obj =
//         target.kind === "text"
//           ? boxes.find((b) => b.id === target.id)!
//           : elements.find((el) => el.id === target.id)!;

//       setResizing({
//         target,
//         corner,
//         startX,
//         startY,
//         startLeft: obj.x,
//         startTop: obj.y,
//         startWidth: obj.width,
//         startHeight: obj.height,
//       });
//     },
//     [boxes, elements]
//   );
//   function computeResize(
//     corner: Corner,
//     start: { left:number; top:number; width:number; height:number },
//     dx:number,
//     dy:number
//   ) {
//     switch (corner) {
//       case "se": /* … */ return …
//       case "sw": /* … */ return …
//       case "ne": /* … */ return …
//       case "nw": /* … */ return …
//     }
//     const _exhaustiveCheck: never = corner; // <- TypeScript protects us
//     return _exhaustiveCheck;
//   }

//   // expose through imperative handle – parent just calls .startResize()
//   useImperativeHandle(ref, () => ({ startResize: handleResizeStart }), [
//     handleResizeStart,
//   ]);
  
//   function handleBoxPointerDown(e: React.PointerEvent, b: TextBox) {
//     // Ignore if we’re clicking a resize handle – they call handleResizeStart.
//     if ((e.target as HTMLElement).classList.contains("resize-handle")) return;

//     // Ignore if user clicks inside the text editor (it stops propagation).
//     e.stopPropagation();

//     setSelectedId(b.id);

//     const rect = ref.current!.getBoundingClientRect();
//     setDragging({
//       id: b.id,
//       startX: e.clientX - rect.left,
//       startY: e.clientY - rect.top,
//       startLeft: b.x,
//       startTop: b.y,
//     });
//   }
//   useEffect(() => {
//     const esc = (e: KeyboardEvent) => e.key === "Escape" && setSelectedId(null);
//     window.addEventListener("keydown", esc);
//     return () => window.removeEventListener("keydown", esc);
//   }, []);

//   // /* attach / detach window listeners when resizing */
//   // useEffect(() => {
//   //   function onMove(ev: PointerEvent) {
//   //     if (!resizing) return;
//   //     const {
//   //       startX,
//   //       startY,
//   //       corner,
//   //       startLeft,
//   //       startTop,
//   //       startWidth,
//   //       startHeight,
//   //       target,
//   //     } = resizing;
//   //     const rect = ref.current!.getBoundingClientRect();
//   //     const x = ev.clientX - rect.left;
//   //     const y = ev.clientY - rect.top;
//   //     const dx = x - startX;
//   //     const dy = y - startY;

//   //     let left = startLeft;
//   //     let top = startTop;
//   //     let width = startWidth;
//   //     let height = startHeight;

//   //     switch (corner) {
//   //       case "se":
//   //         width = Math.max(20, startWidth + dx);
//   //         height = Math.max(20, startHeight + dy);
//   //         break;
//   //       case "sw":
//   //         width = Math.max(20, startWidth - dx);
//   //         height = Math.max(20, startHeight + dy);
//   //         left = startLeft + dx;
//   //         break;
//   //       case "ne":
//   //         width = Math.max(20, startWidth + dx);
//   //         height = Math.max(20, startHeight - dy);
//   //         top = startTop + dy;
//   //         break;
//   //       case "nw":
//   //         width = Math.max(20, startWidth - dx);
//   //         height = Math.max(20, startHeight - dy);
//   //         left = startLeft + dx;
//   //         top = startTop + dy;
//   //         break;
//   //     }

//   //     if (target.kind === "text") {
//   //       setBoxes((bs) =>
//   //         bs.map((b) =>
//   //           b.id === target.id ? { ...b, x: left, y: top, width, height } : b
//   //         )
//   //       );
//   //     } else {
//   //       setElements((es) =>
//   //         es.map((el) =>
//   //           el.id === target.id ? { ...el, x: left, y: top, width, height } : el
//   //         )
//   //       );
//   //     }
//   //   }
    




//   //      function onUp() {
//   //           setResizing(null);          // <- clear the mode
//   //         }
//   //       }

//   //         if (resizing) {
//   //                 window.addEventListener("pointermove", onMove);
//   //                 window.addEventListener("pointerup", onUp);
//   //                 return () => {
//   //                   window.removeEventListener("pointermove", onMove);
//   //                   window.removeEventListener("pointerup", onUp);
//   //                 };
//   //               }
//   // }, [resizing, setBoxes, setElements]);

// /** 1️⃣  global pointer listeners – mount once, on component mount */
// useEffect(() => {
//   /** Pointer move drives *both* resize and drag */
//   const onMove = (ev: PointerEvent) => {
//     const r = resizeRef.current;
//     if (r) updateResize(ev, r);   // <-- pure helper mutates state via setters

//     const d = dragRef.current;
//     if (d) updateDrag(ev, d);
//   };

//   /** Pointer up: finish whichever mode is active */
//   const onUp = () => {
//     resizeRef.current = null;
//     dragRef.current   = null;
//     _setResizing(null);  // tell React to re-render (cursor, selection, etc.)
//     _setDragging(null);
//   };

//   window.addEventListener("pointermove", onMove);
//   window.addEventListener("pointerup",   onUp);

//   /** cleanup once on unmount */
//   return () => {
//     window.removeEventListener("pointermove", onMove);
//     window.removeEventListener("pointerup",   onUp);
//   };
// }, []);   //  <-- empty deps array ⇒ runs exactly once

//   useEffect(() => {
//     function onMove(ev: PointerEvent) {
//       if (!dragging) return;
//       const rect = ref.current!.getBoundingClientRect();
//       const x = ev.clientX - rect.left;
//       const y = ev.clientY - rect.top;
//       const dx = x - dragging.startX;
//       const dy = y - dragging.startY;

//       setBoxes((bs) =>
//         bs.map((b) =>
//           b.id === dragging.id
//             ? { ...b, x: dragging.startLeft + dx, y: dragging.startTop + dy }
//             : b
//         )
//       );
//     }

//     function onUp() {
//       setDragging(null);
//     }

//     if (dragging) {
//       window.addEventListener("pointermove", onMove);
//       window.addEventListener("pointerup", onUp);
//       return () => {
//         window.removeEventListener("pointermove", onMove);
//         window.removeEventListener("pointerup", onUp);
//       };
//     }
//   }, [dragging, setBoxes]);

//   function updateResize(ev: PointerEvent, s: ResizeState) {
//     const { startX, startY, corner, startLeft, startTop,
//             startWidth, startHeight, target } = s;
  
//     const rect = canvasRef.current!.getBoundingClientRect();
//     const dx = ev.clientX - rect.left - startX;
//     const dy = ev.clientY - rect.top  - startY;
  
//     let left = startLeft;
//     let top  = startTop;
//     let w    = startWidth;
//     let h    = startHeight;
  
//     switch (corner) {
//       case "se": w = Math.max(20, startWidth  + dx);
//                  h = Math.max(20, startHeight + dy);      break;
//       case "sw": w = Math.max(20, startWidth  - dx);
//                  h = Math.max(20, startHeight + dy);
//                  left = startLeft + dx;                  break;
//       case "ne": w = Math.max(20, startWidth  + dx);
//                  h = Math.max(20, startHeight - dy);
//                  top  = startTop  + dy;                  break;
//       case "nw": w = Math.max(20, startWidth  - dx);
//                  h = Math.max(20, startHeight - dy);
//                  left = startLeft + dx;
//                  top  = startTop  + dy;                  break;
//     }
//     const _exhaustiveCheck: never = corner; // TS catches new corners
  
//     if (target.kind === "text") {
//       setBoxes(bs => bs.map(b =>
//         b.id === target.id ? { ...b, x: left, y: top, width: w, height: h } : b
//       ));
//     } else {
//       setElements(es => es.map(el =>
//         el.id === target.id ? { ...el, x: left, y: top, width: w, height: h } : el
//       ));
//     }
//   }
//   // inside the forwardRef component
// const startResize = useCallback(
//   (e: React.PointerEvent, target: ResizeTarget, corner: Corner) => {
//     // same math you had before, but instead of setResizing(...)
//     resizeRef.current = {
//       target, corner, startX, startY,
//       startLeft: obj.x, startTop: obj.y,
//       startWidth: obj.width, startHeight: obj.height,
//     };
//     _setResizing(resizeRef.current);   // update React for UI cues
//   },
//   [boxes, elements]
// );

// useImperativeHandle(ref, () => ({ startResize }), [startResize]);
//   function updateDrag(ev: PointerEvent, d: DragState) {
//     const rect = canvasRef.current!.getBoundingClientRect();
//     const dx = ev.clientX - rect.left - d.startX;
//     const dy = ev.clientY - rect.top  - d.startY;
  
//     setBoxes(bs => bs.map(b =>
//       b.id === d.id ? { ...b, x: d.startLeft + dx, y: d.startTop + dy } : b
//     ));
//   }

//   function updateText(id: string, text: string) {
//     setBoxes((bs) => bs.map((b) => (b.id === id ? { ...b, text } : b)));
//   }

//   function canvasMouseDown(e: React.MouseEvent<HTMLDivElement>) {
//     if (e.target === ref.current) {
//       setSelectedId(null);
//     }
//     if (drawText) startDraw(e);
//   }
//   const resizeStartRef = useRef<
//   (e: React.PointerEvent, t: ResizeTarget, c: Corner) => void
// >();
// // thin wrapper the JSX can call
// const proxyResizeStart = (
//   e: React.PointerEvent,
//   target: ResizeTarget,
//   corner: Corner
// ) => resizeStartRef.current?.(e, target, corner);

// function EditableBox({ box, onInput }: { box: TextBox; onInput: (t: string) => void }) {
//   /* 1️⃣  allocate the ref */
//   const textRef = useRef<HTMLDivElement | null>(null);

//   /* 2️⃣  keep DOM text in sync *after* React paint */
//   useLayoutEffect(() => {
//     if (textRef.current && textRef.current.innerText !== box.text) {
//       textRef.current.innerText = box.text;
//     }
//   }, [box.text]);

//   /* 3️⃣  JSX — note it’s a plain <div>, *not* <HTMLDivElement> */
//   return (
//     <div
//       ref={textRef}                     // ✅ attach ref
//       contentEditable
//       suppressContentEditableWarning
//       className="w-full h-full px-3 py-2"
//       style={{
//         fontSize: box.fontSize,
//         lineHeight: box.lineHeight,
//         letterSpacing: box.letterSpacing,
//         fontFamily: box.fontFamily,
//         fontWeight: box.fontWeight,
//         fontStyle: box.italic ? "italic" : undefined,
//         whiteSpace: "pre-wrap",
//         cursor: "text",
//       }}
//       onPointerDown={(e) => e.stopPropagation()}
//       onInput={(e) => onInput((e.target as HTMLElement).innerText)}
//     />
//   );
// }

//   return (
//     <div
//       ref={(node) => {
//         setNodeRef(node);
//         ref.current = node;
//       }}
//       className={`relative flex-1 min-h-screen border border-dashed p-4 ${color} ${layoutClass} grid-background`}
//       style={{
//         cursor: drawText ? (draft ? "crosshair" : "crosshair") : "default",
//       }}
//       onMouseDown={canvasMouseDown}
//       onMouseMove={drawText ? moveDraw : undefined}
//       onMouseUp={drawText ? endDraw : undefined}
//     >
//       {children}
//       {boxes.map((box) => (
//         <div
//           key={box.id}
//           onPointerDown={(e) => handleBoxPointerDown(e, box)}
//           style={{
//             left: box.x,
//             top: box.y,
//             width: box.width,
//             height: box.height,
//           }}
//           className="absolute border-2 border-r-4 border-l-4 border-r-solid border-l-solid custom-scrollbar border-dashed border-gray-400 bg-white text-xs outline-none overflow-hidden cursor-move 
//  justify-center"
//         >
//           {/* corner handles */}
//           {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
//         <div
//           key={corner}
//           onPointerDown={(e) =>
//             handleResizeStart(e, { id: box.id, kind: "text" }, corner)
//           }
//           className={`resize-handle handle-${corner}`}
//         />
//       ))}
// <button
//      className="absolute bottom-1 right-1 p-[2px] rounded
//                 bg-white/80 hover:bg-red-500/90"
//      onClick={(e) => {
//        e.stopPropagation();          // don’t start a drag
//        setBoxes((bs) => bs.filter((b) => b.id !== box.id));
//      }}
//    >
//      <Image src="/assets/trash-can.svg" alt="delete" width={14} height={14} />
//    </button>
//           {/* editable text area */}
//           <div
//             onPointerDown={(e) => e.stopPropagation()} 
//            EditableBox
//             contentEditable
//             onFocus={() => setSelectedId(box.id)}
//             suppressContentEditableWarning
//             className="w-full h-full px-3 py-2"
//             style={{
//               cursor: "text",
//               fontSize: box.fontSize,
//               lineHeight: box.lineHeight,
//               letterSpacing: box.letterSpacing,
//               fontFamily: box.fontFamily,
//               fontWeight: box.fontWeight,
//               fontStyle: box.italic ? "italic" : undefined,
//               whiteSpace: "pre-wrap",
//             }}
//             onInput={(e) =>
//               updateText(box.id, (e.target as HTMLElement).innerText)
//             }
//           >
//             {/* {box.text} */}
//           </div>
//         </div>
//       ))}

     
//       {draft && (
//         <div
//           style={{
//             left: draft.width < 0 ? draft.x + draft.width : draft.x,
//             top: draft.height < 0 ? draft.y + draft.height : draft.y,
//             width: Math.abs(draft.width),
//             height: Math.abs(draft.height),
//           }}
//           className="absolute border border-dashed border-gray-400 bg-white/50 pointer-events-none"
//         />
//       )}
//     </div>
//   );
// }

const DroppableCanvas = forwardRef<DroppableCanvasHandle, DroppableCanvasProps>(
  (
    {
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
    },
    ref
  ) => {
    /* ---------- state & refs ---------- */
    const [draft, setDraft] = useState<TextBox | null>(null);
    const [_, _setResizing] = useState<ResizeState | null>(null);
    const [__, _setDragging] = useState<DragState | null>(null);
    const resizeRef = useRef<ResizeState | null>(null);
    const dragRef   = useRef<DragState | null>(null);

    const setResizing = (s: ResizeState | null) => {
      resizeRef.current = s;
      _setResizing(s);
    };
    const setDragging = (d: DragState | null) => {
      dragRef.current = d;
      _setDragging(d);
    };

    /* ---------- draw new text‑box ---------- */
 // inside the forwardRef body
const startDraw = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!drawText || e.target !== canvasRef.current) return;
  setSelectedId(null);
  const rect = canvasRef.current!.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  setDraft({ id: "", x, y, width: 0, height: 0, text: "" });
};

const moveDraw = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!drawText || !draft) return;
  const rect = canvasRef.current!.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  setDraft(d => d ? { ...d, width: x - d.x, height: y - d.y } : null);
};

const endDraw = () => {
  if (!drawText || !draft) return;
  let { x, y, width, height } = draft;
  if (Math.abs(width) < 5 || Math.abs(height) < 5) {
    setDraft(null);
    return;
  }
  if (width < 0) { x += width; width = -width; }
  if (height < 0){ y += height; height = -height; }
  setBoxes(bs => [
    ...bs,
    { id: nanoid(), x, y, width, height, text: "", fontSize: 14, lineHeight: 1.2 }
  ]);
  setDraft(null);
};
function computeResize(corner: Corner, start: Dim, dx: number, dy: number) {
  switch (corner) {
    case "se": return { w: start.width + dx,  h: start.height + dy,  l: start.left,          t: start.top          };
    case "sw": return { w: start.width - dx,  h: start.height + dy,  l: start.left + dx,     t: start.top          };
    case "ne": return { w: start.width + dx,  h: start.height - dy,  l: start.left,          t: start.top + dy     };
    case "nw": return { w: start.width - dx,  h: start.height - dy,  l: start.left + dx,     t: start.top + dy     };
    default:   return start;                // satisfies TS exhaustiveness
  }
}
const handleBoxPointerDown = (e: React.PointerEvent, box: TextBox) => {
  if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
  e.stopPropagation();
  setSelectedId(box.id);
  const rect = canvasRef.current!.getBoundingClientRect();
  setDragging({
    id: box.id,
    startX: e.clientX - rect.left,
    startY: e.clientY - rect.top,
    startLeft: box.x,
    startTop: box.y,
  });
};


    /* imperative handle exposed to parent */
    useImperativeHandle(ref, () => ({ startResize: handleResizeStart }), [
      handleResizeStart,
    ]);

    /* ---------- update routines used by global listener ---------- */
    const updateResize = (ev: PointerEvent, s: ResizeState) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const dx = ev.clientX - rect.left - s.startX;
      const dy = ev.clientY - rect.top  - s.startY;

      /* compute position/size */
      let { left, top, width: w, height: h } = (() => {
        switch (s.corner) {
          case "se": return { left: s.startLeft,           top: s.startTop,
                              width: Math.max(20, s.startWidth  + dx),
                              height: Math.max(20, s.startHeight + dy) };
          case "sw": return { left: s.startLeft + dx,      top: s.startTop,
                              width: Math.max(20, s.startWidth  - dx),
                              height: Math.max(20, s.startHeight + dy) };
          case "ne": return { left: s.startLeft,           top: s.startTop + dy,
                              width: Math.max(20, s.startWidth  + dx),
                              height: Math.max(20, s.startHeight - dy) };
          case "nw": return { left: s.startLeft + dx,      top: s.startTop + dy,
                              width: Math.max(20, s.startWidth  - dx),
                              height: Math.max(20, s.startHeight - dy) };
        }
      })();

      if (s.target.kind === "text") {
        setBoxes(bs => bs.map(b =>
          b.id === s.target.id ? { ...b, x: left, y: top, width: w, height: h } : b
        ));
      } else {
        setElements(es => es.map(el =>
          el.id === s.target.id ? { ...el, x: left, y: top, width: w, height: h } : el
        ));
      }
    };
    

    const updateDrag = (ev: PointerEvent, d: DragState) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const dx = ev.clientX - rect.left - d.startX;
      const dy = ev.clientY - rect.top  - d.startY;
      setBoxes(bs => bs.map(b =>
        b.id === d.id ? { ...b, x: d.startLeft + dx, y: d.startTop + dy } : b
      ));
    };

    /* ---------- global pointer listeners (mount once) ---------- */
    useEffect(() => {
      const onMove = (ev: PointerEvent) => {
        if (resizeRef.current) updateResize(ev, resizeRef.current);
        if (dragRef.current)   updateDrag(ev,   dragRef.current);
      };
      const onUp = () => {
        resizeRef.current = null;
        dragRef.current   = null;
        _setResizing(null);
        _setDragging(null);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup",   onUp);
      return () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup",   onUp);
      };
    }, []);

    /* ---------- JSX ---------- */
    const layoutClass =
      layout === "free"
        ? "flex flex-col grow gap-2"
        : layout === "grid"
        ? "grid grid-cols-2 gap-2"
        : "flex flex-col gap-2";

    return (
      <div
        ref={(node) => {
          canvasRef.current = node;
        }}
        className={`relative flex-1 min-h-screen border border-dashed p-4 ${color} ${layoutClass}`}
        style={{ cursor: drawText ? "crosshair" : "default" }}
        onMouseDown={(e) => {
          if (e.target === canvasRef.current) setSelectedId(null);
          if (drawText) startDraw(e);
        }}
        onMouseMove={drawText ? moveDraw : undefined}
        onMouseUp={drawText ? endDraw : undefined}
      >
        {children}

        {/* --- render text boxes --- */}
        {boxes.map((box) => (
          <div
            key={box.id}
            style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
            className="absolute border-2 border-dashed border-gray-400 bg-white cursor-move"
            onPointerDown={(e) => {
              if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
              e.stopPropagation();
              const rect = canvasRef.current!.getBoundingClientRect();
              setDragging({
                id: box.id,
                startX: e.clientX - rect.left,
                startY: e.clientY - rect.top,
                startLeft: box.x,
                startTop: box.y,
              });
              setSelectedId(box.id);
            }}
          >
            {/* resize handles */}
            {(["nw", "ne", "sw", "se"] as Corner[]).map((c) => (
              <div
                key={c}
                className={`${styles[`handle-${c}`]}`}
                onPointerDown={(e) =>
                  handleResizeStart(e, { id: box.id, kind: "text" }, c)
                }
              />
            ))}

            {/* editable text */}
            <EditableBox
              box={box}
              onInput={(t) => setBoxes(bs =>
                bs.map(b => (b.id === box.id ? { ...b, text: t } : b))
              )}
            />
          </div>
        ))}

        {/* selection draft rectangle */}
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
);
DroppableCanvas.displayName = "DroppableCanvas";

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
  ) => {
    canvasHandle.current?.startResize(e, target, corner);
  };

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
                width:
                  active.id === "image"
                    ? 300
                    : active.id === "video"
                    ? 480
                    : 200,
                height:
                  active.id === "image"
                    ? 300
                    : active.id === "video"
                    ? 270
                    : 32,
              }
            : {
                id: nanoid(),
                type: active.id as Element["type"],
                content: "",
                src: "",
                width:
                  active.id === "image"
                    ? 200
                    : active.id === "video"
                    ? 480
                    : 200,
                height:
                  active.id === "image"
                    ? 200
                    : active.id === "video"
                    ? 270
                    : 32,
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

   
    await createFeedPost({
        caption: "",                     // or derive from textBoxes/elements
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

          <DraggableItem id="video" fromSidebar>
            Video
            <Image
              src="/assets/video.svg"
              alt={"video"}
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
ref={canvasHandle} // ✅ new
layout={layout}
color={color}
isBlank={template === ""}
drawText={drawText}
boxes={textBoxes}
elements={elements}
setBoxes={setTextBoxes}
setElements={setElements}
canvasRef={canvasRef}
selectedId={selectedId}
setSelectedId={setSelectedId}
/>
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
                            onPointerDown={e => startResize(e, { id: el.id,  kind: 'image' }, corner)}

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
                  {el.type === "video" && (
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
                            setElements((els) =>
                              els.map((it) =>
                                it.id === el.id ? { ...it, src: e.target.value } : it
                              )
                            )
                          }
                        />
                      )}
                      {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
                        <div
                          key={corner}
                          onPointerDown={(e) =>
                            proxyResizeStart(e, { id: el.id, kind: "video" }, corner)
                          }
                          className={`resize-handle handle-${corner}`}
                        />
                      ))}
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
                            onPointerDown={e => startResize(e, { id: box.id, kind: 'text' }, corner)}
                            className={`resize-handle handle-${corner}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {el.type === "video" && (
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
                          className="w-full h-full"
                          onPointerDown={(e) => e.stopPropagation()}
                           onChange={(e) => {
                               const v = e.target.value.trim();
                               if (!isSafeYoutubeEmbed(v)) return;   // silently ignore invalid
                               setElements(...);
                             }}
                        />
                      )}
                      {(["nw", "ne", "sw", "se"] as Corner[]).map((corner) => (
                        <div
                          key={corner}
                          onPointerDown={(e) =>
                            handleResizeStart(e, { id: el.id, kind: "video" }, corner)
                          }
                          className={`resize-handle handle-${corner}`}
                        />
                      ))}
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
                      /* link input */
onChange={(e) => {
  const v = e.target.value.trim();
  if (!isSafeHttpLink(v)) return;
  setElements(…);
}}
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
