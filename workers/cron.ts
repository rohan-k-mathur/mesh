import { prisma } from "@/lib/prismaclient";
import Cron from "croner";

export async function bootCronPoller() {
  const rows = await prisma.scheduledWorkflow.findMany({ where: { cron: { not: null } } });
  rows.forEach(row => {
    const expr = row.cron!;
    const job = new Cron(expr, { timezone: (row.metadata as any)?.timezone || "UTC" }, async () => {
      await prisma.workflowRun.create({
        data: {
          workflow_id: row.workflow_id,
          version: (await prisma.workflow.findUnique({ where: { id: row.workflow_id } }))!.current_version,
          status: "PENDING",
          trigger_kind: "cron",
        },
      });
    });
    job.pause(); job.resume(); // make sure it starts
  });
}
