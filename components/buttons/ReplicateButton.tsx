"use client";

import { replicatePost } from "@/lib/actions/thread.actions";
import { replicateFeedPost } from "@/lib/actions/feed.client";
import { replicateRealtimePost } from "@/lib/actions/realtimepost.actions";
import { useAuth } from "@/lib/AuthContext";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";


interface Props {
  postId?: bigint;
  realtimePostId?: string;
  feedPostId?: bigint;
}

const ReplicateButton = ({ postId, realtimePostId, feedPostId }: Props) => {
  const user = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const isUserSignedIn = !!user.user;
  const userObjectId = user?.user?.userId;

  async function handleSubmit() {
    if (!isUserSignedIn) {
      router.push("/login");
      return;
    }
    if (!userObjectId) {
      return;
    }
    if (realtimePostId) {
      await replicateRealtimePost({
        originalPostId: realtimePostId.toString(),
        userId: userObjectId.toString(),
        path: pathname,
        text,
      });
    } else if (feedPostId) {
      await replicateFeedPost({
        originalPostId: feedPostId.toString(),
        userId: userObjectId.toString(),
        path: pathname,
        text,
      });
    } else if (postId) {
      await replicatePost({
        originalPostId: postId.toString(),
        userId: userObjectId.toString(),
        path: pathname,
        text,
      });
    } else {
      return;
    }
    setText("");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button>
          <Image
            src="/assets/replicate.svg"
            alt="replicate"
            width={28}
            height={28}
            className="cursor-pointer object-contain likebutton"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[30rem]">
        <DialogHeader>
          <DialogTitle className="text-white">Replicate Post</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Add text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button onClick={handleSubmit} className="mt-2">
          Replicate
        </Button>
      </DialogContent>
    </Dialog>
  );
  
};


export default ReplicateButton;
