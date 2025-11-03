// components/thesis/ProngEditor.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { ClaimPicker } from "@/components/claims/ClaimPicker";
import { ArgumentPicker } from "./ArgumentPicker";
import { useAuth } from "@/lib/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type ProngRole = "SUPPORT" | "REBUT" | "PREEMPT";
type ArgumentRole = "PREMISE" | "INFERENCE" | "COUNTER_RESPONSE";

export function ProngEditor({
  thesisId,
  prongId,
  deliberationId,
  onClose,
}: {
  thesisId: string;
  prongId?: string;
  deliberationId: string;
  onClose: () => void;
}) {
  const isNew = !prongId;
  const { user } = useAuth();
  const authorId = user?.userId != null ? String(user.userId) : "";
  
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<ProngRole>("SUPPORT");
  const [mainClaimId, setMainClaimId] = useState<string | null>(null);
  const [introduction, setIntroduction] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [showClaimPicker, setShowClaimPicker] = useState(false);
  const [showArgumentPicker, setShowArgumentPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch existing prong if editing
  const { data: prongData } = useSWR(
    prongId ? `/api/thesis/${thesisId}/prongs/${prongId}` : null,
    fetcher
  );

  const prong = prongData?.prong;

  // Populate form when editing
  useEffect(() => {
    if (prong) {
      setTitle(prong.title ?? "");
      setRole(prong.role ?? "SUPPORT");
      setMainClaimId(prong.mainClaimId ?? null);
      setIntroduction(prong.introduction ?? "");
      setConclusion(prong.conclusion ?? "");
    }
  }, [prong]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error("Please enter a prong title");
      return;
    }

    if (!mainClaimId) {
      toast.error("Please select a main claim for this prong");
      return;
    }

    setSubmitting(true);

    try {
      const url = isNew 
        ? `/api/thesis/${thesisId}/prongs`
        : `/api/thesis/${thesisId}/prongs/${prongId}`;
      
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          role,
          mainClaimId,
          introduction: introduction || undefined,
          conclusion: conclusion || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to save prong");

      toast.success(isNew ? "Prong created" : "Prong updated");
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save prong");
    } finally {
      setSubmitting(false);
    }
  }, [isNew, thesisId, prongId, title, role, mainClaimId, introduction, conclusion, onClose]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this prong?")) return;

    try {
      const res = await fetch(`/api/thesis/${thesisId}/prongs/${prongId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete prong");

      toast.success("Prong deleted");
      onClose();
    } catch (err) {
      toast.error("Failed to delete prong");
    }
  }, [thesisId, prongId, onClose]);

  // Handle argument reordering with up/down
  const handleMoveArgument = useCallback(
    async (argumentId: string, direction: "up" | "down") => {
      if (!prong) return;

      const currentIndex = prong.arguments.findIndex((a: any) => a.argumentId === argumentId);
      if (currentIndex === -1) return;
      if (direction === "up" && currentIndex === 0) return;
      if (direction === "down" && currentIndex === prong.arguments.length - 1) return;

      const items = Array.from(prong.arguments);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      [items[currentIndex], items[targetIndex]] = [items[targetIndex], items[currentIndex]];

      const argumentIds = items.map((a: any) => a.argumentId);

      try {
        const res = await fetch(`/api/thesis/${thesisId}/prongs/${prongId}/arguments`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ argumentIds }),
        });

        if (!res.ok) throw new Error("Failed to reorder arguments");

        mutate(`/api/thesis/${thesisId}/prongs/${prongId}`);
        toast.success("Arguments reordered");
      } catch (err) {
        toast.error("Failed to reorder arguments");
      }
    },
    [thesisId, prongId, prong]
  );

  // Handle add argument
  const handleAddArgument = useCallback(
    async (argumentId: string, argRole: ArgumentRole) => {
      try {
        const res = await fetch(`/api/thesis/${thesisId}/prongs/${prongId}/arguments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ argumentId, role: argRole }),
        });

        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error ?? "Failed to add argument");

        mutate(`/api/thesis/${thesisId}/prongs/${prongId}`);
        toast.success("Argument added to prong");
        setShowArgumentPicker(false);
      } catch (err: any) {
        toast.error(err.message ?? "Failed to add argument");
      }
    },
    [thesisId, prongId]
  );

  // Handle remove argument
  const handleRemoveArgument = useCallback(
    async (argumentId: string) => {
      try {
        const res = await fetch(
          `/api/thesis/${thesisId}/prongs/${prongId}/arguments?argumentId=${argumentId}`,
          { method: "DELETE" }
        );

        if (!res.ok) throw new Error("Failed to remove argument");

        mutate(`/api/thesis/${thesisId}/prongs/${prongId}`);
        toast.success("Argument removed");
      } catch (err) {
        toast.error("Failed to remove argument");
      }
    },
    [thesisId, prongId]
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Add New Prong" : "Edit Prong"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="e.g., First Prong: Jurisdiction"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ProngRole)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="SUPPORT">Support (affirmative)</option>
              <option value="REBUT">Rebut (counter-argument)</option>
              <option value="PREEMPT">Preempt (address anticipated objection)</option>
            </select>
          </div>

          {/* Main Claim */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Main Claim</label>
            <button
              onClick={() => setShowClaimPicker(true)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-left hover:bg-slate-50 transition-colors"
            >
              {mainClaimId ? (prong?.mainClaim?.text ?? "Selected") : "Select a claim..."}
            </button>
          </div>

          {/* Introduction */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Introduction (Optional)
            </label>
            <textarea
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              rows={3}
              placeholder="Introductory context for this prong..."
            />
          </div>

          {/* Arguments (only show when editing existing prong) */}
          {!isNew && prong && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">Arguments</label>
                <button
                  onClick={() => setShowArgumentPicker(true)}
                  className="text-sm px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-colors"
                >
                  + Add Argument
                </button>
              </div>

              <div className="space-y-2 min-h-[100px] border-2 border-dashed border-slate-200 rounded-lg p-2">
                {prong.arguments?.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-8">
                    No arguments yet. Add arguments to build your reasoning chain.
                  </div>
                )}
                {prong.arguments?.map((arg: any, index: number) => (
                  <div
                    key={arg.id}
                    className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveArgument(arg.argument.id, "up")}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleMoveArgument(arg.argument.id, "down")}
                          disabled={index === prong.arguments.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                            {arg.role}
                          </span>
                        </div>
                        <div className="text-sm text-slate-700">{arg.argument.text}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveArgument(arg.argument.id)}
                        className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conclusion */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Conclusion (Optional)
            </label>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              rows={3}
              placeholder="Concluding remarks for this prong..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-sky-600 text-white rounded-lg font-medium hover:from-cyan-700 hover:to-sky-700 transition-all shadow-lg disabled:opacity-50"
            >
              {submitting ? "Saving..." : isNew ? "Create Prong" : "Update Prong"}
            </button>
            {!isNew && (
              <button
                onClick={handleDelete}
                className="px-6 py-3 border border-rose-300 text-rose-700 rounded-lg font-medium hover:bg-rose-50 transition-colors"
              >
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Claim Picker Modal */}
        <ClaimPicker
          deliberationId={deliberationId}
          open={showClaimPicker}
          onClose={() => setShowClaimPicker(false)}
          onPick={(claim) => {
            setMainClaimId(claim.id);
            setShowClaimPicker(false);
          }}
          allowCreate={true}
        />

        {/* Argument Picker Modal */}
        {showArgumentPicker && (
          <Dialog open onOpenChange={() => setShowArgumentPicker(false)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add Argument to Prong</DialogTitle>
              </DialogHeader>
              <ArgumentPicker
                deliberationId={deliberationId}
                onSelect={handleAddArgument}
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
