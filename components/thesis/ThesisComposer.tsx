// components/thesis/ThesisComposer.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { ProngEditor } from "./ProngEditor";
import { ThesisSectionEditor } from "./ThesisSectionEditor";
import { ClaimPicker } from "@/components/claims/ClaimPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ThesisStatus = "DRAFT" | "SUBMITTED" | "PUBLISHED" | "ARCHIVED";
type ThesisTemplate = "LEGAL_DEFENSE" | "POLICY_CASE" | "ACADEMIC_THESIS" | "GENERAL";
type ProngRole = "SUPPORT" | "REBUT" | "PREEMPT";
type ThesisSectionType = "INTRODUCTION" | "BACKGROUND" | "LEGAL_STANDARD" | "CONCLUSION" | "APPENDIX";

type Thesis = {
  id: string;
  slug: string;
  title: string;
  status: ThesisStatus;
  template: ThesisTemplate;
  abstract?: string;
  thesisClaim?: {
    id: string;
    text: string;
  };
  prongs: Prong[];
  sections: ThesisSection[];
};

type Prong = {
  id: string;
  order: number;
  title: string;
  role: ProngRole;
  mainClaim: {
    id: string;
    text: string;
  };
  introduction?: string;
  conclusion?: string;
  arguments: {
    id: string;
    order: number;
    role: string;
    argument: {
      id: string;
      text: string;
    };
  }[];
};

type ThesisSection = {
  id: string;
  order: number;
  sectionType: ThesisSectionType;
  title: string;
  content: string;
};

