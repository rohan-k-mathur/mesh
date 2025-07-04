export type TriggerCallback = (payload: any) => void;

const registry: Record<string, TriggerCallback[]> = {};

export function registerWorkflowTrigger(name: string, callback: TriggerCallback) {
  if (!registry[name]) registry[name] = [];
  registry[name].push(callback);
}

export function emitWorkflowTrigger(name: string, payload: any) {
  for (const cb of registry[name] ?? []) {
    cb(payload);
  }
}
