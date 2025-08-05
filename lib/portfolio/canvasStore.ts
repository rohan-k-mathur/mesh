import { produce, enableMapSet } from "immer";
import { ElementRecord } from "./types";

enableMapSet();

export interface CanvasState {
  elements: Map<string, ElementRecord>;
  past: Array<Map<string, ElementRecord>>;
  future: Array<Map<string, ElementRecord>>;
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
  | { type: "remove"; id: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "drag"; id: string; dx: number; dy: number }
  | {
      type: "resize";
      id: string;
      patch: Pick<ElementRecord, "x" | "y" | "width" | "height">;
    };

export const initialCanvasState: CanvasState = {
  elements: new Map(),
  past: [],
  future: [],
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
