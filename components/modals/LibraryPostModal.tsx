"use client";
import React, { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useCreateLibraryPost } from "@/lib/hooks/useCreateLibraryPost";
import { useCreateFeedPost } from "@/lib/hooks/useCreateFeedPost";
import { useRouter } from "next/navigation";

type Props = { onOpenChange: (v: boolean) => void };

async function renderFirstPagePNG(file: File): Promise<string> {
  // 💡 lazy load in the browser to avoid SSR "DOMMatrix" issues
  const pdfjsLib: any = await import("pdfjs-dist/build/pdf");

  // 👉 point to the local worker you just copied
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  // If you copied the .js version instead, use: "/pdf.worker.min.js"

  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const targetWidth = 560;
  const scale = targetWidth / viewport.width;
  const scaled = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = Math.floor(scaled.width);
  canvas.height = Math.floor(scaled.height);
  await page.render({ canvasContext: ctx, viewport: scaled }).promise;
  return canvas.toDataURL("image/png");
}

export default function LibraryPostModal({ onOpenChange }: Props) {
  const createLibraryPost = useCreateLibraryPost();
  const createFeedPost = useCreateFeedPost();
  const router = useRouter();

  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urls, setUrls] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [caption, setCaption] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const list =
        tab === "url" ? urls.split("\n").map(s => s.trim()).filter(Boolean) : [];
      if (tab === "url" && !list.length && !(files && files.length)) return;
  
      // 1) build client-side previews (optional)
      let previews: string[] = [];
      if (tab === "upload" && files?.length) {
        previews = (await Promise.all(Array.from(files).map(renderFirstPagePNG))).filter(Boolean);
      }
  
      // 2) create library posts (UPLOAD or IMPORT)
      const result = await createLibraryPost({
        files: tab === "upload" ? Array.from(files ?? []) : undefined,
        urls:  tab === "url" ? list : undefined,    // your /import route handles URLs (unchanged)
        previews,                                   // data URLs we rendered client-side
        isPublic,
        caption,
        stackName: "My Stack",       });
      
      // result MUST be { postIds: string[], stackId?: string }
  
      // 3) create the feed post, passing FK(s)
      const count = tab === "upload" ? (files?.length ?? 0) : list.length;
      const payload =
      count <= 1
      ? { kind: "single", libraryPostId: result.postIds?.[0] ?? null, coverUrl: result.coverUrls?.[0] ?? null, coverUrls: [], size: 1 }
      : { kind: "stack",  stackId: result.stackId ?? null,            coverUrl: null,                     coverUrls: result.coverUrls ?? [], size: count };
  
  
      await createFeedPost({
        type: "LIBRARY",
        content: JSON.stringify(payload),
        caption,
        isPublic,
        libraryPostId: count === 1 ? result.postIds?.[0] : undefined,
        stackId: result.stackId ?? undefined,      });
  
      onOpenChange(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }
  

  return (
    <DialogContent className="max-w-[600px]">
      <DialogHeader>
        <DialogTitle>New Library</DialogTitle>
      </DialogHeader>

      <div className="flex gap-3 text-sm">
        <button className={tab === "upload" ? "underline" : ""} onClick={() => setTab("upload")}>Upload</button>
        <button className={tab === "url" ? "underline" : ""} onClick={() => setTab("url")}>Paste URL(s)</button>
      </div>

      {tab === "upload" ? (
        <div className="mt-3 space-y-3">
          <input type="file" accept="application/pdf" multiple onChange={(e) => setFiles(e.target.files)} />
          <div className="text-xs text-muted-foreground">You can select multiple PDFs.</div>
        </div>
      ) : (
        <textarea
          className="mt-3 w-full h-40 rounded border p-2"
          placeholder="One PDF URL per line"
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
        />
      )}

      {/* Optional visibility toggle */}
      {/* <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        Public
      </label> */}

      <input
        className="mt-3 w-full rounded border p-2"
        placeholder="Optional caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <div className="mt-4 flex justify-end gap-2">
        <DialogClose asChild>
          <button className="px-3 py-2 rounded border" disabled={submitting}>Cancel</button>
        </DialogClose>
        <button className="px-3 py-2 rounded bg-black text-white" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Creating…" : "Create"}
        </button>
      </div>
    </DialogContent>
  );
}
