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
import { fetchIntegrations } from "@/lib/actions/integration.actions";
import { sendEmail } from "@/lib/actions/gmail.actions";
import {
  appendRow,
  createSpreadsheet,
  readRange,
} from "@/lib/actions/googleSheets.actions";
import integrationModules from "@/integrations";

interface Step {
  id: string;
  type: "trigger" | "action" | "condition";
  name: string;
  row: number;
  expression?: string;
  to?: string;
  subject?: string;
  message?: string;
  spreadsheetId?: string;
  range?: string;
  values?: string;
  title?: string;
}

export default function PageFlowBuilder() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [pointsMap, setPointsMap] = useState<Record<string, [number, number][]>>(
    {}
  );
  const [sheetMap, setSheetMap] = useState<Record<string, string>>({});
  const [gmailCred, setGmailCred] = useState<
    { email: string; accessToken: string } | null
  >(null);
  const [sheetsKey, setSheetsKey] = useState<string | null>(null);
  const [pendingWorkflow, setPendingWorkflow] = useState<
    | {
        graph: WorkflowGraph;
        actions: Record<string, () => Promise<string | void>>;
      }
    | null
  >(null);

  useEffect(() => {
    registerDefaultWorkflowActions();
    registerDefaultWorkflowTriggers();
    registerIntegrationActions(integrationModules);
    registerIntegrationTriggerTypes(integrationModules);
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
      const sheets = list.find((i) => i.service === "googleSheets");
      if (sheets) {
        try {
          const c = JSON.parse(sheets.credential);
          if (c.accessToken) {
            setSheetsKey(c.accessToken);
          }
        } catch {
          if (typeof sheets.credential === "string") {
            setSheetsKey(sheets.credential);
          }
        }
      }
    });
  }, []);

  const addStep = (type: "trigger" | "action" | "condition") => {
    setSteps((s) => {
      const lastRow = s.length ? Math.max(...s.map((st) => st.row)) : -1;
      return [
        ...s,
        {
          id: `step-${s.length + 1}`,
          type,
          name: "",
          row: lastRow + 1,
          expression: "",
          to: "",
          subject: "",
          message: "",
          spreadsheetId: "",
          range: "",
          values: "",
          title: "",
        },
      ];
    });
  };

  const updateStep = (id: string, name: string) => {
    setSteps((s) => s.map((st) => (st.id === id ? { ...st, name } : st)));
  };

  const updateField = (
    id: string,
    field:
      | "to"
      | "subject"
      | "message"
      | "spreadsheetId"
      | "range"
      | "values"
      | "title"
      | "expression",
    value: string
  ) => {
    setSteps((s) =>
      s.map((st) => (st.id === id ? { ...st, [field]: value } : st))
    );
  };

  const addAfter = (index: number, type: "trigger" | "action" | "condition") => {
    setSteps((s) => {
      const row = s[index].row + 1;
      const step = {
        id: `step-${s.length + 1}`,
        type,
        name: "",
        row,
        expression: "",
        to: "",
        subject: "",
        message: "",
        spreadsheetId: "",
        range: "",
        values: "",
        title: "",
      };
      const updated = s.map((st, i) =>
        i > index && st.row >= row ? { ...st, row: st.row + 1 } : st
      );
      return [...updated.slice(0, index + 1), step, ...updated.slice(index + 1)];
    });
  };

  const addParallel = (type: "trigger" | "action" | "condition") => {
    setSteps((s) => {
      if (s.length === 0) return s;
      const lastRow = Math.max(...s.map((st) => st.row));
      return [
        ...s,
        {
          id: `step-${s.length + 1}`,
          type,
          name: "",
          row: lastRow,
          expression: "",
          to: "",
          subject: "",
          message: "",
          spreadsheetId: "",
          range: "",
          values: "",
          title: "",
        },
      ];
    });
  };

  const runGraph = async (
    graph: WorkflowGraph,
    actionsMap: Record<string, () => Promise<string | void>>
  ) => {
    await executeWorkflow(graph, actionsMap, undefined, {}, (id) => {
      setLogs((l) => [...l, `Executed ${id}`]);
    });
  };

  const handleRun = async () => {
    setLogs([]);
    // refresh gmail credentials in case the user recently connected an account
    if (!gmailCred) {
      try {
        const list = await fetchIntegrations();
        const gmail = list.find((i) => i.service === "gmail");
        if (gmail) {
          const c = JSON.parse(gmail.credential);
          if (c.email && c.accessToken) {
            setGmailCred({ email: c.email, accessToken: c.accessToken });
          }
        }
      } catch {
        // ignore errors and proceed; action map will skip gmail send
      }
    }
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
        } else if (step.name.startsWith("googleSheets:") && sheetsKey) {
          if (step.name === "googleSheets:createSpreadsheet") {
            actionsMap[step.name] = async () => {
              const id = await createSpreadsheet({
                title: step.title ?? "",
                accessToken: sheetsKey,
              });
              setLogs((l) => [...l, `Created spreadsheet ${id}`]);
              setSheetMap((m) => ({ ...m, [step.id]: id }));
            };
          } else if (step.name === "googleSheets:appendRow") {
            actionsMap[step.name] = async () => {
              const vals = (step.values ?? "")
                .split(",")
                .map((v) => v.trim());
              await appendRow({
                spreadsheetId: step.spreadsheetId ?? "",
                range: step.range ?? "",
                values: vals,
                accessToken: sheetsKey,
              });
            };
          } else if (step.name === "googleSheets:readRange") {
            actionsMap[step.name] = async () => {
              const data = await readRange({
                spreadsheetId: step.spreadsheetId ?? "",
                range: step.range ?? "",
                accessToken: sheetsKey,
              });
              setLogs((l) => [...l, JSON.stringify(data ?? [])]);
            };
          }
        } else {
          const act = getWorkflowAction(step.name);
          actionsMap[step.name] = act ?? (async () => {});
        }
      }
    }
    if (!gmailCred && steps.some((s) => s.type === "action" && s.name === "gmail:sendEmail")) {
      setLogs((l) => [...l, "Gmail credentials not found. Connect an account first."]);
    }
    if (!sheetsKey && steps.some((s) => s.type === "action" && s.name.startsWith("googleSheets:"))) {
      setLogs((l) => [...l, "Google Sheets access token not found. Configure integration first."]);
    }
    const graph: WorkflowGraph = { nodes, edges };
    if (steps.some((s) => s.type === "trigger")) {
      setPendingWorkflow({ graph, actions: actionsMap });
      return;
    }
    await runGraph(graph, actionsMap);
  };

  const handleTrigger = async () => {
    if (!pendingWorkflow) return;
    await runGraph(pendingWorkflow.graph, pendingWorkflow.actions);
    setPendingWorkflow(null);
  };

  return (
    <div className="space-y-4">
      <IntegrationButtons />
      <Modal />
      <div className="absolute top-0 bg-background z-10 space-x-2 pb-2">
        <Button onClick={() => addStep("trigger")}>Add Trigger</Button>
        <Button onClick={() => addStep("action")}>Add Action</Button>
        <Button onClick={() => addStep("condition")}>Add Condition</Button>
        <Button onClick={() => addParallel("action")}>Add Parallel Branch</Button>
        <Button onClick={handleRun} disabled={steps.length === 0}>
          Run
        </Button>
      </div>
      <div className="space-y-4">
        {Array.from(new Set(steps.map((s) => s.row)))
          .sort((a, b) => a - b)
          .map((row, rowIdx) => {
            const rowSteps = steps.filter((s) => s.row === row);
            return (
              <div key={row} className="flex flex-col items-center">
                {rowIdx !== 0 && <div className="h-4 w-px bg-gray-300" />}
                <div className="flex space-x-2 w-full">
                  {rowSteps.map((step) => {
                    const idx = steps.findIndex((st) => st.id === step.id);
                    return (
                      <div key={step.id} className="flex-1">
                        <Card className="w-full">
              <CardHeader>
                <CardTitle>
                  {step.type === "trigger"
                    ? "Trigger"
                    : step.type === "condition"
                    ? "Condition"
                    : "Action"} {idx + 1}
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
                {step.type === "action" && step.name === "googleSheets:createSpreadsheet" && (
                  <Input
                    placeholder="Title"
                    value={step.title ?? ""}
                    onChange={(e) => updateField(step.id, "title", e.target.value)}
                  />
                )}
                {step.type === "action" && step.name === "googleSheets:appendRow" && (
                  <>
                    <Input
                      placeholder="Spreadsheet ID"
                      value={step.spreadsheetId ?? ""}
                      onChange={(e) => updateField(step.id, "spreadsheetId", e.target.value)}
                    />
                    <Input
                      placeholder="Range (e.g. Sheet1!A1:C1)"
                      value={step.range ?? ""}
                      onChange={(e) => updateField(step.id, "range", e.target.value)}
                    />
                    <Input
                      placeholder="Comma separated values"
                      value={step.values ?? ""}
                      onChange={(e) => updateField(step.id, "values", e.target.value)}
                    />
                  </>
                )}
                {step.type === "action" && step.name === "googleSheets:readRange" && (
                  <>
                    <Input
                      placeholder="Spreadsheet ID"
                      value={step.spreadsheetId ?? ""}
                      onChange={(e) => updateField(step.id, "spreadsheetId", e.target.value)}
                    />
                    <Input
                      placeholder="Range (e.g. Sheet1!A1:C10)"
                      value={step.range ?? ""}
                      onChange={(e) => updateField(step.id, "range", e.target.value)}
                    />
                  </>
                )}
                {step.type === "condition" && (
                  <Input
                    placeholder="Condition expression"
                    value={step.expression ?? ""}
                    onChange={(e) => updateField(step.id, "expression", e.target.value)}
                  />
                )}
                {step.type === "trigger" && step.name === "onClick" && (
                  <Button onClick={handleTrigger} disabled={!pendingWorkflow}>
                    Trigger
                  </Button>
                )}
              </CardContent>
              <CardFooter className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => addAfter(idx, step.type)}
                >
                  Add {step.type === "trigger" ? "Trigger" : step.type === "condition" ? "Condition" : "Action"}
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
            {sheetMap[step.id] && (
              <Card className="w-full mt-2 p-2">
                <iframe
                  src={`https://docs.google.com/spreadsheets/d/${sheetMap[step.id]}/edit`}
                  width="100%"
                  height="400"
                />
              </Card>
            )}
          </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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
