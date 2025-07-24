"use client";
import { useState } from "react";
import { priceYes } from "@/lib/prediction/lmsr";

interface Props {
  post: any;
}

export default function PredictionMarketCard({ post }: Props) {
  const [price, setPrice] = useState(post.predictionMarket ? priceYes(post.predictionMarket.yesPool, post.predictionMarket.noPool, post.predictionMarket.b) : 0.5);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold">{post.predictionMarket?.question}</h3>
      <div className="h-3 rounded bg-gray-200 relative overflow-hidden">
        <div
          className="bg-green-500 absolute inset-y-0 left-0"
          style={{ width: `${price * 100}%` }}
        />
      </div>
      <div className="text-xs text-gray-600">{Math.round(price * 100)} % YES</div>
      <button
        className="btn-primary w-full"
        disabled={post.predictionMarket?.state !== "OPEN"}
      >
        {post.predictionMarket?.state === "OPEN" ? "Trade" : "Closed"}
      </button>
      {post.predictionMarket?.state === "RESOLVED" && (
        <div className="text-sm font-medium">Outcome: {post.predictionMarket.outcome}</div>
      )}
    </div>
  );
}
