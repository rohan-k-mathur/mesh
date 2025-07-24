import { useState, useMemo } from "react";
import { costToBuy, priceYes } from "@/lib/prediction/lmsr";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface Market {
  id: string;
  yesPool: number;
  noPool: number;
  b: number;
}

interface Props {
  market: Market;
  onClose: () => void;
  onTraded?: (newPrice: number) => void;
}

export default function TradePredictionModal({ market, onClose, onTraded }: Props) {
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [credits, setCredits] = useState(0);
  const currentPrice = useMemo(
    () => priceYes(market.yesPool, market.noPool, market.b),
    [market]
  );

  const shares = useMemo(() => {
    let lo = 0,
      hi = 1000;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      const cost = costToBuy(side, mid, market.yesPool, market.noPool, market.b);
      cost > credits ? (hi = mid) : (lo = mid);
    }
    return lo;
  }, [credits, side, market]);

  const cost = Math.ceil(
    costToBuy(side, shares, market.yesPool, market.noPool, market.b)
  );

  const priceAfter = useMemo(() => {
    const yes = market.yesPool + (side === "YES" ? shares : 0);
    const no = market.noPool + (side === "NO" ? shares : 0);
    return priceYes(yes, no, market.b);
  }, [shares, side, market]);

  async function handleTrade() {
    await fetch(`/api/market/${market.id}/trade`, {
      method: "POST",
      body: JSON.stringify({ side, credits: cost }),
    });
    onTraded?.(priceAfter);
    onClose();
  }

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between">
        <Button
          variant={side === "YES" ? "default" : "outline"}
          onClick={() => setSide("YES")}
        >
          YES
        </Button>
        <Button
          variant={side === "NO" ? "default" : "outline"}
          onClick={() => setSide("NO")}
        >
          NO
        </Button>
      </div>
      <Input
        type="range"
        min={0}
        max={100}
        value={credits}
        onChange={(e) => setCredits(Number(e.target.value))}
      />
      <div className="text-sm text-gray-700">
        Spend: {cost} credits for {shares.toFixed(2)} shares
      </div>
      <div className="text-sm text-gray-700">
        New probability: {(priceAfter * 100).toFixed(2)}% YES
      </div>
      <Button className="w-full" onClick={handleTrade}>
        Confirm Trade
      </Button>
    </div>
  );
}
