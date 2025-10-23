// app/api/non-canonical/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

export async function POST(req: NextRequest) {
  try {
    // ─── 1. Authentication ─────────────────────────────────────
    const currentUserId = await getCurrentUserId();

    // ─── 2. Parse Request Body ────────────────────────────────
    const body = await req.json();
    const { ncmId, executeImmediately = true } = body;

    if (!ncmId) {
      return NextResponse.json(
        { error: "ncmId is required" },
        { status: 400 }
      );
    }

    // ─── 3. Fetch the Non-Canonical Move ──────────────────────
    const ncmResult = await prisma.$queryRaw<
      Array<{
        id: string;
        deliberationId: string;
        targetType: string;
        targetId: string;
        targetMoveId: string | null;
        contributorId: string;
        authorId: string;
        moveType: string;
        content: any;
        status: string;
      }>
    >`
      SELECT
        id, "deliberationId", "targetType", "targetId", "targetMoveId",
        "contributorId", "authorId", "moveType", content, status
      FROM "non_canonical_moves"
      WHERE id = ${ncmId}
      LIMIT 1
    `;

    if (!ncmResult || ncmResult.length === 0) {
      return NextResponse.json(
        { error: "Non-canonical move not found" },
        { status: 404 }
      );
    }

    const ncm = ncmResult[0];

    // ─── 4. Authorization Check ────────────────────────────────
    if (ncm.authorId !== currentUserId?.toString()) {
      return NextResponse.json(
        { error: "Only the original author can approve this response" },
        { status: 403 }
      );
    }

    // ─── 5. Check Status ───────────────────────────────────────
    if (ncm.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot approve move with status: ${ncm.status}` },
        { status: 400 }
      );
    }

    // ─── 6. Approve the Move ───────────────────────────────────
    const now = new Date();
    await prisma.$executeRaw`
      UPDATE "non_canonical_moves"
      SET status = 'APPROVED'::"NCMStatus",
          "approvedBy" = ${currentUserId?.toString()},
          "approvedAt" = ${now},
          "updatedAt" = ${now}
      WHERE id = ${ncmId}
    `;

    let canonicalMoveId: string | null = null;

    // ─── 7. Execute Canonically (if requested) ────────────────
    if (executeImmediately) {
      // Create a canonical DialogueMove
      const dialogueMoveId = crypto.randomUUID();
      
      try {
        // Map NCM moveType to DialogueMove kind
        const kindMapping: Record<string, string> = {
          "GROUNDS_RESPONSE": "GROUNDS",
          "CLARIFICATION_ANSWER": "ASSERT",
          "CHALLENGE_RESPONSE": "ASSERT",
          "EVIDENCE_ADDITION": "GROUNDS",
          "PREMISE_DEFENSE": "GROUNDS",
          "EXCEPTION_REBUTTAL": "GROUNDS"
        };
        
        await prisma.dialogueMove.create({
          data: {
            id: dialogueMoveId,
            deliberationId: ncm.deliberationId,
            kind: kindMapping[ncm.moveType] || "ASSERT",
            targetType: ncm.targetType,
            actorId: ncm.contributorId, // Contributor is credited
            targetId: ncm.targetId,
            payload: ncm.content,
            signature: `ncm-${ncmId}-${Date.now()}`
          }
        });

        // Link back to the canonical move
        await prisma.$executeRaw`
          UPDATE "non_canonical_moves"
          SET status = 'EXECUTED'::"NCMStatus",
              "canonicalMoveId" = ${dialogueMoveId},
              "updatedAt" = ${now}
          WHERE id = ${ncmId}
        `;

        canonicalMoveId = dialogueMoveId;

        console.log(`[non-canonical/approve] Executed ${ncmId} → canonical ${dialogueMoveId}`);
      } catch (error) {
        console.error("[non-canonical/approve] Failed to create canonical move:", error);
        // Move is still APPROVED even if execution fails
      }
    }

    // ─── 8. Emit Events & Notifications ───────────────────────
    // TODO: Emit bus event "non-canonical:approved"
    // TODO: Send notification to contributor

    // ─── 9. Return Success ─────────────────────────────────────
    return NextResponse.json({
      success: true,
      ncmId,
      status: executeImmediately && canonicalMoveId ? "EXECUTED" : "APPROVED",
      canonicalMoveId,
      message: executeImmediately && canonicalMoveId
        ? "Response approved and executed as canonical move"
        : "Response approved"
    });

  } catch (error: any) {
    console.error("[non-canonical/approve] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
