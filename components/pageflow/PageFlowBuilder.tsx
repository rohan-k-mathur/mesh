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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { fetchIntegrations } from "@/lib/actions/integration.actions";
import { sendEmail } from "@/lib/actions/gmail.actions";

interface Step {
  id: string;
  type: "trigger" | "action";
  name: string;
  to?: string;
  subject?: string;
  message?: string;
}

export default function PageFlowBuilder() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [pointsMap, setPointsMap] = useState<Record<string, [number, number][]>>(
    {}
  );
  const [gmailCred, setGmailCred] = useState<
    { email: string; accessToken: string } | null
  >(null);

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
    fetchIntegrations().then((list) => {
      const gmail = list.find((i) => i.service === "gmail");
      if (gmail) {
        try {
          const c = JSON.parse(gmail.credential);
          if (c.email && c.accessToken) {
            setGmailCred({ email: c.email, accessToken: c.accessToken });
          }
        } catch {
          // ignore parse errors
        }
      }
    });
  }, []);

  const addStep = (type: "trigger" | "action") => {
    setSteps((s) => [
      ...s,
      {
        id: `step-${s.length + 1}`,
        type,
        name: "",
        to: "",
        subject: "",
        message: "",
      },
    ]);
  };

  const updateStep = (id: string, name: string) => {
    setSteps((s) => s.map((st) => (st.id === id ? { ...st, name } : st)));
  };

  const updateField = (
    id: string,
    field: "to" | "subject" | "message",
    value: string
  ) => {
    setSteps((s) =>
      s.map((st) => (st.id === id ? { ...st, [field]: value } : st))
    );
  };

  const addAfter = (index: number, type: "trigger" | "action") => {
    setSteps((s) => {
      const step = {
        id: `step-${s.length + 1}`,
        type,
        name: "",
        to: "",
        subject: "",
        message: "",
      };
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
        if (step.name === "createRandomLineGraph") {
          actionsMap[step.name] = async () => {
            const pts = Array.from({ length: 12 }, (_, i) => [
              i + 1,
              Math.random() * 100,
            ]) as [number, number][];
            setPointsMap((m) => ({ ...m, [step.id]: pts }));
          };
        } else if (step.name === "gmail:sendEmail" && gmailCred) {
          actionsMap[step.name] = async () => {
            await sendEmail({
              from: gmailCred.email,
              to: step.to ?? "",
              subject: step.subject ?? "",
              message: step.message ?? "",
              accessToken: gmailCred.accessToken,
            });
          };
        } else {
          const act = getWorkflowAction(step.name);
          actionsMap[step.name] = act ?? (async () => {});
        }
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
          <div key={step.id} className="relative flex flex-col items-center">
            {idx !== 0 && <div className="h-4 w-px bg-gray-300" />}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>
                  {step.type === "trigger" ? "Trigger" : "Action"} {idx + 1}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
                {step.type === "action" && step.name === "gmail:sendEmail" && (
                  <>
                    <Input
                      placeholder="Send to"
                      value={step.to ?? ""}
                      onChange={(e) => updateField(step.id, "to", e.target.value)}
                    />
                    <Input
                      placeholder="Subject"
                      value={step.subject ?? ""}
                      onChange={(e) =>
                        updateField(step.id, "subject", e.target.value)
                      }
                    />
                    <Textarea
                      placeholder="Message"
                      value={step.message ?? ""}
                      onChange={(e) =>
                        updateField(step.id, "message", e.target.value)
                      }
                    />
                  </>
                )}
                {step.type === "trigger" && step.name === "onClick" && (
                  <Button onClick={handleRun}>Trigger</Button>
                )}
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
            {pointsMap[step.id] && (
              <Card className="w-full mt-2 p-2">
                {(() => {
                  const points = pointsMap[step.id];
                  const width = 200;
                  const height = 100;
                  const xs = points.map((p) => p[0]);
                  const ys = points.map((p) => p[1]);
                  const minX = Math.min(...xs);
                  const maxX = Math.max(...xs);
                  const minY = Math.min(...ys);
                  const maxY = Math.max(...ys);
                  const scaleX = (x: number) => ((x - minX) / (maxX - minX || 1)) * width;
                  const scaleY = (y: number) =>
                    height - ((y - minY) / (maxY - minY || 1)) * height;
                  const path = points
                    .map((p, i) => `${i === 0 ? "M" : "L"}${scaleX(p[0])},${scaleY(p[1])}`)
                    .join(" ");
                  return (
                    <svg width={width} height={height}>
                      <path d={path} fill="none" stroke="black" />
                      {points.map((p, i) => (
                        <circle
                          key={i}
                          cx={scaleX(p[0])}
                          cy={scaleY(p[1])}
                          r={3}
                          fill="red"
                        />
                      ))}
                    </svg>
                  );
                })()}
              </Card>
            )}
            {idx !== steps.length - 1 && <div className="h-4 w-px bg-gray-300" />}
          </div>
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
