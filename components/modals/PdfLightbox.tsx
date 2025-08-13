"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function PdfLightbox({
  trigger,
  fileUrl,
  title = "PDF",
}: {
  trigger: React.ReactNode;
  fileUrl: string;
  title?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div onClick={() => setOpen(true)}>{trigger}</div>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] w-[900px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="w-full h-[calc(80vh-4rem)]">
          <iframe src={fileUrl} className="w-full h-full rounded border" title={title} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
