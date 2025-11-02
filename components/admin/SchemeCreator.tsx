//components/admin/SchemeCreator.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateCQsFromTaxonomy, type TaxonomyFields } from "@/lib/argumentation/cqGeneration";

type CriticalQuestion = {
  cqKey: string;
  text: string;
  attackType: "REBUTS" | "UNDERCUTS" | "UNDERMINES";
  targetScope: "conclusion" | "inference" | "premise";
};

type Premise = {
  id: string; // "P1", "P2", etc.
  type: "major" | "minor";
  text: string;
  variables: string[]; // ["E", "S", "A"]
};

type ConclusionTemplate = {
  text: string;
  variables: string[]; // ["A"]
};

type SchemeFormData = {
  key: string;
  name: string;
  description: string;
  summary: string;
  purpose: string;
  source: string;
  materialRelation: string;
  reasoningType: string;
  ruleForm: string;
  conclusionType: string;
  premises: Premise[];
  conclusion: ConclusionTemplate | null;
  cqs: CriticalQuestion[];
  // Phase 6D: Clustering fields
  parentSchemeId: string;
  clusterTag: string;
  inheritCQs: boolean;
};

type SchemeCreatorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (schemeId: string) => void;
  editScheme?: SchemeFormData & { id: string };
};

const INITIAL_FORM: SchemeFormData = {
  key: "",
  name: "",
  description: "",
  summary: "",
  purpose: "",
  source: "",
  materialRelation: "",
  reasoningType: "",
  ruleForm: "",
  conclusionType: "",
  premises: [],
  conclusion: null,
  cqs: [],
  // Phase 6D: Clustering fields
  parentSchemeId: "",
  clusterTag: "",
  inheritCQs: true,
};

