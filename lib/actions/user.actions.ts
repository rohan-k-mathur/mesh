"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "../prismaclient";
import { revalidatePath } from "next/cache";

export interface UpdateUserParams {
  userAuthId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
}

export interface FetchUsersParams {
  userId: bigint;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: Prisma.SortOrder;
}

export async function updateUser({
  userAuthId,
  username,
  name,
  bio,
  image,
  path,
}: UpdateUserParams) {
  try {
    await prisma.$connect();
    const result = await prisma.user.upsert({
      where: {
        auth_id: userAuthId,
      },
      update: {
        username: username.toLowerCase(),
        name: name,
        bio: bio,
        image: image,
        onboarded: true,
      },
      create: {
        auth_id: userAuthId,
        username: username.toLowerCase(),
        name: name,
        bio: bio,
        image: image,
        onboarded: true,
      },
    });
    if (path === "/profile/edit") {
      revalidatePath(path);
    }
    return result;
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUserByAuthId(userAuthId: string) {
  try {
    await prisma.$connect();
    return await prisma.user.findUnique({
      where: {
        auth_id: userAuthId,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function fetchUser(userId: bigint) {
  try {
    await prisma.$connect();
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to get user: ${error.message}`);
  }
}

export async function fetchUserThreads(userId: bigint) {
  try {
    await prisma.$connect();
    const posts = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        posts: {
          include: {
            author: true,
            children: {
              include: {
                author: {
                  select: {
                    name: true,
                    image: true,
                    id: true,
                  },
                },
              },
            },
          },
          orderBy: {
            created_at: Prisma.SortOrder.desc,
          },
        },
      },
    });
    return posts;
  } catch (error: any) {
    throw new Error(`Failed to fetch user threads: ${error.message}`);
  }
}

export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = Prisma.SortOrder.desc,
}: FetchUsersParams) {
  try {
    await prisma.$connect();
    const skipAmount = (pageNumber - 1) * pageSize;
    const query: Prisma.UserWhereInput[] = [
      {
        NOT: {
          id: userId,
        },
      },
    ];
    if (searchString.trim() !== "") {
      const orQuery: Prisma.UserWhereInput = {
        OR: [
          {
            username: {
              contains: searchString,
            },
          },
          {
            name: {
              contains: searchString,
            },
          },
        ],
      };
      query.push(orQuery);
    }
    const users = await prisma.user.findMany({
      where: {
        AND: query,
      },
      skip: skipAmount,
      take: pageSize,
      orderBy: {
        created_at: sortBy,
      },
    });
    const totalUsersCount = await prisma.user.count({
      where: {
        AND: query,
      },
    });
    const isNext = totalUsersCount > skipAmount + users.length;
    return { users, isNext };
  } catch (error: any) {
    throw new Error(`Failed to fetch users ${error.message}`);
  }
}

export async function getActivity(userId: bigint) {
  try {
    await prisma.$connect();
    const userThreads = await prisma.post.findMany({
      where: {
        author_id: userId,
      },
      include: {
        children: {
          select: {
            id: true,
          },
        },
      },
    });

    const childThreadIds = userThreads.flatMap((userThread) =>
      userThread.children.map((child) => child.id)
    );
    const replies = await prisma.post.findMany({
      where: {
        AND: [
          {
            id: {
              in: childThreadIds,
            },
            author_id: {
              not: userId,
            },
          },
        ],
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
            id: true,
          },
        },
      },
    });
    return replies;
  } catch (error: any) {
    throw new Error(`Failed to fetch activity ${error.message}`);
  }
}
