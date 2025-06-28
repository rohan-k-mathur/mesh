"use client";

import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import TextNodeModal from "@/components/modals/TextNodeModal";
import { createRealtimePost } from "@/lib/actions/realtimepost.actions";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { TextPostValidation } from "@/lib/validations/thread";

const CreateFeedPost = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function onSubmit(values: z.infer<typeof TextPostValidation>) {
    await createRealtimePost({
      text: values.postContent,
      path: "/",
      coordinates: { x: 0, y: 0 },
      type: "TEXT",
      realtimeRoomId: "global",
    });
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-full w-full rounded-md leftsidebar-item border-none hover:outline-2 hover:outline-double hover:outline-emerald-400">
          <Image
            src="/assets/plus-circle.svg"
            alt="create post"
            className="mr-2"
            width={24}
            height={24}
          />
          <p className="text-black max-lg:hidden">New Post</p>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[57rem]">
        <TextNodeModal isOwned={true} currentText="" onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateFeedPost;
