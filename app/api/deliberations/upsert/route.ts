// lib/deepdive/upsert.ts
import { prisma } from '@/lib/prismaclient';
import { asUserIdString } from '@/lib/auth/normalize';

export async function getOrCreateDeliberationId(
  hostType: 'article'|'post'|'room_thread'|'library_stack'|'site'|'inbox_thread',
  hostId: string,
  roomId: string | null,
  createdById: string
) {
  const existing = await prisma.deliberation.findFirst({
    where: { hostType, hostId },
    select: { id: true }
  });
  if (existing) return existing.id;
  const userIdStr = asUserIdString(hostId);
  const created = await prisma.deliberation.create({
    data: {
      hostType,
      hostId,
      roomId: roomId ?? undefined,
      createdById: userIdStr,
      // default rule inherits from room if set; fallback utilitarian
      rule: roomId ? (await prisma.room.findUnique({ where: { id: roomId }, select: { representationRule: true }}))?.representationRule ?? 'utilitarian' : 'utilitarian',
    },
    select: { id: true }
  });
  return created.id;
}
