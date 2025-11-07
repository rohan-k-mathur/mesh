// app/api/deliberations/[id]/attacks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

/**
 * GET /api/deliberations/[id]/attacks?attackerId=X
 * 
 * Fetch all attacks (ConflictApplications) created by a specific user.
 * Used by DiscourseDashboard "My Engagements" panel.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const deliberationId = params.id;
  const attackerId = req.nextUrl.searchParams.get("attackerId");

  if (!attackerId) {
    return NextResponse.json(
      { error: "attackerId query parameter required" },
      { status: 400, ...NO_STORE }
    );
  }

  try {
    // Find all ConflictApplications where user is the attacker
    // (either via conflictingClaim or conflictingArgument)
    
    // First get user's claims and arguments
    const [userClaims, userArguments] = await Promise.all([
      prisma.claim.findMany({
        where: {
          deliberationId,
          createdById: attackerId,
        },
        select: { id: true },
      }),
      prisma.argument.findMany({
        where: {
          deliberationId,
          authorId: attackerId,
        },
        select: { id: true },
      }),
    ]);

    const userClaimIds = userClaims.map((c) => c.id);
    const userArgumentIds = userArguments.map((a) => a.id);

    // Find attacks where user's claims/arguments are the conflicting elements
    const attacks = await prisma.conflictApplication.findMany({
      where: {
        deliberationId,
        OR: [
          { conflictingClaimId: { in: userClaimIds } },
          { conflictingArgumentId: { in: userArgumentIds } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attacks, NO_STORE);
  } catch (err) {
    console.error("[GET /api/deliberations/[id]/attacks] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch attacks" },
      { status: 500, ...NO_STORE }
    );
  }
}
