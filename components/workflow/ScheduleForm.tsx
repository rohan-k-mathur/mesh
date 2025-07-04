"use client";

import { useState } from "react";
import { createScheduledWorkflow } from "@/lib/actions/scheduledWorkflow.actions";

export default function ScheduleForm({ workflowId }: { workflowId: string }) {
  const [cron, setCron] = useState("");
  const [trigger, setTrigger] = useState("");
  return (
    <div className="space-y-2">
      <input
        aria-label="Cron Expression"
        className="border p-1"
        value={cron}
        onChange={(e) => setCron(e.target.value)}
      />
      <input
        aria-label="Trigger Name"
        className="border p-1"
        value={trigger}
        onChange={(e) => setTrigger(e.target.value)}
      />
      <button
        onClick={async () => {
          await createScheduledWorkflow({ workflowId, cron, trigger });
        }}
        className="border px-2 py-1"
      >
        Save Schedule
      </button>
    </div>
  );
}
