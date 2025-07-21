"use client";

import { useRouter } from "next/navigation";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PortfolioSiteBuilderModal() {
  const router = useRouter();
  return (
    // <DialogContent className="max-w-sm">
    //   <DialogHeader>
    //     <DialogTitle>Portfolio Site</DialogTitle>
    //   </DialogHeader>
    //   <div className="py-4 flex justify-center">
    //     <Button onClick={() => router.push("/portfolio/builder")}>Go to Site Builder</Button>
    //   </div>
    // </DialogContent>

    <div>
      <DialogContent className="justify-center items-center max-w-lg max-h-[15rem] h-full px-8 py-12 w-full flex bg-sky-200 border-blue border-2 mt-[-6rem]">
        <DialogHeader>
          <DialogTitle hidden>Site Builder</DialogTitle>
        </DialogHeader>
          <button className="flex justify-center likebutton text-[1.5rem] bg-slate-100 w-3/4 h-fit py-5 items-center mx-auto text-center text-black rounded-xl px-5 tracking-widest "
           onClick={() => router.push("/portfolio/builder")}>
            Site Builder
          </button>
      </DialogContent>
    </div>
  );
}
