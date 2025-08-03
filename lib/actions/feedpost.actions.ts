// lib/actions/feedpost.actions.ts
"use server";

import { prisma } from "../prismaclient";
import { feed_post_type } from "@prisma/client";
import { getUserFromCookies } from "../serverutils";

interface CreateFeedPostParams {
  caption?: string;
  imageUrl?: string;
  portfolio?: { pageUrl: string; snapshot?: string };
  type: feed_post_type;
}

export async function createFeedPost({
  caption = "",
  imageUrl,
  portfolio,
  type,
}: CreateFeedPostParams) {
    const user = await getUserFromCookies();
    if (!user) throw new Error("Unauthenticated");
//   const author = await getUserFromCookies();
//   if (!author) throw new Error("Unauthenticated");

  await prisma.feedPost.create({
    data: {
        author: { connect: { id: BigInt(user.userId) } },
        caption,
      image_url: imageUrl ?? null,   // keep column names 1-to-1
      portfolio,          // JSON column on feed_posts (assumed)
      type,
    },
  });
}
