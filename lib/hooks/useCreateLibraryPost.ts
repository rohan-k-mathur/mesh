"use client";

// NOTE: This is a thin client stub. Wire it to your upload/import pipeline next.
// export function useCreateLibraryPost() {
//   return async function createLibraryPost(input: { files?: File[]; urls?: string[] }) {
//     // TODO: Option A (now): call /api/library/import with { externalUrls: urls }
//     // TODO: Option B: upload files to Supabase; pass storage keys to /api/library/import
//     const res = await fetch("/api/library/import", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ externalUrls: input.urls || [], filesCount: input.files?.length || 0 })
//     });
//     if (!res.ok) throw new Error("Library import failed");
//     return res.json();
//   };
// }
type CreateLibraryResult = {
  postIds: string[];
  stackId?: string;
  coverUrls?: string[];
};

export function useCreateLibraryPost() {
  return async function createLibraryPost(input: {
    files?: File[];
    urls?: string[];
    previews?: string[];
    stackId?: string;
    stackName?: string;
    isPublic?: boolean;
    caption?: string;
  }): Promise<CreateLibraryResult> {
    if (input.files?.length) {
      const form = new FormData();
      input.files.forEach(f => form.append("files", f));
      if (input.previews?.length) form.append("previews", JSON.stringify(input.previews));
      if (input.stackId) form.append("stackId", input.stackId);
      if (input.stackName) form.append("stackName", input.stackName);
      form.append("isPublic", String(!!input.isPublic));
      if (input.caption) form.append("caption", input.caption);

      const res = await fetch("/api/library/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Upload failed: ${(await res.text()) || res.statusText}`);
      return res.json();   // ← { postIds, stackId? }
    }

    if (input.urls?.length) {
      const res = await fetch("/api/library/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`Import failed: ${(await res.text()) || res.statusText}`);
      return res.json();   // ← { postIds, stackId? }
    }

    throw new Error("No files or URLs provided");
  };
}
