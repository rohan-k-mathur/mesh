"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  Edit,
  Upload,
  Eye,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { useArgumentScoring } from "@/hooks/useArgumentScoring";

// ============================================================================
// Types
// ============================================================================

export type ArgumentMode = "attack" | "support" | "general";
export type WizardStep = "scheme" | "template" | "premises" | "evidence" | "review";

export interface AttackSuggestion {
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
  targetSchemeInstance?: any;
  cq?: any;
  reasoning?: string;
}

export interface SupportSuggestion {
  schemeId: string;
  reasoning?: string;
}

export interface ArgumentTemplate {
  schemeId: string;
  schemeName: string;
  conclusion: string;
  premises: Array<{
    key: string;
    text: string;
    required: boolean;
    evidenceType?: string;
  }>;
  variables: Record<string, string>;
  constructionSteps: string[];
  evidenceRequirements: string[];
}

export interface ArgumentDraft {
  id: string;
  mode: ArgumentMode;
  schemeId: string;
  filledPremises: Record<string, string>;
  evidenceLinks: Record<string, string[]>;
  variables: Record<string, string>;
  lastModified: Date;
}

interface ArgumentConstructorProps {
  mode: ArgumentMode;
  targetId: string; // claimId or argumentId
  deliberationId: string;
  // For attack mode
  suggestion?: AttackSuggestion;
  // For support mode
  supportSuggestion?: SupportSuggestion;
  // Callbacks
  onComplete?: (argumentId: string) => void;
  onCancel?: () => void;
  onSaveDraft?: (draftId: string) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function ArgumentConstructor({
  mode,
  targetId,
  deliberationId,
  suggestion,
  supportSuggestion,
  onComplete,
  onCancel,
  onSaveDraft,
}: ArgumentConstructorProps) {
  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>(
    mode === "general" ? "scheme" : "template"
  );
  const [selectedScheme, setSelectedScheme] = useState<string | null>(
    (suggestion as any)?.targetSchemeInstance?.scheme?.id ||
      supportSuggestion?.schemeId ||
      null
  );
  const [template, setTemplate] = useState<ArgumentTemplate | null>(null);
  const [filledPremises, setFilledPremises] = useState<Record<string, string>>({});
  const [evidenceLinks, setEvidenceLinks] = useState<Record<string, string[]>>({});
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Real-time scoring
  const { score, isScoring } = useArgumentScoring(
    selectedScheme || "",
    targetId,
    filledPremises
  );

  // Steps configuration based on mode
  const steps = getStepsForMode(mode);
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const loadTemplate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const body: any = {
        schemeId: selectedScheme,
        targetId,
        mode,
      };

      if (mode === "attack" && suggestion) {
        body.attackType = suggestion.attackType;
        body.targetCQ = (suggestion.cq as any)?.id;
      }

      const response = await fetch("/api/arguments/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to load template");
      }

      const data = await response.json();
      setTemplate(data.template);

