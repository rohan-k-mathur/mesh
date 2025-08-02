"use client";

import Image from "next/image";
import { useState } from "react";
import Button from "antd/lib/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";   // ⬅️ NEW
import ViewGalleryModal from "../modals/ViewGalleryModal";
import ViewImageModal from "../modals/ViewImageModal";

interface Props {
  urls: string[];
  caption?: string;
}

const GalleryCarousel = ({ urls, caption }: Props) => {
 // const [currentIndex, setCurrentIndex] = useState(0);
  const [[currentIndex, direction], setPage] = useState<[number, number]>([0, 0]);

  const [loaded, setLoaded] = useState(false);
  const [open,   setOpen]   = useState(false);

  const paginate = (dir: 1 | -1) => {
    setPage(([idx]) => [(idx + dir + urls.length) % urls.length, dir]);
    setLoaded(false);              // so Skeleton shows until image arrives
  };
  
  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    paginate(+1);
  };
  const handlePrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    paginate(-1);}
  // };
  // const handlePrev = (e: React.MouseEvent<HTMLButtonElement>) => {
  //   e.stopPropagation();
  //   setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  // };

  // const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
  //   e.stopPropagation();
  //   setCurrentIndex((prev) => (prev + 1) % urls.length);
  // };

  if (urls.length === 0) return null;
  const distance = 500;             // px — tune to your design

const slideVariants = {
  enter:  (dir: number) => ({ x:  dir > 0 ?  distance : -distance, opacity: 0 }),
  center:              { x: 0,   opacity: 1 },
  exit:   (dir: number) => ({ x:  dir > 0 ? -distance :  distance, opacity: 0 })
};

  return (
    <div className="flex flex-col p-1 w-fit border-[1px] border-sky-200 border-opacity-50 
    rounded-xl align-center justify-center items-center shadow-md bg-white bg-opacity-10">
    <div className="w-full flex flex-1 flex-col justify-center items-center max-w-[90%] h-fit ">
    <div className=" h-fit  flex flex-col  justify-center ">
    


<Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex justify-center items-center w-fit focus:outline-none
                     focus-visible:ring-2 ring-offset-2 ring-indigo-400"
        >
     
<div className="relative w-[700px] h-[25rem] overflow-hidden">
  <AnimatePresence initial={false} custom={direction} mode="wait">
    <motion.div
      key={currentIndex}           // ← causes re‑mount on index change
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x:       { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 }
      }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <Image
        fill
        src={urls[currentIndex]}
        alt={`img-${currentIndex}`}
        className="object-contain pt-3"
        sizes="500px"
        priority={currentIndex === 0}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && <Skeleton className="absolute inset-0" />}
    </motion.div>
  </AnimatePresence>
</div>

        </button>
      </DialogTrigger>

      <ViewGalleryModal open={open} onOpenChange={setOpen} images={urls} />

    </Dialog>

      {urls.length > 0 && (
        <div className="pointer-events-none mt-4 justify-center items-center   flex flex-1 w-full relative gap-4  h-full  ">
          <button className=" pointer-events-auto bg-white bg-opacity-20 border-none carouselbutton rounded-xl
          px-[10%] py-2  w-auto max-h-[70%] min-h-[20%] h-auto justify-center align-center items-center    " onClick={handlePrev}>          
                        <p className="justify-start  text-[1.2rem]">{"<"}</p>

           
          </button>
          <button className="pointer-events-auto bg-white bg-opacity-20 border-none carouselbutton rounded-xl
           px-[10%] py-2  w-auto  max-h-[70%] min-h-[20%] h-auto justify-center align-center items-center  " onClick={handleNext}>
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

