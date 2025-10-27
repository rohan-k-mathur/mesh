// components/dialogue/WhyChallengeModal.tsx
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Lightbulb } from "lucide-react";

interface WhyChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (challengeText: string) => void | Promise<void>;
  targetText?: string;
}

const EXAMPLE_CHALLENGES = [
  "What evidence supports this claim?",
  "How do you know this is true?",
  "What's the reasoning behind this?",
  "Can you provide sources for this claim?",
  "What assumptions are you making here?",
];

/**
 * WhyChallengeModal - Modal for entering WHY challenge text
 * 
 * Replaces window.prompt() for generic WHY moves.
 * Opens when user asks WHY without a specific critical question.
 */
export function WhyChallengeModal({
  open,
  onOpenChange,
  onSubmit,
  targetText,
}: WhyChallengeModalProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    
    if (!trimmed) {
      setError("Please enter a challenge question");
      return;
    }

    if (trimmed.length < 5) {
      setError("Challenge must be at least 5 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmed);
      setText("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit challenge");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setText("");
    setError(null);
    onOpenChange(false);
  };

  const handleExampleClick = (example: string) => {
    setText(example);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-amber-600" />
            Ask WHY - Challenge This Point
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Ask a specific question about why this claim should be accepted. Your challenge will require the author to provide justification.
          </DialogDescription>
        </DialogHeader>

        {targetText && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-600 mb-1">Challenging:</div>
            <div className="text-sm text-slate-900 italic">"{targetText}"</div>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label htmlFor="challenge-text" className="text-sm font-medium text-slate-700 block mb-2">
              Your Challenge Question
            </label>
            <Textarea
              id="challenge-text"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              placeholder="What evidence supports this claim?"
              className="min-h-[100px] articlesearchfield text-sm resize-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="text-xs text-slate-500 mt-1">
              Press {typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter to submit
            </div>
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              {error}
            </div>
          )}

          {/* Example challenges */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-slate-700">Example Challenges:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_CHALLENGES.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(example)}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  type="button"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
            type="button"
          >
            {isSubmitting ? "Posting Challenge..." : "Post WHY Challenge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