      // Initialize variables
      if (data.template.variables) {
        setVariables(data.template.variables);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedScheme, targetId, mode, suggestion]);

  const loadDraft = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/arguments/drafts?targetId=${targetId}&mode=${mode}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.draft) {
          setSelectedScheme(data.draft.schemeId);
          setFilledPremises(data.draft.filledPremises || {});
          setEvidenceLinks(data.draft.evidenceLinks || {});
          setVariables(data.draft.variables || {});
          setLastSaved(new Date(data.draft.lastModified));
        }
      }
    } catch (err) {
      console.error("Failed to load draft:", err);
    }
  }, [targetId, mode]);

  const saveDraft = useCallback(async () => {
    if (!selectedScheme) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/arguments/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          targetId,
          deliberationId,
          schemeId: selectedScheme,
          filledPremises,
          evidenceLinks,
          variables,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastSaved(new Date());
        onSaveDraft?.(data.draft.id);
      }
    } catch (err) {
      console.error("Failed to save draft:", err);
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedScheme,
    mode,
    targetId,
    deliberationId,
    filledPremises,
    evidenceLinks,
    variables,
    onSaveDraft,
  ]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!autoSaveEnabled || !selectedScheme) return;

    const timer = setTimeout(() => {
      saveDraft();
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [filledPremises, evidenceLinks, variables, autoSaveEnabled, selectedScheme, saveDraft]);

  // Load existing draft on mount
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Load template when scheme is selected
  useEffect(() => {
    if (selectedScheme && !template) {
      loadTemplate();
    }
  }, [selectedScheme, template, loadTemplate]);

  // Navigation
  function goToStep(step: WizardStep) {
    if (steps.indexOf(step) <= currentStepIndex) {
      setCurrentStep(step);
    }
  }

  function nextStep() {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < steps.length) {
      setCurrentStep(steps[nextIdx]);
    }
  }

  function previousStep() {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx >= 0) {
      setCurrentStep(steps[prevIdx]);
    }
  }

  // Validation
  function canProceed(): boolean {
    if (!template) return false;

    switch (currentStep) {
      case "scheme":
        return selectedScheme !== null;
      case "template":
        return Object.keys(variables).every((key) => variables[key]?.trim());
      case "premises":
        const requiredPremises = template.premises.filter((p) => p.required);
        return requiredPremises.every((p) => filledPremises[p.key]?.trim());
      case "evidence":
        return true; // Evidence is optional
      case "review":
        return score !== null && score.overallScore >= 40;
      default:
        return false;
    }
  }

  // Submission
  async function handleSubmit() {
    if (!template) return;

    setIsLoading(true);
    setError(null);

    try {
      const argumentText = generateArgumentText();

      const response = await fetch("/api/arguments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          deliberationId,
          targetId,
          schemeId: selectedScheme,
          text: argumentText,
          premises: filledPremises,
          evidenceLinks,
          score: score?.overallScore || 0,
          attackType: mode === "attack" ? suggestion?.attackType : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit argument");
      }

      const data = await response.json();

      // Delete draft after successful submission
      try {
        await fetch(`/api/arguments/drafts?targetId=${targetId}&mode=${mode}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to delete draft:", err);
      }

      onComplete?.(data.argument.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function generateArgumentText(): string {
    if (!template) return "";

    let text = "";

    template.premises.forEach((premise) => {
      const filled = filledPremises[premise.key];
      if (filled) {
        text += filled + " ";
      }
    });

    text += "Therefore, " + template.conclusion;

    return text.trim();
  }

  // Render
  if (isLoading && !template && currentStep !== "scheme") {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with auto-save indicator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {mode === "attack" && "Build Attack"}
                {mode === "support" && "Build Support"}
                {mode === "general" && "Build Argument"}
              </CardTitle>
              <CardDescription>
                {mode === "attack" &&
                  "Construct a strategic attack using argumentation theory"}
                {mode === "support" &&
                  "Strengthen an argument with supporting evidence"}
                {mode === "general" && "Create a well-structured argument"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-save indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>Saved {formatRelativeTime(lastSaved)}</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>Not saved</span>
                  </>
                )}
              </div>
              <button
                onClick={() => saveDraft()}
                className="flex items-center gap-2 py-1.5 px-3 rounded border border-sky-200 bg-white hover:bg-sky-50 text-sky-700 text-sm transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                Save Draft
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Progress indicator */}
      <WizardProgress
        steps={steps}
        currentStep={currentStep}
        onStepClick={goToStep}
        mode={mode}
      />

      {/* Step content */}
      <Card>
        {currentStep === "scheme" && (
          <SchemeSelectionStep
            deliberationId={deliberationId}
            targetId={targetId}
            selectedScheme={selectedScheme}
            onSchemeSelect={setSelectedScheme}
            onNext={nextStep}
            onCancel={onCancel}
          />
        )}

        {currentStep === "template" && (
          <TemplateCustomizationStep
            template={template}
            variables={variables}
            onVariableChange={(key, value) =>
              setVariables((prev) => ({ ...prev, [key]: value }))
            }
            onNext={nextStep}
            onBack={previousStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === "premises" && template && (
          <PremisesFillingStep
            template={template}
            filledPremises={filledPremises}
            onPremiseChange={(key, value) =>
              setFilledPremises((prev) => ({ ...prev, [key]: value }))
            }
            score={score}
            isScoring={isScoring}
            onNext={nextStep}
            onBack={previousStep}
            canProceed={canProceed()}
          />
        )}

        {currentStep === "evidence" && template && (
          <EvidenceCollectionStep
            template={template}
            evidenceLinks={evidenceLinks}
            onEvidenceChange={(key, links) =>
              setEvidenceLinks((prev) => ({ ...prev, [key]: links }))
            }
            onNext={nextStep}
            onBack={previousStep}
          />
        )}

        {currentStep === "review" && template && (
          <ReviewSubmitStep
            mode={mode}
            template={template}
            filledPremises={filledPremises}
            evidenceLinks={evidenceLinks}
            score={score}
            isSubmitting={isLoading}
            error={error}
            onSubmit={handleSubmit}
            onBack={previousStep}
            onCancel={onCancel}
          />
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// Wizard Progress
// ============================================================================

interface WizardProgressProps {
  steps: WizardStep[];
  currentStep: WizardStep;
  onStepClick: (step: WizardStep) => void;
  mode: ArgumentMode;
}

function WizardProgress({
  steps,
  currentStep,
  onStepClick,
  mode,
}: WizardProgressProps) {
  const currentIdx = steps.indexOf(currentStep);
  const progress = ((currentIdx + 1) / steps.length) * 100;

  const stepConfig: Record<
    WizardStep,
    { label: string; icon: React.ComponentType<any> }
  > = {
    scheme: { label: "Select Scheme", icon: Sparkles },
    template: { label: "Customize", icon: FileText },
    premises: { label: "Fill Premises", icon: Edit },
    evidence: { label: "Add Evidence", icon: Upload },
    review: { label: "Review", icon: Eye },
  };

  return (
    <div className="space-y-4">
      <Progress value={progress} className="h-2" />
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const config = stepConfig[step];
          const Icon = config.icon;
          const isActive = step === currentStep;
          const isCompleted = idx < currentIdx;
          const isClickable = idx <= currentIdx;

          return (
            <button
              key={step}
              onClick={() => isClickable && onStepClick(step)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-2 flex-1 py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-sky-50 text-sky-700"
                  : isCompleted
                  ? "text-green-700 hover:bg-green-50"
                  : "text-muted-foreground cursor-not-allowed"
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  isActive
                    ? "bg-sky-600 text-white"
                    : isCompleted
                    ? "bg-green-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span className="text-xs font-medium">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Scheme Selection Step (for general mode)
// ============================================================================

interface SchemeSelectionStepProps {
  deliberationId: string;
  targetId: string;
  selectedScheme: string | null;
  onSchemeSelect: (schemeId: string) => void;
  onNext: () => void;
  onCancel?: () => void;
}

function SchemeSelectionStep({
  deliberationId,
  targetId,
  selectedScheme,
  onSchemeSelect,
  onNext,
  onCancel,
}: SchemeSelectionStepProps) {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadSchemes();
  }, []);

  async function loadSchemes() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/schemes/all");
      if (response.ok) {
        const data = await response.json();
        // API returns array directly, not { schemes: [...] }
        setSchemes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load schemes:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredSchemes = schemes.filter(
    (scheme) =>
      scheme?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <CardHeader>
        <CardTitle>Select Argumentation Scheme</CardTitle>
        <CardDescription>
          Choose the type of argument you want to construct
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div>
          <Input
            placeholder="Search schemes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Scheme list */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : filteredSchemes.length > 0 ? (
              filteredSchemes.map((scheme) => (
                <button
                  key={scheme.id}
                  onClick={() => onSchemeSelect(scheme.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedScheme === scheme.id
                      ? "border-sky-500 bg-sky-50"
                      : "border-gray-200 hover:border-sky-300"
                  }`}
                >
                  <div className="font-medium">{scheme.name}</div>
                  {scheme.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {scheme.description}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No schemes found
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <Separator />
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onNext}
            disabled={!selectedScheme}
            className={`flex-1 py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors ${
              selectedScheme
                ? "bg-sky-600 hover:bg-sky-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </CardContent>
    </>
  );
}

// ============================================================================
// Template Customization Step
// ============================================================================

interface TemplateCustomizationStepProps {
  template: ArgumentTemplate | null;
  variables: Record<string, string>;
  onVariableChange: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

function TemplateCustomizationStep({
  template,
  variables,
  onVariableChange,
  onNext,
  onBack,
  canProceed,
}: TemplateCustomizationStepProps) {
  if (!template) {
    return (
      <CardContent className="py-12">
        <div className="text-center text-muted-foreground">
          Loading template...
        </div>
      </CardContent>
    );
  }

  const templateVariables = Object.keys(template.variables || {});

  return (
    <>
      <CardHeader>
        <CardTitle>Customize Template</CardTitle>
        <CardDescription>
          Fill in the template variables for your argument
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template info */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Using: {template.schemeName}</div>
            <div className="text-sm">
              This template will help you structure your argument effectively.
            </div>
          </AlertDescription>
        </Alert>

        {/* Variables */}
        {templateVariables.length > 0 ? (
          <div className="space-y-4">
            {templateVariables.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/_/g, " ")}
                </Label>
                <Input
                  id={key}
                  value={variables[key] || ""}
                  onChange={(e) => onVariableChange(key, e.target.value)}
                  placeholder={`Enter ${key.replace(/_/g, " ")}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No customization needed for this template
          </div>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors ${
              canProceed
                ? "bg-sky-600 hover:bg-sky-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </>
  );
}

// ============================================================================
// Premises, Evidence, and Review Steps
// ============================================================================

// Note: These components are similar to AttackConstructionWizard steps
// but with mode-specific customizations. For brevity, showing placeholders.

interface PremisesFillingStepProps {
  template: ArgumentTemplate;
  filledPremises: Record<string, string>;
  onPremiseChange: (key: string, value: string) => void;
  score: any;
  isScoring: boolean;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

function PremisesFillingStep({
  template,
  filledPremises,
  onPremiseChange,
  score,
  isScoring,
  onNext,
  onBack,
  canProceed,
}: PremisesFillingStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Fill Premises</CardTitle>
        <CardDescription>Complete each premise for your argument</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {template.premises.map((premise) => (
          <div key={premise.key} className="space-y-2">
            <Label htmlFor={premise.key} className="capitalize">
              {premise.text}
              {premise.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={premise.key}
              value={filledPremises[premise.key] || ""}
              onChange={(e) => onPremiseChange(premise.key, e.target.value)}
              placeholder={`Enter ${premise.text.toLowerCase()}`}
              rows={3}
            />
            {score?.premiseScores?.[premise.key] !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Progress
                  value={score.premiseScores[premise.key]}
                  className="h-1.5 flex-1"
                />
                <span className="text-muted-foreground">
                  {score.premiseScores[premise.key]}%
                </span>
              </div>
            )}
          </div>
        ))}

        {score && (
          <Alert>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Quality:</span>
              <Badge
                className={
                  score.overallScore >= 70
                    ? "bg-green-600"
                    : score.overallScore >= 40
                    ? "bg-amber-600"
                    : "bg-red-600"
                }
              >
                {score.overallScore}%
              </Badge>
            </div>
          </Alert>
        )}

        <Separator />
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors ${
              canProceed
                ? "bg-sky-600 hover:bg-sky-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </>
  );
}

interface EvidenceCollectionStepProps {
  template: ArgumentTemplate;
  evidenceLinks: Record<string, string[]>;
  onEvidenceChange: (key: string, links: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function EvidenceCollectionStep({
  template,
  evidenceLinks,
  onEvidenceChange,
  onNext,
  onBack,
}: EvidenceCollectionStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Add Evidence</CardTitle>
        <CardDescription>
          Link supporting evidence to your premises (optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Evidence strengthens your argument. Add links, citations, or sources.
          </AlertDescription>
        </Alert>

        {template.premises.map((premise) => {
          const links = evidenceLinks[premise.key] || [];
          return (
            <div key={premise.key} className="space-y-2">
              <Label className="text-sm font-medium">{premise.text}</Label>
              <div className="space-y-2">
                {links.map((link, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input value={link} readOnly className="flex-1" />
                    <button
                      onClick={() =>
                        onEvidenceChange(
                          premise.key,
                          links.filter((_, i) => i !== idx)
                        )
                      }
                      className="p-2 rounded border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newLink = prompt("Enter evidence link or citation:");
                    if (newLink) {
                      onEvidenceChange(premise.key, [...links, newLink]);
                    }
                  }}
                  className="w-full py-2 px-3 rounded border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm transition-colors"
                >
                  + Add Evidence
                </button>
              </div>
            </div>
          );
        })}

        <Separator />
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors"
          >
            Continue to Review
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </>
  );
}

interface ReviewSubmitStepProps {
  mode: ArgumentMode;
  template: ArgumentTemplate;
  filledPremises: Record<string, string>;
  evidenceLinks: Record<string, string[]>;
  score: any;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

function ReviewSubmitStep({
  mode,
  template,
  filledPremises,
  evidenceLinks,
  score,
  isSubmitting,
  error,
  onSubmit,
  onBack,
  onCancel,
}: ReviewSubmitStepProps) {
  const canSubmit = score && score.overallScore >= 40;

  return (
    <>
      <CardHeader>
        <CardTitle>Review & Submit</CardTitle>
        <CardDescription>
          Review your argument before submission
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality score */}
        {score && (
          <Alert className={score.overallScore >= 70 ? "bg-green-50 border-green-200" : score.overallScore >= 40 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}>
            <AlertDescription>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Argument Quality:</span>
                <Badge
                  className={
                    score.overallScore >= 70
                      ? "bg-green-600"
                      : score.overallScore >= 40
                      ? "bg-amber-600"
                      : "bg-red-600"
                  }
                >
                  {score.overallScore}%
                </Badge>
              </div>
              {score.overallScore < 40 && (
                <p className="text-sm text-red-800">
                  Quality score below 40% minimum. Consider improving premises or
                  adding evidence.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Premises preview */}
        <div className="space-y-3">
          <h4 className="font-medium">Premises:</h4>
          {template.premises.map((premise) => (
            <div
              key={premise.key}
              className="p-3 border rounded-lg bg-muted space-y-1"
            >
              <div className="text-sm font-medium text-muted-foreground">
                {premise.text}
              </div>
              <div className="text-sm">
                {filledPremises[premise.key] || <em>Not filled</em>}
              </div>
            </div>
          ))}
        </div>

        {/* Evidence preview */}
        <div className="space-y-2">
          <h4 className="font-medium">
            Evidence ({Object.values(evidenceLinks).flat().length} items)
          </h4>
          {Object.values(evidenceLinks).flat().length > 0 ? (
            <div className="text-sm text-muted-foreground">
              {Object.values(evidenceLinks).flat().length} evidence links added
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              No evidence added
            </div>
          )}
        </div>

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Separator />
        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="py-2 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-white text-sm font-medium transition-colors ${
              canSubmit && !isSubmitting
                ? "bg-sky-600 hover:bg-sky-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Submit {mode === "attack" ? "Attack" : mode === "support" ? "Support" : "Argument"}
              </>
            )}
          </button>
        </div>
      </CardContent>
    </>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStepsForMode(mode: ArgumentMode): WizardStep[] {
  if (mode === "general") {
    return ["scheme", "template", "premises", "evidence", "review"];
  }
  // Attack and support modes skip scheme selection
  return ["template", "premises", "evidence", "review"];
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  );
}
