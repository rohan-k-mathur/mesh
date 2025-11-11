"use client";

import { useState, useEffect, useRef } from "react";
import { useDebounce } from "use-debounce";

interface PremiseScores {
  [premiseKey: string]: number;
}

interface ArgumentScore {
  overallScore: number;
  completenessScore: number;
  evidenceScore: number;
  coherenceScore: number;
  vulnerabilityScore: number;
  premiseScores: PremiseScores;
  missingElements: string[];
  suggestions: string[];
}

interface UseArgumentScoringResult {
  score: ArgumentScore | null;
  isScoring: boolean;
  error: string | null;
  refetch: () => void;
}

export function useArgumentScoring(
  schemeId: string,
  claimId: string,
  premises: Record<string, string>,
  debounceMs: number = 500
): UseArgumentScoringResult {
  const [score, setScore] = useState<ArgumentScore | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce premises to avoid scoring on every keystroke
  const [debouncedPremises] = useDebounce(premises, debounceMs);

  // Fetch score
  async function fetchScore(signal?: AbortSignal) {
    // Don't score if no scheme or claim
    if (!schemeId || !claimId) {
      setScore(null);
      return;
    }

    // Don't score if no premises filled
    const filledPremises = Object.values(debouncedPremises).filter(
      (p) => p && p.trim() !== ""
    );
    if (filledPremises.length === 0) {
      setScore(null);
      return;
    }

    setIsScoring(true);
    setError(null);

    try {
      const response = await fetch("/api/arguments/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId,
          claimId,
          premises: debouncedPremises,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to score argument");
      }

      const data = await response.json();
      setScore(data.score);
    } catch (err: any) {
      if (err.name === "AbortError") {
        // Request was cancelled, ignore
        return;
      }
      setError(err.message);
      setScore(null);
    } finally {
      setIsScoring(false);
    }
  }

  // Effect: Score when debounced premises change
  useEffect(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Fetch score
    fetchScore(controller.signal);

    // Cleanup
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemeId, claimId, debouncedPremises]);

  // Manual refetch
  function refetch() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchScore(controller.signal);
  }

  return {
    score,
    isScoring,
    error,
    refetch,
  };
}
