"use server";

import { like_type } from "@prisma/client";
import { prisma } from "../prismaclient";

interface likePostParams {
  userId: bigint;
  postId: bigint;
}

export async function likePost({ userId, postId }: likePostParams) {
  try {
    const existingLike = await fetchLikeForCurrentUser({
      userId: userId,
      postId: postId,
    });
    if (existingLike && existingLike.type === like_type.LIKE) {
      console.log(
        `User ${userId} has already liked post ${postId}. Returning...`
      );
      return;
    }
    let likeChangeAmount = 1;
    if (existingLike && existingLike.type === like_type.DISLIKE) {
      likeChangeAmount = 2;
    }
    await prisma.$transaction([
      prisma.like.upsert({
        where: {
          post_id_user_id: {
            post_id: postId,
            user_id: userId,
          },
        },
        update: {
          score: 1,
          type: "LIKE",
        },
        create: {
          score: 1,
          type: "LIKE",
          user: {
            connect: {
              id: userId,
            },
          },
          post: {
            connect: {
              id: postId,
            },
          },
        },
      }),
      prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          like_count: {
            increment: likeChangeAmount,
          },
        },
      }),
    ]);
  } catch (error: any) {
    throw new Error(`Failed to like post: ${error.message}`);
  }
}

export async function unlikePost({ userId, postId }: likePostParams) {
  try {
    await prisma.$connect();
    const existingLike = await fetchLikeForCurrentUser({
      userId: userId,
      postId: postId,
    });
    let likeChangeAmount = 0;
    if (existingLike && existingLike.type === "LIKE") {
      likeChangeAmount = -1;
    } else if (existingLike && existingLike.type === "DISLIKE") {
      likeChangeAmount = 1;
    }
    await prisma.$transaction([
      prisma.like.delete({
        where: {
          post_id_user_id: {
            user_id: userId,
            post_id: postId,
          },
        },
      }),
      prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          like_count: {
            increment: likeChangeAmount,
          },
        },
      }),
    ]);
  } catch (error: any) {
    throw new Error(`Failed to unlike post: ${error.message}`);
  }
}

export async function dislikePost({ userId, postId }: likePostParams) {
  try {
    await prisma.$connect();
    const existingLike = await fetchLikeForCurrentUser({
      userId: userId,
      postId: postId,
    });
    if (existingLike && existingLike.type === like_type.DISLIKE) {
      console.log(
        `User ${userId} has already disliked post ${postId}. Returning...`
      );
      return;
    }
    let likeChangeAmount = -1;
    if (existingLike && existingLike.type === like_type.LIKE) {
      likeChangeAmount = -2;
    }
    await prisma.$transaction([
      prisma.like.upsert({
        where: {
          post_id_user_id: {
            user_id: userId,
            post_id: postId,
          },
        },
        update: {
          score: -1,
          type: "DISLIKE",
        },
        create: {
          score: -1,
          type: "DISLIKE",
          user: {
            connect: {
              id: userId,
            },
          },
          post: {
            connect: {
              id: postId,
            },
          },
        },
      }),
      prisma.post.update({
        where: {
          id: postId,
        },
        data: {
          like_count: {
            increment: likeChangeAmount,
          },
        },
      }),
    ]);
  } catch (error: any) {
    throw new Error(`Failed to like post: ${error.message}`);
  }
}

export async function fetchLikeForCurrentUser({
  userId,
  postId,
}: likePostParams) {
  try {
    await prisma.$connect();
    const like = await prisma.like.findUnique({
      where: {
        post_id_user_id: {
          user_id: userId,
          post_id: postId,
        },
      },
    });
    return like;
  } catch (error: any) {
    throw new Error(`Failed to fetch if user liked post: ${error.message}`);
  }
}
