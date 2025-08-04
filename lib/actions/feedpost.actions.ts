// lib/actions/feedpost.actions.ts
"use server";

import { prisma } from "../prismaclient";
import { feed_post_type } from "@prisma/client";
import { getUserFromCookies } from "../serverutils";
import type { feed_post_type } from "@prisma/client";   // ✅ type-only import

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
  type: feed_post_type;    
}

export async function createFeedPost({
  caption = "",
  content = "",
  imageUrl,
  portfolio,
  productReview,
  type,
}: CreateFeedPostParams) {
  const user = await getUserFromCookies();
  if (!user) throw new Error("Unauthenticated");

  await prisma.feedPost.create({
    data: {
      author: { connect: { id: BigInt(user.userId) } },
      caption,
      content,
      image_url: imageUrl ?? null, // keep column names 1-to-1
      portfolio, // JSON column on feed_posts (assumed)
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
    //   ...(productReview && {
    //     productReview: {
    //       create: {
    //         author_id: BigInt(user.userId),
    //         product_name: productReview.productName,
    //         rating: productReview.rating,
    //         ...(productReview.summary && { summary: productReview.summary }),
    //         ...(productReview.productLink && {
    //           product_link: productReview.productLink,
    //         }),
    //         image_urls: productReview.images ?? [],
    //         claims: {
    //           create: (productReview.claims ?? []).map((text) => ({ text })),
    //         },
    //       },
    //     },
    //   }),
      type,
    },
  });
}
