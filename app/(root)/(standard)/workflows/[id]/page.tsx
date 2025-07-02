import { fetchWorkflow } from "@/lib/actions/workflow.actions";
import WorkflowRunner from "@/components/workflow/WorkflowRunner";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: { id: string } }) {
  if (!params?.id) return notFound();
  const workflow = await fetchWorkflow({ id: BigInt(params.id) });
  if (!workflow) return notFound();
  return <WorkflowRunner graph={workflow.graph} />;
}
