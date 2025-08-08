// "use client";
// import { createContext, useContext, useReducer } from "react";
// import PrivateChatPane from "@/components/PrivateChatPane";

// export interface Msg {
//   paneId: string;
//   from: bigint;
//   body: string;
//   ts: number;
// }

// interface Pane {
//   id: string;
//   peerId: bigint;
//   peerName: string;          // 👈 NEW
//   msgs: Msg[];
//   minimised: boolean;
//   pos: { x: number; y: number };
// }

// interface State {
//   panes: Pane[];
// }

// const Context = createContext<{
//   panes: Pane[];
//   open: (targetUserId: bigint, targetName: string, roomId: bigint) => Promise<void>;
//   dispatch: React.Dispatch<Action>;
// }>({ panes: [], open: async () => {}, dispatch: () => {} });

// interface OpenAction {
//   type: "OPEN";
//   pane: Pane;
// }
// interface CloseAction {
//   type: "CLOSE";
//   id: string;
// }
// interface AddMsgAction {
//   type: "ADD_MSG";
//   id: string;
//   msg: Msg;
// }
// interface MinimiseAction {
//   type: "MINIMISE";
//   id: string;
// }
// interface SetPosAction {
//   type: "SET_POS";
//   id: string;
//   pos: { x: number; y: number };
// }

// type Action = OpenAction | CloseAction | AddMsgAction | MinimiseAction | SetPosAction;

// function reducer(state: State, action: Action): State {
//   switch (action.type) {
//     case "OPEN":
//       return { panes: [...state.panes, action.pane] };
//     case "CLOSE":
//       return { panes: state.panes.filter((p) => p.id !== action.id) };
//     case "ADD_MSG":
//       return {
//         panes: state.panes.map((p) =>
//           p.id === action.id ? { ...p, msgs: [...p.msgs, action.msg] } : p,
//         ),
//       };
//     case "MINIMISE":
//       return {
//         panes: state.panes.map((p) =>
//           p.id === action.id ? { ...p, minimised: !p.minimised } : p,
//         ),
//       };
//     case "SET_POS":
//       return {
//         panes: state.panes.map((p) =>
//           p.id === action.id ? { ...p, pos: action.pos } : p,
//         ),
//       };
//     default:
//       return state;
//   }
// }

// export function PrivateChatManagerProvider({ children }: { children: React.ReactNode }) {
//   const [state, dispatch] = useReducer(reducer, { panes: [] });

//   const open = async (targetUserId: bigint, targetName:string, roomId: bigint) => {
//     const res = await fetch("/api/esp/open", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         targetUserId: targetUserId.toString(),
//         roomId: roomId.toString(),
//       }),
//     });
//     const { paneId } = await res.json();
//     dispatch({
//       type: "OPEN",
//       pane: {
//         id: paneId,
//         peerId: targetUserId,
//         peerName: targetName,          // 👈 NEW
//         msgs: [],
//         minimised: false,
//         pos: { x: 20, y: 20 },
//       },
//     });
//   };

//   return (
//     <Context.Provider value={{ panes: state.panes, open, dispatch }}>
//       {children}
//       {state.panes.map((p) => (
//         <PrivateChatPane key={p.id} pane={p} />
//       ))}
//     </Context.Provider>
//   );
// }

// export const usePrivateChatManager = () => useContext(Context);
// contexts/PrivateChatManager.tsx
"use client";
import React, { createContext, useContext, useMemo, useReducer } from "react";

export type Msg = { paneId: string; from: string; body: string; ts: number };

export type Pane = {
  id: string;                    // stable pane id (e.g., `${conversationId}:${peerId}`)
  peerId: string;                // string for simplicity
  peerName: string;
  msgs: Msg[];
  minimised: boolean;
  pos: { x: number; y: number };
};

type State = { panes: Record<string, Pane> };

type Action =
  | { type: "OPEN"; pane: Pane }
  | { type: "CLOSE"; id: string }
  | { type: "MINIMISE"; id: string }
  | { type: "SET_POS"; id: string; pos: { x: number; y: number } }
  | { type: "ADD_MSG"; id: string; msg: Msg };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN": {
      const p = action.pane;
      if (state.panes[p.id]) return state;
      return { panes: { ...state.panes, [p.id]: p } };
    }
    case "CLOSE": {
      const { [action.id]: _, ...rest } = state.panes;
      return { panes: rest };
    }
    case "MINIMISE": {
      const p = state.panes[action.id];
      if (!p) return state;
      return { panes: { ...state.panes, [action.id]: { ...p, minimised: !p.minimised } } };
    }
    case "SET_POS": {
      const p = state.panes[action.id];
      if (!p) return state;
      return { panes: { ...state.panes, [action.id]: { ...p, pos: action.pos } } };
    }
    case "ADD_MSG": {
      const p = state.panes[action.id];
      if (!p) return state;
      return { panes: { ...state.panes, [action.id]: { ...p, msgs: [...p.msgs, action.msg] } } };
    }
    default:
      return state;
  }
}

type Ctx = {
  state: State;
  dispatch: React.Dispatch<Action>;
  open: (peerId: string, peerName: string, conversationId: string) => void;
};

const C = createContext<Ctx | null>(null);

export function PrivateChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { panes: {} });

  const open = useMemo(
    () =>
      (peerId: string, peerName: string, conversationId: string) => {
        const id = `${conversationId}:${peerId}`;
        dispatch({
          type: "OPEN",
          pane: {
            id,
            peerId,
            peerName,
            msgs: [],
            minimised: false,
            pos: { x: 24, y: 24 },
          },
        });
      },
    []
  );

  const value = useMemo(() => ({ state, dispatch, open }), [state, open]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function usePrivateChatManager() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("PrivateChatProvider missing");
  return ctx;
}
export { PrivateChatProvider as PrivateChatManagerProvider };
