/**
 * Phase 3.3: Cross-Deliberation Related API
 * GET /api/deliberations/:id/shared-claims-related - Find related deliberations by shared canonical claims
 * 
 * This endpoint finds deliberations that share canonical claims with the given deliberation.
 * Different from /api/deliberations/[id]/related which uses source/topic similarity.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/util/supabase/server";
import { findRelatedDeliberations } from "@/lib/crossDeliberation/crossRoomSearchService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: deliberationId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const related = await findRelatedDeliberations(
      deliberationId,
      Math.min(limit, 20)
    );

    return NextResponse.json(related);
  } catch (error) {
    console.error("Find cross-deliberation related error:", error);
    return NextResponse.json(
      { error: "Failed to find related deliberations by shared claims" },
      { status: 500 }
    );
  }
}