export default function SchemeCreator({
  open,
  onOpenChange,
  onSuccess,
  editScheme,
}: SchemeCreatorProps) {
  const [formData, setFormData] = useState<SchemeFormData>(
    editScheme || INITIAL_FORM
  );
  const [currentCQ, setCurrentCQ] = useState<CriticalQuestion>({
    cqKey: "",
    text: "",
    attackType: "UNDERCUTS",
    targetScope: "inference",
  });

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Phase 6D: Available schemes for parent selector
  const [availableSchemes, setAvailableSchemes] = useState<Array<{ id: string; key: string; name: string }>>([]);
  
  // Fetch available schemes on mount
  React.useEffect(() => {
    if (open) {
      fetch("/api/schemes")
        .then((res) => res.json())
        .then((data) => {
          const schemes = data.items || data.schemes || [];
          setAvailableSchemes(schemes.map((s: any) => ({ id: s.id, key: s.key, name: s.name })));
        })
        .catch((err) => console.error("Failed to fetch schemes:", err));
    }
  }, [open]);

  const handleInputChange = (field: keyof SchemeFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAddCQ = () => {
    if (!currentCQ.cqKey.trim() || !currentCQ.text.trim()) {
      setError("CQ key and text are required");
      return;
    }

    // Check for duplicate cqKey
    if (formData.cqs.some((cq) => cq.cqKey === currentCQ.cqKey)) {
      setError(`CQ key "${currentCQ.cqKey}" already exists`);
      return;
    }

    setFormData({
      ...formData,
      cqs: [...formData.cqs, { ...currentCQ }],
    });

    // Reset CQ form
    setCurrentCQ({
      cqKey: "",
      text: "",
      attackType: "UNDERCUTS",
      targetScope: "inference",
    });
    setError(null);
  };

  const handleGenerateCQs = () => {
    if (!formData.key.trim()) {
      setError("Scheme key is required before generating CQs");
      return;
    }

    const taxonomy: TaxonomyFields = {
      purpose: formData.purpose || null,
      source: formData.source || null,
      materialRelation: formData.materialRelation || null,
      reasoningType: formData.reasoningType || null,
      ruleForm: formData.ruleForm || null,
      conclusionType: formData.conclusionType || null,
    };

    const generated = generateCQsFromTaxonomy(taxonomy, formData.key);

    // Filter out CQs that already exist (by cqKey)
    const existingKeys = new Set(formData.cqs.map((cq) => cq.cqKey));
    const newCQs = generated.filter((cq) => !existingKeys.has(cq.cqKey));

    if (newCQs.length === 0) {
      setError("No new CQs to generate (all taxonomy-based CQs already added)");
      return;
    }

    setFormData({
      ...formData,
      cqs: [...formData.cqs, ...newCQs],
    });

    setError(null);
    // Show success message
    alert(`Generated ${newCQs.length} critical questions based on taxonomy!`);
  };

  const handleRemoveCQ = (cqKey: string) => {
    setFormData({
      ...formData,
      cqs: formData.cqs.filter((cq) => cq.cqKey !== cqKey),
    });
  };

  const validateForm = (): string | null => {
    if (!formData.key.trim()) return "Scheme key is required";
    if (!/^[a-z_]+$/.test(formData.key)) {
      return "Scheme key must be lowercase with underscores only (e.g., expert_opinion)";
    }
    if (!formData.name.trim()) return "Scheme name is required";
    if (!formData.summary.trim()) return "Summary is required";
    if (formData.cqs.length === 0) return "At least one critical question is required";
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const method = editScheme ? "PUT" : "POST";
      const url = editScheme ? `/api/schemes/${editScheme.id}` : "/api/schemes";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save scheme");
      }

      const result = await response.json();
      setSuccess(true);

      // Wait a moment to show success, then close
      setTimeout(() => {
        onSuccess?.(result.schemeId);
        onOpenChange(false);
        setFormData(INITIAL_FORM);
        setSuccess(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-sky-100/40 backdrop-blur-xl border border-indigo-500 custom-scrollbar shadow-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {editScheme ? "Edit Argumentation Scheme" : "Create Custom Argumentation Scheme"}
          </DialogTitle>
          <DialogDescription className="text-slate-600 mt-2">
            Define a new scheme with Macagno taxonomy fields and critical questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 ">
          {/* Basic Information */}
          <div className="space-y-4 pb-3">
            <h3 className="font-semibold text-base text-slate-900 tracking-tight">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="key" className="text-sm font-medium text-slate-700">Scheme Key *</Label>
                <Input
                  id="key"
                  placeholder="expert_opinion"
                  value={formData.key}
                  onChange={(e) => handleInputChange("key", e.target.value)}
                  disabled={!!editScheme}
                  className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Lowercase with underscores (immutable after creation)
                </p>
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-medium text-slate-700">Display Name *</Label>
                <Input
                  id="name"
                  placeholder="Argument from Expert Opinion"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="summary" className="text-sm font-medium  text-slate-700">Summary *</Label>
              <Input
                id="summary"
                placeholder="One-line description of the scheme"
                value={formData.summary}
                onChange={(e) => handleInputChange("summary", e.target.value)}
                className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-slate-700">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Detailed explanation of when and how to use this scheme..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
                    className="border-none articlesearchfield resize-none"
              />
            </div>
          </div>

          {/* Macagno Taxonomy */}
          <div className="space-y-4 pt-3  border-t border-sky-800/60 ">
            <h3 className="font-semibold text-base text-slate-900 tracking-tight">
              Macagno Taxonomy (Optional but Recommended)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purpose" className="text-sm font-medium text-slate-700">Purpose</Label>
                <Select
                  value={formData.purpose || "none"}
                  onValueChange={(value) => handleInputChange("purpose", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20">
                    <SelectValue placeholder="Select purpose..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="action">Action (prescriptive)</SelectItem>
                    <SelectItem value="state_of_affairs">State of Affairs (descriptive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="source" className="text-sm font-medium text-slate-700">Source</Label>
                <Select
                  value={formData.source || "none"}
                  onValueChange={(value) => handleInputChange("source", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20">
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="internal">Internal (speaker&apos;s knowledge)</SelectItem>
                    <SelectItem value="external">External (expert, study, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="materialRelation" className="text-sm font-medium text-slate-700">Material Relation</Label>
                <Select
                  value={formData.materialRelation || "none"}
                  onValueChange={(value) => handleInputChange("materialRelation", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20">
                    <SelectValue placeholder="Select relation..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="cause">Cause & Effect</SelectItem>
                    <SelectItem value="definition">Definition/Classification</SelectItem>
                    <SelectItem value="analogy">Analogy/Similarity</SelectItem>
                    <SelectItem value="authority">Authority/Expertise</SelectItem>
                    <SelectItem value="practical">Practical/Means-End</SelectItem>
                    <SelectItem value="correlation">Correlation/Sign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reasoningType" className="text-sm font-medium text-slate-700">Reasoning Type</Label>
                <Select
                  value={formData.reasoningType || "none"}
                  onValueChange={(value) => handleInputChange("reasoningType", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="deductive">Deductive</SelectItem>
                    <SelectItem value="inductive">Inductive</SelectItem>
                    <SelectItem value="abductive">Abductive</SelectItem>
                    <SelectItem value="practical">Practical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ruleForm" className="text-sm font-medium text-slate-700">Rule Form</Label>
                <Select
                  value={formData.ruleForm || "none"}
                  onValueChange={(value) => handleInputChange("ruleForm", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20">
                    <SelectValue placeholder="Select form..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="MP">Modus Ponens</SelectItem>
                    <SelectItem value="MT">Modus Tollens</SelectItem>
                    <SelectItem value="defeasible_MP">Defeasible MP</SelectItem>
                    <SelectItem value="universal">Universal Instantiation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="conclusionType" className="text-sm font-medium text-slate-700">Conclusion Type</Label>
                <Select
                  value={formData.conclusionType || "none"}
                  onValueChange={(value) => handleInputChange("conclusionType", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="ought">Ought (normative)</SelectItem>
                    <SelectItem value="is">Is (descriptive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Phase 6D: Scheme Clustering & Hierarchy */}
          <div className="space-y-4 border-t border-sky-800/60 pt-3">
            <div>
              <h3 className="font-semibold text-base text-slate-900 tracking-tight">Scheme Clustering & Hierarchy</h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Optional: establish parent-child relationships and cluster families (Macagno & Walton Section 6)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentScheme" className="text-sm font-medium text-slate-700">Parent Scheme</Label>
                <Select
                  value={formData.parentSchemeId || "none"}
                  onValueChange={(value) => handleInputChange("parentSchemeId", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20">
                    <SelectValue placeholder="No parent (root scheme)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                    <SelectItem  className="hover:bg-slate-300/50 cursor-pointer" value="none">No parent (root scheme)</SelectItem>
                    {availableSchemes
                      .filter((s) => s.id !== editScheme?.id) // Don't allow self-parenting
                      .map((scheme) => (
                        <SelectItem key={scheme.id} className="hover:bg-slate-300/50 cursor-pointer" value={scheme.id}>
                          {scheme.name} ({scheme.key})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1.5">
                  Child schemes inherit parent&apos;s critical questions
                </p>
              </div>

              <div>
                <Label htmlFor="clusterTag" className="text-sm font-medium text-slate-700">Cluster Tag</Label>
                <Input
                  id="clusterTag"
                  list="cluster-suggestions"
                  placeholder="e.g., practical_reasoning_family"
                  value={formData.clusterTag}
                  onChange={(e) => handleInputChange("clusterTag", e.target.value)}
                  className="bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                />
                <datalist id="cluster-suggestions">
                  <option value="practical_reasoning_family" />
                  <option value="authority_family" />
                  <option value="similarity_family" />
                  <option value="causal_family" />
                  <option value="definition_family" />
                </datalist>
                <p className="text-xs text-slate-500 mt-1.5">
                  Group related schemes into semantic families
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="inheritCQs"
                checked={formData.inheritCQs}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, inheritCQs: checked as boolean })
                }
              />
              <Label 
                htmlFor="inheritCQs" 
                className="text-sm font-normal cursor-pointer text-slate-700"
              >
                Inherit critical questions from parent scheme
              </Label>
            </div>
          </div>

          {/* Formal Structure (Walton-style Premises & Conclusion) */}
          <div className="space-y-4 border-t border-sky-800/60 pt-3 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-slate-900 tracking-tight">
                  Formal Structure (Premises & Conclusion)
                </h3>
                <p className="text-xs text-slate-500 mt-1.5">
                  Define the logical structure following Walton&apos;s argumentation scheme format
                </p>
              </div>
            </div>

            {/* Premises */}
            <div className="space-y-3">
              <Label className="text-base font-medium text-slate-900 tracking-wide">Premises</Label>
              
              {formData.premises.map((premise, idx) => (
                <div key={premise.id} className="p-4 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-slate-800">{premise.id}:</span>
                      <Select
                        value={premise.type}
                        onValueChange={(value: "major" | "minor") => {
                          const updated = [...formData.premises];
                          updated[idx].type = value;
                          setFormData({ ...formData, premises: updated });
                        }}
                      >
                        <SelectTrigger className="w-32 h-8 bg-white/60 border-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200 ">
                          <SelectItem className="hover:bg-slate-300/50 cursor-pointer" value="major">Major</SelectItem>
                          <SelectItem className="hover:bg-slate-300/50 cursor-pointer" value="minor">Minor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({
                          ...formData,
                          premises: formData.premises.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Textarea
                    placeholder="e.g., Source E is an expert in subject domain S containing proposition A."
                    value={premise.text}
                    onChange={(e) => {
                      const updated = [...formData.premises];
                      updated[idx].text = e.target.value;
                      setFormData({ ...formData, premises: updated });
                    }}
                    rows={2}
                    className="articlesearchfield border-none resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">Variables:</span>
                    <Input
                      placeholder="E, S, A (comma-separated)"
                      value={premise.variables.join(", ")}
                      onChange={(e) => {
                        const updated = [...formData.premises];
                        updated[idx].variables = e.target.value.split(",").map(v => v.trim()).filter(Boolean);
                        setFormData({ ...formData, premises: updated });
                      }}
                      onKeyDown={(e) => {
                        // Allow space key (prevent any event blocking)
                        e.stopPropagation();
                      }}
                      className="h-8 text-xs font-mono bg-white border-slate-200"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="flex items-center gap-2 text-sm text-slate-700 btnv2--ghost px-3 py-1.5 rounded-lg bg-white/90 menuv2--lite"
                onClick={() => {
                  const newId = `P${formData.premises.length + 1}`;
                  setFormData({
                    ...formData,
                    premises: [...formData.premises, { id: newId, type: "major", text: "", variables: [] }]
                  });
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="font-medium tracking-wide text-sm">Add Premise</span>
              </button>
            </div>

            {/* Conclusion */}
            <div className="space-y-2">
              <Label className="text-base font-medium text-slate-900 tracking-wide">Conclusion</Label>
              {formData.conclusion ? (
                <div className="p-4 bg-indigo-50/70 backdrop-blur-sm border border-indigo-200/60 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-mono font-semibold text-indigo-900">∴ Therefore:</span>
                    <button
                      onClick={() => setFormData({ ...formData, conclusion: null })}
                      className="text-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Textarea
                    placeholder="e.g., A is true (false)."
                    value={formData.conclusion.text}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        conclusion: { ...formData.conclusion!, text: e.target.value }
                      });
                    }}
                    rows={2}
                    className="border-none articlesearchfield resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-700 font-medium">Variables:</span>
                    <Input
                      placeholder="A (comma-separated)"
                      value={formData.conclusion.variables.join(", ")}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          conclusion: {
                            ...formData.conclusion!,
                            variables: e.target.value.split(",").map(v => v.trim()).filter(Boolean)
                          }
                        });
                      }}
                      onKeyDown={(e) => {
                        // Allow space key (prevent any event blocking)
                        e.stopPropagation();
                      }}
                      className="h-8 text-xs font-mono bg-white/60 backdrop-blur-sm border-indigo-200"
                    />
                  </div>
                </div>
              ) : (
                <button
                className="flex items-center gap-2 text-sm text-slate-700 btnv2--ghost px-3 py-1.5 rounded-lg bg-white/90 menuv2--lite"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      conclusion: { text: "", variables: [] }
                    });
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                 <span className="font-medium tracking-wide text-sm">Add Conclusion</span>
                </button>
              )}
            </div>
          </div>

          {/* Critical Questions */}
          <div className="space-y-4 border-t border-slate-200/60 pt-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-slate-900 tracking-tight">
                Critical Questions * (at least 1 required)
              </h3>
              <button
                className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-white/50 hover:bg-white/70 backdrop-blur-sm border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 transition-all"
                onClick={handleGenerateCQs}
                disabled={!formData.key.trim()}
              >
                Generate from Taxonomy
              </button>
            </div>

            {!formData.key.trim() && (
              <div className="text-xs text-amber-700 bg-amber-50/70 backdrop-blur-sm border border-amber-200/60 rounded-lg p-3">
                💡 Fill in the scheme key and taxonomy fields above, then click &quot;Generate from Taxonomy&quot; to auto-create baseline CQs!
              </div>
            )}

            {/* Existing CQs */}
            {formData.cqs.length > 0 && (
              <div className="space-y-2">
                {formData.cqs.map((cq) => (
                  <div
                    key={cq.cqKey}
                    className="flex items-start gap-3 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-lg p-3 hover:bg-white/70 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="font-medium text-sm text-slate-900">{cq.cqKey}</div>
                      <div className="text-sm text-slate-700">{cq.text}</div>
                      <div className="flex gap-2">
                        <span className="text-xs bg-purple-100/80 text-purple-700 px-2 py-1 rounded-md font-medium">
                          {cq.attackType}
                        </span>
                        <span className="text-xs bg-sky-100/80 text-sky-700 px-2 py-1 rounded-md font-medium">
                          {cq.targetScope}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCQ(cq.cqKey)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New CQ */}
            <div className="bg-white/40 backdrop-blur-sm border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cqKey" className="text-xs font-medium text-slate-700">
                    CQ Key
                  </Label>
                  <Input
                    id="cqKey"
                    placeholder="expert_credible?"
                    value={currentCQ.cqKey}
                    onChange={(e) =>
                      setCurrentCQ({ ...currentCQ, cqKey: e.target.value })
                    }
                    className="text-sm bg-white/60 backdrop-blur-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                  />
                </div>

                <div>
                  <Label htmlFor="attackType" className="text-xs font-medium text-slate-700">
                    Attack Type
                  </Label>
                  <Select
                    value={currentCQ.attackType}
                    onValueChange={(value) =>
                      setCurrentCQ({
                        ...currentCQ,
                        attackType: value as CriticalQuestion["attackType"],
                      })
                    }
                  >
                    <SelectTrigger className="text-sm bg-white/60 backdrop-blur-sm border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                      <SelectItem  className="hover:bg-slate-300/50 cursor-pointer" value="REBUTS">REBUTS (conclusion)</SelectItem>
                      <SelectItem className="hover:bg-slate-300/50 cursor-pointer" value="UNDERCUTS">UNDERCUTS (inference)</SelectItem>
                      <SelectItem className="hover:bg-slate-300/50 cursor-pointer" value="UNDERMINES">UNDERMINES (premise)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="cqText" className="text-xs font-medium text-slate-700">
                  Question Text
                </Label>
                <Textarea
                  id="cqText"
                  placeholder="Is the expert credible and unbiased?"
                  value={currentCQ.text}
                  onChange={(e) =>
                    setCurrentCQ({ ...currentCQ, text: e.target.value })
                  }
                  rows={2}
                    className="border-none articlesearchfield resize-none"
                />
              </div>

              <div>
                <Label htmlFor="targetScope" className="text-xs font-medium text-slate-700">
                  Target Scope
                </Label>
                <Select
                  value={currentCQ.targetScope}
                  onValueChange={(value) =>
                    setCurrentCQ({
                      ...currentCQ,
                      targetScope: value as CriticalQuestion["targetScope"],
                    })
                  }
                >
                  <SelectTrigger className="text-sm bg-white/60 backdrop-blur-sm border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                    <SelectItem  className="hover:bg-slate-300/50 cursor-pointer" value="conclusion">Conclusion</SelectItem>
                    <SelectItem  className="hover:bg-slate-300/50 cursor-pointer" value="inference">Inference</SelectItem>
                    <SelectItem className="hover:bg-slate-300/50 cursor-pointer" value="premise">Premise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                onClick={handleAddCQ}
                variant="outline"
                size="sm"
                className="w-full bg-white/50 hover:bg-white/70 border-slate-200 hover:border-slate-300 text-slate-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Critical Question
              </Button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50/70 backdrop-blur-sm border border-red-200/60 rounded-lg text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50/70 backdrop-blur-sm border border-green-200/60 rounded-lg text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Scheme saved successfully!</span>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-200/60 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="bg-white/50 hover:bg-white/70 border-slate-200 text-slate-700"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {editScheme ? "Update Scheme" : "Create Scheme"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
