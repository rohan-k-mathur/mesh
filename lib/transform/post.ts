import type { BasePost } from "@/lib/types/post";

export const mapRealtimePost = (dbRow: any): BasePost => ({
  id: dbRow.id,
  canonicalId: dbRow.id,                  // realtime rows *are* canonical

  author: dbRow.author,
  type: dbRow.type,
  content: dbRow.content ?? null,
  roomPostContent: dbRow.room_post_content ?? dbRow.roomPostContent ?? null,
  image_url: dbRow.image_url ?? null,
  video_url: dbRow.video_url ?? null,
  caption: (dbRow as any).caption ?? null,
  pluginType: (dbRow as any).pluginType ?? null,
  pluginData: (dbRow as any).pluginData ?? null,
  predictionMarket: (dbRow as any).predictionMarket ?? null,
  claimIds:
    dbRow.productReview?.claims?.map((c: any) => c.id.toString()) ?? [],
  likeCount: dbRow.like_count ?? dbRow.likeCount ?? 0,
  commentCount: dbRow.commentCount ?? 0,
  expirationDate: dbRow.expiration_date ?? null,
  createdAt: dbRow.created_at
  ? new Date(dbRow.created_at).toISOString()
  : new Date().toISOString(),
});

export const mapFeedPost = (dbRow: any): BasePost => ({
  id: dbRow.id,
  canonicalId: dbRow.post_id ?? dbRow.id,   // fallback for legacy rows

  author: dbRow.author,
  type: dbRow.type,
  content: dbRow.content ?? null,
  roomPostContent: dbRow.room_post_content ?? dbRow.roomPostContent ?? null,
  image_url: dbRow.image_url ?? null,
  video_url: dbRow.video_url ?? null,
  caption: (dbRow as any).caption ?? null,
  pluginType: (dbRow as any).pluginType ?? null,
  pluginData: (dbRow as any).pluginData ?? null,
  predictionMarket: (dbRow as any).predictionMarket ?? null,
  claimIds:
    dbRow.productReview?.claims?.map((c: any) => c.id.toString()) ?? [],
  likeCount: dbRow.like_count ?? dbRow.likeCount ?? 0,
  commentCount: dbRow.commentCount ?? 0,
  expirationDate: dbRow.expiration_date ?? null,
  currentUserLike: (dbRow as any).currentUserLike ?? null,
  createdAt: dbRow.created_at
  ? new Date(dbRow.created_at).toISOString()
  : new Date().toISOString(),
});
