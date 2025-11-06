// app/deliberations/[id]/thesis/[thesisId]/view/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Download,
  Edit,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThesisExportModal } from "@/components/thesis/ThesisExportModal";
import { PropositionNodeView } from "@/components/thesis/PropositionNodeView";

interface ThesisData {
  id: string;
  title: string;
  slug: string;
  abstract?: string;
  content: any; // TipTap JSON
  status: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    name?: string;
    username?: string;
  };
}

export default function ThesisViewPage() {
  const params = useParams();
  const router = useRouter();
  const [thesis, setThesis] = useState<ThesisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const thesisId = params?.thesisId as string;
  const deliberationId = params?.id as string;

  useEffect(() => {
    if (!thesisId) return;
    
    async function fetchThesis() {
      try {
        const res = await fetch(`/api/thesis/${thesisId}`);
        if (!res.ok) throw new Error("Failed to fetch thesis");
        const data = await res.json();
        setThesis(data.thesis);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchThesis();
  }, [thesisId]);

  if (!params) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
          <p className="mt-4 text-sm text-slate-400 font-mono">
            Loading thesis...
          </p>
        </div>
      </div>
    );
  }

  if (error || !thesis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400 font-mono">
            {error || "Thesis not found"}
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(`/deliberation/${deliberationId}`)}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Deliberation
          </Button>
        </div>
      </div>
    );
  }

  const publishedDate = thesis.publishedAt
    ? new Date(thesis.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            className="flex px-5 py-1 rounded-full btnv2 items-center text-sm text-slate-600 hover:text-slate-900"
            onClick={() => router.push(`/deliberation/${deliberationId}`)}
          >
            <ArrowLeft className="mr-0 h-3.5 w-3.5" />
            Back
          </button>

          <div className="flex items-center gap-2">
            {thesis.status === "DRAFT" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(
                    `/deliberations/${deliberationId}/thesis/${thesisId}`
                  )
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Draft
              </Button>
            )}

            <button
              className="flex gap-2 items-center panelv2 text-sm rounded-lg px-3 py-2 bg-white/50"
              onClick={() => setShowExportModal(true)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-5">
        {/* Metadata */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <FileText className="h-4 w-4" />
            <span className="font-mono uppercase tracking-wide">Thesis</span>
            {thesis.status === "PUBLISHED" && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-600 font-medium">Published</span>
              </>
            )}
          </div>

          <h1 className="text-3xl font-semibold text-slate-900 mb-2">
            {thesis.title || "Untitled Thesis"}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            {thesis.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  {thesis.author.name || thesis.author.username || "Anonymous"}
                </span>
              </div>
            )}

            {publishedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{publishedDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Abstract */}
        {thesis.abstract && (
          <div className="mb-8 p-6 bg-slate-100 border border-slate-200 rounded-lg">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
              Abstract
            </h2>
            <p className="text-slate-700 leading-relaxed">{thesis.abstract}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md border border-slate-500 px-5 py-5">
          <ThesisContentRenderer content={thesis.content} />
        </div>
      </div>

      {/* Export Modal */}
      <ThesisExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        thesisId={thesisId}
        thesisTitle={thesis.title || "Untitled Thesis"}
      />
    </div>
  );
}

/**
 * Renders the TipTap JSON content with embedded deliberation objects
 */
function ThesisContentRenderer({ content }: { content: any }) {
  if (!content || !content.content) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>No content available</p>
      </div>
    );
  }

  return (
    <div className="prose prose-slate max-w-none">
      {content.content.map((node: any, index: number) => (
        <ContentNode key={index} node={node} />
      ))}
    </div>
  );
}

/**
 * Renders individual content nodes (paragraphs, headings, custom nodes, etc.)
 */
