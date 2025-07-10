"use client";

import { Node, Edge } from "@xyflow/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  node?: Node;
  edge?: Edge;
  actions: string[];
  triggers: string[];
  onUpdateNode: (node: Node) => void;
  onUpdateEdge: (edge: Edge) => void;
  onClose: () => void;
}

export default function WorkflowSidePanel({
  node,
  edge,
  actions,
  triggers,
  onUpdateNode,
  onUpdateEdge,
  onClose,
}: Props) {
  const open = !!node || !!edge;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[250px] space-y-4 mr-2">
        {node && (
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle>
                Edit
                {" "}
                {node.data?.type === "trigger"
                  ? "Trigger"
                  : node.data?.type === "action"
                  ? "Action"
                  : "Condition"}
              </SheetTitle>
            </SheetHeader>
            <Label htmlFor="node-label">Label</Label>
            <Input
              id="node-label"
              className="w-fit"
              value={node.data?.label || ""}
              onChange={(e) =>
                onUpdateNode({
                  ...node,
                  data: { ...node.data, label: e.target.value },
                })
              }
            />
            {node.data?.type === "trigger" ? (
              <>
                <Label htmlFor="node-trigger">Trigger</Label>
                <Select
                  value={node.data?.trigger || ""}
                  onValueChange={(value) =>
                    onUpdateNode({
                      ...node,
                      data: { ...node.data, trigger: value },
                    })
                  }
                >
                  <SelectTrigger id="node-trigger" className="w-fit">
                    <SelectValue placeholder="Select trigger" className="w-fit" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggers.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : node.data?.type === "action" ? (
              <>
                <Label htmlFor="node-action">Action</Label>
                <Select
                  value={node.data?.action || ""}
                  onValueChange={(value) =>
                    onUpdateNode({
                      ...node,
                      data: { ...node.data, action: value },
                    })
                  }
                >
                  <SelectTrigger id="node-action" className="w-fit">
                    <SelectValue placeholder="Select action" className="w-fit" />
                  </SelectTrigger>
                  <SelectContent>
                    {actions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : null}
          </div>
        )}
        {edge && (
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle>Edit Transition</SheetTitle>
            </SheetHeader>
            <Label htmlFor="edge-label">Label</Label>
            <Input
              id="edge-label"
              className="w-fit"

              value={edge.label || ""}
              onChange={(e) => onUpdateEdge({ ...edge, label: e.target.value })}
            />
            <Label htmlFor="edge-condition">Condition</Label>
            <Input
              id="edge-condition"
              className="w-fit"

              value={(edge.data as any)?.condition || edge.condition || ""}
              onChange={(e) =>
                onUpdateEdge({
                  ...edge,
                  data: { ...(edge.data || {}), condition: e.target.value },
                  condition: e.target.value,
                })
              }
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
