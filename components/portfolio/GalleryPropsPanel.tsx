"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { uploadFileToSupabase, uploadPortfolioFileToSupabase } from "@/lib/utils";
import GalleryNodeModal from "@/components/modals/GalleryNodeModal";
import ViewGalleryModal from "@/components/modals/ViewGalleryModal";
import { AnimatedDialog } from "@/components/ui/AnimatedDialog";

type GalleryProps = {
  urls: string[];
  caption?: string;
  animation?: "cylinder" | "cube" | "portal" | "towardscreen";
};

export default function GalleryPropsPanel({
  componentId,
  value,
  onChange,
}: {
  componentId: string;
  value: GalleryProps;
  onChange: (next: GalleryProps) => void;
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);

  // Accepts values from GalleryNodeForm (zod-inferred type). We only care about images (File[]), caption, isPublic.
  const handleSubmit = async (values: any) => {
    const files: File[] = Array.isArray(values?.images) ? values.images : [];
    const uploadedUrls: string[] = [];

    for (const f of files) {
      const res = await uploadFileToSupabase(f);
      if (!res.error && res.fileURL) uploadedUrls.push(res.fileURL);
    }

    const next: GalleryProps = {
      ...value,
      caption: values?.caption ?? value.caption,
      urls: [...(value.urls || []), ...uploadedUrls],
      // animation unchanged here; user can edit below
    };

    onChange(next);
    setOpenEdit(false);
  };

  return (
    <div className="flex flex-col space-y-3 mt-6">
      <div className="text-xs uppercase tracking-wide text-slate-500">
        Gallery
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          className="border border-black px-3 py-1 rounded-xl bg-white lockbutton"
          onClick={() => setOpenEdit(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className="border border-black px-3 py-1 rounded-xl bg-white lockbutton"
          disabled={!value.urls?.length}
          onClick={() => setOpenView(true)}
        >
          Preview
        </button>
      </div>

      <p className="block text-xs ">Caption</p>
      <Input
      className="titlefield labelbutton outline-none border-none "
        value={value.caption ?? ""}
        onChange={(e) => onChange({ ...value, caption: e.target.value })}
      />

      <label className="block text-xs">Animation</label>
      <select
        className=" labelbutton border rounded p-1 text-xs bg-white focus:outline-none"
        value={value.animation ?? "cube"}
        onChange={(e) =>
          onChange({
            ...value,
            animation: e.target.value as GalleryProps["animation"],
          })
        }
      >
        <option value="cube">cube</option>
        <option value="cylinder">cylinder</option>
        <option value="portal">portal</option>
        <option value="towardscreen">towardscreen</option>
      </select>

      {/* Wrap your modal in a Dialog provider so it renders inside the Builder */}
      <AnimatedDialog open={openEdit} onOpenChange={setOpenEdit}>
        <GalleryNodeModal
          id={componentId}                 // treat as "edit" flow even when empty
          isOwned={true}
          isPublic={true}
          onSubmit={handleSubmit}
          currentImages={value.urls || []}
          currentCaption={value.caption}
        />
      </AnimatedDialog>

      {/* Your viewer modal already includes AnimatedDialog internally */}
      <ViewGalleryModal
        open={openView}
        onOpenChange={setOpenView}
        images={value.urls || []}
      />
    </div>
  );
}
