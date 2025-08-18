
// lib/workflow/runner.ts
import { Workflow, Step, Edge, JSONExpr, JoinMode } from "./types";
import jsonLogic from "json-logic-js"; // npm i json-logic-js

type Emit = (evt: { type: string; data: any }) => void;

interface Ctx {
  payload: any;
  outputs: Record<string, any>;
}

function edgeConditionPasses(edge: Edge, ctx: Ctx) {
  if (!edge.condition) return true;
  try { return !!jsonLogic.apply(edge.condition, ctx); }
  catch { return false; }
}

export async function runWorkflow(
  wf: Workflow,
  runStep: (step: Step, ctx: Ctx) => Promise<any>,
  payload: any,
  emit?: Emit
) {
  const stepsById = new Map(wf.steps.map(s => [s.id, s]));
  const inbound = new Map<string, string[]>();
  const outbound = new Map<string, Edge[]>();
  wf.edges.forEach(e => {
    inbound.set(e.to, [...(inbound.get(e.to) || []), e.from]);
    outbound.set(e.from, [...(outbound.get(e.from) || []), e]);
  });

  const ctx: Ctx = { payload, outputs: {} };

  // Track which predecessors have finished for join semantics
  const finished = new Set<string>();
  const pendingCounts = new Map<string, number>(); // how many predecessors still required
  wf.steps.forEach(s => {
    const preds = inbound.get(s.id) || [];
    if (preds.length === 0) pendingCounts.set(s.id, 0);
    else {
      const joinMode: JoinMode = s.join || "all";
      if (joinMode === "all") pendingCounts.set(s.id, preds.length);
      else pendingCounts.set(s.id, 1); // any/race need just 1
    }
  });
// With a simple "level" batch that runs concurrently:
const roots = (() => {
    const triggers = wf.steps.filter(s => s.kind === "trigger");
    return triggers.length > 0 ? triggers : wf.steps.filter(s => (inbound.get(s.id) || []).length === 0);
  })();
  const queue: Step[] = [...roots];
  
  while (queue.length) {
    // take the whole batch currently unlocked
    const batch = queue.splice(0, queue.length);
    await Promise.all(batch.map(async (step) => {
      emit?.({ type: "StepStarted", data: { stepId: step.id, ref: step.ref } });
  
      if (step.kind === "join") {
        finished.add(step.id);
        emit?.({ type: "StepSucceeded", data: { stepId: step.id } });
        startTargetsIfReady(step.id);
        return;
      }
      if (step.kind === "delay") {
        const ms = Number(step.inputs?.ms ?? 0);
        await new Promise(r => setTimeout(r, ms));
        finished.add(step.id);
        emit?.({ type: "StepSucceeded", data: { stepId: step.id } });
        startTargetsIfReady(step.id);
        return;
      }
  
      try {
        const output = await runStep(step, ctx);
        ctx.outputs[step.id] = output ?? null;
        finished.add(step.id);
        emit?.({ type: "StepSucceeded", data: { stepId: step.id, output } });
        startTargetsIfReady(step.id);
      } catch (err: any) {
        emit?.({ type: "StepFailed", data: { stepId: step.id, error: String(err?.message || err) } });
        throw err;
      }
    }));
  }

  // Queue: start with steps that have no inbound

  const startTargetsIfReady = (fromId: string) => {
    const outs = outbound.get(fromId) || [];
    for (const edge of outs) {
      const to = edge.to;
      const step = stepsById.get(to)!;
      if (!edgeConditionPasses(edge, ctx)) continue;
      const count = pendingCounts.get(to)!;
      if (count > 0) {
        const newCount = count - 1;
        pendingCounts.set(to, newCount);
        if (newCount === 0) queue.push(step);
      } else {
        // already ready or queued; ignore
      }
    }
  };

  

  emit?.({ type: "RunCompleted", data: { finished: Array.from(finished) } });
}
