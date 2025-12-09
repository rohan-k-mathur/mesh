/**
 * ChainEssayView Component
 * Renders an argument chain as a seamless narrative essay
 * 
 * Features:
 * - Natural prose generation using argumentation theory
 * - Walton/Macagno taxonomy integration
 * - Dialectical structure (thesis-antithesis-synthesis)
 * - Critical questions woven into narrative
 * - Multiple tone options
 */

"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import {
  FileText,
  Copy,
  Download,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  Settings2,
  BookOpen,
  Sparkles,
  GraduationCap,
  MessageSquare,
  BookOpenText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { generateEssay, EssayOptions, EssayResult } from "@/lib/chains/essayGenerator";
import { ArgumentChainWithRelations } from "@/lib/types/argumentChain";
import ReactMarkdown from "react-markdown";

// ===== Types =====

interface ChainEssayViewProps {
  /** Chain ID to load */
  chainId: string;
  
  /** Pre-loaded chain data (skips fetch) */
  initialData?: ArgumentChainWithRelations;
  
  /** Compact mode for embedding */
  compact?: boolean;
  
  /** Maximum height before scrolling */
  maxHeight?: string;
  
  /** Callback to switch views */
  onViewThread?: () => void;
  onViewCanvas?: () => void;
  onViewProse?: () => void;
}

type EssayTone = "deliberative" | "academic" | "persuasive";
type AudienceLevel = "general" | "informed" | "expert";

// ===== Fetcher =====

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then(async (r) => {
    const json = await r.json().catch(() => ({}));
    if (!r.ok || json?.ok === false) {
      throw new Error(json?.error || `HTTP ${r.status}`);
    }
    return json.chain || json;
  });

// ===== Tone Configuration =====

const TONE_CONFIG: Record<EssayTone, { icon: React.ReactNode; label: string; description: string }> = {
  deliberative: {
    icon: <MessageSquare className="w-4 h-4" />,
    label: "Deliberative",
    description: "Balanced, considering multiple perspectives"
  },
  academic: {
    icon: <GraduationCap className="w-4 h-4" />,
    label: "Academic",
    description: "Scholarly, formal analysis"
  },
  persuasive: {
    icon: <BookOpenText className="w-4 h-4" />,
    label: "Persuasive",
    description: "Advocating for the main thesis"
  }
};

const AUDIENCE_CONFIG: Record<AudienceLevel, { label: string; description: string }> = {
  general: {
    label: "General",
    description: "Accessible to non-specialists"
  },
  informed: {
    label: "Informed",
    description: "Assumes some domain knowledge"
  },
  expert: {
    label: "Expert",
    description: "For specialists in the field"
  }
};

// ===== Main Component =====