function ContentNode({ node }: { node: any }) {
  const { type, content, attrs, text } = node;

  // Text node
  if (type === "text") {
    return <span>{text}</span>;
  }

  // Paragraph
  if (type === "paragraph") {
    return (
      <p className="mb-4">
        {content?.map((child: any, i: number) => (
          <ContentNode key={i} node={child} />
        ))}
      </p>
    );
  }

  // Headings
  if (type === "heading") {
    const level = attrs?.level || 1;
    const children = content?.map((child: any, i: number) => (
      <ContentNode key={i} node={child} />
    ));

    if (level === 1)
      return <h1 className="text-3xl font-bold mb-3">{children}</h1>;
    if (level === 2)
      return <h2 className="text-2xl font-bold mb-3">{children}</h2>;
    if (level === 3)
      return <h3 className="text-xl font-bold mb-3">{children}</h3>;
    if (level === 4)
      return <h4 className="text-lg font-bold mb-3">{children}</h4>;
    return <h5 className="text-base font-bold mb-3">{children}</h5>;
  }

  // Lists
  if (type === "bulletList") {
    return (
      <ul className="list-disc pl-6 mb-4 space-y-1">
        {content?.map((child: any, i: number) => (
          <ContentNode key={i} node={child} />
        ))}
      </ul>
    );
  }

  if (type === "orderedList") {
    return (
      <ol className="list-decimal pl-6 mb-4 space-y-1">
        {content?.map((child: any, i: number) => (
          <ContentNode key={i} node={child} />
        ))}
      </ol>
    );
  }

  if (type === "listItem") {
    return (
      <li>
        {content?.map((child: any, i: number) => (
          <ContentNode key={i} node={child} />
        ))}
      </li>
    );
  }

  // Blockquote
  if (type === "blockquote") {
    return (
      <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4">
        {content?.map((child: any, i: number) => (
          <ContentNode key={i} node={child} />
        ))}
      </blockquote>
    );
  }

  // Code block
  if (type === "codeBlock") {
    const code = content?.map((child: any) => child.text).join("") || "";
    return (
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto my-4">
        <code>{code}</code>
      </pre>
    );
  }

  // Hard break
  if (type === "hardBreak") {
    return <br />;
  }

  // Horizontal rule
  if (type === "horizontalRule") {
    return <hr className="my-6 border-slate-300" />;
  }

  // Draft Proposition Node (should be published, but shown as warning if not)
  if (type === "draftProposition") {
    const { draftId, text: propText } = attrs || {};
    return (
      <div className="not-prose my-4 p-4 border-l-4 border-purple-400 bg-purple-50 rounded-r-lg">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
            Draft Proposition
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            Unpublished
          </span>
        </div>
        <p className="text-sm text-purple-900">{propText || "No content"}</p>
        {draftId && (
          <p className="text-xs text-purple-600 mt-2">Draft ID: {draftId}</p>
        )}
      </div>
    );
  }

  // Draft Claim Node (should be published, but shown as warning if not)
  if (type === "draftClaim") {
    const { draftId, text: claimText, position } = attrs || {};
    const positionColors = {
      IN: "border-emerald-400 bg-emerald-50 text-emerald-900",
      OUT: "border-rose-400 bg-rose-50 text-rose-900",
      UNDEC: "border-slate-400 bg-slate-50 text-slate-900",
    };
    const colorClass =
      positionColors[position as keyof typeof positionColors] ||
      positionColors.UNDEC;

    return (
      <div
        className={`not-prose my-4 p-4 border-l-4 rounded-r-lg ${colorClass}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wide">
            Draft Claim • {position || "UNDEC"}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
            Unpublished
          </span>
        </div>
        <p className="text-sm">{claimText || "No content"}</p>
        {draftId && (
          <p className="text-xs opacity-60 mt-2">Draft ID: {draftId}</p>
        )}
      </div>
    );
  }

  // Custom ClaimNode
  if (type === "claimNode") {
    const { claimId, claimText, position, authorName } = attrs || {};
    const colors = {
      IN: "border-emerald-300 bg-emerald-100 text-emerald-900",
      OUT: "border-rose-300 bg-rose-100 text-rose-900",
      UNDEC: "border-slate-300 bg-slate-100 text-slate-700",
    };
    const colorClass = colors[position as keyof typeof colors] || colors.UNDEC;

    return (
      <div
        className={`not-prose my-2 py-3 px-2 space-y-1  border-l-4 rounded-r-lg ${colorClass}`}
      >
        <div className="flex items-start justify-between  tracking-wide">
          <div className="text-sm font-semibold uppercase tracking-wide opacity-70">
            Claim {position && `• ${position}`}
          </div>
        </div>
        <p className="text-base leading-relaxed">{claimText}</p>
        {authorName && (
          <p className="mt-2 text-xs opacity-60">— {authorName}</p>
        )}
      </div>
    );
  }

  // Custom PropositionNode
  if (type === "propositionNode") {
    const { propositionId, propositionText, mediaUrl, authorName } =
      attrs || {};

    return (
      <PropositionNodeView
        propositionId={propositionId}
        propositionText={propositionText}
        mediaUrl={mediaUrl}
        authorName={authorName}
      />
    );
  }

  // Custom ArgumentNode
  if (type === "argumentNode") {
    const {
      argumentId,
      text,
      scheme,
      role,
      authorName,
      premises,
      implicitWarrant,
      cq,
      attacks,
      preferences,
    } = attrs || {};

    const colors = {
      PREMISE: {
        border: "border-sky-300",
        bg: "bg-sky-50",
        text: "text-sky-900",
        badge: "bg-sky-100 text-sky-700",
      },
      OBJECTION: {
        border: "border-rose-300",
        bg: "bg-rose-50",
        text: "text-rose-900",
        badge: "bg-rose-100 text-rose-700",
      },
      REBUTTAL: {
        border: "border-purple-300",
        bg: "bg-purple-50",
        text: "text-purple-900",
        badge: "bg-purple-100 text-purple-700",
      },
    };
    const roleColors = colors[role as keyof typeof colors] || colors.PREMISE;

    // Calculate CQ percentage
    const cqRequired = cq?.required ?? 0;
    const cqSatisfied = cq?.satisfied ?? 0;
    const cqPct = cqRequired
      ? Math.round((cqSatisfied / cqRequired) * 100)
      : 100;
    const cqColorClass =
      cqPct === 100
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : cqPct >= 50
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-rose-50 border-rose-200 text-rose-700";

    const hasDetails =
      (premises && premises.length > 0) ||
      implicitWarrant?.text ||
      (attacks &&
        (attacks.REBUTS > 0 ||
          attacks.UNDERCUTS > 0 ||
          attacks.UNDERMINES > 0)) ||
      (preferences &&
        (preferences.preferredBy > 0 || preferences.dispreferredBy > 0));

    return (
      <div
        className={`not-prose my-4 border-l-4 rounded-lg ${roleColors.border} ${roleColors.bg} shadow-sm`}
      >
        {/* Header: Conclusion + Metadata */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors.badge}`}
              >
                {role || "Supporting"}
              </span>
              {scheme && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-700 font-medium">
                  {scheme}
                </span>
              )}
            </div>

            {/* CQ Health Indicator */}
            {cqRequired > 0 && (
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${cqColorClass}`}
                title={`${cqSatisfied}/${cqRequired} Critical Questions satisfied`}
              >
                CQ {cqPct}%
              </div>
            )}
          </div>

          {/* Conclusion (Primary) */}
          <p className="text-base font-semibold ${roleColors.text} leading-relaxed">
            {text}
          </p>
        </div>

        {/* Details Section */}
        {hasDetails && (
          <div className="border-t border-slate-200 bg-white/50 p-4 space-y-3">
            {/* Premises */}
            {premises && premises.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                  Based on:
                </div>
                <ul className="space-y-1.5">
                  {premises.map((p: any, idx: number) => (
                    <li
                      key={p.id}
                      className={`text-sm text-slate-700 flex items-start gap-2 px-3 py-2 rounded-md ${
                        p.isImplicit
                          ? "bg-amber-50/50 border border-amber-200 italic"
                          : "bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <span className="text-slate-400 font-medium flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="flex-1">{p.text}</span>
                      {p.isImplicit && (
                        <span className="text-xs text-amber-600 flex-shrink-0">
                          implicit
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Implicit Warrant */}
            {implicitWarrant?.text && (
              <div className="px-3 py-2 rounded-md bg-orange-50/50 border border-orange-200">
                <div className="text-xs font-semibold text-orange-900 mb-1">
                  Warrant:
                </div>
                <div className="text-sm text-orange-800">
                  {implicitWarrant.text}
                </div>
              </div>
            )}

            {/* Attacks & Preferences */}
            {((attacks &&
              (attacks.REBUTS > 0 ||
                attacks.UNDERCUTS > 0 ||
                attacks.UNDERMINES > 0)) ||
              (preferences &&
                (preferences.preferredBy > 0 ||
                  preferences.dispreferredBy > 0))) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                {attacks && attacks.REBUTS > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {attacks.REBUTS} Rebut{attacks.REBUTS !== 1 ? "s" : ""}
                  </span>
                )}
                {attacks && attacks.UNDERCUTS > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                    {attacks.UNDERCUTS} Undercut
                    {attacks.UNDERCUTS !== 1 ? "s" : ""}
                  </span>
                )}
                {attacks && attacks.UNDERMINES > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                    {attacks.UNDERMINES} Undermine
                    {attacks.UNDERMINES !== 1 ? "s" : ""}
                  </span>
                )}

                {preferences && preferences.preferredBy > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                    ↑ {preferences.preferredBy}
                  </span>
                )}
                {preferences && preferences.dispreferredBy > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    ↓ {preferences.dispreferredBy}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Custom CitationNode
  if (type === "citationNode") {
    const { citationId, title, url, author, year } = attrs || {};
    return (
      <div className="not-prose my-4 p-4 border-l-4 border-amber-300 bg-amber-50 rounded-r">
        <div className="text-sm font-semibold uppercase tracking-wide text-amber-700 mb-2">
          Citation
        </div>
        <p className="text-base text-amber-900 font-medium">{title}</p>
        {(author || year) && (
          <p className="mt-1 text-sm text-amber-800">
            {author}
            {author && year && ", "}
            {year}
          </p>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-sm text-amber-600 hover:text-amber-700 underline inline-block"
          >
            View source →
          </a>
        )}
      </div>
    );
  }

  // Custom TheoryWorkNode
  if (type === "theoryWorkNode") {
    const { theoryWorkId, name, description, category } = attrs || {};
    return (
      <div className="not-prose my-4 p-4 border-l-4 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 rounded-r">
        <div className="text-sm font-semibold uppercase tracking-wide text-purple-700 mb-2">
          Theory Work {category && `• ${category}`}
        </div>
        <p className="text-base text-purple-900 font-medium">{name}</p>
        {description && (
          <p className="mt-2 text-sm text-purple-800">{description}</p>
        )}
      </div>
    );
  }

  // Fallback for unknown node types
  return null;
}
