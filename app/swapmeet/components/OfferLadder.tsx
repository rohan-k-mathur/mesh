"use client";
import { useOfferStream } from "@/lib/hooks/useOfferStream";
import { useTransition, useState } from "react";
import { createOffer, setOfferStatus } from "@/lib/actions/offers.server";

function Badge({ children, tone }: { children: React.ReactNode; tone: "green"|"red"|"gray" }) {
  const color = tone === "green" ? "bg-green-100 text-green-700"
              : tone === "red" ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700";
  return <span className={`px-2 py-0.5 rounded text-xs ${color}`}>{children}</span>;
}

export function OfferLadder({
  stallId,
  currentUserId,
  sellerId,
  itemId,
}: {
  stallId: number;
  currentUserId: string; // as string to match wire type
  sellerId: string;
  itemId?: string | null;
}) {
  const { offers, pending, dispatch } = useOfferStream(stallId);
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const mine = (o: any) => o.buyerId === currentUserId;
  const isSeller = currentUserId === sellerId;

  const onSubmit = () => {
    const amt = parseFloat(amount);
    if (!(amt > 0)) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      stallId: String(stallId),
      itemId: itemId ?? null,
      buyerId: currentUserId,
      sellerId,
      amount: amt,
      currency: "usd",
      status: "PENDING" as const,
      message: message || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "optimistic:add", tempId, row: optimistic });

    startTransition(async () => {
      try {
        const real = await createOffer({
          stallId: BigInt(stallId), itemId: itemId ? BigInt(itemId) : null,
          buyerId: BigInt(currentUserId), sellerId: BigInt(sellerId),
          amount: amt, message,
        });
        dispatch({ type: "optimistic:ack", tempId, real });
        setAmount("");
        setMessage("");
      } catch {
        dispatch({ type: "optimistic:fail", tempId });
      }
    });
  };

  const accept = (id: string) =>
    startTransition(async () => { await setOfferStatus(BigInt(id), "ACCEPTED"); });

  const reject = (id: string) =>
    startTransition(async () => { await setOfferStatus(BigInt(id), "REJECTED"); });

  return (
    <div className="sticky bottom-0 bg-white/80 backdrop-blur p-3 border-t">
      {/* composer */}
      <div className="flex gap-2 items-center mb-3">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Your offer ($)"
          className="border rounded px-2 py-1 w-32"
        />
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message (optional)"
          className="border rounded px-2 py-1 flex-1"
        />
        <button
          disabled={isPending}
          onClick={onSubmit}
          className="rounded bg-black text-white px-3 py-1 disabled:opacity-50"
        >
          Offer
        </button>
      </div>

      {/* ladder */}
      <div className="space-y-1">
        {offers.map((o) => (
          <div
            key={o.id}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-sm"
          >
            <div className={mine(o) ? "text-green-700" : "text-blue-700"}>
              ${o.amount.toFixed(2)} {o.message ? `— ${o.message}` : ""}
            </div>
            <Badge tone={
              o.status === "PENDING" ? "gray" :
              o.status === "ACCEPTED" ? "green" :
              o.status === "REJECTED" ? "red" : "gray"
            }>
              {o.status.toLowerCase()}
            </Badge>

            {/* seller actions */}
            {isSeller && o.status === "PENDING" && (
              <div className="flex gap-1">
                <button
                  onClick={() => accept(o.id)}
                  className="px-2 py-0.5 rounded bg-green-600 text-white"
                >Accept</button>
                <button
                  onClick={() => reject(o.id)}
                  className="px-2 py-0.5 rounded bg-red-600 text-white"
                >Reject</button>
              </div>
            )}
          </div>
        ))}

        {/* optimistic rows (render faintly if you want) */}
        {Object.entries(pending).map(([tempId, o]) => (
          <div key={tempId} className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm opacity-60">
            <div className="text-green-700">${o.amount.toFixed(2)} {o.message ? `— ${o.message}` : ""}</div>
            <Badge tone="gray">sending…</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
