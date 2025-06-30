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
    <div className="img-container">
      <Image
        className="img-frame"
        src={urls[currentIndex]}
        alt={`img-${currentIndex}`}
        width={0}
        height={0}
        sizes="200vw"
      />
      {urls.length > 1 && (
        <>
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white px-1"
            onClick={handlePrev}
          >
            ‹
          </button>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white px-1"
            onClick={handleNext}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};

export default GalleryCarousel;
