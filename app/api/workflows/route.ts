import { listWorkflows } from "@/lib/actions/workflow.actions";
import { NextResponse } from "next/server";

export async function GET() {
  const workflows = await listWorkflows();
  return NextResponse.json(workflows);
}
