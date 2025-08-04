import { produce } from "immer";
import { ElementRecord } from "./types";

export interface CanvasState {
  elements: Map<string, ElementRecord>;
  past: Array<Map<string, ElementRecord>>;
  future: Array<Map<string, ElementRecord>>;
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
        draft.past.push(new Map(draft.elements));
        draft.future = [];
        draft.elements.set(action.element.id, action.element);
        break;
      }
      case "patch": {
        draft.past.push(new Map(draft.elements));
        draft.future = [];
        const el = draft.elements.get(action.id);
        if (el) Object.assign(el, action.patch);
        break;
      }
      case "drag": {
        draft.past.push(new Map(draft.elements));
        draft.future = [];
        const el = draft.elements.get(action.id);
        if (el) {
          el.x += action.dx;
          el.y += action.dy;
        }
        break;
      }
      case "resize": {
        draft.past.push(new Map(draft.elements));
        draft.future = [];
        const el = draft.elements.get(action.id);
        if (el) Object.assign(el, action.patch);
        break;
      }
      case "remove": {
        draft.past.push(new Map(draft.elements));
        draft.future = [];
        draft.elements.delete(action.id);
        break;
      }
      case "undo": {
        if (!draft.past.length) break;
        draft.future.unshift(new Map(draft.elements));
        draft.elements = draft.past.pop()!;
        break;
      }
      case "redo": {
        if (!draft.future.length) break;
        draft.past.push(new Map(draft.elements));
        draft.elements = draft.future.shift()!;
        break;
      }
    }
  }
);
