"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

interface PortfolioCardProps {
  /** absolute URL or site‑relative slug (/portfolio/abc123) */
  pageUrl: string;

  /** Optional pre‑computed snapshot (PNG) for faster preview */
  snapshot?: string;

  /** For legacy posts that still show raw text/images until they’re published */
  text?: string;
  images?: string[];
  links?: string[];

  /** Needed only if you still support in‑feed export */
  layout?: "grid" | "column" | "free";
  color?: string;
}

/* ————————————————————————————————————————————— */
/* ✨ Modal implemented with dynamic import so it   */
/*    isn’t bundled on every feed page load.        */
dynamic(() => import("@/components/modals/PortfolioModal"), { ssr: false });
/* ————————————————————————————————————————————— */

export default function PortfolioCard({
  pageUrl,
  snapshot,
  text = "",
  images = [],
  links = [],
  layout = "column",
  color = "bg-white",
}: PortfolioCardProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  /* OPTIONAL — legacy export button */
  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/portfolio/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, images, links, layout, color }),
      });
      if (!res.ok) throw new Error("export failed");
      const { url } = await res.json();
      window.open(url, "_blank");
    } finally {
      setExporting(false);
    }
  }

  /* —————————————————————————————— */
  /* Preview iframe (scaled thumbnail) */
  /* —————————————————————————————— */
  const preview = snapshot ? (
    <Image
      src={snapshot}
      alt="Portfolio preview"
      fill
      className="object-cover"
    />
  ) : (
    /* Scaled iframe preview */
    <iframe
      src={pageUrl}
      loading="lazy"
      className="w-[1200px] h-[800px] scale-[0.25] origin-top-left pointer-events-none"
      /* 1200×800 is arbitrary; it just needs to be ≥ the actual canvas */
    />
  );

  return (
    <>
      {/* Card container */}
      <div className="flex flex-col gap-3 w-full">
        {/* Thumbnail frame */}
        <div
          onClick={() => setOpen(true)}
          className="relative w-[300px] h-[180px] overflow-hidden border rounded cursor-pointer shadow-sm"
        >
          {preview}
        </div>

        {/* (Optional) old text preview if post not yet published */}
        {!pageUrl && (
          <div className="text-xs text-gray-500">
            Draft: {text.slice(0, 120)}…
          </div>
        )}

        {/* (Optional) Export / Re‑publish button */}
        {text && (
          <button
            onClick={handleExport}
            disabled={exporting}
            className="likebutton text-sm px-3 py-1 rounded border w-fit"
          >
            {exporting ? "Exporting…" : "Export"}
          </button>
        )}
      </div>

      {/* Modal — lazy‑loaded client component */}
      {open && (
        <Modal
          url={pageUrl}
          onClose={() => setOpen(false)}
          snapshot={snapshot}
        />
      )}
    </>
  );
}
