"use client";

import { ThumbsUp, ThumbsDown, BadgeDollarSign, Link } from "lucide-react";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    setVoteCounts(claims.map(() => ({ helpful: 0, unhelpful: 0, vouch: 0 })));
  }, [claims]);

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
    <div className="w-[45rem] h-fit  rounded-md">
    <div className="flex flex-col  items-start mt-2 mb-2">
      <div className="font-bold">{"Product Name: " + productName}</div>
      <div>Rating: {rating}/5</div>
      <div className="text-sm mt-1">{"Review: " + summary}</div>

      <ul className="list-disc pl-2  space-y-2 w-full">
        Claims: 
        {claims.map((c, idx) => (
          <li key={idx} className="text-sm">
            <div className="flex flex-col mt-2 ml-4 justify-between items-start">
              <span>{c}</span>
              <div className="flex items-start gap-3 text-xs">
                <button onClick={() => handleVote(idx, "helpful")} aria-label="Helpful" className="p-1">
                  <ThumbsUp className="h-4 w-4" /> {voteCounts[idx]?.helpful ?? 0}
                </button>
                <button onClick={() => handleVote(idx, "unhelpful")} aria-label="Unhelpful" className="p-1">
                  <ThumbsDown className="h-4 w-4" /> {voteCounts[idx]?.unhelpful ?? 0}
                </button>
                <button onClick={() => handleVouch(idx)} aria-label="Vouch" className="p-1">
                  <BadgeDollarSign className="h-4 w-4" /> {voteCounts[idx]?.vouch ?? 0}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* <Link href="productlink" className="bg-transparent likebutton border-none outline-black outline-blue w-fit text-black  rounded-xl px-2 py-2"> View Product  </Link> */}
      <a
        href={productLink}
        className="mt-2 bg-transparent likebutton border-none outline-black outline-blue w-fit text-black  rounded-xl px-2 py-2"
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
