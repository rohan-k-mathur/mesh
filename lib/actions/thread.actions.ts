"use server";


import { prisma } from "../prismaclient";
import { revalidatePath } from "next/cache";
import { getUserFromCookies } from "../serverutils";

interface CreatePostParams {
  text: string;
  authorId: bigint;
  path: string;
  expirationDate?: string | null;
}

interface AddCommentToPostParams {
  parentPostId: bigint;
  commentText: string;
  userId: bigint;
  path: string;
}

export async function createPost({ text, authorId, path, expirationDate }: CreatePostParams) {
  try {
    const createdPost = await prisma.post.create({
      data: {
        content: text,
        author_id: authorId,
        ...(expirationDate && { expiration_date: new Date(expirationDate) }),
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
  await archiveExpiredPosts();

  const skipAmount = (pageNumber - 1) * pageSize;

  //Find posts that are only top level (no parents)
  const posts = await prisma.post.findMany({
    where: {
      parent_id: null,
      OR: [
        { expiration_date: null },
        { expiration_date: { gt: new Date() } },
      ],
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
          _count: { select: { children: true } },
        },
      },
      _count: { select: { children: true } },
    },
    orderBy: { created_at: "desc" },
    skip: skipAmount,
    take: pageSize,
  });

  const totalPostCount = await prisma.post.count({
    where: {
      parent_id: null,
      OR: [
        { expiration_date: null },
        { expiration_date: { gt: new Date() } },
      ],
    },
  });
  const postsWithCount = posts.map((post) => ({
    ...post,
    commentCount: post._count.children,
    children: post.children.map((child) => ({
      ...child,
      commentCount: child._count.children,
    })),
  }));

  const isNext = totalPostCount > skipAmount + posts.length;

  return { posts: postsWithCount, isNext };
}

export async function fetchPostById(id: bigint) {
  try {
    await archiveExpiredPosts();
    const post = await prisma.post.findUnique({
      where: {
        id: id,
      },
      include: {
        author: true,
        _count: { select: { children: true } },
        children: {
          include: {
            author: true,
            _count: { select: { children: true } },
            children: {
              include: {
                author: true,
                _count: { select: { children: true } },
              },
            },
          },
        },
      },
    });
    if (post && post.expiration_date && post.expiration_date <= new Date()) {
      return null;
    }
    if (post) {
      const mapChildren = (p: any): any => ({
        ...p,
        commentCount: p._count.children,
        children: p.children.map(mapChildren),
      });
      return mapChildren(post);
    }
    return post;
  } catch (error: any) {
    throw new Error(`Failed to fetch post by id ${error.message}`);
  }
}

export async function fetchPostTreeById(id: bigint) {
  await archiveExpiredPosts();
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      _count: { select: { children: true } },
    },
  });
  if (!post || (post.expiration_date && post.expiration_date <= new Date()))
    return null;

  const fetchChildren = async (parentId: bigint): Promise<any[]> => {
    const children = await prisma.post.findMany({
      where: { parent_id: parentId },
      include: { author: true, _count: { select: { children: true } } },
    });
    for (const child of children) {
      child.children = await fetchChildren(child.id);
    }
    return children.map((c) => ({
      ...c,
      commentCount: c._count.children,
    }));
  };

  if (post) {
    post.children = await fetchChildren(post.id);
    return { ...post, commentCount: post._count.children };
  }
  return post;
}

export async function addCommentToPost({
  parentPostId,
  commentText,
  userId,
  path,
}: AddCommentToPostParams) {
  try {
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

export async function replicatePost({
  originalPostId,
  userId,
  path,
  text,
}: {
  originalPostId: string | number | bigint;
  userId: string | number | bigint;
  path: string;
  text?: string;
}) {
  try {
    const oid = BigInt(originalPostId);
    const uid = BigInt(userId);
    const original = await prisma.post.findUnique({
      where: { id: oid },
      include: { author: true },
    });
    if (!original) throw new Error("Post not found");
    const payload = JSON.stringify({ id: oid.toString(), text });
    const newPost = await prisma.post.create({
      data: {
        content: `REPLICATE:${payload}`,
        author_id: uid,
      },
    });
    await prisma.user.update({
      where: { id: uid },
      data: { posts: { connect: { id: newPost.id } } },
    });
    revalidatePath(path);
    return newPost;
  } catch (error: any) {
    throw new Error(`Failed to replicate post: ${error.message}`);
  }
}


export async function updatePostExpiration({
  postId,
  duration,
}: {
  postId: bigint;
  duration: string;
}) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });
  if (!post) {
    throw new Error("Post not found");
  }
  let expiration: Date | null = null;
  if (duration !== "none") {
    const now = Date.now();
    if (duration === "1h") expiration = new Date(now + 3600 * 1000);
    if (duration === "1d") expiration = new Date(now + 86400 * 1000);
    if (duration === "1w") expiration = new Date(now + 604800 * 1000);
  }
  await prisma.post.update({
    where: { id: postId },
    data: { expiration_date: expiration },
  });
}

export async function archiveExpiredPosts() {
  const now = new Date();
  const expired = await prisma.post.findMany({
    where: { expiration_date: { lte: now } },
  });
  if (expired.length === 0) return;

  const postsToArchive: typeof expired = [];
  const visited = new Set<bigint>();
  let queue = expired.map((p) => p.id);

  for (const post of expired) {
    if (!visited.has(post.id)) {
      visited.add(post.id);
      postsToArchive.push(post);
    }
  }

  while (queue.length > 0) {
    const children = await prisma.post.findMany({
      where: { parent_id: { in: queue } },
    });
    queue = [];
    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        postsToArchive.push(child);
        queue.push(child.id);
      }
    }
  }

  const ids = postsToArchive.map((p) => p.id);
  await prisma.$transaction([
    prisma.archivedPost.createMany({
      data: postsToArchive.map((p) => ({
        original_post_id: p.id,
        created_at: p.created_at,
        content: p.content,
        author_id: p.author_id,
        updated_at: p.updated_at,
        parent_id: p.parent_id,
        like_count: p.like_count,
        expiration_date: p.expiration_date ?? undefined,
      })),
      skipDuplicates: true,
    }),
    prisma.post.deleteMany({ where: { id: { in: ids } } }),
  ]);
}

export async function deletePost({ id, path }: { id: bigint; path?: string }) {
  const user = await getUserFromCookies();
  try {
    const originalPost = await prisma.post.findUniqueOrThrow({
      where: {
        id: id,
      },
    });
    if (!user || user.userId != originalPost.author_id) {
      return;
    }

    const ids: bigint[] = [];
    const collect = async (postId: bigint) => {
      const children = await prisma.post.findMany({ where: { parent_id: postId } });
      for (const child of children) {
        await collect(child.id);
      }
      ids.push(postId);
    };

    await collect(id);
    await prisma.post.deleteMany({ where: { id: { in: ids } } });
    if (path) revalidatePath(path);
  } catch (error: any) {
    console.error("Failed to delete post:", error);
  }
}
