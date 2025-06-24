"use server";

import { Prisma, realtime_post_type } from "@prisma/client";
import { prisma } from "../prismaclient";
import { revalidatePath } from "next/cache";
import { getUserFromCookies } from "@/lib/serverutils";

export interface CreateRealtimePostParams {
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  path: string;
  coordinates: { x: number; y: number };
  type: realtime_post_type;
  realtimeRoomId: string;
  collageLayoutStyle?: string;  // or some enum
  collageColumns?: number;
  collageGap?: number;
}

interface UpdateRealtimePostParams {
  id: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  coordinates?: { x: number; y: number };
  path: string;
  collageLayoutStyle?: string;  // or some enum
  collageColumns?: number;
  collageGap?: number;
}

export async function createRealtimePost({
  text,
  imageUrl,
  videoUrl,
  path,
  coordinates,
  type,
  realtimeRoomId,
   //  collage fields
   collageLayoutStyle,
   collageColumns,
   collageGap,
}: CreateRealtimePostParams) {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error("User not authenticated");
  }
  try {
    await prisma.$connect();
    const createdRealtimePost = await prisma.realtimePost.create({
      data: {
        ...(text && { content: text }),
        ...(imageUrl && { image_url: imageUrl }),
        ...(videoUrl && { video_url: videoUrl }),
        
        author_id: user.userId!,
        x_coordinate: new Prisma.Decimal(coordinates.x),
        y_coordinate: new Prisma.Decimal(coordinates.y),
        type,
        realtime_room_id: realtimeRoomId,
        locked: false,

         // Collage fields
         ...(collageLayoutStyle && { collageLayoutStyle }),
         ...(collageColumns !== undefined && { collageColumns }),
         ...(collageGap !== undefined && { collageGap }),
      },
    });
    const author = await prisma.user.update({
      where: {
        id: user.userId!,
      },
      data: {
        realtimeposts: {
          connect: {
            id: createdRealtimePost.id,
          },
        },
      },
    });

    revalidatePath(path);
    return {
      ...createdRealtimePost,
      author: author,
      x_coordinate: createdRealtimePost.x_coordinate.toNumber(),
      y_coordinate: createdRealtimePost.y_coordinate.toNumber(),
    };
  } catch (error: any) {
    throw new Error(`Failed to create real-time post: ${error.message}`);
  }
}

export async function updateRealtimePost({
  id,
  text,
  videoUrl,
  imageUrl,
  coordinates,
  path,
  //  <-- Add these lines
  collageLayoutStyle,
  collageColumns,
  collageGap,
}: UpdateRealtimePostParams) {
  const user = await getUserFromCookies();
  try {
    await prisma.$connect();
    const originalPost = await prisma.realtimePost.findUniqueOrThrow({
      where: {
        id: BigInt(id),
      },
    });
    if (user!.userId != originalPost!.author_id) {
      if (text || videoUrl || imageUrl) {
        throw new Error(`User is not allowed to update this post`);
      }
    }
    if (originalPost.locked && coordinates) {
      throw new Error(`User is not permitted to move this post`);
    }
    await prisma.realtimePost.update({
      where: {
        id: BigInt(id),
      },
      data: {
        ...(text && { content: text }),
        ...(imageUrl && { image_url: imageUrl }),
        ...(videoUrl && { video_url: videoUrl }),
        ...(collageLayoutStyle && { collageLayoutStyle }),
        ...(collageColumns !== undefined && { collageColumns }),
        ...(collageGap !== undefined && { collageGap }),

        ...(coordinates && {
          x_coordinate: new Prisma.Decimal(coordinates.x),
          y_coordinate: new Prisma.Decimal(coordinates.y),
        }),
      },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to update real-time post: ${error.message}`);
  }
}

export async function lockRealtimePost({
  id,
  lockState,
  path,
}: {
  id: string;
  lockState: boolean;
  path: string;
}) {
  const user = await getUserFromCookies();
  try {
    await prisma.$connect();
    const originalPost = await prisma.realtimePost.findUniqueOrThrow({
      where: {
        id: BigInt(id),
      },
    });
    if (user!.userId != originalPost!.author_id) {
      throw new Error(`User is not allowed to update this post`);
    }
    await prisma.realtimePost.update({
      where: {
        id: BigInt(id),
      },
      data: {
        locked: lockState,
      },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to update real-time post: ${error.message}`);
  }
}

export async function fetchRealtimePosts({
  realtimeRoomId,
  postTypes,
}: {
  realtimeRoomId: string;
  postTypes: realtime_post_type[];
}) {
  await prisma.$connect();

  const realtimePosts = await prisma.realtimePost.findMany({
    where: {
      realtime_room_id: realtimeRoomId,
      type: {
        in: postTypes,
      },
    },
    include: {
      author: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return realtimePosts.map((realtimePost) => ({
    ...realtimePost,
    x_coordinate: realtimePost.x_coordinate.toNumber(),
    y_coordinate: realtimePost.y_coordinate.toNumber(),
  }));
}

export async function deleteRealtimePost({ id }: { id: string }) {
  const user = await getUserFromCookies();
  await prisma.$connect();
  const originalPost = await prisma.realtimePost.findUniqueOrThrow({
    where: {
      id: BigInt(id),
    },
  });
  if (user!.userId != originalPost!.author_id) {
    throw new Error(`User is not allowed to update this post`);
  }
  await prisma.realtimePost.delete({
    where: {
      id: BigInt(id),
    },
  });
}

export async function fetchRealtimePostById({ id }: { id: string }) {
  try {
    await prisma.$connect();
    return await prisma.realtimePost.findUniqueOrThrow({
      where: {
        id: BigInt(id),
      },
      include: {
        author: true,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to fetch real-time post: ${error.message}`);
  }
}
