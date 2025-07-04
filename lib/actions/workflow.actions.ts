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
  const state = await prisma.workflowState.create({
    data: {
      workflow_id: workflow.id,
      version: 1,
      graph,
    },
  });
  await prisma.workflowTransition.create({
    data: {
      workflow_id: workflow.id,
      from_state_id: state.id,
      to_state_id: state.id,
      version: 1,
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
  const [updatedWorkflow, newState] = await prisma.$transaction([
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
  if (last) {
    await prisma.workflowTransition.create({
      data: {
        workflow_id: id,
        from_state_id: last.id,
        to_state_id: newState.id,
        version,
      },
    });
  }
  return updatedWorkflow;
}

export async function fetchWorkflow({
  id,
  version,
  history = false,
}: {
  id: bigint;
  version?: number;
  history?: boolean;
}) {
  await prisma.$connect();
  const stateInclude = history
    ? { orderBy: { version: "asc" } }
    : version
    ? { where: { version } }
    : { orderBy: { version: "desc" }, take: 1 };
  const transitionInclude = history
    ? { orderBy: { version: "asc" } }
    : version
    ? { where: { version } }
    : true;
  return await prisma.workflow.findUniqueOrThrow({
    where: { id },
    include: {
      states: stateInclude,
      transitions: transitionInclude,
    },
  });
}
