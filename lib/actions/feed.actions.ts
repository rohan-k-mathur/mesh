import { prisma } from "../prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

export interface CreateFeedPostArgs {
  type: "TEXT" | "IMAGE" | "VIDEO" | "GALLERY" | "PREDICTION" | "PRODUCT_REVIEW";
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  isPublic?: boolean;
}

export async function createFeedPost(args: CreateFeedPostArgs): Promise<{ postId: bigint }> {
  const user = await getUserFromCookies();
  if (!user) throw new Error("Not authenticated");

  const { type, isPublic = true, ...rest } = args;

  const post = await prisma.feedPost.create({
    data: {
      author_id: user.userId!,
      type,
      isPublic,
      ...(rest.content && { content: rest.content }),
      ...(rest.imageUrl && { image_url: rest.imageUrl }),
      ...(rest.videoUrl && { video_url: rest.videoUrl }),
    },
  });

  return { postId: post.id };
}

export async function fetchFeedPosts() {
  const posts = await prisma.feedPost.findMany({
    where: { isPublic: true },
    orderBy: { created_at: "desc" },
    include: { predictionMarket: true, author: true },
  });
  return posts.map((p) => ({ ...p }));
}
