"use server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { revalidatePath } from "next/cache";
import { feed_post_type } from "@prisma/client";
import { emitBus } from "@/lib/bus";

type Viewer = { id: bigint | null };

function canEdit(stack: any, viewer: Viewer) {
  if (!viewer.id) return false;
  if (stack.owner_id === viewer.id) return true;
  if (!stack.collaborators) return false;
  return stack.collaborators.some(
    (c: any) =>
      c.user_id === viewer.id &&
      (c.role === "EDITOR" || c.role === "OWNER")
  );
}
 
function canView(stack: any, viewer: Viewer) {
    if (stack.is_public) return true;
    if (!viewer.id) return false;
    if (stack.owner_id === viewer.id) return true;
    // VIEWER/EDITOR/OWNER collaborators can see private stacks
    return stack.collaborators?.some((c: any) => c.user_id === viewer.id) ?? false;
  }
  export async function assertCanEditStack(stackId: string, userId: bigint) {
    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
      include: { collaborators: true },
    });
    if (!stack) throw new Error("Stack not found");
    if (stack.owner_id === userId) return true;
    const ok = !!stack.collaborators?.some(
      (c) => c.user_id === userId && (c.role === "EDITOR" || c.role === "OWNER")
    );
    if (!ok) throw new Error("Forbidden");
    return true;
  }
  
  async function ensureStackDiscussionThread(stack: {
    id: string;
    name: string;
    owner_id: bigint;
    is_public: boolean;
  }) {
    const threadKey = `stack:${stack.id}`;
    const thread = await prisma.feedPost.upsert({
      where: { articleId: threadKey },
      create: {
        author_id: stack.owner_id,
        type: "TEXT",
        content: `Discussion for stack "${stack.name}"`,
        isPublic: stack.is_public,
        stack_id: stack.id,
        articleId: threadKey,
      },
      update: {},
      select: { id: true },
    });
    return thread.id;
  }
  
export async function getStackPageData(stackId: string) {
  const u = await getUserFromCookies();
  const viewerId = u?.userId ? BigInt(u.userId) : null;
       const include: any = {
           owner: { select: { id: true, name: true, image: true } },
           collaborators: true,
           posts: {
             orderBy: { created_at: "asc" },
             select: {
               id: true,
               title: true,
               file_url: true,
               thumb_urls: true,
               page_count: true,
               uploader_id: true,
               created_at: true,
             },
           },
         };
         if (viewerId) {
           include.subscribers = { where: { user_id: viewerId }, select: { user_id: true } };
         }
       
         const stack = await prisma.stack.findUnique({ where: { id: stackId }, include });
  if (!stack) return { notFound: true } as const;
 
    // deny access to private stacks if viewer lacks permission
    if (!canView(stack, { id: viewerId })) return { notFound: true } as const;
  
  // Ensure there is a root FeedPost to anchor the discussion for this stack
       const discussionKey = `stack:${stack.id}`;
       const discussionRoot = await prisma.feedPost.upsert({
         where: { articleId: discussionKey },
         create: {
          author_id: stack.owner_id,
            stack_id: stack.id,                        // ✅ use scalar FK instead of nested connect
             type: feed_post_type.TEXT,
          content: `Discussion for stack “${stack.name}”`,
          isPublic: stack.is_public,
    articleId: discussionKey,
         },
         update: {},
         select: { id: true },
       });
  
  
  const editable = canEdit(stack, { id: viewerId });
  const subscribed = !!(stack as any).subscribers?.length;

  const order = stack.order ?? [];
  const postsById = new Map(stack.posts.map((p) => [p.id, p]));
  const posts =
    order.length > 0
      ? order.map((id) => postsById.get(id)).filter(Boolean)
      : stack.posts;


  const discussionPostId = await ensureStackDiscussionThread({
    id: stack.id,
    name: stack.name,
    owner_id: stack.owner_id,
    is_public: stack.is_public,
  });


  return {
    stack: {
      id: stack.id,
      name: stack.name,
      description: stack.description,
      is_public: stack.is_public,
      owner_id: stack.owner_id,
      slug: stack.slug ?? null,
    },
    posts,
  
    viewer: { id: viewerId, editable, subscribed, isOwner: stack.owner_id === viewerId },
    discussionPostId: discussionRoot.id,
  };
}

