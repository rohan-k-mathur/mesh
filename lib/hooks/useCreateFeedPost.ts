"use client";
import { useSession } from "@/lib/useSession";

export function useCreateFeedPost() {
  const { session } = useSession();

  async function createFeedPost(args: CreateFeedPostArgs) {
    if (!session) throw new Error("Not authenticated");
    const res = await fetch("/api/feed", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(args),
    });
    if (!res.ok) throw new Error("Failed");
    return res.json();
  }

  return createFeedPost;
}