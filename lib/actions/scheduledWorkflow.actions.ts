"use server";

import { prisma } from "../prismaclient";

export async function createScheduledWorkflow({
  workflowId,
  cron,
  trigger,
  metadata,
}: {
  workflowId: bigint | string;
  cron?: string | null;
  trigger?: string | null;
  metadata?: any;
}) {
  const id = typeof workflowId === "string" ? BigInt(workflowId) : workflowId;
  return prisma.scheduledWorkflow.create({
    data: {
      workflow_id: id,
      cron: cron ?? null,
      trigger: trigger ?? null,
      metadata: metadata ?? undefined,
    },
  });
}

export async function listScheduledWorkflows() {
  return prisma.scheduledWorkflow.findMany();
}
