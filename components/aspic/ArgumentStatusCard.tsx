// components/aspic/ArgumentStatusCard.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ArgumentStatusCardProps {
  argument: {
    id: string;
    premises: any[];
    conclusion: string;
    defeasibleRules: any[];
    topRule: any;
    structure: string;
  };
  status: "in" | "out" | "undec";
  explanation: string;
}

export function ArgumentStatusCard({ argument, status, explanation }: ArgumentStatusCardProps) {
  const [expanded, setExpanded] = useState(false);

//   // Debug logging
//   console.log("[ArgumentStatusCard] Rendering with:", {
//     id: argument.id,
//     idType: typeof argument.id,
//     conclusion: argument.conclusion,
//     conclusionType: typeof argument.conclusion,
//     premises: argument.premises,
//     premisesType: typeof argument.premises,
//     premisesIsArray: Array.isArray(argument.premises),
//     status,
//   });

  const statusConfig = {
    in: {
      icon: "✅",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      label: "IN",
    },
    out: {
      icon: "❌",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      label: "OUT",
    },
    undec: {
      icon: "⚠️",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-700",
      label: "UNDEC",
    },
  };

  const config = statusConfig[status];

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-l-4`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity flex-1"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 flex-shrink-0" />
            )}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{config.icon}</span>
              <Badge variant="outline" className="font-mono text-xs">
                {String(argument.id || "unknown")}
              </Badge>
              <span className="font-mono text-sm font-semibold">
                {String(argument.conclusion || "unknown")}
              </span>
            </div>
          </button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">{explanation}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-3">
          {/* Premises */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Premises:</div>
            <div className="flex flex-wrap gap-1">
              {Array.from(argument.premises || []).map((premise: any, idx: number) => {
                console.log(`[ArgumentStatusCard] Rendering premise ${idx}:`, {
                  premise,
                  type: typeof premise,
                  isObject: typeof premise === "object",
                  keys: typeof premise === "object" && premise ? Object.keys(premise) : null,
                });
                
                // Handle string premises or objects with formula property
                const premiseText = typeof premise === "string" 
                  ? premise 
                  : premise?.formula || premise?.text || JSON.stringify(premise);
                
                console.log(`[ArgumentStatusCard] Premise ${idx} text:`, premiseText);
                
                return (
                  <Badge key={idx} variant="secondary" className="font-mono text-xs">
                    {String(premiseText)}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Defeasible Rules */}
          {argument.defeasibleRules.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">
                Defeasible Rules:
              </div>
              <div className="flex flex-wrap gap-1">
                {Array.from(argument.defeasibleRules || []).map((rule: any, idx: number) => {
                  const ruleText = typeof rule === "string"
                    ? rule
                    : rule?.id || rule?.name || `Rule ${idx + 1}`;
                  return (
                    <Badge key={idx} variant="outline" className="font-mono text-xs">
                      {String(ruleText)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Rule */}
          {argument.topRule && (
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-1">Top Rule:</div>
              <Badge variant="outline" className="font-mono text-xs">
                {typeof argument.topRule === "string" 
                  ? argument.topRule 
                  : (argument.topRule as any)?.type || 
                    (argument.topRule as any)?.id || 
                    "Rule"}
              </Badge>
            </div>
          )}

          {/* Structure */}
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Structure:</div>
            <Badge variant="outline" className="text-xs">
              {typeof argument.structure === "string" 
                ? argument.structure 
                : JSON.stringify(argument.structure)}
            </Badge>
          </div>

          {/* Explanation */}
          <div className={`text-xs p-2 rounded ${config.bgColor} border ${config.borderColor}`}>
            <span className="font-semibold">Status: </span>
            {explanation}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
