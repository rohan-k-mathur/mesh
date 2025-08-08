"use client";

// NOTE: This is a thin client stub. Wire it to your upload/import pipeline next.
export function useCreateLibraryPost() {
  return async function createLibraryPost(input: { files?: File[]; urls?: string[] }) {
    // TODO: Option A (now): call /api/library/import with { externalUrls: urls }
    // TODO: Option B: upload files to Supabase; pass storage keys to /api/library/import
    const res = await fetch("/api/library/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ externalUrls: input.urls || [], filesCount: input.files?.length || 0 })
    });
    if (!res.ok) throw new Error("Library import failed");
    return res.json();
  };
}

