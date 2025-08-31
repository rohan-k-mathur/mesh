import { prisma } from '@/lib/prismaclient';

/** Resolve roomId and deliberationId for a claim */
export async function resolveClaimContext(claimId: string): Promise<{
  deliberationId: string | null;
  roomId: string | null;
}> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: {
      deliberationId: true,
      deliberation: { select: { roomId: true } },
    },
  });

  if (!claim) return { deliberationId: null, roomId: null };
  return {
    deliberationId: claim.deliberationId ?? null,
    roomId: claim.deliberation?.roomId ?? null,
  };
}
