"use client";

import { ThumbsUp, ThumbsDown, BadgeDollarSign, Link } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchClaimStats, voteClaim, vouchClaim } from "@/lib/actions/productreview.actions";
import { useAuth } from "@/lib/AuthContext";
import React from "react";
import localFont from 'next/font/local'
const founders = localFont({ src: './NewEdgeTest-RegularRounded.otf' })

interface ProductReviewCardProps {
  productName: string;
  rating: number;
  summary: string;
  productLink: string;
  claims: string[];
  claimIds?: (string | number | bigint)[];
}

const ProductReviewCard = ({
  productName,
  rating,
  summary,
  productLink,
  claims,
  claimIds,
}: ProductReviewCardProps) => {
  const auth = useAuth();
  const userId = auth.user?.userId ?? null;
  const [voteCounts, setVoteCounts] = useState(
    claims.map(() => ({ helpful: 0, unhelpful: 0, vouch: 0 }))
  );

  useEffect(() => {
    setVoteCounts(claims.map(() => ({ helpful: 0, unhelpful: 0, vouch: 0 })));
  }, [claims]);

  useEffect(() => {
    async function loadCounts() {
      if (!claimIds) return;
      const counts = await Promise.all(
        claimIds.map((id) => fetchClaimStats(id.toString()))
      );
      setVoteCounts(
        counts.map((c) => ({
          helpful: c?.helpful_count ?? 0,
          unhelpful: c?.unhelpful_count ?? 0,
          vouch: c?.vouch_total ?? 0,
        }))
      );
    }
    loadCounts();
  }, [claimIds]);

  const handleVote = async (idx: number, type: "helpful" | "unhelpful") => {
    if (claimIds) {
      if (userId === null) return;
      await voteClaim({
        claimId: claimIds[idx].toString(),
        userId: userId!.toString(),
        type: type === "helpful" ? "HELPFUL" : "UNHELPFUL",
      });
      const updated = await fetchClaimStats(claimIds[idx].toString());
      setVoteCounts((prev) => {
        const copy = [...prev];
        copy[idx] = {
          helpful: updated?.helpful_count ?? 0,
          unhelpful: updated?.unhelpful_count ?? 0,
          vouch: copy[idx].vouch,
        };
        return copy;
      });
    } else {
      setVoteCounts((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], [type]: copy[idx][type] + 1 };
        return copy;
      });
    }
  };

  const handleVouch = async (idx: number) => {
    if (claimIds) {
      if (userId === null) return;
      await vouchClaim({
        claimId: claimIds[idx].toString(),
        userId: userId!.toString(),
        amount: 1,
      });
      const updated = await fetchClaimStats(claimIds[idx].toString());
      setVoteCounts((prev) => {
        const copy = [...prev];
        copy[idx] = {
          helpful: updated?.helpful_count ?? copy[idx].helpful,
          unhelpful: updated?.unhelpful_count ?? copy[idx].unhelpful,
          vouch: updated?.vouch_total ?? copy[idx].vouch,
        };
        return copy;
      });
    } else {
      setVoteCounts((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], vouch: copy[idx].vouch + 1 };
        return copy;
      });
    }
  };
  return (
    <div className="flex justify-center text-[1rem]">
    <div className="w-[45rem] h-fit  rounded-md">
    <div className="flex flex-col   mt-0 mb-0">
      <div className="flex flex-col items-center">
      <div className="items-center   font-bold"> <h1 className="text-[1.5rem] font-bold"> {productName} </h1> </div>
      <div className="text-[1.1rem] mb-2">Rating: {rating}/5</div>
      </div>
      <hr></hr>
      <div className=" my-2 items-start">{"Review: " + summary}</div>
      <hr></hr>

      <ul className="flex  flex-wrap gap-x-2 px-2 my-2  w-full h-fit">
        {claims.map((c, idx) => (
          <li key={idx} className="text-[1rem] w-fit text-block  h-fit">
            <div className="flex flex-col my-2 mx-2  justify-between items-center">
              <span className="text-block text-[1rem] leading-[1.2rem]">{c}</span>
              <div className="flex items-center mt-1  gap-3 text-xs">
                <button onClick={() => handleVote(idx, "helpful")} aria-label="Helpful" className="py-1">
                  <ThumbsUp className="h-4 w-4 mb-1" /> {voteCounts[idx]?.helpful ?? 0}
                </button>
                <button onClick={() => handleVote(idx, "unhelpful")} aria-label="Unhelpful" className="py-1">
                  <ThumbsDown className="h-4 w-4 mb-1" /> {voteCounts[idx]?.unhelpful ?? 0}
                </button>
                <button onClick={() => handleVouch(idx)} aria-label="Vouch" className="py-1">
                  <BadgeDollarSign className="h-4 w-4 mb-1" /> {voteCounts[idx]?.vouch ?? 0}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <hr></hr>

<div className="flex flex-wrap gap-4 mt-2">
      {/* <Link href="productlink" className="bg-transparent likebutton border-none outline-black outline-blue w-fit text-black  rounded-xl px-2 py-2"> View Product  </Link> */}
      <a
        href={productLink}
        className="mt-1 bg-transparent likebutton border-none outline-black outline-blue w-fit text-black  rounded-xl px-2 py-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        Product Link
      </a>
      <a
        href={productLink}
        className="mt-1 bg-transparent likebutton border-none outline-black outline-blue w-fit text-black  rounded-xl px-2 py-2"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Photos
      </a>
      </div>
    </div>
    </div>

    </div>

  );
};

export default ProductReviewCard;
