"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AuctionBar({ auctionId, reserve, endsAt }: {
  auctionId: number; reserve: number; endsAt: string;
}) {
  const [remaining, setRemaining] = useState(
    new Date(endsAt).getTime() - Date.now(),
  );
  const [bids, setBids] = useState<{ user: string; amount: number }[]>([]);

  useEffect(() => {
    const es = new EventSource(`/api/auction/${auctionId}/events`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.remainingMs !== undefined) setRemaining(data.remainingMs);
      if (data.bids) setBids((prev) => [...prev, ...data.bids]);
    };
    return () => es.close();
  }, [auctionId]);

  const total = new Date(endsAt).getTime() - (Date.now() - remaining);
  const pct = Math.max(0, remaining / total);

  return (
    <div className="space-y-2">
      <motion.div
        className="h-2 rounded bg-green-500 origin-left"
        style={{ scaleX: pct }}
        transition={{ ease: "linear", duration: 0.2 }}
      />
      <p className="text-sm">
        {Math.ceil(remaining / 1000)} s left – highest bid $
        {(Math.max(reserve, ...bids.map((b) => b.amount)) / 100).toFixed(2)}
      </p>

      <ul className="text-xs max-h-24 overflow-y-auto">
        {bids.map((b) => (
          <li key={b.amount + b.user}>
            {b.user}: ${(b.amount / 100).toFixed(2)}
          </li>
        ))}
      </ul>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const amt = Number((e.target as any).bid.value) * 100;
          await fetch("/api/auction/bid", {
            method: "POST",
            body: JSON.stringify({ auctionId, amountCents: amt }),
          });
          (e.target as any).bid.value = "";
        }}
        className="flex gap-2"
      >
        <input
          name="bid"
          type="number"
          step="0.01"
          placeholder="Your bid"
          className="border px-2 py-1 flex-1"
        />
        <button className="btn-primary px-3">Bid</button>
      </form>
    </div>
  );
}
