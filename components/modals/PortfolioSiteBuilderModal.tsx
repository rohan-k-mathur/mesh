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
      <DialogContent className="max-w-[50rem]  bg-slate-700 border-blue ">
        <DialogHeader>
          <DialogTitle className="h-0" hidden>Go to Page Builder</DialogTitle>
        </DialogHeader>
          <button className="flex justify-center savebutton text-[1.5rem] bg-slate-100 w-3/4 h-fit py-5 items-center mx-auto text-center text-black rounded-xl px-5 tracking-widest mb-2"
           onClick={() => router.push("/portfolio/builder")}>
            Go to Page Builder
          </button>
      </DialogContent>
    </div>
  );
}
