// components/thesis/ThesisRenderer.tsx
"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { GlossaryText } from "@/components/glossary/GlossaryText";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Thesis = {
  id: string;
  slug: string;
  title: string;
  status: string;
  template: string;
  abstract?: string;
  publishedAt?: string;
  thesisClaim?: {
    id: string;
    text: string;
    ClaimLabel?: {
      label: "IN" | "OUT" | "UNDEC";
    };
  };
  prongs: Array<{
    id: string;
    order: number;
    title: string;
    role: string;
    introduction?: string;
    conclusion?: string;
    mainClaim: {
      id: string;
      text: string;
      ClaimLabel?: {
        label: "IN" | "OUT" | "UNDEC";
      };
    };
    arguments: Array<{
      id: string;
      order: number;
      role: string;
      argument: {
        id: string;
        text: string;
        conclusion?: {
          id: string;
          text: string;
        };
        premises?: Array<{
          claim: {
            id: string;
            text: string;
          };
        }>;
        scheme?: {
          id: string;
          key: string;
          name: string;
        };
      };
    }>;
  }>;
  sections: Array<{
    id: string;
    order: number;
    sectionType: string;
    title: string;
    content: string;
  }>;
};

const SemanticDot = ({ label }: { label: "IN" | "OUT" | "UNDEC" }) => {
  const cls =
    label === "IN"
      ? "bg-emerald-500"
      : label === "OUT"
      ? "bg-rose-500"
      : "bg-zinc-600";
  const title =
    label === "IN"
      ? "Warranted (grounded semantics)"
      : label === "OUT"
      ? "Defeated by an IN attacker"
      : "Undecided";
  return (
    <span
      title={title}
      className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`}
    />
  );
};

export function ThesisRenderer({ thesisId }: { thesisId: string }) {
  const [expandedProngs, setExpandedProngs] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useSWR<{ ok: boolean; thesis: Thesis }>(
    `/api/thesis/${thesisId}`,
    fetcher
  );

  const thesis = data?.thesis;

  const toggleProng = (prongId: string) => {
    setExpandedProngs((prev) => {
      const next = new Set(prev);
      if (next.has(prongId)) {
        next.delete(prongId);
      } else {
        next.add(prongId);
      }
      return next;
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !thesis) {
    return (
      <div className="rounded-xl bg-rose-50 border border-rose-200 p-6 text-rose-800">
        Failed to load thesis
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-white/95 backdrop-blur-xl shadow-2xl p-8 max-w-5xl mx-auto">
      {/* Decorative elements */}
      <div className="absolute top-10 right-20 w-32 h-32 bg-sky-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-cyan-400/8 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <h1 className="text-4xl font-bold text-sky-900 mb-4 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-600" />
            {thesis.title}
          </h1>

          <div className="flex items-center gap-3 mb-4">
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                thesis.status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {thesis.status}
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-sky-100 text-sky-800 font-medium">
              {thesis.template}
            </span>
            {thesis.publishedAt && (
              <span className="text-sm text-slate-600">
                Published {new Date(thesis.publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {thesis.abstract && (
            <div className="text-slate-700 italic">{thesis.abstract}</div>
          )}
        </div>

        {/* Main Thesis Claim */}
        {thesis.thesisClaim && (
          <div className="mb-8 p-6 bg-gradient-to-br from-cyan-50 to-sky-50 border-l-4 border-cyan-600 rounded-r-xl shadow-sm">
            <div className="text-sm font-semibold text-cyan-900 mb-3 flex items-center gap-2">
              {thesis.thesisClaim.ClaimLabel && (
                <SemanticDot label={thesis.thesisClaim.ClaimLabel.label} />
              )}
              Main Thesis Claim
            </div>
            <div className="text-lg text-slate-800">
              <GlossaryText text={thesis.thesisClaim.text} />
            </div>
          </div>
        )}

        {/* Prongs */}
        {thesis.prongs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              Arguments ({thesis.prongs.length} Prongs)
            </h2>

            <div className="space-y-4">
              {thesis.prongs.map((prong, index) => (
                <div
                  key={prong.id}
                  className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleProng(prong.id)}
                    className="w-full text-left p-6 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-slate-500">
                            {index + 1}.
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              prong.role === "SUPPORT"
                                ? "bg-emerald-100 text-emerald-800"
                                : prong.role === "REBUT"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {prong.role}
                          </span>
                          <h3 className="text-xl font-semibold text-slate-900">
                            {prong.title}
                          </h3>
                        </div>
                        <div className="flex items-start gap-2 ml-8 text-slate-700">
                          {prong.mainClaim.ClaimLabel && (
                            <SemanticDot label={prong.mainClaim.ClaimLabel.label} />
                          )}
                          <GlossaryText text={prong.mainClaim.text} />
                        </div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${
                          expandedProngs.has(prong.id) ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {expandedProngs.has(prong.id) && (
                    <div className="px-6 pb-6 bg-slate-50/50">
                      {prong.introduction && (
                        <div className="mb-4 p-4 bg-white rounded-lg border border-slate-200">
                          <div className="text-sm font-medium text-slate-700 mb-2">
                            Introduction
                          </div>
                          <div className="text-slate-600">{prong.introduction}</div>
                        </div>
                      )}

                      {prong.arguments.length > 0 && (
                        <div className="space-y-3 mb-4">
                          <div className="text-sm font-medium text-slate-700">
                            Supporting Arguments ({prong.arguments.length})
                          </div>
                          {prong.arguments.map((arg, argIndex) => (
                            <div
                              key={arg.id}
                              className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm"
                            >
                              <div className="flex items-start gap-3 mb-2">
                                <span className="text-slate-500 font-mono text-sm">
                                  {index + 1}.{argIndex + 1}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                                  {arg.role}
                                </span>
                              </div>
                              <div className="text-slate-700 ml-8">
                                <GlossaryText text={arg.argument.text} />
                              </div>
                              {arg.argument.scheme && (
                                <div className="mt-2 ml-8 text-xs text-slate-500">
                                  Scheme: {arg.argument.scheme.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {prong.conclusion && (
                        <div className="p-4 bg-white rounded-lg border border-slate-200">
                          <div className="text-sm font-medium text-slate-700 mb-2">
                            Conclusion
                          </div>
                          <div className="text-slate-600">{prong.conclusion}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sections */}
        {thesis.sections.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              Additional Sections
            </h2>

            <div className="space-y-3">
              {thesis.sections.map((section) => (
                <div
                  key={section.id}
                  className="border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium">
                          {section.sectionType}
                        </span>
                        <h3 className="font-semibold text-slate-900">{section.title}</h3>
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${
                          expandedSections.has(section.id) ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {expandedSections.has(section.id) && (
                    <div className="px-4 pb-4 bg-slate-50/50">
                      <div className="p-4 bg-white rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap">
                        {section.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer legend */}
        <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-600 flex items-center gap-4 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> IN (Warranted)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> OUT (Defeated)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" /> UNDEC (Undecided)
          </span>
        </div>
      </div>
    </div>
  );
}
