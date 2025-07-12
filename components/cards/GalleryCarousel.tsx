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
    <div className="w-full flex flex-1  max-w-[90%]  h-fit justify-center">
    <div className="relative h-fit my-0  flex justify-center mx-auto">
      <Image
        className="carousel px-10 items-center justify-center h-fit w-[100%]"
        src={urls[currentIndex]}
        alt={`img-${currentIndex}`}
        width={0}
        height={0}
        sizes="100vw"


      />
      {urls.length > 0 && (
        <div className="pointer-events-none max-w-[100%] max-h-[100%]  flex flex-1 w-full absolute inset-0   h-full justify-between px-[-4]">
          <button className=" pointer-events-auto bg-transparent border-none carouselbutton 
          px-2 max-w-[4rem] min-w-[2rem] w-fit max-h-[70%] min-h-[20%] h-auto justify-center align-center items-center my-auto py-2  " onClick={handlePrev}>          
            <Image
              src="/assets/chevron--left.svg"
              alt="previous"
              width={0}
              height={0}
              sizes="30vw"
              className="cursor-pointer object-contain w-fit h-fit"
              layout="responsive"


            />
          </button>
          <button className="pointer-events-auto bg-transparent border-none carouselbutton 
          px-2 max-w-[4rem] min-w-[2rem] w-fit max-h-[70%] min-h-[20%] h-auto justify-center align-center items-center my-auto py-2  " onClick={handleNext}>
            <Image
              src="/assets/chevron--right.svg"
              alt="next"
              width={0}
              height={0}
              sizes="30vw"
              className="cursor-pointer object-contain w-fit h-fit"
              layout="responsive"

            />
          </button>
        </div>
      )}
    </div>
    </div>
  );
};

export default GalleryCarousel;
