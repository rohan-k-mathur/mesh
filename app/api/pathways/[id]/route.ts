import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { apiError, mapServiceError, requireAuth } from "@/lib/pathways/apiHelpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const pathway = await prisma.institutionalPathway.findUnique({
      where: { id: params.id },
    });
    if (!pathway) return apiError("NOT_FOUND", "Pathway not found");

    // Public read gate
    let isAuthed = true;
    if (!pathway.isPublic) {
      const auth = await requireAuth();
      if (!auth.ok) return auth.response;
    } else {
      // Public requests still allow authed users; only redact when fully anon.
      const auth = await requireAuth();
      isAuthed = auth.ok;
    }

    const currentPacket = pathway.currentPacketId
      ? await prisma.recommendationPacket.findUnique({
          where: { id: pathway.currentPacketId },
          include: { items: { orderBy: { orderIndex: "asc" } } },
        })
      : null;

    const latestSubmission = currentPacket
      ? await prisma.institutionalSubmission.findFirst({
          where: { packetId: currentPacket.id },
          orderBy: { submittedAt: "desc" },
        })
      : null;

    const latestResponse = latestSubmission
      ? await prisma.institutionalResponse.findFirst({
          where: { submissionId: latestSubmission.id },
          orderBy: { respondedAt: "desc" },
        })
      : null;

    return NextResponse.json({
      pathway: isAuthed ? pathway : { ...pathway, openedById: null },
      currentPacket: isAuthed
        ? currentPacket
        : currentPacket
          ? { ...currentPacket, createdById: null }
          : null,
      latestSubmission: isAuthed
        ? latestSubmission
        : latestSubmission
          ? { ...latestSubmission, submittedById: null, acknowledgedById: null }
          : null,
      latestResponse: isAuthed
        ? latestResponse
        : latestResponse
          ? { ...latestResponse, respondedById: null }
          : null,
      metrics: {
        submissionToAcknowledgementMs: null,
        acknowledgementToResponseMs: null,
        itemDispositionCoverage: null,
      },
    });
  } catch (err) {
    return mapServiceError(err);
  }
}
