import { prisma } from "@/lib/prismaclient";

export async function recordWorkflowRun({
  workflowId,
  executed,
  startedAt,
  finishedAt,
}: {
  workflowId: bigint;
  executed: string[];
  startedAt: Date;
  finishedAt: Date;
}) {
  await prisma.workflowRun.create({
    data: {
      workflow_id: workflowId,
      executed,
      started_at: startedAt,
      finished_at: finishedAt,
    },
  });
}
