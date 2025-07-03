"use server";

import { prisma } from "../prismaclient";
import { revalidatePath } from "next/cache";
import { getUserFromCookies } from "../serverutils";

export interface WorkflowGraph {
  nodes: any[];
  edges: any[];
}

export async function createWorkflow({
  name,
  graph,
}: {
  name: string;
  graph: WorkflowGraph;
}) {
  const user = await getUserFromCookies();
  if (!user) throw new Error("User not authenticated");
  await prisma.$connect();
  const workflow = await prisma.workflow.create({
    data: {
      owner_id: user.userId!,
      name,
      graph,
    },
  });
  await prisma.workflowState.create({
    data: {
      workflow_id: workflow.id,
      version: 1,
      graph,
    },
  });
  revalidatePath("/workflows");
  return workflow;
}

export async function updateWorkflow({
  id,
  graph,
}: {
  id: bigint;
  graph: WorkflowGraph;
}) {
  const user = await getUserFromCookies();
  if (!user) throw new Error("User not authenticated");
  await prisma.$connect();
  const workflow = await prisma.workflow.findUniqueOrThrow({ where: { id } });
  if (workflow.owner_id !== user.userId) {
    throw new Error("User not authorized");
  }
  const last = await prisma.workflowState.findFirst({
    where: { workflow_id: id },
    orderBy: { version: "desc" },
  });
  const version = (last?.version ?? 0) + 1;
  const [updatedWorkflow] = await prisma.$transaction([
    prisma.workflow.update({
      where: { id },
      data: { graph },
    }),
    prisma.workflowState.create({
      data: {
        workflow_id: id,
        version,
        graph,
      },
    }),
  ]);
  return updatedWorkflow;
}

export async function fetchWorkflow({ id }: { id: bigint }) {
  await prisma.$connect();
  return await prisma.workflow.findUniqueOrThrow({
    where: { id },
    include: {
      states: { orderBy: { version: "desc" }, take: 1 },
      transitions: true,
    },
  });
}
