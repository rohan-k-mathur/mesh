"use client";

import Image from "next/image";
import { useState } from "react";
import Button from "antd/lib/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import ViewGalleryModal from "../modals/ViewGalleryModal";
import ViewImageModal from "../modals/ViewImageModal";
import { buildSlideVariants } from "./helpers/slideVariants";
import { useMemo } from "react";



export type GalleryAnimationStyle =
  | "cylinder"
  | "cube"
  | "portal"
  | "towardscreen";

interface Props {
  urls: string[];
  caption?: string;
  animation?: GalleryAnimationStyle; // NEW   (default = 'cylinder')
  /** When true, fill parent box (Canvas/Renderer). Use <img>, not <Image>. */
  embed?: boolean;
  /** Only used in non-embed path with <Image>. */
  unoptimized?: boolean;
  /** Only used in non-embed path with <Image>. */
  sizes?: string;
}
const GalleryCarousel = ({
  urls,
  caption,
  animation,
  embed = false,
  unoptimized = false,
  sizes,
}: Props) => {
  // const [currentIndex, setCurrentIndex] = useState(0);
  if (!embed && urls.length === 0) return null;

  const [[currentIndex, direction], setPage] = useState<[number, number]>([
    0, 0,
  ]);

  animation = 'portal';
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  const paginate = (dir: 1 | -1) => {
    setPage(([idx]) => [(idx + dir + urls.length) % urls.length, dir]);
    setLoaded(false); // so Skeleton shows until image arrives
  };

  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    paginate(+1);
  };
  const handlePrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    paginate(-1);
  };

  const radius = 270; // 👈 depth “radius” of the cylinder
  const angle = 45; // 👈 how far each neighbour swings away

  const hasArrows = urls.length > 1;
  const prefersReduced = useReducedMotion();
  const slideVariants = useMemo(
    () => buildSlideVariants(animation),
    [animation]
  );

  return (
    <div
    className={
      embed
        ? "w-full h-full"
        : "flex flex-col flex-1 p-1 w-full border border-indigo-200/50 rounded-xl items-center shadow-md bg-white/10"
    }
  >
    <div
      className={
        embed
          ? "w-full h-full flex flex-col items-center justify-center"
          : "w-full flex flex-1 flex-col justify-center items-center max-w-[90%] h-fit"
      }
    >
      <div className={embed ? "w-full h-full" : "h-fit flex flex-col justify-center"}>
          {/* Make this container relative so we can overlay arrows */}
          <div
            className={
              embed
                ? "relative w-full h-full overflow-hidden"
                : "relative w-[600px] h-[400px] overflow-hidden"
            }
            style={{ perspective: 900 }}
          >
            {/* Image (inside DialogTrigger as before) */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex justify-center items-center w-fit focus:outline-none focus-visible:ring-2 ring-offset-2 ring-indigo-400"
                  aria-haspopup="dialog"
                >
                  <AnimatePresence
                    initial={false}
                    custom={direction}
                    mode="wait"
                  >
                    {embed ? (
                      <motion.img
                      key={`${animation}-${currentIndex}-${urls.length}`}   // 👈 include animation in key
                      custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={
                          prefersReduced
                            ? { duration: 0.2, opacity: { duration: 0.2 } }
                            : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                        }
                        transformTemplate={(_, transform) =>
                          `perspective(1000px) ${transform}`
                        }
                        src={urls[currentIndex]}
                        alt={`img-${currentIndex}`}
                        onLoad={() => setLoaded(true)}
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          display: "block",
                          willChange: "transform, opacity",
                          transformStyle: "preserve-3d",
                        }}
                      />
                    ) : (
                      <motion.div
                      key={`${animation}-${currentIndex}-${urls.length}`}  // 👈 include animation in key
                      custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={
                          prefersReduced
                            ? { duration: 0.2, opacity: { duration: 0.2 } }
                            : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
                        }
                        transformTemplate={(_, transform) =>
                          `perspective(1000px) ${transform}`
                        }
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ willChange: "transform, opacity", transformStyle: "preserve-3d" }}
                      >
                        <Image
                          fill
                          src={urls[currentIndex]}
                          alt={`img-${currentIndex}`}
                          className="object-contain pt-1"
                          sizes={sizes ?? "(max-width: 768px) 100vw, 800px"}
                          unoptimized={unoptimized}
                          priority={currentIndex === 0}
                          onLoad={() => setLoaded(true)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </DialogTrigger>

              <ViewGalleryModal
                open={open}
                onOpenChange={setOpen}
                images={urls}
              />
            </Dialog>

            {/* ⬇️ Embed-only overlay arrows (do NOT open modal) */}
            {embed && hasArrows && (
              <div className="absolute inset-0 pointer-events-none">
                <button
                  type="button"
                  aria-label="Previous image"
                  className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 rounded-3xl bg-white/40 likebutton  text-black px-3 py-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage(([i]) => [(i - 1 + urls.length) % urls.length, -1]);
                    setLoaded(false);
                  }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 rounded-3xl bg-white/40 likebutton  text-black px-3 py-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPage(([i]) => [(i + 1) % urls.length, +1]);
                    setLoaded(false);
                  }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Non-embed layout: keep your existing bottom-row buttons */}
        {!embed && hasArrows && (
          <div className="pointer-events-none mt-4 justify-center items-center   flex flex-1 w-full relative gap-4  h-full  ">
            <button
              className=" pointer-events-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors border-none carouselbutton rounded-xl
         px-[10%] py-1  w-auto max-h-[70%] min-h-[20%] h-auto justify-center align-center items-center    "
              onClick={handlePrev}
            >
              <p className="justify-start  text-[1.2rem]">{"<"}</p>
            </button>
            <button
              className="pointer-events-auto bg-white bg-opacity-20 border-none carouselbutton rounded-xl
          px-[10%] py-1  w-auto  max-h-[70%] min-h-[20%] h-auto justify-center align-center items-center  "
              onClick={handleNext}
            >
              <p className="justify-start   text-[1.2rem]">{">"}</p>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap mt-4 mb-2 border-t-[1px]   border-indigo-300 border-opacity-50   w-full  rounded-none  justify-center items-center   ">
        {/* <hr className="w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-55" /> */}
        <p className="text-center tracking-wide pt-2 ">{caption}</p>
      </div>
    </div>
  );
};

export default GalleryCarousel;
