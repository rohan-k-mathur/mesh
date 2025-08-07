import { produce, enableMapSet } from "immer";
import { ElementRecord } from "./types";

enableMapSet();

export interface CanvasState {
  elements: Map<string, ElementRecord>;
  selected: Set<string>;
  past: Array<Map<string, ElementRecord>>;
  future: Array<Map<string, ElementRecord>>;
  layout?: "grid" | "column" | "free";
  color?: string;
  schemaVersion?: number;
  _dragStart?: Map<string, ElementRecord>;
}

const HISTORY_LIMIT = 100;

function cloneElements(
  elements: Map<string, ElementRecord>,
): Map<string, ElementRecord> {
  return new Map([...elements].map(([k, v]) => [k, { ...v }]));
}

function pushHistory(draft: CanvasState) {
  draft.past.push(cloneElements(draft.elements));
  if (draft.past.length > HISTORY_LIMIT) draft.past.shift();
  draft.future = [];
}

export type CanvasAction =
  | { type: "add"; element: ElementRecord }
  | { type: "patch"; id: string; patch: Partial<ElementRecord> }
  | { type: "replace"; elements: ElementRecord[] }
  | { type: "reorder"; order: string[] }
  | { type: "remove"; id: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "drag"; id: string; dx: number; dy: number }
  | {
      type: "resize";
      id: string;
      patch: Pick<ElementRecord, "x" | "y" | "width" | "height">;
    }
  | { type: "selectOne"; id: string }
  | { type: "toggleSelect"; id: string }
  | { type: "clearSelect" }
  | { type: "setLayout"; layout: "grid" | "column" | "free" }
  | { type: "setColor"; color: string }
  | { type: "groupDragStart" }
  | { type: "groupDrag"; dx: number; dy: number }
  | { type: "groupDragEnd"; dx: number; dy: number };

export const initialCanvasState: CanvasState = {
  elements: new Map(),
  selected: new Set(),
  past: [],
  future: [],
  layout: "free",
  color: "bg-white",
};

export const canvasReducer = produce(
  (draft: CanvasState, action: CanvasAction) => {
    switch (action.type) {
      case "add": {
        pushHistory(draft);
        draft.elements.set(action.element.id, action.element);
        break;
      }
      case "patch": {
        pushHistory(draft);
        const el = draft.elements.get(action.id);
        if (el) Object.assign(el, action.patch);
        break;
      }
      case "replace": {
        pushHistory(draft);
        draft.elements = new Map(
          action.elements.map((el) => [el.id, { ...el }]),
        );
        draft.selected = new Set();
        break;
      }
      case "reorder": {
        pushHistory(draft);
        const newMap = new Map<string, ElementRecord>();
        action.order.forEach((id) => {
          const el = draft.elements.get(id);
          if (el) newMap.set(id, el);
        });
        draft.elements = newMap;
        break;
      }
      case "setLayout": {
        draft.layout = action.layout;
        break;
      }
      case "setColor": {
        draft.color = action.color;
        break;
      }
      case "drag": {
        pushHistory(draft);
        const el = draft.elements.get(action.id);
        if (el) {
          el.x += action.dx;
          el.y += action.dy;
        }
        break;
      }
      case "resize": {
        pushHistory(draft);
        const el = draft.elements.get(action.id);
        if (el) Object.assign(el, action.patch);
        break;
      }
      case "remove": {
        pushHistory(draft);
        draft.elements.delete(action.id);
        draft.selected.delete(action.id);
        break;
      }
      case "selectOne": {
        draft.selected = new Set([action.id]);
        break;
      }
      case "toggleSelect": {
        const next = new Set(draft.selected);
        if (next.has(action.id)) next.delete(action.id);
        else next.add(action.id);
        draft.selected = next;
        break;
      }
      case "clearSelect": {
        draft.selected = new Set();
        break;
      }
      case "groupDragStart": {
        draft._dragStart = cloneElements(draft.elements);
        break;
      }
      case "groupDrag": {
        draft.selected.forEach((id) => {
          const el = draft.elements.get(id);
          if (el) {
            el.x += action.dx;
            el.y += action.dy;
          }
        });
        break;
      }
      case "groupDragEnd": {
        if ((action.dx !== 0 || action.dy !== 0) && draft._dragStart) {
          draft.past.push(draft._dragStart);
          if (draft.past.length > HISTORY_LIMIT) draft.past.shift();
          draft.future = [];
        }
        draft._dragStart = undefined;
        break;
      }
      case "undo": {
        if (!draft.past.length) break;
        draft.future.unshift(cloneElements(draft.elements));
        draft.elements = draft.past.pop()!;
        break;
      }
      case "redo": {
        if (!draft.future.length) break;
        draft.past.push(cloneElements(draft.elements));
        if (draft.past.length > HISTORY_LIMIT) draft.past.shift();
        draft.elements = draft.future.shift()!;
        break;
      }
    }
  }
);
