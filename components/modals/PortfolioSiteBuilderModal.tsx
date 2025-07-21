"use client";

import { useRouter } from "next/navigation";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PortfolioSiteBuilderModal() {
  const router = useRouter();
  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Portfolio Site</DialogTitle>
      </DialogHeader>
      <div className="py-4 flex justify-center">
        <Button onClick={() => router.push("/portfolio/builder")}>Go to Site Builder</Button>
      </div>
    </DialogContent>
  );
}
