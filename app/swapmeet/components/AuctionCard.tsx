'use client';
import { useEffect, useState } from 'react';

type Auction = {
  id: string;
  item: { name: string; images: string[] };
  current_bid_cents: number;
  ends_at: string; // ISO
};

export function AuctionCard({ auction }: { auction: Auction }) {
  const [bid, setBid]     = useState(auction.current_bid_cents);
  const [time, setTime]   = useState<string>(() => countdown(auction.ends_at));
  const [placing, setPlacing] = useState(false);

  /* 1 · subscribe to SSE ------------------------------------------------ */
  useEffect(() => {
    const es = new EventSource(`/api/auction/${auction.id}/stream`);
    es.onmessage = (ev) => {
      const { current_bid_cents } = JSON.parse(ev.data);
      setBid(current_bid_cents);
    };
    return () => es.close();
  }, [auction.id]);

  /* 2 · count‑down timer ------------------------------------------------ */
  useEffect(() => {
    const t = setInterval(() => setTime(countdown(auction.ends_at)), 1000);
    return () => clearInterval(t);
  }, [auction.ends_at]);

  /* 3 · bid handler ----------------------------------------------------- */
  const placeBid = async () => {
    setPlacing(true);
    const res = await fetch(`/api/auction/${auction.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bid_cents: bid + 100 }), // +$1
    });
    setPlacing(false);
    if (!res.ok) alert('Bid rejected');
  };

  return (
    <div className="border rounded p-4 w-60">
      <img src={auction.item.images[0]} className="h-32 w-full object-cover" />
      <h3 className="mt-2 font-semibold">{auction.item.name}</h3>

      <p className="text-lg">${(bid / 100).toFixed(2)}</p>
      <p className="text-sm text-gray-500">{time}</p>

      <button
        disabled={placing}
        onClick={placeBid}
        className="btn-primary w-full mt-2"
      >
        {placing ? '...' : 'Bid +$1'}
      </button>
    </div>
  );
}

function countdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Closed';
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')} left`;
}
