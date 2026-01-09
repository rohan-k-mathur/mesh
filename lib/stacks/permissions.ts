/**
 * Stack Permissions
 * 
 * Phase 1.1 of Stacks Improvement Roadmap
 * 
 * Centralized permission checks for stack operations.
 */

import { prisma } from "@/lib/prismaclient";

/**
 * Check if a user can view a stack
 */
export async function canViewStack(stackId: string, userId: bigint | null): Promise<boolean> {
  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    include: { collaborators: true },
  });

  if (!stack) return false;
  if (stack.is_public) return true;
  if (!userId) return false;
  if (stack.owner_id === userId) return true;

  // VIEWER/EDITOR/OWNER collaborators can see private stacks
  return stack.collaborators.some((c) => c.user_id === userId);
}

/**
 * Check if a user can edit a stack (add/remove items, reorder)
 */
export async function canEditStack(stackId: string, userId: bigint | null): Promise<boolean> {
  if (!userId) return false;

  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    include: { collaborators: true },
  });

  if (!stack) return false;
  if (stack.owner_id === userId) return true;

  return stack.collaborators.some(
    (c) => c.user_id === userId && (c.role === "EDITOR" || c.role === "OWNER")
  );
}

/**
 * Throws if user cannot edit the stack
 */
export async function assertCanEditStack(stackId: string, userId: bigint): Promise<void> {
  const canEdit = await canEditStack(stackId, userId);
  if (!canEdit) {
    throw new Error("Forbidden: You don't have permission to edit this stack");
  }
}

/**
 * Check if a user owns a stack
 */
export async function isStackOwner(stackId: string, userId: bigint): Promise<boolean> {
  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    select: { owner_id: true },
  });

  return stack?.owner_id === userId;
}
