import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { getCurrentUserId } from "@/lib/serverutils";

/**
 * GET /api/deliberations/[id]/nets
 * Fetch all SchemeNets in a deliberation
 * 
 * Query params:
 * - netType: Filter by net type (serial, convergent, divergent, hybrid)
 * - sortBy: Sort by (confidence, createdAt, stepCount)
 * - order: Sort order (asc, desc)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deliberationId = params.id;
    const { searchParams } = new URL(request.url);
    const netTypeFilter = searchParams.get("netType");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";

    // Fetch all arguments in deliberation with their nets
    const argumentsWithNets = await prisma.argument.findMany({
      where: {
        deliberationId,
        schemeNet: {
          isNot: null, // Only arguments with nets
        },
      },
      include: {
        schemeNet: {
          include: {
            steps: {
              include: {
                scheme: {
                  select: {
                    id: true,
                    name: true,
                    materialRelation: true,
                    reasoningType: true,
                  },
                },
              },
              orderBy: { stepOrder: "asc" },
            },
          },
        },
        conclusion: {
          select: {
            id: true,
            propositionText: true,
          },
        },
      },
    });

    // Fetch authors separately for better performance
    const authorIds = [...new Set(argumentsWithNets.map(arg => arg.authorId))];
    const authors = await prisma.user.findMany({
      where: {
        id: {
          in: authorIds,
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
      },
    });
    const authorMap = new Map(authors.map(a => [a.id, a]));

    // Transform to net-centric view
    let nets = argumentsWithNets
      .filter((arg) => arg.schemeNet) // Type guard
      .map((arg) => {
        const net = arg.schemeNet!;
        const author = authorMap.get(arg.authorId);
        
        // Infer net type from steps structure
        let inferredNetType = "serial"; // default
        if (net.steps.length > 0) {
          const independentSteps = net.steps.filter((s) => !s.inputFromStep);
          if (independentSteps.length > 1) {
            inferredNetType = "convergent";
          } else if (net.steps.some((s) => {
            // Check if multiple steps feed from same source
            const feedsFrom = s.inputFromStep;
            return feedsFrom && net.steps.filter((s2) => s2.inputFromStep === feedsFrom).length > 1;
          })) {
            inferredNetType = "divergent";
          }
        }

        return {
          id: net.id,
          argumentId: arg.id,
          argumentConclusion: arg.conclusion?.propositionText || arg.conclusion?.id || "Untitled",
          description: net.description,
          netType: inferredNetType,
          overallConfidence: net.overallConfidence,
          stepCount: net.steps.length,
          createdAt: net.createdAt,
          updatedAt: net.updatedAt,
          author: {
            id: arg.author?.id,
            username: arg.author?.username,
            name: arg.author?.name,
            image: arg.author?.image,
          },
          steps: net.steps.map((step) => ({
            id: step.id,
            order: step.stepOrder,
            schemeId: step.schemeId,
            schemeName: step.scheme.name,
            label: step.label,
            confidence: step.confidence,
            inputFromStep: step.inputFromStep,
          })),
          // Calculate weakest link
          weakestStep: net.steps.reduce((min, step) =>
            step.confidence < min.confidence ? step : min
          , net.steps[0]),
        };
      });

    // Apply filters
    if (netTypeFilter) {
      nets = nets.filter((net) => net.netType === netTypeFilter);
    }

    // Apply sorting
    nets.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "confidence":
          comparison = a.overallConfidence - b.overallConfidence;
          break;
        case "stepCount":
          comparison = a.stepCount - b.stepCount;
          break;
        case "createdAt":
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return order === "asc" ? comparison : -comparison;
    });

    // Calculate deliberation-wide stats
    const stats = {
      totalNets: nets.length,
      averageConfidence: nets.length > 0
        ? nets.reduce((sum, net) => sum + net.overallConfidence, 0) / nets.length
        : 0,
      averageStepCount: nets.length > 0
        ? nets.reduce((sum, net) => sum + net.stepCount, 0) / nets.length
        : 0,
      netTypeBreakdown: {
        serial: nets.filter((n) => n.netType === "serial").length,
        convergent: nets.filter((n) => n.netType === "convergent").length,
        divergent: nets.filter((n) => n.netType === "divergent").length,
        hybrid: nets.filter((n) => n.netType === "hybrid").length,
      },
    };

    return NextResponse.json(
      { nets, stats },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/deliberations/[id]/nets] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch nets" },
      { status: 500 }
    );
  }
}
