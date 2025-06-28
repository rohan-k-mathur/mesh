"use server";

import { prisma } from "../prismaclient";
import { deepseekEmbedding } from "../deepseekclient";

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
  return suggestions.map((s) => ({
    id: s.suggested_user_id,
    name: s.suggestedUser.name,
    username: s.suggestedUser.username,
    image: s.suggestedUser.image,
    score: s.score,
  }));
}
