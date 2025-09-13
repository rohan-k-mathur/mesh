// packages/ludics-engine/delocate.ts
export type Design = { id?: string; base: string; actions: any[]; meta?: any };

export function delocate(design: Design, toLocus: string): Design {
  return {
    ...design,
    base: toLocus,
    meta: { ...(design.meta ?? {}), delocatedFrom: design.base, delocated: true }
  };
}
