"use client";
import TradePredictionModal from "../modals/TradePredictionModal";
import ResolveMarketDialog from "../modals/ResolveMarketDialog";
import { useMarket } from "@/hooks/useMarket";
import { timeUntil } from "@/lib/utils";
import { useState } from "react";

interface Props {
  post: any;
}

export default function PredictionMarketCard({ post }: Props) {
  const { market, mutate } = useMarket(post.predictionMarket.id);
  const price = market?.price ?? 0.5;
  // const closesAt =
  //   market?.market.closesAt ? market.market.closesAt
  //                           : post.predictionMarket.closesAt;  
  const closesAt =
  market?.market.closesAt ?? post.predictionMarket?.closesAt;

const countdown =
  closesAt ? timeUntil(closesAt) : '--';

    const state = market?.market.state ?? post.predictionMarket.state;
  const outcome = market?.market.outcome ?? post.predictionMarket.outcome;
  const canResolve = market?.canResolve ?? false;
  const [showTrade, setShowTrade] = useState(false);
  const [showResolve, setShowResolve] = useState(false);

  return (
    <div className="border-[1px] border-white w-[600px] bg-white bg-opacity-10
     justify-center items-center mx-auto rounded-xl p-6 space-y-3 shadow-md">
      <h3 className=" text-[1.2rem] tracking-wide">{post.predictionMarket?.question}</h3>
      <div className="h-3 w-full rounded bg-gray-200 relative items-center justify-center mx-auto  overflow-hidden">
        <div
          className="bg-green-500 absolute inset-y-0 left-0"
          style={{ width: `${price * 100}%` }}
        />
      </div>
      <div className="text-xs text-gray-600 ">{Math.round(price * 100)} % YES</div>
      <div className="items-center justify-center mx-auto ">
        {state === "OPEN" && (
          <button
            className="likebutton bg-white bg-opacity-20 py-2 px-8 mt-1 mb-2  rounded-xl text-[1.1rem] mx-full items-center justify-center text-center tracking-widest"
            onClick={() => setShowTrade(true)}
          >
            Trade
          </button>
        )}
        {state === "CLOSED" && canResolve && (
          <button
            className="likebutton bg-white bg-opacity-20 py-2 px-8 mt-1 mb-2 rounded-xl text-[1.1rem] mx-full items-center justify-center text-center tracking-widest"
            onClick={() => setShowResolve(true)}
          >
            Resolve
          </button>
        )}
      </div>
      {state === "OPEN" && (
  <span className="text-xs">Closes in {countdown}</span>
  )}
      {showTrade && post.predictionMarket && (
        <TradePredictionModal
          market={post.predictionMarket}
          onClose={() => setShowTrade(false)}
          mutate={() => mutate()}
        />
      )}
      {state === "CLOSED" && !canResolve && (
        <div className="text-[sm] font-medium">Awaiting resolution</div>
      )}
      {showResolve && (
        <ResolveMarketDialog
          marketId={post.predictionMarket.id}
          onClose={() => setShowResolve(false)}
          mutate={() => mutate()}
        />
      )}
      {state === "RESOLVED" && (
        <div className="text-[sm] font-medium">Outcome: {outcome}</div>
      )}
    </div>
  );
}
