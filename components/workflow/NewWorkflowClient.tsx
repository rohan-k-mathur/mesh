"use client";

import React, { useState, useEffect } from "react";
import WorkflowBuilder from "./WorkflowBuilder";
import TemplatePicker from "./TemplatePicker";
import IntegrationButtons from "./IntegrationButtons";
import Modal from "@/components/modals/Modal";
import { ReactFlowProvider } from "@xyflow/react";
import { WorkflowGraph } from "@/lib/actions/workflow.actions";
import { WorkflowExecutionProvider } from "./WorkflowExecutionContext";
import { registerWorkflowAction } from "@/lib/workflowActions";
import { fetchIntegrations } from "@/lib/actions/integration.actions";
import SendEmailModal from "@/components/modals/SendEmailModal";
import useStore from "@/lib/reactflow/store";
import { useShallow } from "zustand/react/shallow";
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

  const { openModal } = useStore(
    useShallow((state) => ({ openModal: state.openModal }))
  );

  useEffect(() => {
    fetchIntegrations().then((list) => {
      const gmail = list.find((i) => i.service === "gmail");
      if (gmail) {
        try {
          const cred = JSON.parse(gmail.credential);
          if (cred.email && cred.accessToken) {
            registerWorkflowAction("openEmailModal", async () => {
              openModal(
                <SendEmailModal from={cred.email} accessToken={cred.accessToken} />
              );
            });
          }
        } catch {
          // ignore parse errors
        }
      }
    });
  }, [openModal]);

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
        <WorkflowExecutionProvider>
          <ReactFlowProvider>
            <Modal />
            <WorkflowBuilder onSave={onSave} initialGraph={graph} />
          </ReactFlowProvider>
        </WorkflowExecutionProvider>
      </div>
    </div>
  );
}
