/**
 * DDS Views API - Main Entry Point
 * GET/POST /api/ludics/dds/views
 * 
 * Fetches and computes views for a design.
 * Delegates to extract sub-route for computation.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import {
  extractProponentView,
  extractOpponentView,
  disputeToPosition,
} from "@/packages/ludics-core/dds";
import type { Dispute, View } from "@/packages/ludics-core/dds/types";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const designId = url.searchParams.get("designId");
    const player = url.searchParams.get("player") as "P" | "O" | null;

    if (!designId) {
      return NextResponse.json(
        { ok: false, error: "designId query param required" },
        { status: 400 }
      );
    }

    // Fetch existing views from database
    const where: any = { designId };
    if (player) where.player = player;

    const views = await prisma.ludicView.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Map to View type format
    const formattedViews: View[] = views.map((v) => ({
      id: v.id,
      designId: v.designId,
      player: v.player as "P" | "O",
      sequence: (v.viewSequence as any[]) || [],
      length: ((v.viewSequence as any[]) || []).length,
    }));

    return NextResponse.json({
      ok: true,
      views: formattedViews,
      count: formattedViews.length,
    });
  } catch (error: any) {
    console.error("[DDS Views GET Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { designId, forceRecompute } = await req.json();

    if (!designId) {
      return NextResponse.json(
        { ok: false, error: "designId is required" },
        { status: 400 }
      );
    }

    // Check for cached views if not forcing recompute
    if (!forceRecompute) {
      const existingViews = await prisma.ludicView.findMany({
        where: { designId },
      });

      if (existingViews.length > 0) {
        const formattedViews: View[] = existingViews.map((v) => ({
          id: v.id,
          designId: v.designId,
          player: v.player as "P" | "O",
          sequence: (v.viewSequence as any[]) || [],
          length: ((v.viewSequence as any[]) || []).length,
        }));

        return NextResponse.json({
          ok: true,
          views: formattedViews,
          count: formattedViews.length,
          cached: true,
        });
      }
    }

    // Fetch design
    const design = await prisma.ludicDesign.findUnique({
      where: { id: designId },
      include: { acts: true },
    });

    if (!design) {
      return NextResponse.json(
        { ok: false, error: "Design not found" },
        { status: 404 }
      );
    }

    // Determine player
    const player = design.participantId === "Proponent" ? "P" : "O";

    // Fetch disputes involving this design
    const disputes = await prisma.ludicDispute.findMany({
      where: {
        OR: [{ posDesignId: designId }, { negDesignId: designId }],
      },
    });

    // Extract views from each dispute
    const views: View[] = [];

    for (const dispute of disputes) {
      const disputeData: Dispute = {
        id: dispute.id,
        dialogueId: dispute.deliberationId,
        posDesignId: dispute.posDesignId,
        negDesignId: dispute.negDesignId,
        pairs: (dispute.actionPairs as any) || [],
        status: dispute.status as any,
        length: dispute.length,
      };

      const position = disputeToPosition(disputeData);
      const viewSequence =
        player === "P"
          ? extractProponentView(position)
          : extractOpponentView(position);

      // Save view
      const savedView = await prisma.ludicView.create({
        data: {
          designId,
          player,
          viewSequence: viewSequence as any,
          parentDisputeId: dispute.id,
        },
      });

      views.push({
        id: savedView.id,
        designId,
        player,
        sequence: viewSequence,
        length: viewSequence.length,
      });
    }

    // If no disputes, create a trivial view from the design acts
    if (disputes.length === 0) {
      const acts = design.acts || [];
      const trivialSequence = acts.map((act: any) => ({
        focus: act.locus?.path || "0",
        polarity: act.polarity || "P",
        ramification: [],
        actId: act.id,
      }));

      const savedView = await prisma.ludicView.create({
        data: {
          designId,
          player,
          viewSequence: trivialSequence as any,
        },
      });

      views.push({
        id: savedView.id,
        designId,
        player,
        sequence: trivialSequence,
        length: trivialSequence.length,
      });
    }

    return NextResponse.json({
      ok: true,
      views,
      count: views.length,
      cached: false,
    });
  } catch (error: any) {
    console.error("[DDS Views POST Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
