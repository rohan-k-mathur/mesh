"use client";
import { useState } from "react";
import { priceYes } from "@/lib/prediction/lmsr";
import TradePredictionModal from "../modals/TradePredictionModal";

interface Props {
  post: any;
}

export default function PredictionMarketCard({ post }: Props) {
  const [price, setPrice] = useState(
    post.predictionMarket
      ? priceYes(
          post.predictionMarket.yesPool,
          post.predictionMarket.noPool,
          post.predictionMarket.b
        )
      : 0.5
  );
  const [showTrade, setShowTrade] = useState(false);

  return (
    <div className="border-[1px] border-white w-[600px] bg-white bg-opacity-10
     justify-center items-center mx-auto rounded-lg p-6 space-y-3">
      <h3 className=" text-[1.2rem] tracking-wide">{post.predictionMarket?.question}</h3>
      <div className="h-3 w-full rounded bg-gray-200 relative items-center justify-center mx-auto  overflow-hidden">
        <div
          className="bg-green-500 absolute inset-y-0 left-0"
          style={{ width: `${price * 100}%` }}
        />
      </div>
      <div className="text-xs text-gray-600 ">{Math.round(price * 100)} % YES</div>
      <div className="items-center justify-center mx-auto ">
      <button
        className="likebutton bg-white bg-opacity-20 py-2 px-8 mt-1 mb-2  rounded-xl text-[1.1rem] mx-full items-center justify-center text-center tracking-widest"
        disabled={post.predictionMarket?.state !== "OPEN"}
        onClick={() => setShowTrade(true)}
      >
        {post.predictionMarket?.state === "OPEN" ? "Trade" : "Closed"}
      </button>
      </div>
      {showTrade && post.predictionMarket && (
        <TradePredictionModal
          market={post.predictionMarket}
          onClose={() => setShowTrade(false)}
          onTraded={(p) => setPrice(p)}
        />
      )}
      {post.predictionMarket?.state === "RESOLVED" && (
        <div className="text-[sm] font-medium">Outcome: {post.predictionMarket.outcome}</div>
      )}
    </div>
  );
}
