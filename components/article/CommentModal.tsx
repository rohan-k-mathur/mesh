"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { CommentThread } from "@/types/comments";

interface CommentModalProps {
  thread: CommentThread;
  open: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export default function CommentModal({
  thread,
  open,
  onClose,
  currentUserId,
}: CommentModalProps) {
  const comment = thread.comments[0];
  const [upvotes, setUpvotes] = useState(comment.upvotes);
  const [downvotes, setDownvotes] = useState(comment.downvotes);

  async function handleVote(delta: number) {
    try {
      const res = await fetch(`/api/comments/${comment.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        if (delta === 1) setUpvotes((v) => v + 1);
        else setDownvotes((v) => v + 1);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const isAuthor = currentUserId === thread.createdBy;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-200">
        <DialogHeader>
          <DialogTitle hidden>Comment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {thread.comments.map((c) => (
            <p key={c.id} className="text-[1rem] border-black border-[2px] bg-white chat-bubble 
             shadow-black rounded-xl p-2 tracking-wide whitespace-pre-wrap">
              {c.body}
            </p>
          ))}
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-1 text-[.9rem] border-[1px] border-black rounded-xl bg-white lockbutton"
              onClick={() => handleVote(1)}
            >
              ▲ {upvotes}
            </button>
            <button
              className="px-4 py-1 text-[.9rem] border-[1px] border-black rounded-xl bg-white lockbutton"
              onClick={() => handleVote(-1)}
            >
              ▼ {downvotes}
            </button>
          </div>
          <textarea
            className="w-full border rounded p-2 text-sm"
            placeholder="Reply coming soon..."
            disabled
          />
          {isAuthor && (
            <div className="flex gap-2">
              <button className="px-2 py-1 text-xs border rounded">
                Resolve
              </button>
              <button className="px-2 py-1 text-xs border rounded">
                Delete
              </button>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose className="px-4 py-1 lockbutton text-sm border-[1px] border-black bg-white rounded-xl">
            Close
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
