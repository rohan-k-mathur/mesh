// "use client";
// import { useEffect } from "react";
// import type { BusEvent } from "@/types/agora";

// export function useBusEffect(topics: BusEvent[] | "*", handler: (e: any) => void) {
//   useEffect(() => {
//     const on = (ev: Event) => handler((ev as CustomEvent).detail);
//     const keys = topics === "*" ? [
//       "dialogue:moves:refresh","dialogue:cs:refresh","claims:edges:changed","cqs:changed","cards:changed",
//       "decision:changed","votes:changed","deliberations:created","comments:changed","xref:changed","citations:changed"
//     ] as BusEvent[] : topics;

//     for (const t of keys) window.addEventListener(t, on as any);
//     return () => { for (const t of keys) window.removeEventListener(t, on as any); };
//   }, [topics, handler]);
// }
// lib/client/useBusEffect.ts
import { useEffect, useRef } from 'react';

type Topic =
  | 'dialogue:moves:refresh' | 'dialogue:changed'
  | 'citations:changed' | 'comments:changed'
  | 'deliberations:created' | 'decision:changed'
  | 'votes:changed' | 'xref:changed' | 'stacks:changed';

export function useBusEffect(topics: Topic[] | 'all', fn: (evt: any) => void) {
  const fnRef = useRef(fn); fnRef.current = fn;

  useEffect(() => {
    const es = new EventSource('/api/events');
    es.onmessage = (ev) => {
      try {
        const e = JSON.parse(ev.data);
        if (topics === 'all' || (e?.type && topics.includes(e.type))) {
          fnRef.current(e);
        }
      } catch {}
    };
    return () => es.close();
  }, [Array.isArray(topics) ? topics.join(',') : topics]);
}
