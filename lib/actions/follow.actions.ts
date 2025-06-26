"use server";

import { prisma } from "../prismaclient";

export async function followUser({ followerId, followingId }: { followerId: bigint; followingId: bigint; }) {
  try {
    await prisma.$connect();
    await prisma.follow.create({
      data: {
        follower_id: followerId,
        following_id: followingId,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to follow user: ${error.message}`);
  }
}

export async function unfollowUser({ followerId, followingId }: { followerId: bigint; followingId: bigint; }) {
  try {
    await prisma.$connect();
    await prisma.follow.delete({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        },
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to unfollow user: ${error.message}`);
  }
}

export async function isFollowing({ followerId, followingId }: { followerId: bigint; followingId: bigint; }) {
  await prisma.$connect();
  const follow = await prisma.follow.findUnique({
    where: {
      follower_id_following_id: { follower_id: followerId, following_id: followingId },
    },
  });
  return !!follow;
}

export async function areFriends({ userId, targetUserId }: { userId: bigint; targetUserId: bigint; }) {
  await prisma.$connect();
  const [a, b] = await Promise.all([
    prisma.follow.findUnique({
      where: {
        follower_id_following_id: { follower_id: userId, following_id: targetUserId },
      },
    }),
    prisma.follow.findUnique({
      where: {
        follower_id_following_id: { follower_id: targetUserId, following_id: userId },
      },
    }),
  ]);
  return !!a && !!b;
}
