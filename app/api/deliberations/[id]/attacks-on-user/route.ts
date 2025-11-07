// app/api/deliberations/[id]/attacks-on-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

/**
 * GET /api/deliberations/[id]/attacks-on-user?userId=X
 * 
 * Fetch all attacks (ConflictApplications) targeting a specific user's work.
 * Used by DiscourseDashboard "Actions on My Work" panel.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const deliberationId = params.id;
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId query parameter required" },
      { status: 400, ...NO_STORE }
    );
  }

  try {
    // Find all claims authored by this user in this deliberation
    const userClaims = await prisma.claim.findMany({
      where: {
        deliberationId,
        createdById: userId,
      },
      select: { id: true },
    });

    // Find all arguments authored by this user in this deliberation
    const userArguments = await prisma.argument.findMany({
      where: {
        deliberationId,
        authorId: userId,
      },
      select: { id: true },
    });

    const userClaimIds = userClaims.map((c) => c.id);
    const userArgumentIds = userArguments.map((a) => a.id);

    // Find all ConflictApplications targeting user's claims or arguments
    const attacks = await prisma.conflictApplication.findMany({
      where: {
        deliberationId,
        OR: [
          { conflictedClaimId: { in: userClaimIds } },
          { conflictedArgumentId: { in: userArgumentIds } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // Collect all unique claim/argument IDs we need to fetch
    const conflictingClaimIds = attacks
      .map((a: any) => a.conflictingClaimId)
      .filter(Boolean) as string[];
    const conflictingArgumentIds = attacks
      .map((a: any) => a.conflictingArgumentId)
      .filter(Boolean) as string[];
    const conflictedClaimIds = attacks
      .map((a: any) => a.conflictedClaimId)
      .filter(Boolean) as string[];
    const conflictedArgumentIds = attacks
      .map((a: any) => a.conflictedArgumentId)
      .filter(Boolean) as string[];

    // Fetch all related claims and arguments in bulk
    const [conflictingClaims, conflictingArguments, conflictedClaims, conflictedArguments] = await Promise.all([
      prisma.claim.findMany({
        where: { id: { in: conflictingClaimIds } },
        select: { id: true, text: true, createdById: true },
      }),
      prisma.argument.findMany({
        where: { id: { in: conflictingArgumentIds } },
        select: {
          id: true,
          text: true,
          authorId: true,
          claim: { select: { text: true } },
        },
      }),
      prisma.claim.findMany({
        where: { id: { in: conflictedClaimIds } },
        select: { id: true, text: true },
      }),
      prisma.argument.findMany({
        where: { id: { in: conflictedArgumentIds } },
        select: {
          id: true,
          text: true,
          claim: { select: { text: true } },
        },
      }),
    ]);

    // Collect unique attacker user IDs
    const attackerUserIds = [
      ...conflictingClaims.map(c => c.createdById),
      ...conflictingArguments.map(a => a.authorId),
    ].filter(Boolean) as string[];

    // Fetch attacker user profiles
    const attackerUsers = await prisma.profile.findMany({
      where: { id: { in: attackerUserIds } },
      select: { id: true, displayName: true, username: true },
    });

    const attackerUserMap = new Map(attackerUsers.map((u) => [u.id, u]));

    // Create lookup maps
    const conflictingClaimMap = new Map(conflictingClaims.map((c) => [c.id, c]));
    const conflictingArgumentMap = new Map(conflictingArguments.map((a) => [a.id, a]));
    const conflictedClaimMap = new Map(conflictedClaims.map((c) => [c.id, c]));
    const conflictedArgumentMap = new Map(conflictedArguments.map((a) => [a.id, a]));

    // Format for dashboard
    const formatted = attacks.map((attack: any) => {
      // Determine attacker
      const conflictingClaim = attack.conflictingClaimId
        ? conflictingClaimMap.get(attack.conflictingClaimId)
        : null;
      const conflictingArgument = attack.conflictingArgumentId
        ? conflictingArgumentMap.get(attack.conflictingArgumentId)
        : null;

      const attackerId = conflictingClaim?.createdById || 
                        conflictingArgument?.authorId || 
                        null;

      // Fetch attacker name
      const attackerUser = attackerId ? attackerUserMap.get(attackerId) : null;
      const attackerName = attackerUser?.displayName || attackerUser?.username || "Unknown";

      // Determine target
      const conflictedClaim = attack.conflictedClaimId
        ? conflictedClaimMap.get(attack.conflictedClaimId)
        : null;
      const conflictedArgument = attack.conflictedArgumentId
        ? conflictedArgumentMap.get(attack.conflictedArgumentId)
        : null;

      const targetType = attack.conflictedClaimId ? "claim" : "argument";
      const targetId = attack.conflictedClaimId || attack.conflictedArgumentId || "";
      const targetText = conflictedClaim?.text || 
                         conflictedArgument?.claim?.text || 
                         "";

      return {
        id: attack.id,
        attackerId,
        attackerName,
        legacyAttackType: attack.legacyAttackType,
        legacyTargetScope: attack.legacyTargetScope,
        targetType,
        targetId,
        targetText,
        createdAt: attack.createdAt,
        responded: false, // TODO: Check if user has responded (CONCEDE/RETRACT/GROUNDS)
      };
    });

    return NextResponse.json(formatted, NO_STORE);
  } catch (err) {
    console.error("[GET /api/deliberations/[id]/attacks-on-user] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch attacks" },
      { status: 500, ...NO_STORE }
    );
  }
}
