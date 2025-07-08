"use client";

import React, { useState } from "react";
import WorkflowBuilder from "./WorkflowBuilder";
import TemplatePicker from "./TemplatePicker";
import IntegrationButtons from "./IntegrationButtons";
import Modal from "@/components/modals/Modal";
import { ReactFlowProvider } from "@xyflow/react";
import { WorkflowGraph } from "@/lib/actions/workflow.actions";
import analyticsTemplate from "@/templates/analytics-dashboard.json";

export default function NewWorkflowClient({
  onSave,
}: {
  onSave: (graph: WorkflowGraph, name: string) => Promise<{ id: string }>;
}) {
  const [graph, setGraph] = useState<WorkflowGraph>(
    analyticsTemplate.graph as WorkflowGraph
  );
  const [template, setTemplate] = useState<string>(analyticsTemplate.name);

  const handleTemplateSelect = (g: WorkflowGraph, name: string) => {
    setGraph(g);
    setTemplate(name);
  };

  return (
    <div className="relative -top-12 space-y-4">
      <IntegrationButtons />
      <TemplatePicker selected={template} onSelect={handleTemplateSelect} />
      <p className="mx-2 text-sm">
        Select a starter template or build from scratch. The analytics template
        collects Shopify and social metrics, aggregates the data, generates a
        report, then shares it through Gmail and Slack.
      </p>
      <div className="w-[100%] h-full border-2 border-blue overscroll-none">
        <ReactFlowProvider>
          <Modal />
          <WorkflowBuilder onSave={onSave} initialGraph={graph} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
