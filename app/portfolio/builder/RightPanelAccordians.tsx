"use client";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function ControlsCollapsible({
  template,
  templates,
  applyTemplate,
  color,
  setColor,
  layout,
  setLayout,
  dispatch,
}: {
  template: string;
  templates: { name: string }[];
  applyTemplate: (t: string) => void;
  color: string;
  setColor: (c: string) => void;
  layout: "column" | "grid" | "free";
  setLayout: (l: "column" | "grid" | "free") => void;
  dispatch: React.Dispatch<any>;
}) {
  // Shared content animation: grid-rows (auto height) + opacity
  const contentClass =
    "relative z-0 w-full overflow-hidden transform-gpu " +
    "grid grid-rows-[0fr] transition-[grid-template-rows,opacity] duration-300 " +
    "data-[state=open]:grid-rows-[1fr] data-[state=open]:opacity-100 data-[state=closed]:opacity-0";
  const innerClass = "min-h-0"; // lets content shrink to 0fr cleanly
  const triggerClass =
    "relative z-10 flex w-full items-center justify-between py-2 text-left font-medium";

  return (
    <div className="relative z-0 w-full min-w-[150px] space-y-2">
      {/* Template */}
      <Collapsible className="group relative">
        <CollapsibleTrigger className={triggerClass}>
          <span>Template</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className={contentClass}>
          <div className={innerClass}>
            <div className="w-full rounded-xl p-1">
              <select
                className="w-full rounded-xl lockbutton mt-1 border-black bg-gray-100 border p-1"
                value={template}
                onChange={(e) => applyTemplate(e.target.value)}
              >
                <option value="">Blank</option>
                {templates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Background */}
      <Collapsible className="group relative">
        <CollapsibleTrigger className={triggerClass}>
          <span>Background</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className={contentClass}>
          <div className={innerClass}>
            <div className="rounded-xl p-1">
              <select
                className="w-full rounded-xl lockbutton mt-1 border-black bg-gray-100 border p-1"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  dispatch({ type: "setColor", color: e.target.value });
                }}
              >
                <option value="bg-white">White</option>
                <option value="bg-gray-200">Gray</option>
                <option value="bg-blue-200">Blue</option>
              </select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Layout */}
      <Collapsible className="group relative">
        <CollapsibleTrigger className={triggerClass}>
          <span>Layout</span>
          <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className={contentClass}>
          <div className={innerClass}>
            <div className="rounded-xl p-1">
              <select
                className="w-full rounded-xl lockbutton mt-1 border-black bg-gray-100 border p-1"
                value={layout}
                onChange={(e) => {
                  const v = e.target.value as "column" | "grid" | "free";
                  setLayout(v);
                  dispatch({ type: "setLayout", layout: v });
                }}
              >
                <option value="free">Free</option>
                <option value="column">Column</option>
                <option value="grid">Grid</option>
              </select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
