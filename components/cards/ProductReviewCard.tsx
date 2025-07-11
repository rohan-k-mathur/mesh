"use client";

import { ThumbsUp, ThumbsDown, BadgeDollarSign } from "lucide-react";
import { useState } from "react";

interface ProductReviewCardProps {
  productName: string;
  rating: number;
  summary: string;
  productLink: string;
  claims: string[];
}

const ProductReviewCard = ({
  productName,
  rating,
  summary,
  productLink,
  claims,
}: ProductReviewCardProps) => {
  const [voteCounts, setVoteCounts] = useState(
    claims.map(() => ({ helpful: 0, unhelpful: 0, vouch: 0 }))
  );

  const handleVote = (idx: number, type: "helpful" | "unhelpful") => {
    setVoteCounts((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [type]: copy[idx][type] + 1 };
      return copy;
    });
  };

  const handleVouch = (idx: number) => {
    setVoteCounts((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], vouch: copy[idx].vouch + 1 };
      return copy;
    });
  };
  return (
    <div className="flex justify-center">
    <div className="w-[45rem] h-[24rem]  rounded-md">
    <div className="flex flex-col  items-start mt-2 mb-2">
      <div className="font-bold">{productName}</div>
      <div>Rating: {rating}/5</div>
      <div className="text-sm mt-1">{summary}</div>
      <ul className="list-disc pl-5 mt-2 space-y-2 w-full">
        {claims.map((c, idx) => (
          <li key={idx} className="text-sm">
            <div className="flex justify-between items-center">
              <span>{c}</span>
              <div className="flex items-center gap-2 text-xs">
                <button onClick={() => handleVote(idx, "helpful")} aria-label="Helpful" className="p-1">
                  <ThumbsUp className="h-4 w-4" /> {voteCounts[idx].helpful}
                </button>
                <button onClick={() => handleVote(idx, "unhelpful")} aria-label="Unhelpful" className="p-1">
                  <ThumbsDown className="h-4 w-4" /> {voteCounts[idx].unhelpful}
                </button>
                <button onClick={() => handleVouch(idx)} aria-label="Vouch" className="p-1">
                  <BadgeDollarSign className="h-4 w-4" /> {voteCounts[idx].vouch}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <a
        href={productLink}
        className="text-xs text-blue-500"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Product
      </a>
    </div>
    </div>

    </div>

  );
};

export default ProductReviewCard;
