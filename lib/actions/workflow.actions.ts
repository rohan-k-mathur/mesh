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
  await prisma.$connect();
  return await prisma.workflow.update({
    where: { id },
    data: { graph },
  });
}

export async function fetchWorkflow({ id }: { id: bigint }) {
  await prisma.$connect();
  return await prisma.workflow.findUniqueOrThrow({ where: { id } });
}
