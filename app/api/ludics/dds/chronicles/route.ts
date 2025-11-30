/**
 * DDS Chronicles API - Main Entry Point
 * GET/POST /api/ludics/dds/chronicles
 * 
 * Fetches and computes chronicles for a design.
 * 
 * Note: The LudicChronicle model stores individual acts in order.
 * A chronicle is reconstructed by grouping acts by designId and ordering by `order`.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import {
  extractChronicles,
  disputeToPosition,
} from "@/packages/ludics-core/dds";
import type { Dispute, Chronicle } from "@/packages/ludics-core/dds/types";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const designId = url.searchParams.get("designId");

    if (!designId) {
      return NextResponse.json(
        { ok: false, error: "designId query param required" },
        { status: 400 }
      );
    }

    // Fetch existing chronicle entries from database (ordered by `order` field)
    const chronicleEntries = await prisma.ludicChronicle.findMany({
      where: { designId },
      orderBy: { order: "asc" },
      include: { 
        act: {
          include: { locus: true }
        }
      },
    });

    // Group entries into a single chronicle sequence
    if (chronicleEntries.length > 0) {
      const sequence = chronicleEntries.map((entry) => ({
        focus: entry.act?.locus?.path || "0",
        polarity: entry.act?.polarity || "P",
        ramification: [],
        actId: entry.actId,
        order: entry.order,
      }));

      const chronicle: Chronicle = {
        id: `chronicle-${designId}`,
        designId,
        sequence,
        length: sequence.length,
        isMaximal: true, // Assume maximal since we have all entries
      };

      return NextResponse.json({
        ok: true,
        chronicles: [chronicle],
        count: 1,
      });
    }

    // No chronicles found
    return NextResponse.json({
      ok: true,
      chronicles: [],
      count: 0,
    });
  } catch (error: any) {
    console.error("[DDS Chronicles GET Error]", error);
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

    // Check for cached chronicles if not forcing recompute
    if (!forceRecompute) {
      const existingEntries = await prisma.ludicChronicle.findMany({
        where: { designId },
        orderBy: { order: "asc" },
        include: { 
          act: {
            include: { locus: true }
          }
        },
      });

      if (existingEntries.length > 0) {
        const sequence = existingEntries.map((entry) => ({
          focus: entry.act?.locus?.path || "0",
          polarity: entry.act?.polarity || "P",
          ramification: [],
          actId: entry.actId,
          order: entry.order,
        }));

        return NextResponse.json({
          ok: true,
          chronicles: [{
            id: `chronicle-${designId}`,
            designId,
            sequence,
            length: sequence.length,
            isMaximal: true,
          }],
          count: 1,
          cached: true,
        });
      }
    }

    // Delete existing chronicle entries if forcing recompute
    if (forceRecompute) {
      await prisma.ludicChronicle.deleteMany({
        where: { designId },
      });
    }

    // Fetch design with acts
    const design = await prisma.ludicDesign.findUnique({
      where: { id: designId },
      include: { 
        acts: {
          include: { locus: true },
          orderBy: { orderInDesign: "asc" }
        }
      },
    });

    if (!design) {
      return NextResponse.json(
        { ok: false, error: "Design not found" },
        { status: 404 }
      );
    }

    // Fetch disputes involving this design
    const disputes = await prisma.ludicDispute.findMany({
      where: {
        OR: [{ posDesignId: designId }, { negDesignId: designId }],
      },
    });

    // Extract chronicles from disputes
    const allChronicles: Chronicle[] = [];

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
      const chronicles = extractChronicles(position);

      // Save chronicle entries (each act in the sequence)
      for (const chronicle of chronicles) {
        for (let i = 0; i < chronicle.sequence.length; i++) {
          const step = chronicle.sequence[i];
          if (step.actId) {
            await prisma.ludicChronicle.create({
              data: {
                designId,
                order: i,
                actId: step.actId,
              },
            });
          }
        }

        allChronicles.push({
          id: `chronicle-${designId}-${allChronicles.length}`,
          designId,
          sequence: chronicle.sequence,
          length: chronicle.length,
          isMaximal: chronicle.isMaximal,
        });
      }
    }

    // If no disputes, create chronicle from design acts directly
    if (disputes.length === 0 && design.acts && design.acts.length > 0) {
      const acts = design.acts;
      const sequence = acts.map((act: any, i: number) => ({
        focus: act.locus?.path || "0",
        polarity: act.polarity || "P",
        ramification: [],
        actId: act.id,
        order: i,
      }));

      // Save each act as a chronicle entry
      for (let i = 0; i < acts.length; i++) {
        await prisma.ludicChronicle.create({
          data: {
            designId,
            order: i,
            actId: acts[i].id,
          },
        });
      }

      allChronicles.push({
        id: `chronicle-${designId}`,
        designId,
        sequence,
        length: sequence.length,
        isMaximal: true,
      });
    }

    return NextResponse.json({
      ok: true,
      chronicles: allChronicles,
      count: allChronicles.length,
      cached: false,
    });
  } catch (error: any) {
    console.error("[DDS Chronicles POST Error]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
