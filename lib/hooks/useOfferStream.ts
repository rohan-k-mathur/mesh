"use client";
import { useEffect, useMemo, useReducer, useRef } from "react";

export type OfferRow = {
  id: string;
  stallId: string;
  itemId: string | null;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  message: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

type State = {
  byId: Record<string, OfferRow>;
  order: string[]; // sorted by updatedAt asc
  pending: Record<string, OfferRow>; // tempId -> optimistic row
};

type Action =
  | { type: "snapshot" | "upsert"; row: OfferRow }
  | { type: "delete"; id: string }
  | { type: "optimistic:add"; tempId: string; row: OfferRow }
  | { type: "optimistic:ack"; tempId: string; real: OfferRow }
  | { type: "optimistic:fail"; tempId: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "snapshot":
    case "upsert": {
      const r = action.row;
      const byId = { ...state.byId, [r.id]: r };
      const set = new Set(state.order);
      set.add(r.id);
      const order = Array.from(set).sort((a,b) =>
        new Date(byId[a].updatedAt).getTime() - new Date(byId[b].updatedAt).getTime()
      );
      return { ...state, byId, order };
    }
    case "delete": {
      const byId = { ...state.byId };
      delete byId[action.id];
      return { ...state, byId, order: state.order.filter(id => id !== action.id) };
    }
    case "optimistic:add": {
      const pending = { ...state.pending, [action.tempId]: action.row };
      return { ...state, pending };
    }
    case "optimistic:ack": {
      // replace tempId with real row
      const pending = { ...state.pending };
      delete pending[action.tempId];
      return reducer({ ...state, pending }, { type: "upsert", row: action.real });
    }
    case "optimistic:fail": {
      const pending = { ...state.pending };
      delete pending[action.tempId];
      return { ...state, pending };
    }
  }
}

export function useOfferStream(stallId: number) {
  const [state, dispatch] = useReducer(reducer, { byId: {}, order: [], pending: {} });
  const lastIdRef = useRef<string | null>(null);

  // initial backfill
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch(`/api/offers?stallId=${stallId}`, { cache: "no-store" });
      const rows: OfferRow[] = await r.json();
      if (cancelled) return;
      for (const row of rows) {
        dispatch({ type: "snapshot", row });
        lastIdRef.current = row.updatedAt;
      }
    })();
    return () => { cancelled = true; };
  }, [stallId]);

  // SSE live updates
  useEffect(() => {
    const es = new EventSource(`/api/offers/stream?stallId=${stallId}`);
    es.addEventListener("offer.snapshot", (e) => {
      const row = JSON.parse((e as MessageEvent).data) as OfferRow;
      dispatch({ type: "snapshot", row });
    });
    es.addEventListener("offer.insert", (e) => {
      const row = JSON.parse((e as MessageEvent).data) as OfferRow;
      dispatch({ type: "upsert", row });
    });
    es.addEventListener("offer.update", (e) => {
      const row = JSON.parse((e as MessageEvent).data) as OfferRow;
      dispatch({ type: "upsert", row });
    });
    es.addEventListener("offer.delete", (e) => {
      const row = JSON.parse((e as MessageEvent).data) as { id: string };
      dispatch({ type: "delete", id: row.id });
    });
    es.onerror = () => { /* keep open; browser will retry */ };
    return () => es.close();
  }, [stallId]);

  const offers = useMemo(() => state.order.map(id => state.byId[id]), [state.order, state.byId]);
  const pending = state.pending;

  return { offers, pending, dispatch };
}
