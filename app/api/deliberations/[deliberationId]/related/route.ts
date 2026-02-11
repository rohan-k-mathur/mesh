/**
 * Phase 3.3: Related Deliberations API
 * GET /api/deliberations/:deliberationId/related - Find related deliberations by shared claims
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/util/supabase/server";
import { findRelatedDeliberations } from "@/lib/crossDeliberation/crossRoomSearchService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deliberationId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deliberationId } = await params;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const related = await findRelatedDeliberations(
      deliberationId,
      Math.min(limit, 20)
    );

    return NextResponse.json(related);
  } catch (error) {
    console.error("Find related deliberations error:", error);
    return NextResponse.json(
      { error: "Failed to find related deliberations" },
      { status: 500 }
    );
  }
}
