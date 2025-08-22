"use client";
import React, { useRef, useState, startTransition } from "react";
import { uploadPortfolioFileToSupabase } from "@/lib/utils";

type GalleryProps = {
  urls: string[];
  caption?: string;
  animation?: "cylinder" | "cube" | "portal" | "towardscreen";
};

export default function GalleryInspector({
  value,
  onChange,
}: {
  value: GalleryProps;
  onChange: (patch: Partial<GalleryProps>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          const { fileURL, error } = await uploadPortfolioFileToSupabase(file, {
            bucket: "realtime_post_images",
            folder: "public",
          });
          if (error || !fileURL) throw error || new Error("upload failed");
          return fileURL;
        })
      );
      // single batched patch keeps re-renders minimal
      startTransition(() => {
        onChange({ urls: [...(value.urls ?? []), ...uploads] });
      });
    } catch (e) {
      console.error("upload failed", e);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeAt(i: number) {
    const next = [...(value.urls ?? [])];
    next.splice(i, 1);
    startTransition(() => onChange({ urls: next }));
  }

  return (
    <div className="space-y-4">
      {/* Upload */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          disabled={busy}
          className="px-3 py-1 rounded-md bg-white/80 border text-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          {busy ? "Uploading…" : "Upload images"}
        </button>
        <span className="text-xs text-slate-500">…or paste URLs below</span>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-3 gap-2">
        {(value.urls ?? []).map((u, i) => (
          <div key={i} className="relative border rounded overflow-hidden">
            <img
              src={u}
              alt=""
              className="w-full h-24 object-cover"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
            <button
              className="absolute top-1 right-1 text-xs bg-white/80 rounded px-1"
              onClick={() => removeAt(i)}
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}
        {!value.urls?.length && (
          <div className="text-xs text-slate-500 col-span-3">
            No images yet — upload or enter URLs below.
          </div>
        )}
      </div>

      {/* URL textarea (optional) */}
      <label className="block">
        <div className="text-xs text-slate-600 mb-1">Image URLs (one per line)</div>
        <textarea
          className="w-full h-24 border rounded p-2 text-sm bg-white"
          value={(value.urls ?? []).join("\n")}
          onChange={(e) =>
            startTransition(() =>
              onChange({ urls: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })
            )
          }
        />
      </label>

      {/* Caption + Animation (render just what we need) */}
      <label className="block">
        <div className="text-xs text-slate-600 mb-1">Caption</div>
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          value={value.caption ?? ""}
          onChange={(e) => startTransition(() => onChange({ caption: e.target.value }))}
        />
      </label>

      <label className="block">
        <div className="text-xs text-slate-600 mb-1">Animation</div>
        <select
          className="w-full border rounded px-2 py-1 text-sm"
          value={value.animation ?? "cube"}
          onChange={(e) => startTransition(() => onChange({ animation: e.target.value as any }))}
        >
          <option value="cylinder">Cylinder</option>
          <option value="cube">Cube</option>
          <option value="portal">Portal</option>
          <option value="towardscreen">Toward Screen</option>
        </select>
      </label>
    </div>
  );
}
