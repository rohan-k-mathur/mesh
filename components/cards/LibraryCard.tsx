"use client";
import React from "react";
import GalleryCarousel from "./GalleryCarousel";

export type LibraryCardProps = {
  kind: "single" | "stack";
  coverUrl?: string;              // single
  libraryPostId?: string;         // single
  stackId?: string;               // stack
  coverUrls?: string[];           // stack
  size?: number;                  // stack size
  caption?: string | null;
  onOpenPdf?: (libraryPostId: string) => void;
  onOpenStack?: (stackId: string) => void;
};

export default function LibraryCard(props: LibraryCardProps) {
  const { kind, coverUrl, coverUrls = [], size = 0, caption, libraryPostId, stackId, onOpenPdf, onOpenStack } = props;
  if (kind === "single" && coverUrl) {
    return (
      <img
        src={coverUrl}
        alt="PDF cover"
        className="rounded-md cursor-pointer w-full h-auto"
        onClick={() => libraryPostId && onOpenPdf?.(libraryPostId)}
      />
    );
  }

  if (kind === "stack") {
    if (size <= 10) {
      return (
        <div className="grid justify-center items-center w-full">
          <GalleryCarousel urls={coverUrls} caption={caption || undefined} />
        </div>
      );
    }
    // >10: simple 2x2 collage
    const tiles = (coverUrls || []).slice(0, 4);
    return (
      <div className="w-full">
        <div className="grid grid-cols-2 gap-1 rounded-md overflow-hidden">
          {tiles.map((u, i) => (
            <img key={i} src={u} alt={`PDF ${i}`} className="w-full aspect-[4/3] object-cover" />
          ))}
        </div>
        <button
          className="mt-2 text-sm underline"
          onClick={() => stackId && onOpenStack?.(stackId)}
        >
          View Stack ({size})
        </button>
      </div>
    );
  }
  return null;
}

