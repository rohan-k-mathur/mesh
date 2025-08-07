import React, {
  useReducer,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
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

export function CanvasProvider({
  children,
  initial,
  onChange,
}: {
  children: React.ReactNode;
  initial?: CanvasState | null;
  onChange?: (s: CanvasState) => void;
}) {
  const [state, dispatch] = useReducer(
    canvasReducer,
    initial ?? initialCanvasState,
  );
  // const listeners = React.useRef(new Set<() => void>());

  // const subscribe = useCallback((fn: () => void) => {
  //   listeners.current.add(fn);
  //   return () => listeners.current.delete(fn);
  // }, []);

  //   const store = useMemo<Store>(() => ({
  //       getSnapshot: () => state,          // overwritten below via closure
  //       dispatch,
  //       subscribe,
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //     }), []); // never re-created
    
  //     /* keep getSnapshot up-to-date without changing identity */
  //     store.getSnapshot = () => state;
  /* ---------- NEW stable store ---------- */
  const listeners = useRef(new Set<() => void>());

  const stateRef = useRef(initialCanvasState); // holds latest state
  stateRef.current = state;                    // update ref each render

  const subscribe = useCallback((fn: () => void) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  const store = useMemo<Store>(() => {
    const getSnapshot = () => stateRef.current;  // ⚡️ SAME fn for life
    return { getSnapshot, dispatch, subscribe };
  }, [dispatch, subscribe]); // deps are stable
  useLayoutEffect(() => {
    listeners.current.forEach((fn) => fn());
    onChange?.(state);
  }, [state, onChange]);

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
  // return React.useSyncExternalStore(
  //   store.subscribe,
  //   () => Array.from(store.getSnapshot().selected),
  //   () => Array.from(store.getSnapshot().selected),
  // );
  const selectedSet = React.useSyncExternalStore(
        store.subscribe,
        () => store.getSnapshot().selected,
        () => store.getSnapshot().selected,
      );
    
      /* 2️⃣  Convert to an Array _after_ the snapshot comparison.
            Stable as long as the Set reference didn’t change. */
      return React.useMemo(() => Array.from(selectedSet), [selectedSet]);
     }


export function useCanvasElements(): Map<string, ElementRecord> {
  const store = useStore();
  return React.useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().elements,
    () => store.getSnapshot().elements,
  );
}

export function useCanvasUndo() {
  const store = useStore();
  return () => store.dispatch({ type: "undo" });
}

export function useCanvasRedo() {
  const store = useStore();
  return () => store.dispatch({ type: "redo" });
}
