"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import IntegrationButtons from "@/components/workflow/IntegrationButtons";
import Modal from "@/components/modals/Modal";
import {
  registerDefaultWorkflowActions,
} from "@/lib/registerDefaultWorkflowActions";
import { registerDefaultWorkflowTriggers } from "@/lib/registerDefaultWorkflowTriggers";
import { registerIntegrationActions } from "@/lib/registerIntegrationActions";
import { registerIntegrationTriggerTypes } from "@/lib/registerIntegrationTriggerTypes";
import { listWorkflowActions, getWorkflowAction } from "@/lib/workflowActions";
import { listWorkflowTriggers } from "@/lib/workflowTriggers";
import { executeWorkflow, WorkflowGraph } from "@/lib/workflowExecutor";
import { IntegrationApp } from "@/lib/integrations/types";

interface Step {
  id: string;
  type: "trigger" | "action";
  name: string;
}

export default function PageFlowBuilder() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    registerDefaultWorkflowActions();
    registerDefaultWorkflowTriggers();
    const integrationContext = typeof (require as any).context === "function"
      ? (require as any).context("../../integrations", false, /\\.ts$/)
      : { keys: () => [], context: () => ({}) };
    const modules: Record<string, { integration?: IntegrationApp }> = {};
    integrationContext.keys().forEach((key: string) => {
      modules[key] = integrationContext(key);
    });
    registerIntegrationActions(modules);
    registerIntegrationTriggerTypes(modules);
    setActions(listWorkflowActions());
    setTriggers(listWorkflowTriggers());
  }, []);

  const addStep = (type: "trigger" | "action") => {
    setSteps((s) => [
      ...s,
      { id: `step-${s.length + 1}`, type, name: "" },
    ]);
  };

  const updateStep = (id: string, name: string) => {
    setSteps((s) => s.map((st) => (st.id === id ? { ...st, name } : st)));
  };

  const addAfter = (index: number, type: "trigger" | "action") => {
    setSteps((s) => {
      const step = { id: `step-${s.length + 1}`, type, name: "" };
      return [...s.slice(0, index + 1), step, ...s.slice(index + 1)];
    });
  };

  const handleRun = async () => {
    setLogs([]);
    const nodes = steps.map((s) => ({
      id: s.id,
      type: s.type,
      action: s.type === "action" ? s.name : undefined,
    }));
    const edges = steps.slice(1).map((_, i) => ({
      id: `e-${i}`,
      source: steps[i].id,
      target: steps[i + 1].id,
    }));
    const actionsMap: Record<string, () => Promise<string | void>> = {};
    for (const step of steps) {
      if (step.type === "action" && step.name) {
        const act = getWorkflowAction(step.name);
        actionsMap[step.name] = act ?? (async () => {});
      }
    }
    const graph: WorkflowGraph = { nodes, edges };
    await executeWorkflow(graph, actionsMap, undefined, {}, (id) => {
      setLogs((l) => [...l, `Executed ${id}`]);
    });
  };

  return (
    <div className="space-y-4">
      <IntegrationButtons />
      <Modal />
      <div className="sticky top-0 bg-background z-10 space-x-2 pb-2">
        <Button onClick={() => addStep("trigger")}>Add Trigger</Button>
        <Button onClick={() => addStep("action")}>Add Action</Button>
        <Button onClick={handleRun} disabled={steps.length === 0}>
          Run
        </Button>
      </div>
      <div className="space-y-4">
        {steps.map((step, idx) => (
          <Card key={step.id} className="w-full">
            <CardHeader>
              <CardTitle>
                {step.type === "trigger" ? "Trigger" : "Action"} {idx + 1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={step.name}
                onValueChange={(val) => updateStep(step.id, val)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {(step.type === "trigger" ? triggers : actions).map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
            <CardFooter className="space-x-2">
              <Button
                variant="outline"
                onClick={() => addAfter(idx, step.type)}
              >
                Add {step.type === "trigger" ? "Trigger" : "Action"}
              </Button>
              {step.type === "trigger" && (
                <Button
                  variant="outline"
                  onClick={() => addAfter(idx, "action")}
                >
                  Add Action
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      {logs.length > 0 && (
        <div className="border p-2 space-y-1 text-sm">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
