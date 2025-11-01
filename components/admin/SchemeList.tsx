//components/admin/SchemeList.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Loader2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SchemeCreator from "./SchemeCreator";

type ArgumentScheme = {
  id: string;
  key: string;
  name: string;
  summary: string;
  purpose?: string;
  source?: string;
  materialRelation?: string;
  reasoningType?: string;
  cqs?: Array<{
    cqKey: string;
    text: string;
    attackType: string;
    targetScope: string;
  }>;
};

export default function SchemeList() {
  const [schemes, setSchemes] = useState<ArgumentScheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<ArgumentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showCreator, setShowCreator] = useState(false);
  const [editingScheme, setEditingScheme] = useState<ArgumentScheme | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMaterial, setFilterMaterial] = useState<string>("");

  useEffect(() => {
    loadSchemes();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = schemes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.key.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query) ||
          s.summary.toLowerCase().includes(query)
      );
    }

    if (filterMaterial) {
      filtered = filtered.filter((s) => s.materialRelation === filterMaterial);
    }

    setFilteredSchemes(filtered);
  }, [schemes, searchQuery, filterMaterial]);

  const loadSchemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/schemes");
      if (!response.ok) throw new Error("Failed to load schemes");
      const data = await response.json();
      setSchemes(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (schemeId: string) => {
    if (!confirm("Are you sure you want to delete this scheme?")) return;

    try {
      const response = await fetch(`/api/schemes/${schemeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete scheme");
      }

      await loadSchemes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete scheme");
    }
  };

  const handleEdit = (scheme: ArgumentScheme) => {
    setEditingScheme(scheme);
    setShowCreator(true);
  };

  const handleCreatorClose = () => {
    setShowCreator(false);
    setEditingScheme(null);
  };

  const handleCreatorSuccess = () => {
    loadSchemes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-700">
        Error loading schemes: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Argumentation Schemes</h2>
          <p className="text-sm text-slate-600 mt-1">
            Manage custom schemes with Macagno taxonomy and critical questions
          </p>
        </div>
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Scheme
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search schemes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-64">
          <Select value={filterMaterial || "all"} onValueChange={(value) => setFilterMaterial(value === "all" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by material relation..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Relations</SelectItem>
              <SelectItem value="cause">Cause & Effect</SelectItem>
              <SelectItem value="definition">Definition/Classification</SelectItem>
              <SelectItem value="analogy">Analogy/Similarity</SelectItem>
              <SelectItem value="authority">Authority/Expertise</SelectItem>
              <SelectItem value="practical">Practical/Means-End</SelectItem>
              <SelectItem value="correlation">Correlation/Sign</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Schemes List */}
      {filteredSchemes.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {searchQuery || filterMaterial
            ? "No schemes match your filters"
            : "No schemes yet. Create your first one!"}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{scheme.name}</h3>
                    <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {scheme.key}
                    </code>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{scheme.summary}</p>

                  {/* Taxonomy Badges */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {scheme.materialRelation && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {scheme.materialRelation}
                      </span>
                    )}
                    {scheme.reasoningType && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {scheme.reasoningType}
                      </span>
                    )}
                    {scheme.source && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        source: {scheme.source}
                      </span>
                    )}
                    {scheme.purpose && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                        {scheme.purpose}
                      </span>
                    )}
                  </div>

                  {/* CQ Count */}
                  {scheme.cqs && scheme.cqs.length > 0 && (
                    <div className="text-xs text-slate-500 mt-2">
                      {scheme.cqs.length} critical question{scheme.cqs.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(scheme)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(scheme.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creator Dialog */}
      <SchemeCreator
        open={showCreator}
        onOpenChange={handleCreatorClose}
        onSuccess={handleCreatorSuccess}
        editScheme={
          editingScheme
            ? {
                id: editingScheme.id,
                key: editingScheme.key,
                name: editingScheme.name,
                description: "",
                summary: editingScheme.summary,
                purpose: editingScheme.purpose || "",
                source: editingScheme.source || "",
                materialRelation: editingScheme.materialRelation || "",
                reasoningType: editingScheme.reasoningType || "",
                ruleForm: "",
                conclusionType: "",
                premises: (editingScheme.premises || []) as any,
                conclusion: editingScheme.conclusion as any,
                cqs: (editingScheme.cqs || []).map((cq) => ({
                  cqKey: cq.cqKey,
                  text: cq.text,
                  attackType: cq.attackType as "REBUTS" | "UNDERCUTS" | "UNDERMINES",
                  targetScope: cq.targetScope as "conclusion" | "inference" | "premise",
                })),
              }
            : undefined
        }
      />
    </div>
  );
}
