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
    <div className="border-[1px] border-white px-8 py-6  space-y-4 bg-white bg-opacity-20 rounded-xl shadow-md">
      <div className="flex justify-between">
       
        <button
          className="likebutton bg-white px-4 pt-1 pb-0 bg-opacity-40 rounded-xl items-center justify-center text-center"
          onClick={() => setSide("NO")}
        >
          NO
        </button>
        <button
          className="likebutton bg-white px-4 pt-1 pb-0 bg-opacity-40 rounded-xl items-center justify-center text-center"

          onClick={() => setSide("YES")}
        >
          YES
        </button>
      </div>
      <div className="justify-center items-center mx-auto text-center space-y-2 ">
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
      <button className="w-fit px-8  text-[1rem] bg-white bg-opacity-40
       py-2 rounded-xl tracking-wide text-center justify-center items-center mx-auto  likebutton" onClick={handleTrade}>
        Confirm Trade
      </button>
      </div>
      </div>
  );
}
