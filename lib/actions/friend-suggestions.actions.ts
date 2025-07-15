"use server";
export const runtime = 'nodejs';          // forces Node runtime
export const dynamic = 'force-dynamic';   // stops build-time execution
import { prisma } from "../prismaclient";
import { deepseekEmbedding } from "../deepseekclient";
import { getPineconeIndex, knnPgvector } from '@/lib/pineconeClient';
import { UserAttributes } from "@prisma/client";

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

export async function updateUserEmbedding(userId: bigint) {
  const attrs = await prisma.userAttributes.findUnique({
    where: { user_id: userId },
  });
  const safeJoin = (arr?: string[] | null) => (arr ?? []).join(" ");

  if (!attrs) return;
  const desc = [
    safeJoin(attrs.interests),
    safeJoin(attrs.hobbies),
    safeJoin(attrs.artists),
    safeJoin(attrs.albums),
    safeJoin(attrs.movies),
    safeJoin(attrs.books),
    safeJoin(attrs.communities),
  ].join(" \n");
  const embedding = await deepseekEmbedding(desc);
  await prisma.userEmbedding.upsert({
    where: { user_id: userId },
    update: { embedding },
    create: { user_id: userId, embedding },
  });
  try {
    const index = await getPineconeIndex();
    if (index) {

    await index.upsert({
      vectors: [{ id: userId.toString(), values: embedding }],
    });
  } else {
    await knnPgvector(embedding);

  } 
  catch (err) {
    console.warn("Pinecone upsert failed", err);
  }
}

export async function generateFriendSuggestions(userId: bigint) {
  const base = await prisma.userEmbedding.findUnique({ where: { user_id: userId } });
  if (!base) return [];
  const others = await prisma.userEmbedding.findMany({ where: { user_id: { not: userId } } });
  if (others.length === 0) return [];
  // const sample = others.sort(() => Math.random() - 0.5).slice(0, 20);

  // const otherIds = sample.map((o) => o.user_id);
  const index = await getPineconeIndex();
const neighbours = index
  ? await index.query({ topK: 300, vector: base.embedding, includeValues: false })
  : await knnPgvector(base.embedding, 300);

const otherIds = neighbours.matches.map((m) => BigInt(m.id));
  // const [baseLikes, baseRooms, otherLikes, otherRooms] = await Promise.all([
  //   prisma.like.findMany({
  //     where: { user_id: userId },
  //     select: { post_id: true },
  //   }),
  //   prisma.userRealtimeRoom.findMany({
  //     where: { user_id: userId },
  //     select: { realtime_room_id: true },
  //   }),
  //   prisma.like.findMany({
  //     where: { user_id: { in: otherIds } },
  //     select: { user_id: true, post_id: true },
  //   }),
  //   prisma.userRealtimeRoom.findMany({
  //     where: { user_id: { in: otherIds } },
  //     select: { user_id: true, realtime_room_id: true },
  //   }),
  // ]);
  const [baseLikes, baseRooms, otherLikes, otherRooms, otherAttrs] =
  await Promise.all([
    prisma.like.findMany({
      where: { user_id: userId },
      select: { post_id: true },
    }),
    prisma.userRealtimeRoom.findMany({
      where: { user_id: userId },
      select: { realtime_room_id: true },
    }),
    prisma.like.findMany({
      where: { user_id: { in: otherIds } },
      select: { user_id: true, post_id: true },
    }),
    prisma.userRealtimeRoom.findMany({
      where: { user_id: { in: otherIds } },
      select: { user_id: true, realtime_room_id: true },
    }),
    prisma.userAttributes.findMany({              // 🆕 batch fetch
      where: { user_id: { in: otherIds } },
    }),
  ]);


  // const baseLikeSet = new Set(baseLikes.map((l) => l.post_id.toString()));
  // const baseRoomSet = new Set(baseRooms.map((r) => r.realtime_room_id));

  // const likesMap = new Map<bigint, Set<string>>();
  // for (const l of otherLikes) {
  //   const uid = l.user_id as bigint;
  //   if (!likesMap.has(uid)) likesMap.set(uid, new Set());
  //   likesMap.get(uid)!.add(l.post_id.toString());
  // }

  // const roomsMap = new Map<bigint, Set<string>>();
  // for (const r of otherRooms) {
  //   const uid = r.user_id as bigint;
  //   if (!roomsMap.has(uid)) roomsMap.set(uid, new Set());
  //   roomsMap.get(uid)!.add(r.realtime_room_id);
  // }
   /* ---------- overlap helpers / pre-computed maps ----------------- */
   const baseLikeSet = new Set(baseLikes.map((l) => l.post_id.toString()));
   const baseRoomSet = new Set(baseRooms.map((r) => r.realtime_room_id));
 
   const likesMap = new Map<bigint, Set<string>>();
   for (const l of otherLikes) {
     const uid = l.user_id as bigint;
     if (!likesMap.has(uid)) likesMap.set(uid, new Set());
     likesMap.get(uid)!.add(l.post_id.toString());
   }
 
   const roomsMap = new Map<bigint, Set<string>>();
   for (const r of otherRooms) {
     const uid = r.user_id as bigint;
     if (!roomsMap.has(uid)) roomsMap.set(uid, new Set());
     roomsMap.get(uid)!.add(r.realtime_room_id);
   }
  // 🆕  UserAttributes lookup map
  const attrMap = new Map<bigint, UserAttributes>(
    otherAttrs.map((ua) => [ua.user_id as bigint, ua]),
  );
 

/* ---------------- scoring --------------------------------------- */
const scored = neighbours.matches.map((m) => {
  const otherId = BigInt(m.id);
  const otherEmb = others.find((o) => o.user_id === otherId)!;

  const likeSet = likesMap.get(otherId) ?? new Set<string>();
  const roomSet = roomsMap.get(otherId) ?? new Set<string>();

  let overlapLikes = 0;
  for (const p of likeSet) if (baseLikeSet.has(p)) overlapLikes++;

  let overlapRooms = 0;
  for (const rm of roomSet) if (baseRoomSet.has(rm)) overlapRooms++;

  const baseScore = cosineSimilarity(base.embedding, otherEmb.embedding);
  const score = 0.6 * baseScore + 0.2 * overlapLikes + 0.2 * overlapRooms;

  return { id: otherId, score };
});

scored.sort((a, b) => b.score - a.score);
const top = scored.slice(0, 5);

await prisma.friendSuggestion.deleteMany({ where: { user_id: userId } });
await prisma.friendSuggestion.createMany({
  data: top.map((s) => ({
    user_id: userId,
    suggested_user_id: s.id,
    score: s.score,
  })),
});

  }
  return top;
}

