// components/rhetoric/RhetoricContext.tsx
'use client';
import { createContext, useContext, useMemo, useState } from 'react';

export type RhetoricMode = 'content' | 'style';
export type RhetoricCategory =
  | 'hedge'
  | 'intensifier'
  | 'absolute'
  | 'analogy'
  | 'metaphor'
  | 'allcaps'
  | 'exclaim';

type Cfg = {
  mode: RhetoricMode;
  setMode: (m: RhetoricMode) => void;
  enabled: Record<RhetoricCategory, boolean>;
  toggle: (c: RhetoricCategory) => void;
};

const DEFAULT_ENABLED: Cfg['enabled'] = {
  hedge: true,
  intensifier: true,
  absolute: true,
  analogy: true,
  metaphor: true,
  allcaps: true,
  exclaim: true,
};

const Ctx = createContext<Cfg | null>(null);

export function RhetoricProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<RhetoricMode>('content');
  const [enabled, setEnabled] = useState(DEFAULT_ENABLED);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      enabled,
      toggle: (k: RhetoricCategory) =>
        setEnabled((prev) => ({ ...prev, [k]: !prev[k] })),
    }),
    [mode, enabled]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRhetoric() {
  const c = useContext(Ctx);
  if (!c) throw new Error('RhetoricProvider missing');
  return c;
}
