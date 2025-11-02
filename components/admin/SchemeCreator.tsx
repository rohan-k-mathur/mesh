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
import { Plus, X, Save, Loader2, AlertCircle, CheckCircle2, PlusCircle } from "lucide-react";
import { generateCQsFromTaxonomy, type TaxonomyFields } from "@/lib/argumentation/cqGeneration";

// Custom scrollbar styles for light mode
const scrollbarStyles = `
  .custom-scrollbar-light::-webkit-scrollbar {
    width: 3px;
  }
  .custom-scrollbar-light::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }
  .custom-scrollbar-light::-webkit-scrollbar-thumb {
    background: rgba(56, 189, 248, 0.4);
    border-radius: 4px;
  }
  .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
    background: rgba(56, 189, 248, 0.6);
  }
`;


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
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <DialogContent className="max-w-4xl max-h-[94vh] overflow-hidden bg-white/65 backdrop-blur-xl panel-edge py-4 px-5">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-xl font-bold text-slate-900">
            {editScheme ? "Edit Argumentation Scheme" : "Create Custom Argumentation Scheme"}
          </DialogTitle>
          <DialogDescription className="text-slate-600 pb-0 border-sky-500">
            Define a new scheme with a formal structure, Walton taxonomy fields and critical questions.
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable content wrapper */}
        <div className="relative z-10 overflow-y-auto max-h-[72vh] custom-scrollbar-light px-2">
        <div className="space-y-3">
          {/* Basic Information */}
          <div className="space-y-2">
            <Label className="text-base font-semibold text-sky-900 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              Basic Information
            </Label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="key" className="text-sm font-medium text-slate-700">Scheme Key *</Label>
                <Input
                  id="key"
                  placeholder="expert_opinion"
                  value={formData.key}
                  onChange={(e) => handleInputChange("key", e.target.value)}
                  disabled={!!editScheme}
                  className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg transition-all"
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
                  className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg transition-all"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="summary" className="text-sm font-medium text-slate-700">Summary *</Label>
              <Input
                id="summary"
                placeholder="One-line description of the scheme"
                value={formData.summary}
                onChange={(e) => handleInputChange("summary", e.target.value)}
                className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg transition-all"
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
                className="min-h-[90px] resize-y bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg"
              />
            </div>
          </div>

          {/* Macagno Taxonomy */}
          <div className="space-y-4 border-t border-slate-900/10 pt-6">
            <Label className="text-sm font-semibold text-sky-900 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              Walton Taxonomy (Optional but Recommended)
            </Label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purpose" className="text-sm font-medium text-slate-700">Purpose</Label>
                <Select
                  value={formData.purpose || "none"}
                  onValueChange={(value) => handleInputChange("purpose", value === "none" ? "" : value)}
                >
                  <SelectTrigger className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg">
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
                  <SelectTrigger className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg">
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
                  <SelectTrigger className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg">
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
                  <SelectTrigger className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg">
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
                  <SelectTrigger className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg">
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
                  <SelectTrigger className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg">
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
          <div className="space-y-4 border-t border-slate-900/10 pt-6">
            <div>
              <Label className="text-sm font-semibold text-sky-900 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                Scheme Clustering & Hierarchy
              </Label>
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
                  <SelectTrigger                   className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg transition-all"
