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
  await prisma.$connect();
  const base = await prisma.userAttributes.findUnique({
    where: { user_id: userId },
  });
  if (!base) return { users: [] as RecommendedUser[], rooms: [] as RecommendedRoom[] };

  const others = await prisma.userAttributes.findMany({
    where: { user_id: { not: userId } },
    include: { user: true },
  });

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

  const toSetMap = (u: typeof base) => {
    const sets: Record<string, Set<string>> = {};
    for (const field of fields) {
      sets[field] = new Set(((u as any)[field] as string[]) || []);
    }
    return sets;
  };

  const baseSets = toSetMap(base);

  const intersection = (a: Set<string>, b: Set<string>) => {
    const [smaller, larger] = a.size < b.size ? [a, b] : [b, a];
    let count = 0;
    for (const value of smaller) {
      if (larger.has(value)) count += 1;
    }
    return count;
  };

  const calcScore = (
    aSets: Record<string, Set<string>>,
    bSets: Record<string, Set<string>>,
    aLocation?: string | null,
    bLocation?: string | null,
  ) => {
    let score = 0;
    for (const field of fields) {
      score += intersection(aSets[field], bSets[field]);
    }

    if (aLocation && bLocation && aLocation === bLocation) score += 1;
    return score;
  };

  const scored = others
    .map((o) => ({
      score: calcScore(baseSets, toSetMap(o), base.location, o.location),
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
  await prisma.$connect();
  await prisma.recommendationClick.create({
    data: {
      user_id: userId,
      recommended_user_id: recommendedUserId,
      recommended_room_id: recommendedRoomId,
    },
  });
}
