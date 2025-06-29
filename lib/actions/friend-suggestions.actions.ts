"use server";

import { prisma } from "../prismaclient";
import { deepseekEmbedding } from "../deepseekclient";
import { UserAttributes } from "@prisma/client";

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

export async function updateUserEmbedding(userId: bigint) {
  await prisma.$connect();
  const attrs = await prisma.userAttributes.findUnique({
    where: { user_id: userId },
  });
  if (!attrs) return;
  const desc = [
    attrs.interests.join(" "),
    attrs.hobbies.join(" "),
    attrs.artists.join(" "),
    attrs.albums.join(" "),
    attrs.movies.join(" "),
    attrs.books.join(" "),
    attrs.communities.join(" "),
  ].join(" \n");
  const embedding = await deepseekEmbedding(desc);
  await prisma.userEmbedding.upsert({
    where: { user_id: userId },
    update: { embedding },
    create: { user_id: userId, embedding },
  });
}

export async function generateFriendSuggestions(userId: bigint) {
  await prisma.$connect();
  const base = await prisma.userEmbedding.findUnique({ where: { user_id: userId } });
  if (!base) return [];
  const others = await prisma.userEmbedding.findMany({ where: { user_id: { not: userId } } });
  if (others.length === 0) return [];
  const sample = others.sort(() => Math.random() - 0.5).slice(0, 20);
  const scored = sample.map((o) => ({
    id: o.user_id,
    score: cosineSimilarity(base.embedding, o.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);
  await prisma.friendSuggestion.deleteMany({ where: { user_id: userId } });
  for (const s of top) {
    await prisma.friendSuggestion.create({
      data: {
        user_id: userId,
        suggested_user_id: s.id,
        score: s.score,
      },
    });
  }
  return top;
}

export async function fetchFriendSuggestions(userId: bigint) {
  await prisma.$connect();
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

  const overlapFor = async (otherId: bigint) => {
    if (!baseAttrs) return {} as Record<string, string[]>;
    const other = await prisma.userAttributes.findUnique({
      where: { user_id: otherId },
    });
    if (!other) return {} as Record<string, string[]>;

    const overlap: Record<string, string[]> = {};
    for (const field of fields) {
      const arrA = (baseAttrs as any)[field] as string[] | null | undefined;
      const arrB = (other as any)[field] as string[] | null | undefined;
      const inter = (arrA || []).filter((v) => (arrB || []).includes(v));
      if (inter.length > 0) {
        overlap[field] = inter;
      }
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

  return Promise.all(
    suggestions.map(async (s) => ({
      id: Number(s.suggested_user_id),
      name: s.suggestedUser.name,
      username: s.suggestedUser.username,
      image: s.suggestedUser.image,
      score: s.score,
      overlap: await overlapFor(s.suggested_user_id),
    }))
  );
}
