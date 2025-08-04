import React, { useReducer, useCallback } from "react";
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

  React.useLayoutEffect(() => {
    listeners.current.forEach((fn) => fn());
  });

  const store = React.useMemo<Store>(
    () => ({
      getSnapshot: () => state,
      dispatch,
      subscribe,
    }),
    [state, dispatch, subscribe]
  );

  return <CanvasCtx.Provider value={store}>{children}</CanvasCtx.Provider>;
}

export function useElement(id: string): ElementRecord {
  const store = React.useContext(CanvasCtx)!;
  return React.useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().elements.get(id)!,
    () => store.getSnapshot().elements.get(id)!
  );
}

export function useCanvasDispatch() {
  return React.useContext(CanvasCtx)!.dispatch;
}
