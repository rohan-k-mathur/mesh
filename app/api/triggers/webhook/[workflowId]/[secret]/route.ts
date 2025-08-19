import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";

export async function POST(req: NextRequest, { params }: { params: { workflowId: string; secret: string } }) {
  const { workflowId, secret } = params;
  const body = await req.json().catch(() => ({}));

  // Validate secret against ScheduledWorkflow.metadata or WorkflowVersion.dsl.inputs
  const sched = await prisma.scheduledWorkflow.findFirst({ where: { workflow_id: BigInt(workflowId) } });
  const ok = (sched?.metadata as any)?.secret === secret;
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Create a run row here (WorkflowRun + steps), or enqueue to a worker
  // For now, store payload and return 202
  // TODO: actually invoke your runner or queue
  await prisma.workflowRun.create({
    data: {
      workflow_id: BigInt(workflowId),
      version: (await prisma.workflow.findUnique({ where: { id: BigInt(workflowId) } }))!.current_version,
      status: "PENDING",
      trigger_kind: "webhook",
      trigger_payload: body,
    },
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
