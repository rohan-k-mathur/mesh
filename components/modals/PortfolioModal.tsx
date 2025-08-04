"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface PortfolioModalProps {
  /** Absolute or site‑relative URL to the published page */
  url: string;
  /** Callback that closes the modal (sets open =false in parent) */
  onClose: () => void;
  /** Optional PNG snapshot for faster display (falls back to iframe) */
  snapshot?: string;
}

/**
 * Full‑screen modal that shows the portfolio page
 * and a CTA button to open it in a new tab.
 */
export default function PortfolioModal({
  url,
  onClose,
  snapshot,
}: PortfolioModalProps) {
   const [dim, setDim] = useState<{ w: number; h: number } | null>(null);

  /* read natural size once the image loads */
  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDim({ w: img.naturalWidth, h: img.naturalHeight });
  };
  /* put focus in modal for accessibility */
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    wrapperRef.current?.focus();
  }, []);

  /* Close on Esc */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

    const maxW  = 0.85 * window.innerWidth;
    const maxH  = 0.85 * window.innerHeight;
  
    return (    <div
      tabIndex={-1}
      ref={wrapperRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm focus:outline-none"
    >
      {/* click‑outside to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close modal overlay"
      />

      {/* Content panel */}
      {/* <div className="relative bg-slate-200 rounded-xl shadow-xl max-w-5xl w-full h-[90vh] overflow-hidden"> */}
 {/* Content panel – width/height adapt to snapshot */}
       <div
        className="relative flex  justify-center bg-slate-200 rounded-xl shadow-xl overflow-hidden"
        style={
          dim
            ? (() => {
                const maxW = 0.9 * window.innerWidth;
                const maxH = 0.9 * window.innerHeight;
                let w = dim.w;
                let h = dim.h;
        
                // scale down until it fits both constraints
                const scale = Math.min(maxW / w, maxH / h);   // allow > 1 when we can
                w *=2;
                h *= scale;
        
                return { width: w, height: h };
              })()
            : { width: "85vw", height: "85vh" }
        }
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-2xl font-bold leading-none z-10 transition-opacity hover:opacity-70"
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Main body */}
        {snapshot ? (
          <Image
            src={snapshot}
            alt="Portfolio preview"
            width={1400}
            height={1025}
            
            onLoad={handleImgLoad}
            
            className="object-contain flex rounded-xl w-fit justify-center"
          />
        ) : (
          <iframe
            src={url}
            title="Portfolio"
            loading="lazy"
            className="w-full h-full border-0"
          />
        )}

        {/* CTA */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 -right-[-2rem] text-black tracking-wide  px-4 py-2 rounded-xl savebutton"
        >
          Visit Page
        </a>
      </div>
    </div>
  );
}
