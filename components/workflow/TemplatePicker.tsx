import React from "react";
import { WorkflowGraph } from "@/lib/actions/workflow.actions";
import analyticsTemplate from "@/templates/analytics-dashboard.json";
import clickCounter from "@/templates/click-counter.json";
import conditionalBranch from "@/templates/conditional-branch.json";

interface Template {
  name: string;
  description: string;
  graph: WorkflowGraph;
}

const templates: Template[] = [
  analyticsTemplate as Template,
  clickCounter as Template,
  conditionalBranch as Template,
];

export default function TemplatePicker({
  onSelect,
  selected,
}: {
  onSelect: (graph: WorkflowGraph, name: string) => void;
  selected: string;
}) {
  return (
    <div className="space-x-2 mb-4">
      {templates.map((t) => (
        <button
          key={t.name}
          className={`border px-2 py-1 rounded ${
            selected === t.name ? "bg-blue-500 text-white" : ""
          }`}
          onClick={() => onSelect(t.graph, t.name)}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
