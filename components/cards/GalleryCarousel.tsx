"use client";

import Image from "next/image";
import { useState } from "react";
import Button from "antd/lib/button";
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
    <div className="relative mr-[20%] flex w-[100%] max-w-[45rem]  right-3 justify-center">
      <Image
        className="carousel"
        src={urls[currentIndex]}
        alt={`img-${currentIndex}`}
        width={0}
        height={0}
        sizes="100vw"
      />
      {urls.length > 1 && (
        <div className="pointer-events-none absolute inset-0 flex  justify-between px-2">
          <button className="pointer-events-auto bg-transparent border-none carouselbutton px-2 " onClick={handlePrev}>
            <Image
              src="/assets/chevron--left.svg"
              alt="previous"
              width={48}
              height={48}
              className="cursor-pointer object-contain "
            />
          </button>
          <button className="pointer-events-auto bg-transparent border-none carouselbutton px-2" onClick={handleNext}>
            <Image
              src="/assets/chevron--right.svg"
              alt="next"
              width={48}
              height={48}
              className="cursor-pointer object-contain "
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryCarousel;