export async function toggleStackSubscription(formData: FormData) {
  const u = await getUserFromCookies();
  if (!u) throw new Error("Unauthenticated");
  const userId = BigInt(u.userId);

  const stackId = String(formData.get("stackId") || "");
  const op = String(formData.get("op") || "toggle");

       const stack = await prisma.stack.findUnique({
           where: { id: stackId },
           include: { collaborators: true },
         });
         if (!stack) throw new Error("Stack not found");
         // Only allow subscribe if public OR viewer could view anyway.
         if (!(stack.is_public || canView(stack, { id: userId }))) {
           throw new Error("Forbidden");
         }
    
  const existing = await prisma.stackSubscription.findUnique({
    where: { stack_id_user_id: { stack_id: stackId, user_id: userId } },
  });

  if (existing) {
    if (op !== "subscribe") {
      await prisma.stackSubscription.delete({
        where: { stack_id_user_id: { stack_id: stackId, user_id: userId } },
      });
       emitBus("stacks:changed", { stackId, op: "unsubscribe", userId: String(userId) });

    }
  } else {
    if (op !== "unsubscribe") {
      await prisma.stackSubscription.create({
        data: { stack_id: stackId, user_id: userId },
      });
       emitBus("stacks:changed", { stackId, op: "subscribe", userId: String(userId) });

    }
  }

  revalidatePath(`/stacks/${stackId}`);
}


export async function addCollaborator(formData: FormData) {
  const u = await getUserFromCookies();
  if (!u) throw new Error("Unauthenticated");
  const ownerId = BigInt(u.userId);

  const stackId = String(formData.get("stackId") || "");
  const role = String(formData.get("role") || "EDITOR") as "EDITOR" | "VIEWER";
  const rawUserId = String(formData.get("userId") || "");
  const username = String(formData.get("username") || "");

  const stack = await prisma.stack.findUnique({ where: { id: stackId } });
  if (!stack || stack.owner_id !== ownerId) throw new Error("Forbidden");

  let target: { id: bigint } | null = null;
  if (rawUserId) {
    target = await prisma.user.findUnique({
      where: { id: BigInt(rawUserId) },
      select: { id: true },
    });
  } else if (username) {
    target = await prisma.user.findFirst({
      where: { username },
      select: { id: true },
    });
  }
  if (!target) throw new Error("User not found");

  await prisma.stackCollaborator.upsert({
    where: { stack_id_user_id: { stack_id: stackId, user_id: target.id } },
    create: { stack_id: stackId, user_id: target.id, role },
    update: { role },
  });

  revalidatePath(`/stacks/${stackId}`);
}

export async function removeCollaborator(formData: FormData) {
  const u = await getUserFromCookies();
  if (!u) throw new Error("Unauthenticated");
  const ownerId = BigInt(u.userId);
  const stackId = String(formData.get("stackId") || "");
  const targetUserId = BigInt(String(formData.get("userId") || ""));
  const stack = await prisma.stack.findUnique({ where: { id: stackId } });
  if (!stack || stack.owner_id !== ownerId) throw new Error("Forbidden");
  await prisma.stackCollaborator.delete({
    where: { stack_id_user_id: { stack_id: stackId, user_id: targetUserId } },
  });
  revalidatePath(`/stacks/${stackId}`);
}

export async function setStackOrder(formData: FormData) {
  const u = await getUserFromCookies();
  if (!u) throw new Error("Unauthenticated");
  const userId = BigInt(u.userId);
  const stackId = String(formData.get("stackId") || "");
  const orderJson = String(formData.get("orderJson") || "[]");
  const order = JSON.parse(orderJson) as string[];

  await assertCanEditStack(stackId, userId);
  await prisma.stack.update({ where: { id: stackId }, data: { order } });
  revalidatePath(`/stacks/${stackId}`);
}

