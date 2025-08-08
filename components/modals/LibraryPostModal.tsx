"use client";
import React, { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { useCreateLibraryPost } from "@/lib/hooks/useCreateLibraryPost";

type Props = {
  onOpenChange: (v: boolean) => void;
};

export default function LibraryPostModal({ onOpenChange }: Props) {
  const createLibraryPost = useCreateLibraryPost();
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urls, setUrls] = useState<string>("");
  const [files, setFiles] = useState<FileList | null>(null);

  async function onSubmit() {
    if (tab === "url") {
      const list = urls.split("\n").map(s => s.trim()).filter(Boolean);
      await createLibraryPost({ urls: list });
      onOpenChange(false);
      return;
    }
    if (files && files.length) {
      await createLibraryPost({ files: Array.from(files) });
      onOpenChange(false);
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
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => setFiles(e.target.files)}
          />
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
      <div className="mt-4 flex justify-end gap-2">
        <DialogClose asChild>
          <button className="px-3 py-2 rounded border">Cancel</button>
        </DialogClose>
        <button className="px-3 py-2 rounded bg-black text-white" onClick={onSubmit}>Create</button>
      </div>
    </DialogContent>
  );
}