>
                    <SelectValue  placeholder="No parent (root scheme)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                    <SelectItem className="hover:bg-slate-900/10  cursor-pointer" value="none">No parent (root scheme)</SelectItem>
                    {availableSchemes
                      .filter((s) => s.id !== editScheme?.id) // Don't allow self-parenting
                      .map((scheme) => (
                        <SelectItem key={scheme.id} className="hover:bg-slate-900/10 cursor-pointer" value={scheme.id}>
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
                <Label htmlFor="clusterTag" className="text-sm py-0 font-medium text-slate-700">Cluster Tag</Label>
                <Input
                  id="clusterTag"
                  list="cluster-suggestions"
                  placeholder="e.g., practical_reasoning_family"
                  value={formData.clusterTag}
                  onChange={(e) => handleInputChange("clusterTag", e.target.value)}
                  className="bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg transition-all"
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

            <div className="flex items-start gap-2">
              <Checkbox
                id="inheritCQs"
                className="flex items-center bg-white w-4 border-indigo-200 focus:ring-1 focus:ring-indigo-500 h-5 "
                checked={formData.inheritCQs}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, inheritCQs: checked as boolean })
                }
              />
              <Label 
                htmlFor="inheritCQs" 
                className="text-sm items-center font-medium tracking-wide cursor-pointer text-slate-700"
              >
                Inherit critical questions from parent scheme
              </Label>
            </div>
          </div>

          {/* Formal Structure (Walton-style Premises & Conclusion) */}
          <div className="space-y-2 border-t border-slate-900/10 pt-3">
            <div>
              <Label className="text-sm font-semibold text-sky-900 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                Formal Structure (Premises & Conclusion)
              </Label>
              <p className="text-xs text-slate-500 mt-1.5">
                Define the logical structure following Walton&apos;s argumentation scheme format
              </p>
            </div>

            {/* Premises */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">Premises</Label>
              
              {formData.premises.map((premise, idx) => (
                <div key={premise.id} className="relative overflow-hidden p-4 backdrop-blur-md border shadow-lg rounded-xl transition-all duration-300 border-slate-900/10 bg-slate-900/5 hover:bg-slate-900/10 hover:border-slate-900/20">
                  {/* Glass shine overlay */}
                  
                  <div className="relative space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-semibold text-slate-900">{premise.id}:</span>
                        <Select
                          value={premise.type}
                          onValueChange={(value: "major" | "minor") => {
                            const updated = [...formData.premises];
                            updated[idx].type = value;
                            setFormData({ ...formData, premises: updated });
                          }}
                        >
                          <SelectTrigger className="w-32 h-8 bg-slate-900/5 border-slate-900/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                            <SelectItem className="hover:bg-slate-900/10 cursor-pointer" value="major">Major</SelectItem>
                            <SelectItem className="hover:bg-slate-900/10 cursor-pointer" value="minor">Minor</SelectItem>
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
                      className="min-h-[60px] resize-y bg-slate-100/5 backdrop-blur-md border-slate-900/20 
                      text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg"
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
                          e.stopPropagation();
                        }}
                        className="h-8 text-xs font-mono bg-slate-900/5 border-slate-900/20 text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="relative overflow-hidden flex items-center gap-2 text-sm text-slate-700 
                hover:text-slate-900 bg-slate-900/5 hover:bg-slate-900/10
                 backdrop-blur-md border border-slate-900/20 hover:border-slate-900/30 rounded-xl 
                 px-4 py-1.5 transition-all group"
                onClick={() => {
                  const newId = `P${formData.premises.length + 1}`;
                  setFormData({
                    ...formData,
                    premises: [...formData.premises, { id: newId, type: "major", text: "", variables: [] }]
                  });
                }}
              >
                <PlusCircle className="flex h-3.5 w-3.5" />
                <span className="flex font-medium text-sm">Add Premise</span>
              </button>
            </div>

            {/* Conclusion */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Conclusion</Label>
              {formData.conclusion ? (
                <div className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-sky-100/35 via-white to-cyan-50/55 backdrop-blur-md border border-cyan-500/30 shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent" />
                  <div className="relative space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="px-2 rounded-lg bg-gradient-to-br from-cyan-500/30 to-sky-500/30 shadow-lg">
                          <span className="text-sm font-mono font-semibold text-cyan-900">∴</span>
                        </div>
                        <span className="text-sm font-semibold text-cyan-900">Therefore:</span>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, conclusion: null })}
                        className="text-cyan-600 hover:text-cyan-800 transition-colors"
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
                      className="min-h-[60px] resize-y bg-slate-100/75 backdrop-blur-md border-slate-900/20 text-slate-900
                       placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-sky-700 font-medium">Variables:</span>
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
                          e.stopPropagation();
                        }}
                        className="h-8 text-xs font-mono bg-slate-900/5 border-slate-900/20 text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  className="relative overflow-hidden flex items-center gap-2 text-sm text-slate-700 
                  hover:text-slate-900 bg-slate-900/5 hover:bg-slate-900/10 backdrop-blur-md
                   border border-slate-900/20 hover:border-slate-900/30 rounded-xl px-3 py-2 transition-all group"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      conclusion: { text: "", variables: [] }
                    });
                  }}
                >
                  <PlusCircle className="flex h-3.5 w-3.5" />
                  <span className="font-medium">Add Conclusion</span>
                </button>
              )}
            </div>
          </div>

          {/* Critical Questions */}
          <div className="space-y-3 border-t border-slate-900/10 pt-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-sky-900 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
                Critical Questions * (at least 1 required)
              </Label>
              <button
                className="text-xs flex  font-medium text-slate-700 hover:text-slate-900 bg-slate-900/5 hover:bg-slate-900/10 backdrop-blur-sm
                 border border-slate-900/20
                 hover:border-slate-900/30 rounded-lg px-3 py-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleGenerateCQs}
                disabled={!formData.key.trim()}
              >
                Generate from Taxonomy
              </button>
            </div>

            {!formData.key.trim() && (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-sky-400/15 to-cyan-400/15 
              backdrop-blur-md border border-cyan-500/30 px-2 py-2 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent" />
                <div className="relative flex gap-3">
                  <div className="p-1 rounded-xl bg-gradient-to-br from-cyan-500/30 to-sky-500/30 shadow-lg h-fit">
                    <AlertCircle className="w-4 h-4 text-cyan-700" />
                  </div>
                  <p className="text-sm text-sky-900 leading-relaxed">
                    Fill in the scheme key and taxonomy fields above, then click &quot;Generate from Taxonomy&quot; to auto-create baseline CQs!
                  </p>
                </div>
              </div>
            )}

            {/* Existing CQs */}
            {formData.cqs.length > 0 && (
              <div className="space-y-2">
                {formData.cqs.map((cq) => (
                  <div
                    key={cq.cqKey}
                    className="relative overflow-hidden flex items-start gap-3 backdrop-blur-md border shadow-lg rounded-xl p-3 transition-all duration-300 border-slate-900/10 bg-slate-900/5 hover:bg-slate-900/10 hover:border-slate-900/20 hover:scale-[1.01]"
                  >
                    {/* Glass shine overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex-1 space-y-2">
                      <div className="font-medium text-sm text-slate-900">{cq.cqKey}</div>
                      <div className="text-sm text-slate-700 leading-relaxed">{cq.text}</div>
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
                      className="relative text-slate-400 hover:text-slate-600 hover:bg-slate-900/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New CQ */}
            <div className="bg-slate-900/5 backdrop-blur-md border border-slate-900/20 rounded-xl p-4 space-y-3 shadow-lg">
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
                    className="text-sm bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg"
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
                    <SelectTrigger className="text-sm bg-slate-900/5 backdrop-blur-md border-slate-900/20 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                      <SelectItem className="hover:bg-slate-900/10 cursor-pointer" value="REBUTS">REBUTS (conclusion)</SelectItem>
                      <SelectItem className="hover:bg-slate-900/10 cursor-pointer" value="UNDERCUTS">UNDERCUTS (inference)</SelectItem>
                      <SelectItem className="hover:bg-slate-900/10 cursor-pointer" value="UNDERMINES">UNDERMINES (premise)</SelectItem>
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
                  className="min-h-[60px] resize-y bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg"
                />
              </div>

              <div>
                <Label htmlFor="targetScope" className="text-xs  font-medium text-slate-700">
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
                  <SelectTrigger className="text-sm mb-6 bg-slate-900/5 backdrop-blur-md border-slate-900/20 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 rounded-xl shadow-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-slate-200">
                    <SelectItem className="hover:bg-slate-900/10 cursor-pointer" value="conclusion">Conclusion</SelectItem>
                    <SelectItem className="hover:bg-slate-900/10 cursor-pointer" value="inference">Inference</SelectItem>
                    <SelectItem className="hover:bg-slate-900/10 cursor-pointer" value="premise">Premise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <button
                type="button"
                onClick={handleAddCQ}
                
                className="flex items-center w-fit rounded-xl gap-1 px-3 gap-2 py-2 btnv2--ghost  tracking-wide
                 menuv2--lite bg-slate-900/5  border-slate-900/20 text-slate-900 transition-all"
              >
                <PlusCircle className="h-3.5 w-3.5   items-center flex" />
                <span className="flex items-center  text-sm flex-1">Add Critical Question</span>
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-400/15 to-red-400/15 backdrop-blur-md border border-rose-500/40 p-4 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent" />
              <div className="relative flex gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <p className="text-sm text-rose-900">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400/15 to-green-400/15 backdrop-blur-md border border-emerald-500/40 p-4 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-transparent" />
              <div className="relative flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-pulse" />
                <p className="text-sm text-emerald-900">Scheme saved successfully!</p>
              </div>
            </div>
          )}
        </div>
        </div>

        <DialogFooter className="border-t border-slate-900/10 pt-1 mt-2 gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="btnv2 text-sm bg-slate-900/5 backdrop-blur-md border-slate-900/20 text-slate-900 hover:bg-slate-900/10 hover:border-slate-900/30 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="relative btnv2 text-base overflow-hidden bg-gradient-to-r from-sky-700 to-sky-900 hover:from-cyan-600 hover:to-sky-800 text-white border-0 shadow-md shadow-cyan-400/30 hover:shadow-cyan-400/50 transition-all duration-300 group"
          >
            {/* Glass shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            <div className="relative flex items-center gap-2">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editScheme ? "Update Scheme" : "Create Scheme"}
                </>
              )}
            </div>
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
