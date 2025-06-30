"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CommentTextarea } from "../ui/commenttextarea";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
//import { updateUser } from "@/lib/actions/user.actions"
import { useRouter, usePathname } from "next/navigation";
import { CommentValidation } from "@/lib/validations/thread";
import Image from "next/image";
import {
  addCommentToPost,
} from "@/lib/actions/thread.actions";
import { addCommentToRealtimePost } from "@/lib/actions/realtimepost.actions";
import ReplyButton from "../buttons/ReplyButton";
interface Props {
  postId?: bigint;
  realtimePostId?: string;
  currentUserImg: string;
  currentUserId: bigint;
}
const Comment = ({ postId, realtimePostId, currentUserImg, currentUserId }: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(CommentValidation),
    defaultValues: {
      thread: "",
      accountId: currentUserId,
    },
  });

  const onSubmit = async (values: z.infer<typeof CommentValidation>) => {
    if (realtimePostId) {
      await addCommentToRealtimePost({
        parentPostId: BigInt(realtimePostId),
        commentText: values.thread,
        userId: currentUserId,
        path: pathname,
      });
    } else if (postId) {
      await addCommentToPost({
        parentPostId: postId,
        commentText: values.thread,
        userId: currentUserId,
        path: pathname,
      });
    }

    form.reset();
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="comment-form">
        <FormField
          control={form.control}
          name="thread"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 w-full h-full">
     
              <FormControl className=" bg-transparent ">
          
                <CommentTextarea
                  placeholder="Comment..."
                  rows={1}
                  className="comment-textarea   no-focus text-black "
                  {...field}
                  ></CommentTextarea>
              </FormControl>
              
            </FormItem>
          )}
        />
        <Button type="submit" variant="ghost" className=" comment-form_btn mr-2">
          Reply
        </Button>
      </form>
    </Form>
  );
};

export default Comment;
