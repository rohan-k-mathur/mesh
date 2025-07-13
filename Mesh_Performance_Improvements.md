To keep the home feed responsive as posts accumulate, consider implementing server‑side pagination for realtime posts. The current implementation in fetchRealtimePosts loads all posts of a room in one query:

export async function fetchRealtimePosts({
  realtimeRoomId,
  postTypes,
}: {
  realtimeRoomId: string;
  postTypes: realtime_post_type[];
}) {
  const realtimePosts = await prisma.realtimePost.findMany({
    where: {
      realtime_room_id: realtimeRoomId,
      parent_id: null,
      type: { in: postTypes },
    },
    include: { author: true, _count: { select: { children: true } }, productReview: { include: { claims: true } } },
    orderBy: { created_at: "desc" },
  });
  ...
}

As the number of posts grows, this query can become expensive. A better approach is the one used for thread posts, which paginates results via skip and take parameters:

export async function fetchPosts(pageNumber = 1, pageSize = 20) {
  await archiveExpiredPosts();
  const skipAmount = (pageNumber - 1) * pageSize;

  const posts = await prisma.post.findMany({
    where: { parent_id: null, OR: [{ expiration_date: null }, { expiration_date: { gt: new Date() } }] },
    include: { author: {...}, children: {...}, _count: { select: { children: true } } },
    orderBy: { created_at: "desc" },
    skip: skipAmount,
    take: pageSize,
  });

  const totalPostCount = await prisma.post.count({ ... });
  ...
  return { posts: postsWithCount, isNext };
}

Suggested approach
Add pagination to realtime posts
Extend fetchRealtimePosts to accept parameters like cursor or pageSize, similar to fetchPosts. Return an indicator (isNext) so the client knows whether more posts are available.

Implement client‑side infinite scroll
Use a library such as React Query’s useInfiniteQuery or a custom hook that loads additional pages when the user scrolls near the end. This reduces initial load time and limits data transfer.

Archive or purge old posts
Standard threads already move expired posts to an archived_posts table via archiveExpiredPosts. A similar archival process for realtime posts would keep the working table smaller, reducing query costs.

Use indexes and caching
Ensure the database has indexes on created_at, realtime_room_id, and any other filter fields. Optionally cache recent pages (e.g., with Redis or a CDN) to lower database load for popular content.

Consider UI virtualization
For very long lists, rendering only the visible items (using a library like react-window) helps keep client performance high.

By fetching posts in pages and archiving old data, the feed will scale better without incurring excessive database or rendering costs while maintaining a smooth user experience.
