"use client";
import { createContext, useContext, useReducer } from "react";
import PrivateChatPane from "@/components/PrivateChatPane";

export interface Msg {
  paneId: string;
  from: bigint;
  body: string;
  ts: number;
}

interface Pane {
  id: string;
  peerId: bigint;
  msgs: Msg[];
  minimised: boolean;
  pos: { x: number; y: number };
}

interface State {
  panes: Pane[];
}

const Context = createContext<{
  panes: Pane[];
  open: (targetUserId: bigint, roomId: bigint) => Promise<void>;
  dispatch: React.Dispatch<Action>;
}>({ panes: [], open: async () => {}, dispatch: () => {} });

interface OpenAction {
  type: "OPEN";
  pane: Pane;
}
interface CloseAction {
  type: "CLOSE";
  id: string;
}
interface AddMsgAction {
  type: "ADD_MSG";
  id: string;
  msg: Msg;
}
interface MinimiseAction {
  type: "MINIMISE";
  id: string;
}
interface SetPosAction {
  type: "SET_POS";
  id: string;
  pos: { x: number; y: number };
}

type Action = OpenAction | CloseAction | AddMsgAction | MinimiseAction | SetPosAction;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "OPEN":
      return { panes: [...state.panes, action.pane] };
    case "CLOSE":
      return { panes: state.panes.filter((p) => p.id !== action.id) };
    case "ADD_MSG":
      return {
        panes: state.panes.map((p) =>
          p.id === action.id ? { ...p, msgs: [...p.msgs, action.msg] } : p,
        ),
      };
    case "MINIMISE":
      return {
        panes: state.panes.map((p) =>
          p.id === action.id ? { ...p, minimised: !p.minimised } : p,
        ),
      };
    case "SET_POS":
      return {
        panes: state.panes.map((p) =>
          p.id === action.id ? { ...p, pos: action.pos } : p,
        ),
      };
    default:
      return state;
  }
}

export function PrivateChatManagerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { panes: [] });

  const open = async (targetUserId: bigint, roomId: bigint) => {
    const res = await fetch("/api/esp/open", {
      method: "POST",
      body: JSON.stringify({ targetUserId, roomId }),
    });
    const { paneId } = await res.json();
    dispatch({
      type: "OPEN",
      pane: {
        id: paneId,
        peerId: targetUserId,
        msgs: [],
        minimised: false,
        pos: { x: 20, y: 20 },
      },
    });
  };

  return (
    <Context.Provider value={{ panes: state.panes, open, dispatch }}>
      {children}
      {state.panes.map((p) => (
        <PrivateChatPane key={p.id} pane={p} />
      ))}
    </Context.Provider>
  );
}

export const usePrivateChatManager = () => useContext(Context);
