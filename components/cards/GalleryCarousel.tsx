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
    <div className="flex flex-col p-1 w-fit border-[1px] border-sky-200 border-opacity-50 
    rounded-xl align-center justify-center items-center shadow-md bg-white bg-opacity-10">
    <div className="w-full flex flex-1 flex-col justify-center items-center max-w-[90%] h-fit ">
    <div className=" h-fit  flex flex-col  justify-center ">
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
          {/* {!loaded && (
            <Skeleton         className="img-feed-frame px-10 items-center justify-center h-[32rem] w-[500px] object-fit"
            />
          )} */}

{/* <Image
        className="carousel px-10 items-center justify-center h-[32rem] w-[500px] object-fit"
        src={urls[currentIndex]}
        alt={`img-${currentIndex}`}
        width={0}
        height={0}
        sizes="100vw"
        onLoad={() => setLoaded(true)}


      /> */}

{/* container establishes the final dimensions immediately */}
<div className="relative w-[700px] h-[25rem] ">
  <Image
    fill                     // let the image cover the container
    src={urls[currentIndex]}
    alt={`img-${currentIndex}`}
    className="object-contain pt-2"
    sizes="500px"
    priority                // first image pre-loads, optional
    onLoad={() => setLoaded(true)}
  />
  {!loaded && (
    <Skeleton className="absolute inset-0" />      
  )}
</div>

        </button>
      </DialogTrigger>

      {/*  Re‑use your existing modal in “view” mode  */}
      <ViewImageModal open={open} onOpenChange={setOpen} imageUrl={urls[currentIndex]} />

    </Dialog>

      {urls.length > 0 && (
        <div className="pointer-events-none mt-4 justify-center items-center   flex flex-1 w-full relative gap-4  h-full  ">
          <button className=" pointer-events-auto bg-white bg-opacity-20 border-none carouselbutton rounded-xl
          px-[15%]   w-auto max-h-[70%] min-h-[20%] h-auto justify-center align-center items-center    " onClick={handlePrev}>          
                        <p className="justify-start  text-[1.2rem]">{"<"}</p>

           
          </button>
          <button className="pointer-events-auto bg-white bg-opacity-20 border-none carouselbutton rounded-xl
           px-[15%]  w-auto  max-h-[70%] min-h-[20%] h-auto justify-center align-center items-center  " onClick={handleNext}>
                                <p className="justify-start   text-[1.2rem]">{">"}</p>

           
          </button>
        </div>
      )}
    
    </div>
    </div>
    <div className="flex flex-wrap mt-4 mb-2 border-t-[1px] border-b-[1px]  border-sky-200 border-opacity-50  py-2 w-full  rounded-none  justify-center items-center   ">
    {/* <hr className="w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-55" /> */}
    <p className="text-center tracking-wide ">{caption}</p>
    </div>
    </div>
  );
};

export default GalleryCarousel;