export async function fetchFriendSuggestions(userId: bigint) {
  const suggestions = await prisma.friendSuggestion.findMany({
    where: { user_id: userId },
    include: { suggestedUser: true },
    orderBy: { score: "desc" },
    take: 5,
  });

  const baseAttrs = await prisma.userAttributes.findUnique({
    where: { user_id: userId },
  });

  const fields: (keyof UserAttributes)[] = [
    "artists",
    "albums",
    "songs",
    "interests",
    "movies",
    "books",
    "hobbies",
    "communities",
  ];

  // now purely synchronous – O(1) look-ups
  const overlapFor = (otherId: bigint) => {
    if (!baseAttrs) return {} as Record<string, string[]>;
    const other = attrMap.get(otherId);
    if (!other) return {} as Record<string, string[]>;

    const overlap: Record<string, string[]> = {};
    for (const field of fields) {
      const inter = (baseAttrs[field] ?? []).filter((v) =>
        (other[field] ?? []).includes(v),
      );
      if (inter.length) overlap[field] = inter;
    }
    if (
      baseAttrs.location &&
      other.location &&
      baseAttrs.location === other.location
    ) {
      overlap.location = [baseAttrs.location];
    }
    return overlap;
  };

  return top.map((s) => {
    const sugg = attrMap.get(s.id)!;
    return {
      id: Number(s.id),
      name: sugg.name,
      username: sugg.username,
      image: sugg.image,
      score: s.score,
      overlap: overlapFor(s.id),
    };
  });
}
