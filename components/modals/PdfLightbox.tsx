"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

type PdfLightboxProps = {
  postId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

type PostInfo = {
  id: string;
  title: string;
  fileUrl: string;
  pageCount: number;
  thumbUrls: string[];
};

export default function PdfLightbox({ postId, open, onOpenChange }: PdfLightboxProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<PostInfo | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!open || !postId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/library/post?id=${encodeURIComponent(postId)}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as PostInfo;
        if (!cancelled) setInfo(json);
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[50rem] w-[92vw] h-[92vh] p-2 overflow-hidden bg-slate-500 border-2 border-slate-500">
        <DialogHeader  className="px-3 py-0 h-min flex flex-1 mt-1 items-end text-black">
          <a
            href={info?.fileUrl || "#"}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-white "
          >
            Open
          </a>
       
          <DialogTitle hidden className="truncate">
            {info?.title || "Document"}
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="w-full h-[calc(92vh-56px)] bg-white relative">
          {loading && (
            <div className="absolute inset-0 grid place-items-center text-sm text-gray-500">
              Loading PDF…
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-red-600">
              Failed to load: {error}
            </div>
          )}

          {!loading && !error && info?.fileUrl && (
            // Use native PDF viewer; widest compatibility and zero worker setup.
            // On Safari/iOS, <iframe> generally works better than <object>.
            <iframe
              title={info.title}
              src={`${info.fileUrl}#view=FitH`}
              className="w-full h-full"
              style={{ border: "none" }}
            />
          )}
        </div>

        {/* Footer actions */}
        
      </DialogContent>
    </Dialog>
  );
}
