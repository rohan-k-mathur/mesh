"use client";
import { useEffect } from "react";
import { useCart } from "@/lib/stores/cart";
import CartDrawer from "@/components/cart/CartDrawer";

export default function Providers({ children }: { children: React.ReactNode }) {
  const rehydrate = (useCart as any).persist?.rehydrate;
  const setHydrated = useCart((s) => s._setHydrated);

  useEffect(() => {
    rehydrate?.();
    setHydrated();
  }, [rehydrate, setHydrated]);

  return (
    <>
      {children}
      <CartDrawer />
      {/* Add a small floating button globally */}
      <button
        onClick={() => useCart.getState().toggle(true)}
        className="fixed bottom-4 right-4 rounded-full px-4 py-2 shadow z-50 bg-black text-white"
      >
        Cart
      </button>
    </>
  );
}
