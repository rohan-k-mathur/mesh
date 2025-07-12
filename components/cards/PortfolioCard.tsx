"use client";

import Image from "next/image";

interface PortfolioCardProps {
  text: string;
  images: string[];
  links: string[];
  layout: "grid" | "column";
  color: string;
}

const PortfolioCard = ({ text, images, links, layout, color }: PortfolioCardProps) => {
  const handleExport = async () => {
    const res = await fetch("/api/portfolio/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, images, links, layout, color }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col">
      <button onClick={handleExport} className="likebutton w-fit self-end mb-2 px-2">
        Export
      </button>
      <div className="portfolio-container flex flex-col w-[34rem] max-h-[3000px]">
        <div className={`${color} flex flex-col gap-2 rounded-lg p-4 mt-4 max-h-[3000px]`}>
          {text && (
            <div className="text-block flex flex-col max-h-[1000px] mb-1 mt-2 break-words">
              {text}
            </div>
          )}
          {images.map((src, idx) => (
            <Image
              key={idx}
              src={src}
              alt={`img-${idx}`}
              width={200}
              height={200}
              className={`object-cover portfolio-img-frame ${idx === 0 ? "flex flex-col max-h-[3000px] mb-1 mt-2 break-words" : ""}`}
            />
          ))}
          {links.map((href, idx) => (
            <a
              key={idx}
              href={href}
              className="text-blue-500 underline break-all"
              target="_blank"
              rel="noreferrer"
            >
              {href}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;