export function ThesisComposer({
  thesisId,
  deliberationId,
  authorId,
  onClose,
}: {
  thesisId?: string;
  deliberationId: string;
  authorId: string;
  onClose?: () => void;
}) {
  const [isCreating, setIsCreating] = useState(!thesisId);
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<ThesisTemplate>("GENERAL");
  const [selectedThesisClaimId, setSelectedThesisClaimId] = useState<string | null>(null);
  const [showClaimPicker, setShowClaimPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"prongs" | "sections">("prongs");
  const [editingProngId, setEditingProngId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  // Fetch thesis data if editing
  const { data: thesisData, mutate: mutateThesis } = useSWR<{ ok: boolean; thesis: Thesis }>(
    thesisId ? `/api/thesis/${thesisId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const thesis = thesisData?.thesis;

  // Handle thesis creation
  const handleCreateThesis = useCallback(async () => {
    if (!title.trim()) {
      toast.error("Please enter a thesis title");
      return;
    }

    try {
      const res = await fetch("/api/thesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliberationId,
          title,
          template,
          thesisClaimId: selectedThesisClaimId,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to create thesis");

      toast.success("Thesis created successfully");
      setIsCreating(false);
      
      // Redirect to edit mode
      window.location.href = `/deliberations/${deliberationId}/thesis/${json.thesis.id}`;
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create thesis");
    }
  }, [title, template, selectedThesisClaimId, deliberationId]);

  // Handle prong reordering
  const handleMoveProng = useCallback(
    async (prongId: string, direction: "up" | "down") => {
      if (!thesis) return;

      const currentIndex = thesis.prongs.findIndex((p) => p.id === prongId);
      if (currentIndex === -1) return;
      if (direction === "up" && currentIndex === 0) return;
      if (direction === "down" && currentIndex === thesis.prongs.length - 1) return;

      const items = Array.from(thesis.prongs);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      [items[currentIndex], items[targetIndex]] = [items[targetIndex], items[currentIndex]];

      const prongIds = items.map((p) => p.id);

      try {
        const res = await fetch(`/api/thesis/${thesis.id}/prongs`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prongIds }),
        });

        if (!res.ok) throw new Error("Failed to reorder prongs");

        mutateThesis();
        toast.success("Prongs reordered");
      } catch (err) {
        toast.error("Failed to reorder prongs");
      }
    },
    [thesis, mutateThesis]
  );

  // Handle section reordering
  const handleMoveSection = useCallback(
    async (sectionId: string, direction: "up" | "down") => {
      if (!thesis) return;

      const currentIndex = thesis.sections.findIndex((s) => s.id === sectionId);
      if (currentIndex === -1) return;
      if (direction === "up" && currentIndex === 0) return;
      if (direction === "down" && currentIndex === thesis.sections.length - 1) return;

      const items = Array.from(thesis.sections);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      [items[currentIndex], items[targetIndex]] = [items[targetIndex], items[currentIndex]];

      const sectionIds = items.map((s) => s.id);

      try {
        const res = await fetch(`/api/thesis/${thesis.id}/sections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionIds }),
        });

        if (!res.ok) throw new Error("Failed to reorder sections");

        mutateThesis();
        toast.success("Sections reordered");
      } catch (err) {
        toast.error("Failed to reorder sections");
      }
    },
    [thesis, mutateThesis]
  );

  // Handle publish
  const handlePublish = useCallback(async () => {
    if (!thesis) return;

    if (!thesis.thesisClaim) {
      toast.error("Please set a main thesis claim before publishing");
      return;
    }

    if (thesis.prongs.length === 0) {
      toast.error("Please add at least one prong before publishing");
      return;
    }

    try {
      const res = await fetch(`/api/thesis/${thesis.id}/publish`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to publish");

      mutateThesis();
      toast.success("Thesis published successfully!");
    } catch (err) {
      toast.error("Failed to publish thesis");
    }
  }, [thesis, mutateThesis]);

  if (isCreating) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-white/95 backdrop-blur-xl shadow-2xl p-6 max-w-2xl mx-auto">
        <div className="absolute top-10 right-20 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-cyan-400/8 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-sky-900 mb-6 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-600" />
            Create New Thesis
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Enter thesis title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as ThesisTemplate)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="GENERAL">General</option>
                <option value="LEGAL_DEFENSE">Legal Defense</option>
                <option value="POLICY_CASE">Policy Case</option>
                <option value="ACADEMIC_THESIS">Academic Thesis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Main Thesis Claim (Optional)
              </label>
              <button
                onClick={() => setShowClaimPicker(true)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                {selectedThesisClaimId ? "Change claim..." : "Select a claim..."}
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreateThesis}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-lg font-medium hover:from-cyan-700 hover:to-sky-700 transition-all shadow-lg"
              >
                Create Thesis
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {showClaimPicker && (
          <Dialog open onOpenChange={() => setShowClaimPicker(false)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Select Thesis Claim</DialogTitle>
              </DialogHeader>
              <ClaimPicker
                deliberationId={deliberationId}
                authorId={authorId}
                onPick={(claim) => {
                  setSelectedThesisClaimId(claim.id);
                  setShowClaimPicker(false);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  if (!thesis) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-white/95 backdrop-blur-xl shadow-2xl p-6">
      <div className="absolute top-10 right-20 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-cyan-400/8 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-sky-900 mb-2 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan-600" />
              {thesis.title}
            </h2>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                thesis.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" :
                thesis.status === "DRAFT" ? "bg-amber-100 text-amber-800" :
                "bg-slate-100 text-slate-800"
              }`}>
                {thesis.status}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-sky-100 text-sky-800 font-medium">
                {thesis.template}
              </span>
            </div>
          </div>

          {thesis.status === "DRAFT" && (
            <button
              onClick={handlePublish}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg"
            >
              Publish Thesis
            </button>
          )}
        </div>

        {/* Main Thesis Claim */}
        {thesis.thesisClaim && (
          <div className="mb-6 p-4 bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-200 rounded-xl">
            <div className="text-sm font-medium text-cyan-900 mb-2">Main Thesis Claim</div>
            <div className="text-slate-700">{thesis.thesisClaim.text}</div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("prongs")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "prongs"
                ? "text-cyan-600 border-b-2 border-cyan-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Prongs ({thesis.prongs.length})
          </button>
          <button
            onClick={() => setActiveTab("sections")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "sections"
                ? "text-cyan-600 border-b-2 border-cyan-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sections ({thesis.sections.length})
          </button>
        </div>

        {/* Prongs Tab */}
        {activeTab === "prongs" && (
          <div className="space-y-4">
            <DragDropContext onDragEnd={handleProngDragEnd}>
              <Droppable droppableId="prongs">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {thesis.prongs.map((prong, index) => (
                      <Draggable key={prong.id} draggableId={prong.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border border-slate-200 rounded-lg p-4 bg-white ${
                              snapshot.isDragging ? "shadow-2xl" : "shadow-sm"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div {...provided.dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing">
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                                    prong.role === "SUPPORT" ? "bg-emerald-100 text-emerald-800" :
                                    prong.role === "REBUT" ? "bg-rose-100 text-rose-800" :
                                    "bg-amber-100 text-amber-800"
                                  }`}>
                                    {prong.role}
                                  </span>
                                  <h4 className="font-semibold text-slate-900">{prong.title}</h4>
                                </div>
                                <div className="text-sm text-slate-600 mb-2">{prong.mainClaim.text}</div>
                                <div className="text-xs text-slate-500">
                                  {prong.arguments.length} argument{prong.arguments.length !== 1 ? "s" : ""}
                                </div>
                              </div>
                              <button
                                onClick={() => setEditingProngId(prong.id)}
                                className="px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <button
              onClick={() => setEditingProngId("new")}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors font-medium"
            >
              + Add Prong
            </button>
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === "sections" && (
          <div className="space-y-4">
            <DragDropContext onDragEnd={handleSectionDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {thesis.sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border border-slate-200 rounded-lg p-4 bg-white ${
                              snapshot.isDragging ? "shadow-2xl" : "shadow-sm"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div {...provided.dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing">
                                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                                    {section.sectionType}
                                  </span>
                                  <h4 className="font-semibold text-slate-900">{section.title}</h4>
                                </div>
                                <div className="text-sm text-slate-600 line-clamp-2">{section.content}</div>
                              </div>
                              <button
                                onClick={() => setEditingSectionId(section.id)}
                                className="px-3 py-1 text-sm text-cyan-600 hover:bg-cyan-50 rounded transition-colors"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <button
              onClick={() => setEditingSectionId("new")}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors font-medium"
            >
              + Add Section
            </button>
          </div>
        )}
      </div>

      {/* Prong Editor Modal */}
      {editingProngId && (
        <ProngEditor
          thesisId={thesis.id}
          prongId={editingProngId === "new" ? undefined : editingProngId}
          deliberationId={deliberationId}
          onClose={() => {
            setEditingProngId(null);
            mutateThesis();
          }}
        />
      )}

      {/* Section Editor Modal */}
      {editingSectionId && (
        <ThesisSectionEditor
          thesisId={thesis.id}
          sectionId={editingSectionId === "new" ? undefined : editingSectionId}
          onClose={() => {
            setEditingSectionId(null);
            mutateThesis();
          }}
        />
      )}
    </div>
  );
}
