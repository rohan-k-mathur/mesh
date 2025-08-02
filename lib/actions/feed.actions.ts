import { prisma } from "../prismaclient";
import { useSession } from "../useSession";
import { getUserFromCookies } from "@/lib/serverutils"; // server‑only util
import { revalidatePath } from "next/cache";
import { jsonSafe } from "../bigintjson";
export interface CreateFeedPostArgs {
  type:
    | "TEXT"
    | "IMAGE"
    | "VIDEO"
    | "GALLERY"
    | "PREDICTION"
    | "PRODUCT_REVIEW"
    | "LIVECHAT";
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  isPublic?: boolean;
}

export async function createFeedPost(
  args: CreateFeedPostArgs
): Promise<{ postId: bigint }> {
  const user = await getUserFromCookies(); // ← **server** side
  if (!user) throw new Error("Not authenticated");

  // const user = await getUserFromCookies();

  const { type, isPublic = true, ...rest } = args;

  const post = await prisma.feedPost.create({
    data: {
      author_id: user.userId!,
      type,
      isPublic,
      ...(rest.content && { content: rest.content }),
      ...(rest.imageUrl && { image_url: rest.imageUrl }),
      ...(rest.videoUrl && { video_url: rest.videoUrl }),
      ...(rest.caption && { caption: rest.caption }),
    },
  });

  return jsonSafe({ postId: post.id });
}

// export async function archiveExpiredFeedPosts() {
//   const now = new Date();
//   const expired = await prisma.feedPost.findMany({
//     where: { expiration_date: { lte: now } },
//   });
//   if (expired.length === 0) return;
//   const ids = expired.map((p) => p.id);
//   await prisma.feedPost.deleteMany({ where: { id: { in: ids } } });
// }
// export async function archiveExpiredFeedPosts() {
//   const now = new Date();

//   const expired = await prisma.feedPost.findMany({
//     where: { expiration_date: { lte: now } },      // ➜ error #1
//   });
//   if (expired.length === 0) return;

//   const ids = expired.map((p) => p.id);

//   await prisma.$transaction([
//     prisma.predictionMarket.deleteMany({ where: { postId: { in: ids } } }),
//     prisma.feedPost.deleteMany({ where: { id: { in: ids } } }),
//   ]);
// }
// export async function archiveExpiredFeedPosts() {
//   const now = new Date();                        // 1️⃣ declare

//   // 2️⃣ find every expired post (snake-case field)
//   const expired = await prisma.feedPost.findMany({
//     where: {
//       expiration_date: { lte: now },
//     },
//     select: { id: true },
//   });
//   if (expired.length === 0) return;

//   const ids = expired.map(p => p.id);

//   // 3️⃣ delete in the right order inside one transaction
//   await prisma.$transaction([
//     prisma.predictionMarket.deleteMany({
//       where: { postId: { in: ids } },
//     }),
//     prisma.feedPost.deleteMany({
//       where: { id: { in: ids } },
//     }),
//   ]);
// }
 // ❶ IDs of all expired posts
 export async function archiveExpiredFeedPosts() {
  const now = new Date();   // ← bring “now” back
 const ids = await prisma.feedPost.findMany({
  where: { expiration_date: { lte: now } },
  select: { id: true },
}).then(rows => rows.map(r => r.id));

if (ids.length === 0) return;

await prisma.$transaction([
  // delete trades first → then markets → then posts
  prisma.trade.deleteMany({ where: { market: { postId: { in: ids } } } }),
  prisma.predictionMarket.deleteMany({ where: { postId: { in: ids } } }),
  prisma.feedPost.deleteMany({ where: { id: { in: ids } } }),
]);
}

export async function fetchFeedPosts() {
  await archiveExpiredFeedPosts();
  const posts = await prisma.feedPost.findMany({
    where: {
      isPublic: true,
      OR: [{ expiration_date: null }, { expiration_date: { gt: new Date() } }],
    },
    orderBy: { created_at: "desc" },
    include: {
      predictionMarket: {
        select: {
          id: true,
          question: true,
          yesPool: true,
          noPool: true,
          b: true,
          state: true,
          outcome: true,
          closesAt: true,
        },
      },
      author: true,
    },
  });
  return posts.map((p) => ({ ...p }));
}

export async function deleteFeedPost({
  id,
  path,
}: {
  id: bigint;
  path?: string;
}) {
  const user = await getUserFromCookies();
  if (!user) return;
  const post = await prisma.feedPost.findUnique({ where: { id } });
  if (!post || post.author_id !== user.userId) return;
  await prisma.feedPost.delete({ where: { id } });
  if (path) revalidatePath(path);
}

export async function replicateFeedPost({
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
  const oid = BigInt(originalPostId);
  const uid = BigInt(userId);
  const original = await prisma.feedPost.findUnique({ where: { id: oid } });
  if (!original) throw new Error("Feed post not found");
  // const payload = JSON.stringify({ id: oid.toString(), text });
  const payload = JSON.stringify({
    id: oid.toString(),
    text,
    source: "feed",
  });
  const newPost = await prisma.feedPost.create({
    data: {
      content: `REPLICATE:${payload}`,
      author_id: uid,
      type: "TEXT",
      isPublic: true,
    },
  });
  if (path) revalidatePath(path);
  return newPost;
}

export async function likeFeedPost({ id }: { id: bigint }) {
  await prisma.feedPost.update({
    where: { id },
    data: { like_count: { increment: 1 } },
  });
}

export async function unlikeFeedPost({ id }: { id: bigint }) {
  await prisma.feedPost.update({
    where: { id },
    data: { like_count: { decrement: 1 } },
  });
}
