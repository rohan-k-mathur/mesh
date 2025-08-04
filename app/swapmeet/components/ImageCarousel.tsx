"use client";
import useEmblaCarousel from "embla-carousel-react";

export function ImageCarousel({ images }: { images: { url: string }[] }) {
  const [emblaRef] = useEmblaCarousel({ loop: true });
  if (!images.length) return null;
  return (
    <div className="overflow-hidden w-full" ref={emblaRef}>
      <div className="flex">
        {images.map((img) => (
          <div key={img.url} className="flex-[0_0_100%]">
            <img src={img.url} alt="" className="w-full h-48 object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
