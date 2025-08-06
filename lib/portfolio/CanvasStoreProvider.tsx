import React, { useReducer, useCallback, useLayoutEffect } from "react";
import {
  canvasReducer,
  initialCanvasState,
  CanvasState,
  CanvasAction,
} from "./canvasStore";
import { ElementRecord } from "./types";

interface Store {
  getSnapshot(): CanvasState;
  dispatch(action: CanvasAction): void;
  subscribe(listener: () => void): () => void;
}

const CanvasCtx = React.createContext<Store | null>(null);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialCanvasState);
  const listeners = React.useRef(new Set<() => void>());

  const subscribe = useCallback((fn: () => void) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  const store = React.useRef<Store>({
    getSnapshot: () => initialCanvasState,
    dispatch: () => {},
    subscribe: () => () => {},
  }).current;

  store.dispatch = dispatch;
  store.getSnapshot = () => state;
  store.subscribe = subscribe;

  useLayoutEffect(() => {
    listeners.current.forEach((fn) => fn());
  }, [state]);

  return <CanvasCtx.Provider value={store}>{children}</CanvasCtx.Provider>;
}

function useStore(): Store {
  const store = React.useContext(CanvasCtx);
  if (!store)
    throw new Error("Canvas context missing. Wrap components with CanvasProvider.");
  return store;
}

export function useElement(id: string): ElementRecord {
  const store = useStore();
  return React.useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().elements.get(id)!,
    () => store.getSnapshot().elements.get(id)!,
  );
}

export function useCanvasDispatch() {
  return useStore().dispatch;
}

export function useCanvasSelection(): string[] {
  const store = useStore();
  return React.useSyncExternalStore(
    store.subscribe,
    () => Array.from(store.getSnapshot().selected),
    () => Array.from(store.getSnapshot().selected),
  );
}

export function useCanvasElements(): Map<string, ElementRecord> {
  const store = useStore();
  return React.useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().elements,
    () => store.getSnapshot().elements,
  );
}
