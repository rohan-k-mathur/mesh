import { prisma } from "../prismaclient";
import { useSession } from "../useSession";
import { getUserFromCookies } from "@/lib/serverutils"; // server‑only util
import { revalidatePath } from "next/cache";
import { jsonSafe } from "../bigintjson";
import { canRepost } from "@/lib/repostPolicy";
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

    /* 1️⃣ Create the canonical post row */
    const master = await prisma.post.create({
      data: {
        author_id: user.userId!,
        type,
        isPublic,
        content: rest.content ?? null,
        image_url: rest.imageUrl ?? null,
        video_url: rest.videoUrl ?? null,
        caption:  rest.caption  ?? null,
      },
    });


  /* 2️⃣ Create the feed row that points at it */
  const feed = await prisma.feedPost.create({
    data: {
      post_id:   master.id,        // 🔑 FK
      author_id: user.userId!,
      type,
      isPublic,
      ...(rest.content && { content: rest.content }),
      ...(rest.imageUrl && { image_url: rest.imageUrl }),
      ...(rest.videoUrl && { video_url: rest.videoUrl }),
      ...(rest.caption && { caption: rest.caption }),
    },
  });


  // const post = await prisma.feedPost.create({
  //   data: {
  //     author_id: user.userId!,
  //     type,
  //     isPublic,
  //     ...(rest.content && { content: rest.content }),
  //     ...(rest.imageUrl && { image_url: rest.imageUrl }),
  //     ...(rest.videoUrl && { video_url: rest.videoUrl }),
  //     ...(rest.caption && { caption: rest.caption }),
  //   },
  // });

  return jsonSafe({ postId: feed.id });
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

// export async function fetchFeedPosts() {
//   await archiveExpiredFeedPosts();
//   const posts = await prisma.feedPost.findMany({
//     where: {
//       isPublic: true,
//       OR: [{ expiration_date: null }, { expiration_date: { gt: new Date() } }],
//     },
//     orderBy: { created_at: "desc" },
//     include: {
//       predictionMarket: {
//         select: {
//           id: true,
//           question: true,
//           yesPool: true,
//           noPool: true,
//           b: true,
//           state: true,
//           outcome: true,
//           closesAt: true,
//         },
//       },
//       author: true,
//     },
//   });
//   return posts.map((p) => ({ ...p }));
// }
export async function fetchFeedPosts() {
  await archiveExpiredFeedPosts();

  const rows = await prisma.feedPost.findMany({
    where: {
      isPublic: true,
      OR: [
        { expiration_date: null },
        { expiration_date: { gt: new Date() } },
      ],
    },
    orderBy: { created_at: "desc" },

    /* 👇 use select so scalar `post_id` is available */
    select: {
      id: true,                 // feed‑row PK
      post_id: true,            // ← canonical Post PK
      type: true,
      content: true,
      image_url: true,
      video_url: true,
      caption: true,
      like_count: true,
      // commentCount: true,
      _count: { select: { children: true } },   // children = replies

      expiration_date: true,
      created_at: true,

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
      author: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return rows;          // mapper will handle null‑checks / defaults
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
  if (!canRepost(original.type)) {
    throw new Error("Post type not allowed to be replicated");
  }
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
