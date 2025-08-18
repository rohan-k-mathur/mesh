// components/pageflow/PageFlowBuilder.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Step, Edge, Workflow } from "@/lib/workflow/types";
import { runWorkflow } from "@/lib/workflow/runner";
import { getActionDef, getTriggerDef, listActionDefs, listTriggerDefs } from "@/lib/workflow/registry";
import { getConnection } from "@/lib/connections/service";
import { DynamicForm } from "@/components/workflow/DynamicForm";
import { resolveTemplate } from "@/lib/workflow/vars";

const uid = () => crypto.randomUUID();

function EdgeConditionBadge({ edge, onEdit }: { edge: Edge; onEdit: (edgeId: string, cond?: any) => void }) {
  const label = edge.condition ? "IF •" : "IF ∅";
  return (
    <Button
      variant="outline"
      size="xs"
      onClick={() => {
        const raw = prompt("JSONLogic for this edge (leave blank for none):", edge.condition ? JSON.stringify(edge.condition, null, 2) : "");
        if (raw === null) return;
        const val = raw.trim() ? JSON.parse(raw) : undefined;
        onEdit(edge.id, val);
      }}
    >
      {label}
    </Button>
  );
}

export default function PageFlowBuilder() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // --- builders ---
  const addRoot = (kind: Step["kind"]) => {
    const newStep: Step = { id: uid(), kind, ref: "", inputs: {}, ui: { row: steps.length ? Math.max(...steps.map(s => s.ui?.row ?? 0)) + 1 : 0, col: 0 } };
    setSteps(prev => [...prev, newStep]);
  };

  const addAfter = (sourceId: string, kind: Step["kind"]) => {
    setSteps(prev => {
      const src = prev.find(s => s.id === sourceId);
      if (!src) return prev;
      const newStep: Step = { id: uid(), kind, ref: "", inputs: {}, ui: { row: (src.ui?.row ?? 0) + 1, col: 0 } };
      // bump later rows so there is space for the new row
      const bumped = prev.map(s => (s.ui && src.ui && s.ui.row > src.ui.row ? { ...s, ui: { ...s.ui, row: s.ui.row + 1 } } : s));
      const idx = bumped.findIndex(s => s.id === sourceId);
      const next = [...bumped.slice(0, idx + 1), newStep, ...bumped.slice(idx + 1)];
      setEdges(e => [...e, { id: uid(), from: sourceId, to: newStep.id }]);
      return next;
    });
  };

  const addParallelFrom = (sourceId: string, kind: Step["kind"]) => {
    setSteps(prev => {
      const src = prev.find(s => s.id === sourceId);
      if (!src?.ui) return prev;
      const row = src.ui.row;
      const nextCol = Math.max(0, ...prev.filter(s => s.ui?.row === row).map(s => s.ui?.col ?? 0)) + 1;
      const newStep: Step = { id: uid(), kind, ref: "", inputs: {}, ui: { row, col: nextCol } };
      setEdges(e => [...e, { id: uid(), from: sourceId, to: newStep.id }]);
      return [...prev, newStep];
    });
  };

  const addJoinAfterRow = (row: number, mode: "all" | "any" | "race" = "all") => {
    setSteps(prev => {
      const newStep: Step = { id: uid(), kind: "join", ref: "join", join: mode, ui: { row: row + 1, col: 0 } };
      const bumped = prev.map(s => (s.ui && s.ui.row > row ? { ...s, ui: { ...s.ui, row: s.ui.row + 1 } } : s));
      const froms = bumped.filter(s => s.ui?.row === row).map(s => s.id);
      setEdges(e => [...e, ...froms.map(f => ({ id: uid(), from: f, to: newStep.id }))]);
      return [...bumped, newStep];
    });
  };

  const updateEdgeCondition = (edgeId: string, condition?: any) => {
    setEdges(prev => prev.map(e => (e.id === edgeId ? { ...e, condition } : e)));
  };

  const updateStepRef = (id: string, ref: string) => setSteps(prev => prev.map(s => (s.id === id ? { ...s, ref } : s)));
  const updateStepInputs = (id: string, inputs: Record<string, any>) => setSteps(prev => prev.map(s => (s.id === id ? { ...s, inputs } : s)));

  // --- run ---
  const handleRun = async () => {
    setLogs([]);

    const wf: Workflow = { steps, edges, name: "Ad-hoc run" };

    const runStep = async (step: Step, ctx: any) => {
      if (step.kind === "trigger") return null;
      if (step.kind !== "action") return null;

      const def = getActionDef(step.ref);
      if (!def) throw new Error(`Unknown action: ${step.ref}`);

      const creds = def.provider ? await getConnection("TODO_ORG_ID", def.provider) : undefined;
      const evalFn = (v: any) => resolveTemplate(v, { payload: ctx.payload, outputs: ctx.outputs });
      const inputs = step.inputs || {};
      return def.run({ ...ctx, creds, eval: evalFn }, inputs);
    };

    await runWorkflow(
      wf,
      async (step, ctx) => {
        setLogs(l => [...l, `▶ ${step.ref}`]);
        return runStep(step, ctx);
      },
      /* payload */ {},
      (evt) => setLogs(l => [...l, JSON.stringify(evt)])
    );
  };

  // --- render ---
  const rows = Array.from(new Set(steps.map(s => s.ui?.row ?? 0))).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-background z-10 space-x-2 pb-2">
        <Button onClick={() => addRoot("trigger")}>Add Trigger</Button>
        <Button onClick={() => addRoot("action")}>Add Action</Button>
        <Button onClick={() => addRoot("delay")}>Add Delay</Button>
        <Button onClick={handleRun} disabled={steps.length === 0}>Run</Button>
      </div>

      {rows.map((row, rowIdx) => {
        const rowSteps = steps.filter(s => s.ui?.row === row).sort((a, b) => (a.ui!.col - b.ui!.col));
        return (
          <div key={row} className="flex flex-col items-center space-y-2">
            {rowIdx !== 0 && <div className="h-4 w-px bg-gray-300" />}
            <div className="flex space-x-2 w-full">
              {rowSteps.map((step) => {
                const defs = step.kind === "action" ? listActionDefs() : listTriggerDefs();
                const def = step.kind === "action" ? getActionDef(step.ref) : getTriggerDef(step.ref);

                const outgoing = edges.filter(e => e.from === step.id);

                return (
                  <div key={step.id} className="flex-1">
                    <Card className="w-full">
                      <CardHeader>
                        <CardTitle>
                          {step.kind.toUpperCase()} — {step.ref || "Select"}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <Select value={step.ref} onValueChange={(val) => updateStepRef(step.id, val)}>
                          <SelectTrigger className="w-[260px]">
                            <SelectValue placeholder={`Select ${step.kind}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {defs.map(d => <SelectItem key={d.id} value={d.id}>{d.displayName}</SelectItem>)}
                          </SelectContent>
                        </Select>

                        {def && (
                          <DynamicForm
                            fields={def.inputs}
                            value={step.inputs || {}}
                            onChange={(next) => updateStepInputs(step.id, next)}
                          />
                        )}

                        {outgoing.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {outgoing.map(e => (
                              <EdgeConditionBadge key={e.id} edge={e} onEdit={updateEdgeCondition} />
                            ))}
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="space-x-2">
                        <Button variant="outline" onClick={() => addAfter(step.id, "action")}>Add Action After</Button>
                        <Button variant="outline" onClick={() => addParallelFrom(step.id, "action")}>Add Parallel Branch</Button>
                        {rowSteps.length > 1 && (
                          <Button variant="outline" onClick={() => addJoinAfterRow(row, "all")}>Add Join Below</Button>
                        )}
                      </CardFooter>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {logs.length > 0 && (
        <div className="border p-2 space-y-1 text-sm">
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
