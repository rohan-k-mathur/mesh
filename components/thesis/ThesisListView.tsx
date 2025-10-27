"use client";
import React from "react";
import useSWR from "swr";
import { FileText, Eye, Edit2, Calendar, User } from "lucide-react";

interface Thesis {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "SUBMITTED" | "PUBLISHED" | "ARCHIVED";
  template: string;
  abstract: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
  };
  _count: {
    prongs: number;
    sections: number;
  };
}

interface ThesisListViewProps {
  deliberationId: string;
  onEdit: (thesisId: string) => void;
  onView: (thesisId: string) => void;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ThesisListView({ deliberationId, onEdit, onView }: ThesisListViewProps) {
  const { data, error, isLoading } = useSWR<{ ok: boolean; theses: Thesis[] }>(
    `/api/thesis?deliberationId=${deliberationId}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const theses = data?.theses ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-neutral-500">Loading theses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">Failed to load theses</p>
      </div>
    );
  }

  if (theses.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <p className="text-sm text-slate-600 mb-2">No theses yet</p>
        <p className="text-xs text-slate-500">
          Create your first thesis to build a structured argument from claims and evidence
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {theses.map((thesis) => (
        <ThesisCard
          key={thesis.id}
          thesis={thesis}
          onEdit={onEdit}
          onView={onView}
        />
      ))}
    </div>
  );
}

function ThesisCard({
  thesis,
  onEdit,
  onView,
}: {
  thesis: Thesis;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
}) {
  const statusColors = {
    DRAFT: "bg-slate-100 text-slate-700",
    SUBMITTED: "bg-blue-100 text-blue-700",
    PUBLISHED: "bg-green-100 text-green-700",
    ARCHIVED: "bg-neutral-100 text-neutral-700",
  };

  const templateLabels: Record<string, string> = {
    LEGAL_DEFENSE: "Legal Defense",
    POLICY_CASE: "Policy Case",
    ACADEMIC_THESIS: "Academic Thesis",
    GENERAL: "General",
  };

  return (
    <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 truncate">{thesis.title}</h3>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${
                statusColors[thesis.status]
              }`}
            >
              {thesis.status}
            </span>
            <span className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded">
              {templateLabels[thesis.template] || thesis.template}
            </span>
          </div>

          {thesis.abstract && (
            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{thesis.abstract}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{thesis.author.name || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>
                {thesis._count.prongs} prong{thesis._count.prongs !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(thesis.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          {thesis.status === "PUBLISHED" && (
            <button
              onClick={() => onView(thesis.id)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="View thesis"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(thesis.id)}
            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            title="Edit thesis"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
