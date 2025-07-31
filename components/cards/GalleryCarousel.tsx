"use client";

import Image from "next/image";
import { useState } from "react";
import Button from "antd/lib/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

import ViewImageModal from "../modals/ViewImageModal";

interface Props {
  urls: string[];
  caption?: string;
}

const GalleryCarousel = ({ urls, caption }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [open,   setOpen]   = useState(false);


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
    <div className="w-full  justify-center items-center flex flex-col mx-auto">
    <div className="w-full flex flex-1 flex-col justify-center items-center mx-auto max-w-[90%] mx-auto h-fit ">
    <div className="relative h-fit  flex flex-col  justify-center mx-auto">
      {/* <Image
        className="carousel px-10 items-center justify-center h-[32rem] w-[500px] object-fit"
        src={urls[currentIndex]}
        alt={`img-${currentIndex}`}
        width={0}
        height={0}
        sizes="100vw"


      /> */}


<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/*  wrapper ensures the whole card is clickable  */}
        <button
          type="button"
          className="flex justify-center items-center w-fit focus:outline-none
                     focus-visible:ring-2 ring-offset-2 ring-indigo-400"
        >
          {/*  skeleton while the <img> is downloading  */}
          {!loaded && (
            <Skeleton className="img-feed-frame mt-4 mb-4 w-full h-[300px]" />
          )}

<Image
        className="carousel px-10 items-center justify-center h-[32rem] w-[500px] mx-auto object-fit"
        src={urls[currentIndex]}
        alt={`img-${currentIndex}`}
        width={0}
        height={0}
        sizes="100vw"
        onLoad={() => setLoaded(true)}


      />
        </button>
      </DialogTrigger>

      {/*  Re‑use your existing modal in “view” mode  */}
      <ViewImageModal open={open} onOpenChange={setOpen} imageUrl={urls[currentIndex]} />

    </Dialog>

      {urls.length > 0 && (
        <div className="pointer-events-none mt-4 justify-center items-center   flex flex-1 w-full relative   h-full  ">
          <button className=" pointer-events-auto bg-white bg-opacity-20 border-none carouselbutton rounded-xl
          px-[15%] mx-auto  w-auto max-h-[70%] min-h-[20%] h-auto justify-center align-center items-center    " onClick={handlePrev}>          
                        <p className="justify-start mx-auto text-[1.2rem]">{"<"}</p>

           
          </button>
          <button className="pointer-events-auto bg-white bg-opacity-20 border-none carouselbutton rounded-xl
           px-[15%] mx-auto  w-auto  max-h-[70%] min-h-[20%] h-auto justify-center align-center items-center  " onClick={handleNext}>
                                <p className="justify-start mx-auto  text-[1.2rem]">{">"}</p>

           
          </button>
        </div>
      )}
    
    </div>
    </div>
    <div className="mt-4 w-full justify-center items-center  w-full ">
    <hr className="w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-55" />
    <p className="text-center tracking-wide mb-0 pt-3">{caption}</p>
    </div>
    </div>
  );
};

export default GalleryCarousel;

