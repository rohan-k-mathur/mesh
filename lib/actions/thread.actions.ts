"use server";

import { prisma } from "../prismaclient";
import { revalidatePath } from "next/cache";

interface CreatePostParams {
  text: string;
  authorId: bigint;
  path: string;
}

interface AddCommentToPostParams {
  parentPostId: bigint;
  commentText: string;
  userId: bigint;
  path: string;
}

export async function createPost({ text, authorId, path }: CreatePostParams) {
  try {
    await prisma.$connect();
    const createdPost = await prisma.post.create({
      data: {
        content: text,
        author_id: authorId,
      },
    });
    await prisma.user.update({
      where: {
        id: authorId,
      },
      data: {
        posts: {
          connect: {
            id: createdPost.id,
          },
        },
      },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to create post: ${error.message}`);
  }
}

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  await prisma.$connect();

  const skipAmount = (pageNumber - 1) * pageSize;

  //Find posts that are only top level (no parents)
  const posts = await prisma.post.findMany({
    where: {
      parent_id: null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      children: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
    skip: skipAmount,
    take: pageSize,
  });

  const totalPostCount = await prisma.post.count({
    where: {
      parent_id: null,
    },
  });
  const isNext = totalPostCount > skipAmount + posts.length;

  return { posts, isNext };
}

export async function fetchPostById(id: bigint) {
  try {
    await prisma.$connect();
    return await prisma.post.findUnique({
      where: {
        id: id,
      },
      include: {
        author: true,
        children: {
          include: {
            author: true,
            children: {
              include: {
                author: true,
              },
            },
          },
        },
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to fetch post by id ${error.message}`);
  }
}

export async function addCommentToPost({
  parentPostId,
  commentText,
  userId,
  path,
}: AddCommentToPostParams) {
  try {
    await prisma.$connect();
    const originalPost = await prisma.post.findUnique({
      where: {
        id: parentPostId,
      },
    });
    if (!originalPost) {
      throw new Error("Post not found");
    }
    const commentPost = await prisma.post.create({
      data: {
        content: commentText,
        author_id: userId,
        parent_id: parentPostId,
      },
    });
    await prisma.post.update({
      where: {
        id: parentPostId,
      },
      data: {
        children: {
          connect: {
            id: commentPost.id,
          },
        },
      },
    });
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Error adding comment to thread ${error.message}`);
  }
}
