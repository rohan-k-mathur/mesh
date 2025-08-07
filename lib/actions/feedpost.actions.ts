// lib/actions/feedpost.actions.ts
"use server";

import { prisma } from "../prismaclient";
import { getUserFromCookies } from "../serverutils";
import { feed_post_type } from '@prisma/client'        // ✅ runtime enum

interface CreateFeedPostParams {
  caption?: string;
  content?: string;
  imageUrl?: string;
  portfolio?: { pageUrl: string; snapshot?: string };
  productReview?: {
    productName: string;
    rating: number; // 1 – 5
    summary: string;
    productLink?: string;
    images?: string[];
    claims?: string[];
  };
  postType: feed_post_type;    
}

export async function createFeedPost({
  caption = '',
  content = '',
  imageUrl,
  portfolio,
  productReview,
  postType,
}: CreateFeedPostParams) {
  const user = await getUserFromCookies();
  if (!user) throw new Error("Unauthenticated");

  const post = await prisma.feedPost.create({
    data: {
      author: { connect: { id: BigInt(user.userId) } },
      caption,
      content,
      image_url: imageUrl ?? null,
      portfolio: portfolio ?? null,          // don’t pass undefined
                                    // now a real enum value
  /* one‑to‑one relation – will create ProductReview + nested claims */
  ...(productReview && {
    productReview: {
      create: {
        author_id: BigInt(user.userId), 
        product_name:     productReview.productName,
        rating:           productReview.rating,
        summary:          productReview.summary,
        product_link:     productReview.productLink,
        image_urls:       productReview.images ?? [],
        claims: {
          create: (productReview.claims ?? []).map((t) => ({ text: t })),
        },
      },
    },
  }),
  postType,

    },
  });
  return post    
}
