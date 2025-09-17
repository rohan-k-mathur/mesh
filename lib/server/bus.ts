// lib/server/bus.ts  (unchanged, shown for clarity)
import { EventEmitter } from 'events';

type BusEvent =
  | 'dialogue:moves:refresh'
  | 'dialogue:cs:refresh'
  | 'claims:edges:changed'
  | 'cqs:changed'
  | 'cards:changed'
  | 'decision:changed'
  | 'votes:changed'
  | 'deliberations:created'
  | 'comments:changed'
  | 'xref:changed'
  | 'citations:changed'
  | 'dialogue:changed';

export type BusPayload = Record<string, any>;

class MeshBus extends EventEmitter {
  emitEvent(type: BusEvent, payload: BusPayload = {}) {
    super.emit(type, { type, ...payload, ts: Date.now() });
  }
}

export function emitBus<T = any>(type: BusEvent, detail?: T) {
  try {
    const b: any = (globalThis as any).__meshBus__;
    if (b?.emitEvent) b.emitEvent(type, detail);
    else if (b?.emit) b.emit(type, detail);
  } catch {}
}

export const bus: MeshBus =
  (globalThis as any).__meshBus__ ?? ((globalThis as any).__meshBus__ = new MeshBus());

// back-compat
(bus as any).emit = (type: any, payload: any) => bus.emitEvent(type, payload);
