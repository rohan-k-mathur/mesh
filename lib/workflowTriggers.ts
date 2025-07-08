export type TriggerCallback = (payload: any) => void;

const callbackRegistry: Record<string, TriggerCallback[]> = {};
const triggerRegistry = new Set<string>();

export function registerWorkflowTrigger(name: string, callback: TriggerCallback) {
  if (!callbackRegistry[name]) callbackRegistry[name] = [];
  callbackRegistry[name].push(callback);
}

export function emitWorkflowTrigger(name: string, payload: any) {
  for (const cb of callbackRegistry[name] ?? []) {
    cb(payload);
  }
}

export function registerWorkflowTriggerType(name: string) {
  triggerRegistry.add(name);
}

export function listWorkflowTriggers(): string[] {
  return Array.from(triggerRegistry);
}
