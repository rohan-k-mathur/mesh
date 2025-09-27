// lib/server/bus.ts
import { EventEmitter } from 'node:events'; // explicit Node entrypoint
import { BUS_EVENTS, type BusEvent } from '@/lib/events/topics';

/* ---------------------------- Typed payloads (extend as you go) ---------------------------- */
export interface BusPayloadMap {
  'dialogue:moves:refresh': { deliberationId: string; moveId?: string; kind?: string };
  'dialogue:cs:refresh':    { deliberationId: string; participantId?: string };
  'dialogue:changed':       { deliberationId: string; moveId?: string; kind?: string; chips?: string[] };
  // add more as you standardize them
}

export type BusPayload<T extends BusEvent> =
  T extends keyof BusPayloadMap ? BusPayloadMap[T] : Record<string, any>;

export type BusEnvelope<T extends BusEvent = BusEvent> =
  { type: T; ts: number } & BusPayload<T>;

/* ------------------------------- Global singleton ------------------------------- */
declare global {
  // eslint-disable-next-line no-var
  var __meshBus__: EventEmitter | undefined;
}
const bus: EventEmitter = globalThis.__meshBus__ ??= new EventEmitter();

// TEMP ceiling while migrating to one subscriber; remove later.
if ((EventEmitter as any).defaultMaxListeners < 50) {
  (EventEmitter as any).defaultMaxListeners = 50;
}
bus.setMaxListeners(50);

export default bus;

/* --------------------------------- Helpers --------------------------------- */
export function emitBus<T extends BusEvent>(type: T, payload: BusPayload<T>): BusEnvelope<T> {
  const env = { type, ts: Date.now(), ...(payload || {}) } as BusEnvelope<T>;
  bus.emit(type, env);
  return env;
}

export function onBus<T extends BusEvent>(type: T, fn: (e: BusEnvelope<T>) => void) {
  bus.on(type, fn as any);
}

export function offBus<T extends BusEvent>(type: T, fn: (e: BusEnvelope<T>) => void) {
  (bus as any).off ? (bus as any).off(type, fn as any) : bus.removeListener(type, fn as any);
}

