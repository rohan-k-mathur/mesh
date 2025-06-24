"use server";

import { Prisma, realtime_post_type, UserAttributes } from "@prisma/client";
import { prisma } from "../prismaclient";
import { revalidatePath } from "next/cache";
import { getUserFromCookies } from "@/lib/serverutils";

export interface UpsertUserAttributes {
  userAttributes: UserAttributes;
  path: string;
}

export async function upsertUserAttributes({
  userAttributes,
  path,
}: UpsertUserAttributes) {
  const user = await getUserFromCookies();
  if (!user) {
    throw new Error("User not authenticated");
  }
  try {
    await prisma.$connect();
    await prisma.userAttributes.upsert({
      where: {
        user_id: user.userId!,
      },
      update: {
        artists: {
          set: userAttributes.artists,
        },
        albums: {
          set: userAttributes.albums,
        },
        songs: {
          set: userAttributes.songs,
        },
        interests: {
          set: userAttributes.interests,
        },
        movies: {
          set: userAttributes.movies,
        },
      },
      create: {
        user_id: user.userId!,
        artists: {
          set: userAttributes.artists,
        },
        albums: {
          set: userAttributes.albums,
        },
        songs: {
          set: userAttributes.songs,
        },
        interests: {
          set: userAttributes.interests,
        },
        movies: {
          set: userAttributes.movies,
        },
      },
    });
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to upsert user attributes: ${error.message}`);
  }
}

export async function fetchUserAttributes({ userId }: { userId: bigint }) {
  await prisma.$connect();

  const userAttributes = await prisma.userAttributes.findUnique({
    where: {
      user_id: userId,
    },
  });

  return userAttributes;
}
