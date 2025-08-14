"use server";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { revalidatePath } from "next/cache";

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
  
  const editable = canEdit(stack, { id: viewerId });
  const subscribed = !!(stack as any).subscribers?.length;

  const order = stack.order ?? [];
  const postsById = new Map(stack.posts.map((p) => [p.id, p]));
  const posts =
    order.length > 0
      ? order.map((id) => postsById.get(id)).filter(Boolean)
      : stack.posts;

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
    viewer: { id: viewerId, editable, subscribed },
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
    }
  } else {
    if (op !== "unsubscribe") {
      await prisma.stackSubscription.create({
        data: { stack_id: stackId, user_id: userId },
      });
    }
  }

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

  revalidatePath(`/stacks/${stackId}`);
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

  revalidatePath(`/stacks/${stackId}`);
}
