// app/api/deliberations/[id]/activity-feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

const NO_STORE = { headers: { "Cache-Control": "no-store" } } as const;

/**
 * GET /api/deliberations/[id]/activity-feed?userId=X
 * 
 * Fetch recent activity stream for a user in a deliberation.
 * Includes attacks, challenges, responses, votes, etc.
 * Used by DiscourseDashboard "Activity Feed" panel.
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
    // For now, return empty array
    // TODO: Implement comprehensive activity feed that aggregates:
    // - New attacks on user's work
    // - New challenges on user's work
    // - Responses to user's attacks
    // - Votes on user's contributions
    // - Approvals/rejections of user's proposals
    
    const activities: any[] = [];

    return NextResponse.json(activities, NO_STORE);
  } catch (err) {
    console.error("[GET /api/deliberations/[id]/activity-feed] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch activity feed" },
      { status: 500, ...NO_STORE }
    );
  }
}
