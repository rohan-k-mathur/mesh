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
    <div className="flex flex-col ">
    
      <div className="flex flex-col w-full h-fit  items-start">
        <div className={`${color} flex flex-col rounded-lg p-4 max-w-[90%] w-fit  mt-4 h-fit`}>
          {text && (
            <div className="text-block flex flex-col max-h-screen  h-fit mb-1 mt-1 p-2 custom-scrollbar text-[1.1rem] break-words">
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

      <button onClick={handleExport} className="justify-start mx-auto mr-[44%] likebutton text-[1rem] font-light  w-[20%] py-2 mt-6 mb-4 mb-1 outline-blue px-2">
        Export
      </button>
    </div>
  );
};

export default PortfolioCard;
