// lib/bus.ts
export const bus = {
    emit(name: string, detail: any) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(name, { detail }));
      }
    }
  };
  // make it globally reachable in dev:
  if (typeof globalThis !== 'undefined') (globalThis as any).meshBus = bus;
  