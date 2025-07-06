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
  isPublic?: boolean;
  collageLayoutStyle?: string;  // or some enum
  collageColumns?: number;
  collageGap?: number;
  pluginType?: string;
  pluginData?: Record<string, unknown>;
}

interface UpdateRealtimePostParams {
  id: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  coordinates?: { x: number; y: number };
  path: string;
  isPublic?: boolean;
  collageLayoutStyle?: string;  // or some enum
  collageColumns?: number;
  collageGap?: number;
  content?: string;
  pluginType?: string;
  pluginData?: Record<string, unknown>;
}

export async function createRealtimePost({
  text,
  imageUrl,
  videoUrl,
  path,
  coordinates,
  type,
  realtimeRoomId,
  isPublic = false,
   //  collage fields
   collageLayoutStyle,
   collageColumns,
   collageGap,
   pluginType,
   pluginData,
}: CreateRealtimePostParams) {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error("User not authenticated");
  }
  try {
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
        isPublic,
        ...(pluginType && { pluginType }),
        ...(pluginData && { pluginData }),

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
  isPublic,
  //  <-- Add these lines
  collageLayoutStyle,
  collageColumns,
  collageGap,
  content,
  pluginType,
  pluginData,
}: UpdateRealtimePostParams) {
  const user = await getUserFromCookies();
  try {
    const originalPost = await prisma.realtimePost.findUniqueOrThrow({
      where: {
        id: BigInt(id),
      },
    });
    const coordChanged =
      coordinates &&
      (coordinates.x !== originalPost.x_coordinate.toNumber() ||
        coordinates.y !== originalPost.y_coordinate.toNumber());

    if (!user || user.userId != originalPost.author_id) {
      if (!originalPost.isPublic) {
        return;
      }
      if (
        coordChanged ||
        isPublic !== undefined ||
        collageLayoutStyle ||
        collageColumns !== undefined ||
        collageGap !== undefined
      ) {
        return;
      }
    }
    if (originalPost.locked && coordinates) {
      return;
    }
    const updateData: Prisma.RealtimePostUpdateInput = {
      ...(text && { content: text }),
      ...(imageUrl && { image_url: imageUrl }),
      ...(videoUrl && { video_url: videoUrl }),
      ...(content && { content }),
      ...(collageLayoutStyle && { collageLayoutStyle }),
      ...(collageColumns !== undefined && { collageColumns }),
      ...(collageGap !== undefined && { collageGap }),
      ...(isPublic !== undefined && { isPublic }),
      ...(pluginType && { pluginType }),
      ...(pluginData && { pluginData }),
    };

    if (coordinates && coordChanged) {
      updateData.x_coordinate = new Prisma.Decimal(coordinates.x);
      updateData.y_coordinate = new Prisma.Decimal(coordinates.y);
    }

    await prisma.realtimePost.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    revalidatePath(path);
  } catch (error: any) {
    console.error("Failed to update real-time post:", error);
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
    const originalPost = await prisma.realtimePost.findUniqueOrThrow({
      where: {
        id: BigInt(id),
      },
    });
    if (!user || user.userId != originalPost.author_id) {
      return;
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
    console.error("Failed to update real-time post:", error);
  }
}

export async function fetchRealtimePosts({
  realtimeRoomId,
  postTypes,
}: {
  realtimeRoomId: string;
  postTypes: realtime_post_type[];
}) {

  const realtimePosts = await prisma.realtimePost.findMany({
    where: {
      realtime_room_id: realtimeRoomId,
      parent_id: null,
      type: {
        in: postTypes,
      },
    },
    include: {
      author: true,
      _count: { select: { children: true } },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return realtimePosts.map((realtimePost) => ({
    ...realtimePost,
    commentCount: realtimePost._count.children,
    x_coordinate: realtimePost.x_coordinate.toNumber(),
    y_coordinate: realtimePost.y_coordinate.toNumber(),
  }));
}

export async function deleteRealtimePost({
  id,
  path,
}: {
  id: string;
  path?: string;
}) {
  const user = await getUserFromCookies();
  try {
    const originalPost = await prisma.realtimePost.findUniqueOrThrow({
      where: {
        id: BigInt(id),
      },
    });
    if (!user || user.userId != originalPost.author_id) {
      return;
    }
    await prisma.realtimePost.delete({
      where: {
        id: BigInt(id),
      },
    });
    if (path) revalidatePath(path);
  } catch (error: any) {
    console.error("Failed to delete real-time post:", error);
  }
}

export async function fetchRealtimePostById({ id }: { id: string }) {
  try {
    const post = await prisma.realtimePost.findUniqueOrThrow({
      where: {
        id: BigInt(id),
      },
      include: {
        author: true,
        _count: { select: { children: true } },
        children: {
          include: { author: true, _count: { select: { children: true } } },
        },
      },
    });
    return {
      ...post,
      commentCount: post._count.children,
      x_coordinate: post.x_coordinate.toNumber(),
      y_coordinate: post.y_coordinate.toNumber(),
      children: post.children.map((c) => ({
        ...c,
        commentCount: c._count.children,
        x_coordinate: c.x_coordinate.toNumber(),
        y_coordinate: c.y_coordinate.toNumber(),
      })),
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch real-time post: ${error.message}`);
  }
}

export async function fetchRealtimePostTreeById({ id }: { id: string }) {
  const post: any = await prisma.realtimePost.findUnique({
    where: { id: BigInt(id) },
    include: { author: true, _count: { select: { children: true } } },
  });
  if (!post) return null;

  const fetchChildren = async (parentId: bigint): Promise<any[]> => {
    const children = await prisma.realtimePost.findMany({
      where: { parent_id: parentId },
      include: { author: true, _count: { select: { children: true } } },
    });
    for (const child of children) {
      child.children = await fetchChildren(child.id);
    }
    return children.map((c) => ({
      ...c,
      commentCount: c._count.children,
      x_coordinate: c.x_coordinate.toNumber(),
      y_coordinate: c.y_coordinate.toNumber(),
      children: c.children,
    }));
  };

  if (post) {
    post.children = await fetchChildren(post.id);
    return {
      ...post,
      commentCount: post._count.children,
      x_coordinate: post.x_coordinate.toNumber(),
      y_coordinate: post.y_coordinate.toNumber(),
    };
  }
  return post;
}

export async function addCommentToRealtimePost({
  parentPostId,
  commentText,
  userId,
  path,
}: {
  parentPostId: bigint;
  commentText: string;
  userId: bigint;
  path: string;
}) {
  try {
    const originalPost = await prisma.realtimePost.findUnique({
      where: { id: parentPostId },
    });
    if (!originalPost) throw new Error("Post not found");
    const comment = await prisma.realtimePost.create({
      data: {
        content: commentText,
        author_id: userId,
        parent_id: parentPostId,
        realtime_room_id: originalPost.realtime_room_id,
        type: "TEXT",
        x_coordinate: originalPost.x_coordinate,
        y_coordinate: originalPost.y_coordinate,
        locked: true,
        isPublic: false,
      },
    });
    await prisma.realtimePost.update({
      where: { id: parentPostId },
      data: { children: { connect: { id: comment.id } } },
    });
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error adding comment to realtime post ${error.message}`);
  }
}

export async function fetchUserRealtimePosts({
  realtimeRoomId,
  userId,
  postTypes,
}: {
  realtimeRoomId: string;
  userId: bigint;
  postTypes: realtime_post_type[];
}) {
  const realtimePosts = await prisma.realtimePost.findMany({
    where: {
      realtime_room_id: realtimeRoomId,
      author_id: userId,
      type: {
        in: postTypes,
      },
    },
    include: {
      author: true,
      _count: { select: { children: true } },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return realtimePosts.map((realtimePost) => ({
    ...realtimePost,
    commentCount: realtimePost._count.children,
    x_coordinate: realtimePost.x_coordinate.toNumber(),
    y_coordinate: realtimePost.y_coordinate.toNumber(),
  }));
}

export async function replicateRealtimePost({
  originalPostId,
  userId,
  path,
}: {
  originalPostId: string | number | bigint;
  userId: string | number | bigint;
  path: string;
}) {
  try {
    const oid = BigInt(originalPostId);
    const uid = BigInt(userId);
    const original = await prisma.realtimePost.findUnique({
      where: { id: oid },
    });
    if (!original) throw new Error("Real-time post not found");
    const newPost = await prisma.realtimePost.create({
      data: {
        ...(original.content && { content: original.content }),
        ...(original.image_url && { image_url: original.image_url }),
        ...(original.video_url && { video_url: original.video_url }),
        author_id: uid,
        x_coordinate: original.x_coordinate,
        y_coordinate: original.y_coordinate,
        type: original.type,
        realtime_room_id: original.realtime_room_id,
        locked: false,
        isPublic: original.isPublic,
        ...(original.collageLayoutStyle && {
          collageLayoutStyle: original.collageLayoutStyle,
        }),
        ...(original.collageColumns !== null && {
          collageColumns: original.collageColumns ?? undefined,
        }),
        ...(original.collageGap !== null && {
          collageGap: original.collageGap ?? undefined,
        }),
      },
    });
    await prisma.user.update({
      where: { id: uid },
      data: { realtimeposts: { connect: { id: newPost.id } } },
    });
    revalidatePath(path);
    return newPost;
  } catch (error: any) {
    throw new Error(`Failed to replicate real-time post: ${error.message}`);
  }
}
