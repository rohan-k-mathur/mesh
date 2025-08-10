// contexts/PrivateChatManager.tsx
"use client";
import React, { createContext, useContext, useMemo, useReducer, useCallback } from "react";

export type Msg = { paneId: string; from: string; body: string; ts: number };
export type Pane = {
  id: string;                 // roomId
  conversationId: string;     // <-- add this
  peerId: string;
  peerName: string;
  peerImage?: string | null;
  msgs: Msg[];
  minimised: boolean;
  unread?: number;
  pos: { x: number; y: number };
};
type OpenPayload = Omit<Pane, "msgs" | "minimised" | "unread">;
type OpenOptions = {
  peerImage?: string | null;
  roomId?: string;
  pos?: { x: number; y: number };
};

type Ctx = {
  state: State;
  dispatch: React.Dispatch<Action>;
  open: (
    peerId: string,
    peerName: string,
    conversationId: string,
    opts?: OpenOptions
  ) => void;
};
type State = { panes: Record<string, Pane> };

type Action =
  | { type: "OPEN"; pane: Omit<Pane, "msgs" | "minimised" | "unread"> }
  | { type: "OPEN_OR_CREATE"; pane: Omit<Pane, "msgs" | "minimised" | "unread">; bump?: boolean }
  | { type: "CLOSE"; id: string }
  | { type: "MINIMISE"; id: string }
  | { type: "RESTORE"; id: string }
  | { type: "SET_POS"; id: string; pos: { x: number; y: number } }
  | { type: "ADD_MSG"; id: string; msg: Msg };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN": {
      const p = state.panes[action.pane.id];
      if (p) {
        return { ...state, panes: { ...state.panes, [p.id]: { ...p, minimised: false, unread: 0 } } };
      }
      const offset = Object.keys(state.panes).length * 40;
      return {
        ...state,
        panes: {
          ...state.panes,
          [action.pane.id]: {
            ...action.pane,
            msgs: [],
            minimised: false,
            unread: 0,
            pos: action.pane.pos ?? { x: 420 + offset, y: 24 + offset },
          },
        },
      };
    }
    case "CLOSE": {
      const { [action.id]: _, ...rest } = state.panes;
      return { ...state, panes: rest };
    }
    case "MINIMISE": {
      const p = state.panes[action.id];
      if (!p) return state;
      return { ...state, panes: { ...state.panes, [p.id]: { ...p, minimised: true } } };
    }
    case "RESTORE": {
      const p = state.panes[action.id];
      if (!p) return state;
      return { ...state, panes: { ...state.panes, [p.id]: { ...p, minimised: false, unread: 0 } } };
    }
    case "SET_POS": {
      const p = state.panes[action.id];
      if (!p) return state;
      return { ...state, panes: { ...state.panes, [p.id]: { ...p, pos: action.pos } } };
    }
    case "OPEN_OR_CREATE": {
      const p = state.panes[action.pane.id];
      if (p) {
        const unread = action.bump && p.minimised ? (p.unread ?? 0) + 1 : p.unread ?? 0;
        return {
          ...state,
          panes: {
            ...state.panes,
            [p.id]: {
              ...p,
              peerName: action.pane.peerName || p.peerName,
              peerImage: action.pane.peerImage ?? p.peerImage,
              unread,
            },
          },
        };
      }
      // create minimised; only bump if bump===true
      return {
        ...state,
        panes: {
          ...state.panes,
          [action.pane.id]: {
            ...action.pane,
            msgs: [],
            minimised: true,
            unread: action.bump ? 1 : 0,
            pos: action.pane.pos ?? { x: 420, y: 24 },
          },
        },
      };
    }

    case "ADD_MSG": {
      const p = state.panes[action.id];
      if (!p) return state;
      const isIncoming = String(action.msg.from) === p.peerId;
      const unread = p.minimised && isIncoming ? (p.unread ?? 0) + 1 : p.unread ?? 0;
      return {
        ...state,
        panes: {
          ...state.panes,
          [p.id]: { ...p, msgs: [...p.msgs, action.msg], unread },
        },
      };
    }

    
    default:
      return state;
  }
}




const C = createContext<Ctx | null>(null);


export function PrivateChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { panes: {} });

  const open = useCallback<Ctx["open"]>((peerId, peerName, conversationId, opts) => {
    const roomId = opts?.roomId ?? `dm:${conversationId}:${peerId}`;

    dispatch({
      type: "OPEN",
      pane: {
        id: roomId,
        conversationId,                      // <-- include
        peerId,
        peerName,
        peerImage: opts?.peerImage ?? null,
        pos: opts?.pos ?? { x: 420, y: 24 },
      },
    });
  }, []);

  const value = useMemo(() => ({ state, dispatch, open }), [state, open]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function usePrivateChatManager() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("PrivateChatProvider missing");
  return ctx;
}
export { PrivateChatProvider as PrivateChatManagerProvider };
