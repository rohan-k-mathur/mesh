// components/glossary/TermCard.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EndorseButton } from "./EndorseButton";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Archive,
  ChevronDown,
  ChevronUp,
  History,
  Plus,
  Eye,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TermCardProps {
  term: any;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: () => void;
}

export function TermCard({ term, isSelected, onSelect, onUpdate }: TermCardProps) {
  const [expanded, setExpanded] = useState(false);

  const consensusDefinition = term.definitions.find((d: any) => d.isCanonical);
  const competingDefinitions = term.definitions.filter((d: any) => !d.isCanonical);
  const hasCompeting = competingDefinitions.length > 0;

  // Status configuration with icons
  const statusConfig = {
    CONSENSUS: { 
      label: "Consensus", 
      icon: CheckCircle2,
      gradient: "from-emerald-500/20 to-green-500/20",
      border: "border-emerald-400/40",
      text: "text-emerald-100",
      badge: "bg-emerald-500/30 text-emerald-50 border-emerald-400/50"
    },
    CONTESTED: { 
      label: "Contested", 
      icon: AlertCircle,
      gradient: "from-amber-500/20 to-yellow-500/20",
      border: "border-amber-400/40",
      text: "text-amber-100",
      badge: "bg-amber-500/30 text-amber-50 border-amber-400/50"
    },
    PENDING: { 
      label: "Pending", 
      icon: Clock,
      gradient: "from-slate-500/20 to-slate-600/20",
      border: "border-slate-400/40",
      text: "text-slate-200",
      badge: "bg-slate-500/30 text-slate-100 border-slate-400/50"
    },
    ARCHIVED: { 
      label: "Archived", 
      icon: Archive,
      gradient: "from-gray-500/20 to-gray-600/20",
      border: "border-gray-400/40",
      text: "text-gray-300",
      badge: "bg-gray-500/30 text-gray-200 border-gray-400/50"
    },
  };

  const status = statusConfig[term.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer",
        "backdrop-blur-md border shadow-lg",
        isSelected
          ? "bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border-cyan-400/60 shadow-cyan-500/20 scale-[1.01]"
          : "bg-slate-800/40 border-white/50 hover:border-white   hover:scale-[1.001]"
      )}
      onClick={() => {
        onSelect();
        setExpanded(!expanded);
      }}
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0  transition-opacity duration-300 pointer-events-none" />
      
      {/* Glow effect for selected state */}
      {isSelected && (
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400/20 to-indigo-400/20 blur-xl opacity-50 pointer-events-none" />
      )}

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="text-lg font-bold text-white drop-shadow-lg">
                {term.term}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-sm shadow-md",
                  status.badge
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
            </div>
            {term.usages && term.usages.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-cyan-200/80">
                <Sparkles className="w-3 h-3" />
                <span>
                  Used {term.usages.length} {term.usages.length === 1 ? "time" : "times"} in arguments
                </span>
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-cyan-200" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cyan-200" />
            )}
          </button>
        </div>

        {/* Definition Body */}
        <div className="space-y-2">
          {consensusDefinition ? (
            <div className={cn(
              "relative overflow-hidden rounded-xl backdrop-blur-md border p-4 shadow-lg",
              "bg-gradient-to-br", status.gradient, status.border
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
              <div className="relative space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400/30 to-green-400/30 shadow-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  </div>
                  <div className="text-xs font-bold text-emerald-100">
                    Consensus Definition
                  </div>
                </div>
                <p className="text-sm text-white/90 leading-relaxed pl-1">
                  {consensusDefinition.definition}
                </p>
                {consensusDefinition.examples && (
                  <div className="mt-2 pl-3 border-l-2 border-white/20">
                    <p className="text-xs text-white/70 italic leading-relaxed">
                      {consensusDefinition.examples}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <div className="text-xs text-white/60">
                    by <span className="font-semibold text-white/80">{consensusDefinition.author.name}</span>
                  </div>
                  <EndorseButton
                    definitionId={consensusDefinition.id}
                    endorsementCount={consensusDefinition.endorsementCount}
                    onEndorsed={onUpdate}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          ) : term.definitions.length > 0 ? (
            <div className="space-y-2">
              {term.definitions.slice(0, expanded ? undefined : 1).map((def: any, idx: number) => (
                <div
                  key={def.id}
                  className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-md border border-white/10 p-4 shadow-lg hover:bg-slate-300/10 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                  <div className="relative space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <div className="text-xs font-semibold text-indigo-200">
                          Definition {idx + 1}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-cyan-200/80 bg-cyan-500/20 px-2 py-1 rounded-md backdrop-blur-sm border border-cyan-400/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {def.endorsementCount} {def.endorsementCount === 1 ? "endorsement" : "endorsements"}
                      </div>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">
                      {def.definition}
                    </p>
                    {def.examples && (
                      <div className="pl-3 border-l-2 border-white/20">
                        <p className="text-xs text-white/70 italic leading-relaxed">
                          {def.examples}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                      <div className="text-xs text-white/60">
                        by <span className="font-semibold text-white/80">{def.author.name}</span>
                      </div>
                      <EndorseButton
                        definitionId={def.id}
                        endorsementCount={def.endorsementCount}
                        onEndorsed={onUpdate}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {!expanded && term.definitions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(true);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-cyan-200 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show {term.definitions.length - 1} more{" "}
                  {term.definitions.length - 1 === 1 ? "definition" : "definitions"}
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic text-center py-4">
              No definitions yet
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-indigo-200/80 pt-2 border-t border-white/10">
          <div>
            Proposed by <span className="font-semibold text-indigo-100">{term.proposedBy.name}</span>
          </div>
          {hasCompeting && (
            <div className="flex items-center gap-1.5 text-amber-200 font-semibold bg-amber-500/20 px-2 py-1 rounded-md border border-amber-400/30 backdrop-blur-sm">
              <AlertCircle className="w-3 h-3" />
              {competingDefinitions.length} competing{" "}
              {competingDefinitions.length === 1 ? "definition" : "definitions"}
            </div>
          )}
        </div>

        {/* Footer Actions (only when expanded) */}
        {expanded && (
          <div className="flex items-center gap-2 pt-3 border-t border-white/10">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-cyan-200 transition-all backdrop-blur-sm">
              <History className="w-3.5 h-3.5" />
              View History
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-cyan-200 transition-all backdrop-blur-sm">
              <Plus className="w-3.5 h-3.5" />
              Propose Alternative
            </button>
            {term.usages && term.usages.length > 0 && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-cyan-200 transition-all backdrop-blur-sm">
                <Eye className="w-3.5 h-3.5" />
                View Usage ({term.usages.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
