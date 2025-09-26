// lib/server/bus.ts
import { EventEmitter } from 'events';

/* --------------------------- Event names (source of truth) --------------------------- */

export const BUS_EVENTS = [
  'dialogue:moves:refresh',
  'dialogue:cs:refresh',
  'claims:edges:changed',
  'cqs:changed',
  'cards:changed',
  'decision:changed',
  'votes:changed',
  'stacks:changed',
  'deliberations:created',
  'comments:changed',
  'xref:changed',
  'citations:changed',
  'dialogue:changed',
] as const;

export type BusEvent = typeof BUS_EVENTS[number];

/* ---------------------------- Payload typing (optional) ---------------------------- */

export interface BusPayloadMap {
  'dialogue:moves:refresh': { deliberationId: string };
  'dialogue:cs:refresh': { deliberationId: string; participantId?: string };
  'dialogue:changed': { deliberationId: string; moveId?: string; kind?: string };
  // add more as you standardize them
}

export type BusPayload<T extends BusEvent> =
  T extends keyof BusPayloadMap ? BusPayloadMap[T] : Record<string, any>;

export type BusEnvelope<T extends BusEvent = BusEvent> = {
  type: T;
  ts: number;
} 

/* --------------------------------- Bus class --------------------------------- */

export class MeshBus extends EventEmitter {
  emitEvent<T extends BusEvent>(type: T, payload?: BusPayload<T>): void {
    const envelope: BusEnvelope<T> = {
      ...(payload as object),
      type,
      ts: Date.now(),
    } as BusEnvelope<T>;
    super.emit(type, envelope);
  }

  /** Typed listener helpers (use these if you want type inference on handlers) */
  onEvent<T extends BusEvent>(type: T, listener: (e: BusEnvelope<T>) => void): this {
    super.on(type, listener as any);
    return this;
  }

  onceEvent<T extends BusEvent>(type: T, listener: (e: BusEnvelope<T>) => void): this {
    super.once(type, listener as any);
    return this;
  }
}


/* ------------------------------- Global singleton ------------------------------- */

declare global {
  // eslint-disable-next-line no-var
  var __meshBus__: MeshBus | undefined;
}

export const bus: MeshBus =
  globalThis.__meshBus__ ?? (globalThis.__meshBus__ = new MeshBus());

/* --------------------------------- Emit helper --------------------------------- */

export function emitBus<T extends BusEvent>(type: T, payload: BusPayload<T>): void {
  bus.emitEvent(type, payload);
}

/* ------------------------------- Back-compat shim ------------------------------- */
/** Allow legacy code that calls `bus.emit(type, payload)` */
;(bus as any).emit = (type: BusEvent, payload?: Record<string, any>) => {
  bus.emitEvent(type as any, payload as any);
};

/* ------------------------------- Feed types to UI ------------------------------- */

export type AgoraEvent = {
  id: string;          // stable id for UI keys
  type: BusEvent;      // normalized event type
  ts: number;          // epoch ms
  title: string;       // card title / summary
  meta?: string;       // one-liner detail
  chips?: string[];    // tags/labels
  link?: string;       // primary link (room/claim)
  deliberationId?: string;
  targetType?: string;
  targetId?: string;
  icon?: string;       // "move"|"link"|"check"|"vote"|"branch"
};
