"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  urls: string[];
}

const GalleryCarousel = ({ urls }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  if (urls.length === 0) return null;

  return (
    <div className="relative mx-auto flex w-full max-w-[500px] justify-center">
      <Image
        className="carousel"
        src={urls[currentIndex]}
        alt={`img-${currentIndex}`}
        width={0}
        height={0}
        sizes="100vw"
      />
      {urls.length > 1 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
          <button
            className="pointer-events-auto bg-black/50 text-white px-1"
            onClick={handlePrev}
          >
            ‹
          </button>
          <button
            className="pointer-events-auto bg-black/50 text-white px-1"
            onClick={handleNext}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryCarousel;
