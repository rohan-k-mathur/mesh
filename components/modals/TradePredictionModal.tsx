"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { priceYes, costToBuy } from "@/lib/prediction/lmsr";
import { estimateShares } from "@/lib/prediction/tradePreview";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import Spinner from "../ui/spinner";
import { Alert } from "../ui/alert";
import { toast } from "sonner";

interface Market {
  id: string;
  yesPool: number;
  noPool: number;
  b: number;
}

interface Props {
  market: Market;
  onClose: () => void;
  mutateMarket?: (updater?: any) => void;
}

export default function TradePredictionModal({ market, onClose, mutateMarket }: Props) {
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [spend, setSpend] = useState(0);
  const [maxSpend, setMaxSpend] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentPrice = useMemo(
    () => priceYes(market.yesPool, market.noPool, market.b),
    [market]
  );

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => setMaxSpend(d.balanceCents ?? 0))
      .catch(() => setMaxSpend(0));
  }, []);





  const { shares, cost } = useMemo(() => {
    if (!spend) return { shares: 0, cost: 0 };
    try {
      return estimateShares(
        side,
        spend,
        market.yesPool,
        market.noPool,
        market.b
      );
    } catch (e) {
      setError("Invalid spend amount");
      return { shares: 0, cost: 0 };
    }
  }, [spend, side, market]);

  const priceAfter = useMemo(() => {
    const yes = market.yesPool + (side === "YES" ? shares : 0);
    const no = market.noPool + (side === "NO" ? shares : 0);
    return priceYes(yes, no, market.b);
  }, [shares, side, market]);

  const handleTrade = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const resp = await fetch(`/api/market/${market.id}/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, spendCents: cost }),
      });
      if (resp.status !== 200) {
        const data = await resp.json().catch(() => ({}));
        setError(data.error ?? "Trade failed");
        return;
      }
      const result = await resp.json();
      const tradedShares = result.shares ?? shares;
      const newYes = market.yesPool + (side === "YES" ? tradedShares : 0);
      const newNo = market.noPool + (side === "NO" ? tradedShares : 0);
      if (mutateMarket) {
        mutateMarket((prev: Market) => ({
          ...prev,
          yesPool: newYes,
          noPool: newNo,
        }));
      } else {
        mutateMarket?.();
      }
      toast.success(
        `Bought ${tradedShares.toFixed(2)} shares @ ${(priceAfter * 100).toFixed(2)} %`
      );
      onClose();
    } catch {
      toast.error("Network error");
    } finally {
      setPending(false);
    }
  }, [market.id, side, cost, mutateMarket, shares, priceAfter, onClose, market.yesPool, market.noPool]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setSpend((s) => Math.max(0, s - 10));
      if (e.key === "ArrowRight") setSpend((s) => Math.min(maxSpend, s + 10));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, maxSpend]);

  const fmt = useMemo(() => new Intl.NumberFormat(), []);

  return (
    <div className="border-[1px] border-white px-8 py-6 space-y-4 bg-white bg-opacity-20 rounded-xl shadow-md">
      <div className="flex justify-between">
        <button
          className={`likebutton px-4 pt-1 pb-0 rounded-xl ${side === "NO" ? "bg-red-500 text-white" : "bg-white bg-opacity-40"}`}
          onClick={() => setSide("NO")}
        >
          NO
        </button>
        <button
          className={`likebutton px-4 pt-1 pb-0 rounded-xl ${side === "YES" ? "bg-green-500 text-white" : "bg-white bg-opacity-40"}`}
          onClick={() => setSide("YES")}
        >
          YES
        </button>
      </div>
      <div className="justify-center items-center mx-auto text-center space-y-2">
        <Slider
          min={0}
          max={maxSpend}
          step={10}
          value={[spend]}
          onValueChange={([v]) => setSpend(v)}
          className="w-full"
        />
        {error && <Alert variant="destructive">{error}</Alert>}
        <div className="text-sm text-gray-700" aria-live="polite">
          Cost: {cost} credits — New balance: {maxSpend - cost}
        </div>
        <div className="text-sm text-gray-700" aria-live="polite">
          You receive ≈ {shares.toFixed(2)} shares
        </div>
        <div className="text-sm text-gray-700" aria-live="polite">
          Market moves to ≈ {(priceAfter * 100).toFixed(1)} % YES
        </div>
        <Button
          onClick={handleTrade}
          disabled={pending || cost === 0 || cost > maxSpend}
          className="w-fit h-full px-6 py-3 bg-white bg-opacity-40 rounded-xl tracking-wide mx-auto likebutton"
        >
          {pending ? <Spinner className="h-4 w-4" /> : "Confirm Trade"}
        </Button>
      </div>
    </div>
  );
}