export function ChainEssayView({
  chainId,
  initialData,
  compact = false,
  maxHeight = "calc(100vh - 200px)",
  onViewThread,
  onViewCanvas,
  onViewProse,
}: ChainEssayViewProps) {
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<EssayTone>("deliberative");
  const [audienceLevel, setAudienceLevel] = useState<AudienceLevel>("informed");
  const [includeSchemeRefs, setIncludeSchemeRefs] = useState(true);
  const [includeCQs, setIncludeCQs] = useState(true);
  const [includePremises, setIncludePremises] = useState(true);
  const [includeDialectic, setIncludeDialectic] = useState(true);

  // Fetch chain data if not provided
  const {
    data: fetchedChain,
    error,
    isLoading,
    mutate,
  } = useSWR<ArgumentChainWithRelations>(
    !initialData ? `/api/argument-chains/${chainId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const chainData = initialData || fetchedChain;

  // Generate essay when data or options change
  const essayResult = useMemo<EssayResult | null>(() => {
    if (!chainData) return null;
    
    const options: EssayOptions = {
      tone,
      audienceLevel,
      includeSchemeReferences: includeSchemeRefs,
      includeCriticalQuestions: includeCQs,
      includePremiseStructure: includePremises,
      includeDialectic,
    };
    
    return generateEssay(chainData, options);
  }, [chainData, tone, audienceLevel, includeSchemeRefs, includeCQs, includePremises, includeDialectic]);

  // Copy to clipboard
  const handleCopy = async () => {
    if (!essayResult) return;
    
    try {
      await navigator.clipboard.writeText(essayResult.fullText);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  // Download as markdown file
  const handleDownload = () => {
    if (!essayResult) return;
    
    const blob = new Blob([essayResult.fullText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${essayResult.title.replace(/\s+/g, "_")}_essay.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Loading chain...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-slate-600">Failed to load chain</p>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (!chainData || !essayResult) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <FileText className="w-12 h-12 text-slate-300" />
        <p className="text-sm text-slate-500">No chain data available</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", compact && "gap-2")}>
      {/* Header with controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <BookOpenText className="w-3 h-3 mr-1" />
            Essay Mode
          </Badge>
          <span className="text-xs text-slate-500">
            {essayResult.wordCount} words • {essayResult.metadata.schemeCount} schemes
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Tone selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {TONE_CONFIG[tone].icon}
                <span className="ml-1">{TONE_CONFIG[tone].label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Essay Tone</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(TONE_CONFIG) as EssayTone[]).map((t) => (
                <DropdownMenuItem
                  key={t}
                  onClick={() => setTone(t)}
                  className={cn(tone === t && "bg-slate-100")}
                >
                  <div className="flex items-center gap-2">
                    {TONE_CONFIG[t].icon}
                    <div>
                      <div className="font-medium">{TONE_CONFIG[t].label}</div>
                      <div className="text-xs text-slate-500">{TONE_CONFIG[t].description}</div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Settings2 className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Essay Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                Audience Level
              </DropdownMenuLabel>
              {(Object.keys(AUDIENCE_CONFIG) as AudienceLevel[]).map((level) => (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={audienceLevel === level}
                  onCheckedChange={() => setAudienceLevel(level)}
                >
                  {AUDIENCE_CONFIG[level].label}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                Content Options
              </DropdownMenuLabel>
              
              <DropdownMenuCheckboxItem
                checked={includeSchemeRefs}
                onCheckedChange={(checked) => setIncludeSchemeRefs(checked)}
              >
                Scheme References
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                checked={includeCQs}
                onCheckedChange={(checked) => setIncludeCQs(checked)}
              >
                Critical Questions
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                checked={includePremises}
                onCheckedChange={(checked) => setIncludePremises(checked)}
              >
                Premise Structure
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuCheckboxItem
                checked={includeDialectic}
                onCheckedChange={(checked) => setIncludeDialectic(checked)}
              >
                Dialectical Pairs
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actions */}
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* View switcher */}
      {(onViewThread || onViewCanvas || onViewProse) && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>View as:</span>
          {onViewThread && (
            <button
              onClick={onViewThread}
              className="underline hover:text-slate-700"
            >
              Thread
            </button>
          )}
          {onViewCanvas && (
            <button
              onClick={onViewCanvas}
              className="underline hover:text-slate-700"
            >
              Canvas
            </button>
          )}
          {onViewProse && (
            <button
              onClick={onViewProse}
              className="underline hover:text-slate-700"
            >
              Prose (Brief)
            </button>
          )}
        </div>
      )}

      {/* Essay content */}
      <div
        className={cn(
          "prose prose-slate prose-sm max-w-none",
          "overflow-y-auto rounded-lg border bg-white p-6",
          compact && "p-4"
        )}
        style={{ maxHeight }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-xl font-bold text-slate-900 mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-slate-800 mt-6 mb-3">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-medium text-slate-700 mt-4 mb-2">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-slate-700 leading-relaxed mb-4">{children}</p>
            ),
            em: ({ children }) => (
              <em className="text-slate-600 italic">{children}</em>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-slate-900">{children}</strong>
            ),
            hr: () => (
              <hr className="my-6 border-slate-200" />
            ),
          }}
        >
          {essayResult.fullText}
        </ReactMarkdown>
      </div>

      {/* Footer metadata */}
      {!compact && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Generated from {essayResult.metadata.argumentCount} arguments
          </span>
          <span>
            {essayResult.metadata.dialecticalMoves} dialectical exchange{essayResult.metadata.dialecticalMoves !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

export default ChainEssayView;