export async function reorderStack(formData: FormData) {
  const u = await getUserFromCookies();
  if (!u) throw new Error("Unauthenticated");
  const userId = BigInt(u.userId);

  const stackId = String(formData.get("stackId") || "");
  const direction = String(formData.get("direction") || "up");
  const postId = String(formData.get("postId") || "");

  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    include: { collaborators: true },
  });
  if (!stack) throw new Error("Stack not found");
  if (!canEdit(stack, { id: userId })) throw new Error("Forbidden");

  const order = [...(stack.order ?? [])];
  const idx = order.indexOf(postId);
  if (idx === -1) {
    const posts = await prisma.libraryPost.findMany({
      where: { stack_id: stackId },
      orderBy: { created_at: "asc" },
      select: { id: true },
    });
    order.splice(0, order.length, ...posts.map((p) => p.id));
  }

  const i = order.indexOf(postId);
  if (i < 0) return;

  if (direction === "up" && i > 0) {
    [order[i - 1], order[i]] = [order[i], order[i - 1]];
  } else if (direction === "down" && i < order.length - 1) {
    [order[i], order[i + 1]] = [order[i + 1], order[i]];
  }

  await prisma.stack.update({
    where: { id: stackId },
    data: { order },
  });
   emitBus("stacks:changed", { stackId, op: "reorder", postId });

  revalidatePath(`/stacks/${stackId}`);
}


   /** POST a new comment under the stack’s discussion root. */
   export async function addStackComment(formData: FormData) {
    const u = await getUserFromCookies();
    if (!u) throw new Error("Unauthenticated");
    const userId = BigInt(u.userId);
  
    const rootIdRaw = String(formData.get("rootId") || "");
    const text = String(formData.get("text") || "").trim();
    if (!rootIdRaw) throw new Error("Missing rootId");
    if (!text) throw new Error("Empty comment");
  
    const rootId = BigInt(rootIdRaw);
    const root = await prisma.feedPost.findUnique({
      where: { id: rootId },
      select: { isPublic: true, stack_id: true },
    });
    if (!root) throw new Error("Thread not found");
  
    let stackId: string | null = root.stack_id;
    if (stackId) {
      const stack = await prisma.stack.findUnique({
        where: { id: stackId },
        include: {
          collaborators: true,
          subscribers: { where: { user_id: userId }, select: { user_id: true } },
        },
      });
      const isOwner = stack?.owner_id === userId;
      const isEditor = !!stack?.collaborators?.some(
        (c) => c.user_id === userId && (c.role === "EDITOR" || c.role === "OWNER")
      );
      const isSub = !!stack?.subscribers?.length;
      const allowed = stack?.is_public || isOwner || isEditor || isSub;
      if (!allowed) throw new Error("Forbidden");
    }
  
    const created = await prisma.feedPost.create({
      data: {
        parent_id: rootId,
        author_id: userId,
        type: "TEXT",
        content: text,
        isPublic: root.isPublic,
      },
      select: { id: true },
    });
    emitBus("comments:changed", { stackId, op: "add" });
    if (stackId) revalidatePath(`/stacks/${stackId}`);
    return created.id; // 👈 return the comment id
  }
     
     /** Delete a comment (author, owner, or editor). */
     export async function deleteStackComment(formData: FormData) {
       const u = await getUserFromCookies();
       if (!u) throw new Error("Unauthenticated");
       const userId = BigInt(u.userId);
     
       const commentIdRaw = String(formData.get("commentId") || "");
       if (!commentIdRaw) throw new Error("Missing commentId");
       const commentId = BigInt(commentIdRaw);
     
       const comment = await prisma.feedPost.findUnique({
         where: { id: commentId },
         select: { author_id: true, parent_id: true },
       });
       if (!comment) throw new Error("Not found");
       if (!comment.parent_id) throw new Error("Not a comment");
     
       const root = await prisma.feedPost.findUnique({
         where: { id: comment.parent_id },
         select: { stack_id: true },
       });
       const stackId = root?.stack_id || null;
     
       let allowed = comment.author_id === userId;
       if (!allowed && stackId) {
         const stack = await prisma.stack.findUnique({
           where: { id: stackId },
           include: { collaborators: true },
         });
         const isOwner = stack?.owner_id === userId;
         const isEditor = !!stack?.collaborators?.some(
           (c) => c.user_id === userId && (c.role === "EDITOR" || c.role === "OWNER")
         );
         allowed = isOwner || isEditor;
       }
       if (!allowed) throw new Error("Forbidden");
     
       await prisma.feedPost.delete({ where: { id: commentId } });
        emitBus("comments:changed", { stackId, op: "delete" });

       if (stackId) revalidatePath(`/stacks/${stackId}`);
     }

export async function removeFromStack(formData: FormData) {
  const u = await getUserFromCookies();
  if (!u) throw new Error("Unauthenticated");
  const userId = BigInt(u.userId);

  const stackId = String(formData.get("stackId") || "");
  const postId = String(formData.get("postId") || "");

  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    include: { collaborators: true },
  });
  if (!stack) throw new Error("Stack not found");
  if (!canEdit(stack, { id: userId })) throw new Error("Forbidden");

  await prisma.$transaction(async (tx) => {
           // Only detach if the post truly belongs to this stack
           const updated = await tx.libraryPost.updateMany({
             where: { id: postId, stack_id: stackId },
             data: { stack_id: null },
           });
           if (updated.count === 0) throw new Error("Post not in this stack");
           await tx.stack.update({
             where: { id: stackId },
             data: { order: (stack.order ?? []).filter((id) => id !== postId) },
           });
      });
       emitBus("stacks:changed", { stackId, op: "remove", postId });

  revalidatePath(`/stacks/${stackId}`);
}
