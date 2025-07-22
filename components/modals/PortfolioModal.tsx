"use client";

import { useEffect, useRef } from "react";
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

  return (
    <div
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
      <div className="relative bg-white rounded shadow-xl max-w-5xl w-full h-[90vh] overflow-hidden">

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
            fill
            className="object-contain"
            sizes="(max-width: 1280px) 100vw, 1280px"
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
          className="absolute top-4 -right-[-2rem] bg-blue-600 text-black  px-4 py-2 rounded-xl lockbutton hover:bg-blue-700 transition-colors"
        >
          Visit Page
        </a>
      </div>
    </div>
  );
}
