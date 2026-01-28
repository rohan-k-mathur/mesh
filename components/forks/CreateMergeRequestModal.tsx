"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import useSWR from "swr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, GitPullRequest, ArrowRight, Check, AlertCircle } from "lucide-react";
import {
  MergeClaimSelector,
  MergeClaimSelection,
  ClaimForMerge,
  MergeConflict,
  MergeConflictViewer,
} from "./MergeWorkflow";

/**
 * CreateMergeRequestModal - Modal for creating a merge request
 * 
 * Phase 2.2: Fork/Branch/Merge for Deliberations
 */

const createMergeRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
});

type CreateMergeRequestForm = z.infer<typeof createMergeRequestSchema>;

interface MergeAnalysis {
  claimsToMerge: number;
  argumentsToMerge: number;
  conflicts: MergeConflict[];
  canAutoMerge: boolean;
}

export interface CreateMergeRequestResult {
  id: string;
  title: string;
  status: string;
}

export interface CreateMergeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceDeliberationId: string;
  sourceTitle: string;
  targetDeliberationId: string;
  targetTitle: string;
  onSuccess?: (result: CreateMergeRequestResult) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CreateMergeRequestModal({
  open,
  onOpenChange,
  sourceDeliberationId,
  sourceTitle,
  targetDeliberationId,
  targetTitle,
  onSuccess,
}: CreateMergeRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [step, setStep] = React.useState<"claims" | "analysis" | "details">("claims");
  const [selections, setSelections] = React.useState<MergeClaimSelection[]>([]);
  const [analysis, setAnalysis] = React.useState<MergeAnalysis | null>(null);

  // Fetch claims from source deliberation
  const { data: claimsData } = useSWR<{ claims: ClaimForMerge[] }>(
    open ? `/api/deliberations/${sourceDeliberationId}/claims` : null,
    fetcher
  );

  const claims = claimsData?.claims ?? [];

  const form = useForm<CreateMergeRequestForm>({
    resolver: zodResolver(createMergeRequestSchema),
    defaultValues: {
      title: `Merge from ${sourceTitle}`,
      description: "",
    },
  });

  // Reset when modal opens
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: `Merge from ${sourceTitle}`,
        description: "",
      });
      setStep("claims");
      setError(null);
      setSelections([]);
      setAnalysis(null);
    }
  }, [open, form, sourceTitle]);

  // Initialize selections when claims load
  React.useEffect(() => {
    if (claims.length > 0 && selections.length === 0) {
      setSelections(
        claims.map((claim) => ({
          claimId: claim.id,
          strategy: "ADD_NEW",
          claim,
        }))
      );
    }
  }, [claims, selections.length]);

  const selectedClaims = selections.filter((s) => s.strategy !== "SKIP");

  const handleAnalyze = async () => {
    if (selectedClaims.length === 0) {
      setError("Please select at least one claim to merge");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/deliberations/${targetDeliberationId}/merges?analyze=true`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceDeliberationId,
            claimsToMerge: selectedClaims.map((s) => ({
              claimId: s.claimId,
              strategy: s.strategy,
              targetClaimId: s.targetClaimId,
            })),
            argumentsToMerge: [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze merge");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setStep("analysis");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (formData: CreateMergeRequestForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/deliberations/${targetDeliberationId}/merges`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceDeliberationId,
            title: formData.title,
            description: formData.description || undefined,
            claimsToMerge: selectedClaims.map((s) => ({
              claimId: s.claimId,
              strategy: s.strategy,
              targetClaimId: s.targetClaimId,
            })),
            argumentsToMerge: [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create merge request");
      }

      const mergeRequest = await response.json();

      onSuccess?.({
        id: mergeRequest.id,
        title: mergeRequest.title,
        status: mergeRequest.status,
      });

      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveConflict = (claimId: string, strategy: "REPLACE" | "LINK_SUPPORT" | "LINK_CHALLENGE" | "SKIP") => {
    setSelections((prev) =>
      prev.map((s) => (s.claimId === claimId ? { ...s, strategy } : s))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-primary" />
            Create Merge Request
          </DialogTitle>
          <DialogDescription>
            <span className="flex items-center gap-2">
              <span className="truncate max-w-[150px]">{sourceTitle}</span>
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
              <span className="truncate max-w-[150px]">{targetTitle}</span>
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2 border-b border-slate-200 dark:border-slate-700">
          {["claims", "analysis", "details"].map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
                  step === s
                    ? "bg-primary text-white"
                    : i < ["claims", "analysis", "details"].indexOf(step)
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                )}
              >
                {i < ["claims", "analysis", "details"].indexOf(step) ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span>{i + 1}</span>
                )}
                <span className="capitalize">{s}</span>
              </div>
              {i < 2 && (
                <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4">
          {step === "claims" && (
            <div className="space-y-4">
              <MergeClaimSelector
                claims={claims}
                selections={selections}
                onSelectionsChange={setSelections}
                conflicts={analysis?.conflicts ?? []}
              />

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === "analysis" && analysis && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedClaims.length}
                  </div>
                  <div className="text-xs text-slate-500">Claims</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    0
                  </div>
                  <div className="text-xs text-slate-500">Arguments</div>
                </div>
                <div
                  className={cn(
                    "p-3 rounded-lg text-center",
                    analysis.conflicts.length > 0
                      ? "bg-amber-50 dark:bg-amber-900/20"
                      : "bg-green-50 dark:bg-green-900/20"
                  )}
                >
                  <div
                    className={cn(
                      "text-2xl font-bold",
                      analysis.conflicts.length > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400"
                    )}
                  >
                    {analysis.conflicts.length}
                  </div>
                  <div className="text-xs text-slate-500">Conflicts</div>
                </div>
              </div>

              {/* Conflicts */}
              {analysis.conflicts.length > 0 ? (
                <MergeConflictViewer
                  conflicts={analysis.conflicts}
                  onResolve={handleResolveConflict}
                />
              ) : (
                <div className="text-center py-6">
                  <Check className="w-10 h-10 mx-auto text-green-500 mb-2" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No conflicts detected
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    This merge can proceed without issues
                  </p>
                </div>
              )}
            </div>
          )}

          {step === "details" && (
            <form
              id="merge-request-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a title for this merge request..."
                  {...form.register("title")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this merge request contains..."
                  rows={4}
                  {...form.register("description")}
                  disabled={isSubmitting}
                />
              </div>

              {/* Summary */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Merge Summary
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{selectedClaims.length} claims</span>
                  <span>0 arguments</span>
                  {analysis?.conflicts.length ? (
                    <span className="text-amber-600">
                      {analysis.conflicts.length} conflicts
                    </span>
                  ) : (
                    <span className="text-green-600">No conflicts</span>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          {step === "claims" && (
            <>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isAnalyzing}
              >
                Cancel
              </Button>
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Merge
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === "analysis" && (
            <>
              <Button variant="ghost" onClick={() => setStep("claims")}>
                Back
              </Button>
              <Button onClick={() => setStep("details")}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === "details" && (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep("analysis")}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                form="merge-request-form"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <GitPullRequest className="w-4 h-4 mr-2" />
                    Create Merge Request
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper for cn
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
