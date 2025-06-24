"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prismaclient";
import { getUserFromCookies } from "../serverutils";
import { nanoid } from "nanoid";

export async function fetchRealtimeRoom({
  realtimeRoomId,
}: {
  realtimeRoomId: string;
}) {
  try {
    await prisma.$connect();

    const realtimeRoom = await prisma.realtimeRoom.findUniqueOrThrow({
      where: {
        id: realtimeRoomId,
      },
      include: {
        realtimeposts: {
          include: {
            author: true,
          },
        },
        realtimeedges: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    return {
      ...realtimeRoom,
      realtimeposts: realtimeRoom.realtimeposts.map((realtimePost) => ({
        ...realtimePost,
        x_coordinate: realtimePost.x_coordinate.toNumber(),
        y_coordinate: realtimePost.y_coordinate.toNumber(),
      })),
    };
  } catch (error: any) {
    throw new Error(`Failed to get room: ${error.message}`);
  }
}

export async function joinRoom({ roomId }: { roomId: string }) {
  try {
    await prisma.$connect();
    const user = await getUserFromCookies();
    if (!user) {
      throw new Error("User not authenticated");
    }

    await prisma.userRealtimeRoom.upsert({
      where: {
        user_id_realtime_room_id: {
          user_id: user.userId!,
          realtime_room_id: roomId,
        },
      },
      create: {
        user_id: user.userId!,
        realtime_room_id: roomId,
      },
      update: {
        user_id: user.userId!,
        realtime_room_id: roomId,
      },
    });
  } catch (error: any) {
    throw new Error(`Failed to join room: ${error.message}`);
  }
}

export async function leaveRoom({
  roomId,
  path,
}: {
  roomId: string;
  path: string;
}) {
  try {
    await prisma.$connect();
    const user = await getUserFromCookies();
    if (!user) {
      throw new Error("User not authenticated");
    }
    await prisma.userRealtimeRoom.delete({
      where: {
        user_id_realtime_room_id: {
          user_id: user.userId!,
          realtime_room_id: roomId,
        },
      },
    });
    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to leave room: ${error.message}`);
  }
}

export async function createAndJoinRoom({
  roomName,
  roomIcon,
  path,
}: {
  roomName: string;
  roomIcon: string;
  path: string;
}) {
  try {
    await prisma.$connect();
    const user = await getUserFromCookies();
    if (!user) {
      throw new Error("User not authenticated");
    }
    const [realtimeRoom, connection] = await prisma.$transaction([
      prisma.realtimeRoom.create({
        data: {
          id: roomName,
          room_icon: roomIcon,
        },
      }),
      prisma.userRealtimeRoom.create({
        data: {
          user_id: user.userId!,
          realtime_room_id: roomName,
        },
      }),
    ]);
    revalidatePath(path);
    return realtimeRoom;
  } catch (error: any) {
    throw new Error(`Failed to create and join room: ${error.message}`);
  }
}

export async function getRoomsForUser({ userId }: { userId: bigint }) {
  try {
    await prisma.$connect();
    const userRoomMemberships = await prisma.userRealtimeRoom.findMany({
      where: {
        user_id: userId,
      },
      include: {
        realtime_room: true,
      },
    });
    return userRoomMemberships.map((membership) => membership.realtime_room);
  } catch (error: any) {
    throw new Error(`Failed to get rooms for user: ${error.message}`);
  }
}

export async function findOrGenerateInviteToken({
  userId,
  roomId,
}: {
  userId: bigint;
  roomId: string;
}) {
  try {
    await prisma.$connect();
    const existingInviteToken = await prisma.realtimeRoomInviteToken.findFirst({
      where: { inviting_user_id: userId, realtime_room_id: roomId },
    });
    if (existingInviteToken) {
      return existingInviteToken;
    }
    const inviteToken = await prisma.realtimeRoomInviteToken.create({
      data: {
        inviting_user_id: userId,
        realtime_room_id: roomId,
        token: nanoid(10),
      },
    });
    return inviteToken;
  } catch (error: any) {
    throw new Error(`Failed to generate invite link: ${error.message}`);
  }
}

export async function lookupInviteToken(inviteToken: string) {
  try {
    await prisma.$connect();
    return await prisma.realtimeRoomInviteToken.findUnique({
      where: { token: inviteToken },
    });
  } catch (error: any) {
    throw new Error(`Failed to lookup invite token: ${error.message}`);
  }
}
