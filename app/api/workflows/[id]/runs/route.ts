import { NextRequest, NextResponse } from "next/server";
import { recordWorkflowRun } from "@/lib/workflowAnalytics";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { executed, startedAt, finishedAt } = await req.json();
  await recordWorkflowRun({
    workflowId: BigInt(params.id),
    executed,
    startedAt: new Date(startedAt),
    finishedAt: new Date(finishedAt),
  });
  return NextResponse.json({ status: "ok" });
}
