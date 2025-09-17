import { EventEmitter } from 'events';

type BusEvent =
  | 'dialogue:moves:refresh'
  | 'dialogue:cs:refresh'
  | 'claims:edges:changed'
  | 'cqs:changed'
  | 'cards:changed'
  | 'decision:changed'
  | 'votes:changed';

export type BusPayload = Record<string, any>;

class MeshBus extends EventEmitter {
    
  emitEvent(type: BusEvent, payload: BusPayload = {}) {
    super.emit(type, { type, ...payload, ts: Date.now() });
  }

}


export const bus: MeshBus =
  (globalThis as any).__meshBus__ ?? ((globalThis as any).__meshBus__ = new MeshBus());

  (bus as any).emit = (type: any, payload: any) => bus.emitEvent(type, payload);
