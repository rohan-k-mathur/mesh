import { fetchWorkflow } from "@/lib/actions/workflow.actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const versionParam = req.nextUrl.searchParams.get("version");
  const historyParam = req.nextUrl.searchParams.get("history");
  const version = versionParam ? parseInt(versionParam, 10) : undefined;
  const history = historyParam === "true";
  const workflow = await fetchWorkflow({
    id: BigInt(params.id),
    version,
    history,
  });
  return NextResponse.json(workflow);
}
