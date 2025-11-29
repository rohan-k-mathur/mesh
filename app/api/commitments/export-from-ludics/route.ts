/**
 * POST /api/commitments/export-from-ludics
 * 
 * Reverse flow: Export Ludics commitment elements back to the dialogue commitment system.
 * Takes LudicCommitmentElement IDs and creates corresponding Commitment records.
 * 
 * This enables "publishing" ludics inference results back to the dialogue layer.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";
import { emitBus } from "@/lib/server/bus";

interface ExportFromLudicsRequest {
  deliberationId: string;
  ludicCommitmentElementIds: string[]; // IDs of LudicCommitmentElements to export
  targetParticipantId?: string; // Optional: override participant ID (default: use ludicElement.ownerId)
}

interface ExportFromLudicsResponse {
  ok: boolean;
  error?: string;
  created?: Array<{
    commitmentId: string;
    ludicElementId: string;
    proposition: string;
    participantId: string;
  }>;
  skipped?: Array<{
    ludicElementId: string;
    reason: string;
  }>;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authentication check
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body: ExportFromLudicsRequest = await request.json();
    const { deliberationId, ludicCommitmentElementIds, targetParticipantId } = body;

    if (!deliberationId || !ludicCommitmentElementIds || ludicCommitmentElementIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: deliberationId and ludicCommitmentElementIds" },
        { status: 400 }
      );
    }

    // 3. Verify deliberation exists and user has access
    const deliberation = await prisma.deliberation.findUnique({
      where: { id: deliberationId },
      select: { id: true, roomId: true },
    });

    if (!deliberation) {
      return NextResponse.json(
        { ok: false, error: "Deliberation not found" },
        { status: 404 }
      );
    }

    // Check room membership if deliberation has a room
    if (deliberation.roomId) {
      // @ts-ignore - roomMember exists but types not yet refreshed
      const roomMember = await prisma.roomMember.findFirst({
        where: {
          roomId: deliberation.roomId,
          userId: userId,
        },
      });

      if (!roomMember) {
        return NextResponse.json(
          { ok: false, error: "Access denied to this deliberation" },
          { status: 403 }
        );
      }
    }

    // 4. Fetch ludic commitment elements
    const ludicElements = await prisma.ludicCommitmentElement.findMany({
      where: {
        id: { in: ludicCommitmentElementIds },
      },
      include: {
        baseLocus: {
          select: {
            dialogueId: true,
          },
        },
      },
    });

    if (ludicElements.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No ludic commitment elements found with provided IDs" },
        { status: 404 }
      );
    }

    // 5. Verify all elements belong to this deliberation
    const wrongDeliberation = ludicElements.find(
      el => el.baseLocus?.dialogueId !== deliberationId
    );

    if (wrongDeliberation) {
      return NextResponse.json(
        {
          ok: false,
          error: `Element ${wrongDeliberation.id} does not belong to deliberation ${deliberationId}`,
        },
        { status: 400 }
      );
    }

    // 6. Process each element
    const created: Array<{
      commitmentId: string;
      ludicElementId: string;
      proposition: string;
      participantId: string;
    }> = [];

    const skipped: Array<{
      ludicElementId: string;
      reason: string;
    }> = [];

    for (const ludicElement of ludicElements) {
      const proposition = ludicElement.label;
      const participantId = targetParticipantId || ludicElement.ownerId;

      // Check if commitment already exists
      const existingCommitment = await prisma.commitment.findFirst({
        where: {
          deliberationId,
          participantId,
          proposition,
          isRetracted: false,
        },
      });

      if (existingCommitment) {
        skipped.push({
          ludicElementId: ludicElement.id,
          reason: "Commitment already exists in dialogue system",
        });
        continue;
      }

      // Check if already exported via mapping
      // @ts-ignore - commitmentLudicMapping exists but types not yet refreshed
      const existingMapping = await prisma.commitmentLudicMapping.findFirst({
        where: {
          ludicCommitmentElementId: ludicElement.id,
        },
      });

      if (existingMapping) {
        skipped.push({
          ludicElementId: ludicElement.id,
          reason: "Already exported (mapping exists)",
        });
        continue;
      }

      // 7. Create dialogue commitment and supporting records
      const commitment = await prisma.commitment.create({
        data: {
          deliberationId,
          participantId,
          proposition,
          isRetracted: false,
        },
      });

      // 7b. Create a Claim node (required for CommitmentStorePanel to display it)
      // The CommitmentStorePanel SQL query joins on Claim.text
      const claim = await prisma.claim.create({
        data: {
          text: proposition,
          deliberationId,
          createdById: String(userId), // Current user who initiated the export
          moid: `ludics-export-${ludicElement.id}-${Date.now()}`, // Unique identifier
        },
      });

      // 7c. Create DialogueMove (ASSERT) linking to the claim
      // This is what CommitmentStorePanel actually reads
      // signature is required - use a unique identifier
      const signature = `ludics-export-${ludicElement.id}-${Date.now()}`;
      
      // Use the current user's ID as actorId for proper user lookup in CommitmentStorePanel
      // The CommitmentStorePanel SQL joins on numeric actorId to users table
      // Store the ludics participantId (Proponent/Opponent) in the mapping instead
      const dialogueMoveActorId = String(userId);
      
      // @ts-ignore - extJson may not be in types yet
      const dialogueMove = await prisma.dialogueMove.create({
        data: {
          deliberationId,
          actorId: dialogueMoveActorId, // Use real user ID for proper display
          kind: "ASSERT",
          targetType: "claim",
          targetId: claim.id,
          signature,
        },
      });

      // 8. Create mapping record to link ludics and dialogue systems
      // @ts-ignore - commitmentLudicMapping exists but types not yet refreshed
      await prisma.commitmentLudicMapping.create({
        data: {
          dialogueCommitmentId: commitment.id,
          deliberationId,
          participantId,
          proposition: proposition || ludicElement.label || "", // Handle null
          ludicCommitmentElementId: ludicElement.id,
          ludicOwnerId: ludicElement.ownerId,
          ludicLocusId: ludicElement.baseLocusId,
          promotedBy: String(userId),
          promotionContext: {
            sourcePanel: "export-from-ludics",
            direction: "ludics-to-dialogue",
            timestamp: new Date().toISOString(),
          },
        },
      });

      created.push({
        commitmentId: commitment.id,
        ludicElementId: ludicElement.id,
        proposition: proposition || ludicElement.label || "",
        participantId,
      });

      console.log(`[export-from-ludics] Created commitment ${commitment.id} from ludic element ${ludicElement.id}`);
    }

    // 9. Emit refresh events
    const affectedParticipants = [...new Set(created.map(c => c.participantId))];
    for (const participantId of affectedParticipants) {
      emitBus("dialogue:cs:refresh", {
        deliberationId,
        participantId,
      });
    }

    // 10. Return success response
    const responseTime = Date.now() - startTime;
    console.log(`[export-from-ludics] Exported ${created.length} commitments, skipped ${skipped.length} in ${responseTime}ms`);

    return NextResponse.json(
      {
        ok: true,
        created,
        skipped,
      } as ExportFromLudicsResponse,
      {
        headers: {
          "X-Response-Time": `${responseTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error("[export-from-ludics] Error exporting commitments:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
