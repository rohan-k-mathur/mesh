"use client";
import { useCart } from "@/lib/stores/cart";

export default function CartDrawer() {
  const { isOpen, toggle, lines } = useCart((s) => ({ isOpen: s.isOpen, toggle: s.toggle, lines: s.lines }));
  if (!isOpen) return null;

  const items = Object.values(lines);
  const subtotal = items.reduce((acc, l) => acc + (l.unitPrice ?? 0) * l.qty, 0);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => toggle(false)} />
      <div className="absolute right-0 top-0 h-full w-[360px] bg-white p-4 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Your Cart</h3>
        <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
          {items.length === 0 ? <div className="text-sm text-gray-500">Empty</div> : items.map((l) => (
            <div key={l.itemId} className="flex items-center justify-between text-sm">
              <div className="mr-2">
                <div className="font-medium">{l.name ?? l.itemId}</div>
                <div className="text-gray-500">Qty {l.qty}</div>
              </div>
              <div className="flex items-center gap-2">
                <div>${((l.unitPrice ?? 0) * l.qty).toFixed(2)}</div>
                <button
                  className="text-red-600"
                  onClick={() => useCart.getState().remove(l.itemId)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t pt-3 flex justify-between">
          <div className="font-medium">Subtotal</div>
          <div>${subtotal.toFixed(2)}</div>
        </div>
        <button className="mt-4 w-full rounded bg-black text-white py-2" onClick={() => {/* start checkout */}}>
          Checkout
        </button>
      </div>
    </div>
  );
}
