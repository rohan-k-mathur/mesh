import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartLine = { itemId: string; name?: string; qty: number; unitPrice?: number };
type CartState = {
  lines: Record<string, CartLine>; // key by itemId
  isOpen: boolean;
  hydrateDone: boolean;
  add: (line: CartLine) => void;
  setQty: (itemId: string, qty: number) => void;
  remove: (itemId: string) => void;
  toggle: (open?: boolean) => void;
  _setHydrated: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: {},
      isOpen: false,
      hydrateDone: false,
      add: (line) => {
        const cur = get().lines[line.itemId];
        const nextQty = (cur?.qty ?? 0) + line.qty;
        set({ lines: { ...get().lines, [line.itemId]: { ...cur, ...line, qty: nextQty } } });
      },
      setQty: (itemId, qty) => {
        const cur = get().lines[itemId];
        if (!cur) return;
        if (qty <= 0) {
          const { [itemId]: _, ...rest } = get().lines;
          set({ lines: rest });
        } else {
          set({ lines: { ...get().lines, [itemId]: { ...cur, qty } } });
        }
      },
      remove: (itemId) => {
        const { [itemId]: _, ...rest } = get().lines;
        set({ lines: rest });
      },
      toggle: (open) => set({ isOpen: open ?? !get().isOpen }),
      _setHydrated: () => set({ hydrateDone: true }),
    }),
    {
      name: "cart",
      skipHydration: true,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? undefined : localStorage
      ),
      partialize: (s) => ({ lines: s.lines }), // don’t persist isOpen/hydrateDone
    }
  )
);
