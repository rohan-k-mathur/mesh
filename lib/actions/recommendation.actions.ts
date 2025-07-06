"use server";

import { prisma } from "../prismaclient";
import { Prisma } from "@prisma/client";

export interface RecommendedUser {
  id: bigint;
  name: string | null;
  username: string;
  image: string | null;
  score: number;
}

export interface RecommendedRoom {
  id: string;
  room_icon: string;
  score: number;
}

interface RecommendationParams {
  userId: bigint;
  limitUsers?: number;
  limitRooms?: number;
}

export async function fetchRecommendations({
  userId,
  limitUsers = 7,
  limitRooms = 5,
}: RecommendationParams) {
  const base = await prisma.userAttributes.findUnique({
    where: { user_id: userId },
  });
  if (!base) return { users: [] as RecommendedUser[], rooms: [] as RecommendedRoom[] };

  const others = await prisma.userAttributes.findMany({
    where: { user_id: { not: userId } },
    include: { user: true },
  });

  const intersection = (a: string[], b: string[]) => a.filter((v) => b.includes(v));

  const calcScore = (a: typeof base, b: typeof base) => {
    let score = 0;
    const fields: (keyof typeof base)[] = [
      "artists",
      "albums",
      "songs",
      "interests",
      "movies",
      "books",
      "hobbies",
      "communities",
    ];
    for (const field of fields) {
      const arrA = (a as any)[field] as string[];
      const arrB = (b as any)[field] as string[];
      score += intersection(arrA || [], arrB || []).length;
    }
    if (a.location && b.location && a.location === b.location) score += 1;
    return score;
  };

  const scored = others
    .map((o) => ({
      score: calcScore(base, o),
      user: o.user,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limitUsers);

  const users: RecommendedUser[] = scored.map((s) => ({
    id: s.user.id,
    name: s.user.name,
    username: s.user.username,
    image: s.user.image,
    score: s.score,
  }));

  const memberships = await prisma.userRealtimeRoom.findMany({
    where: {
      user_id: { in: users.map((u) => u.id) },
    },
    include: { realtime_room: true },
  });

  const roomScores = new Map<string, RecommendedRoom>();
  for (const m of memberships) {
    const match = users.find((u) => u.id === m.user_id);
    if (!match) continue;
    const current = roomScores.get(m.realtime_room_id);
    if (current) {
      current.score += match.score;
    } else {
      roomScores.set(m.realtime_room_id, {
        id: m.realtime_room_id,
        room_icon: m.realtime_room.room_icon,
        score: match.score,
      });
    }
  }

  const rooms = Array.from(roomScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limitRooms);

  return { users, rooms };
}

export async function logRecommendationClick({
  userId,
  recommendedUserId,
  recommendedRoomId,
}: {
  userId: bigint;
  recommendedUserId?: bigint;
  recommendedRoomId?: string;
}) {
  await prisma.recommendationClick.create({
    data: {
      user_id: userId,
      recommended_user_id: recommendedUserId,
      recommended_room_id: recommendedRoomId,
    },
  });
}
