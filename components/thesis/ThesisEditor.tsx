/* eslint-disable max-lines */
"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import useSWR, { mutate } from "swr";
import {
  FileText,
  Save,
  Eye,
  Settings,
  ChevronLeft,
  Sparkles,
  MessageSquare,
  Quote,
  Link as LinkIcon,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import { ClaimNode } from "@/lib/tiptap/extensions/claim-node";
import { ArgumentNode } from "@/lib/tiptap/extensions/argument-node";
import { CitationNode } from "@/lib/tiptap/extensions/citation-node";
import { TheoryWorkNode } from "@/lib/tiptap/extensions/theorywork-node";
import { ClaimPicker } from "@/components/claims/ClaimPicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ThesisEditorProps {
  thesisId: string;
  deliberationId: string;
}

type ThesisStatus = "DRAFT" | "SUBMITTED" | "PUBLISHED" | "ARCHIVED";
type ThesisTemplate = "LEGAL_DEFENSE" | "POLICY_CASE" | "ACADEMIC_THESIS" | "GENERAL";

type Thesis = {
  id: string;
  slug: string;
  title: string;
  abstract?: string;
  content?: JSONContent;
  status: ThesisStatus;
  template: ThesisTemplate;
  authorId: string;
  deliberationId?: string;
  createdAt: string;
  updatedAt: string;
};

export default function ThesisEditor({ thesisId, deliberationId }: ThesisEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [template, setTemplate] = useState<ThesisTemplate>("GENERAL");
  const [isSaving, setIsSaving] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const [authorId, setAuthorId] = useState<string>("");

  // Picker modals state
  const [showClaimPicker, setShowClaimPicker] = useState(false);
  const [showArgumentPicker, setShowArgumentPicker] = useState(false);

  // Fetch thesis data
  const { data, error: fetchError } = useSWR<{ ok: boolean; thesis: Thesis }>(
    `/api/thesis/${thesisId}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const thesis = data?.thesis;

  // Initialize form from fetched data
  useEffect(() => {
    if (thesis) {
      setTitle(thesis.title || "");
      setAbstract(thesis.abstract || "");
      setTemplate(thesis.template);
      // Set authorId from thesis data
      setAuthorId(thesis.authorId || "");
    }
  }, [thesis]);

  // TipTap editor setup
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-teal-600 underline hover:text-teal-700",
        },
      }),
      Placeholder.configure({
        placeholder: "Begin composing your thesis. Use the toolbar to insert claims, arguments, and other deliberation objects...",
      }),
      CharacterCount,
      ClaimNode,
      ArgumentNode,
      CitationNode,
      TheoryWorkNode,
    ],
    content: thesis?.content || { type: "doc", content: [{ type: "paragraph" }] },
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none focus:outline-none min-h-[500px] px-12 py-8",
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getJSON());
    },
  });

  // Update editor content when thesis loads
  useEffect(() => {
    if (editor && thesis?.content && !editor.isDestroyed) {
      editor.commands.setContent(thesis.content);
    }
  }, [editor, thesis?.content]);

  // Autosave function
  const saveThesis = useCallback(
    async (content: JSONContent) => {
      if (!thesisId) return;

      try {
        setIsSaving(true);
        const res = await fetch(`/api/thesis/${thesisId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || "Untitled Thesis",
            abstract,
            template,
            content,
          }),
        });

        if (!res.ok) throw new Error("Failed to save");

        setLastSaved(new Date());
        mutate(`/api/thesis/${thesisId}`);
      } catch (err: any) {
        console.error("Save error:", err);
        toast.error("Failed to save thesis");
      } finally {
        setIsSaving(false);
      }
    },
    [thesisId, title, abstract, template]
  );

  const debouncedSave = useDebouncedCallback((content: JSONContent) => {
    saveThesis(content);
  }, 2000);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (editor) {
      saveThesis(editor.getJSON());
    }
  }, [editor, saveThesis]);

  // Publish
  const handlePublish = useCallback(async () => {
    if (!thesisId || !title.trim()) {
      toast.error("Please add a title before publishing");
      return;
    }

    try {
      const res = await fetch(`/api/thesis/${thesisId}/publish`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to publish");

      toast.success("Thesis published!");
      mutate(`/api/thesis/${thesisId}`);
      router.push(`/deliberations/${deliberationId}/thesis/${thesisId}/view`);
    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error("Failed to publish thesis");
    }
  }, [thesisId, title, deliberationId, router]);

  // Auto-resize title textarea
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.style.height = "auto";
      titleInputRef.current.style.height = `${titleInputRef.current.scrollHeight}px`;
    }
  }, [title]);

  // Handlers for inserting nodes
  const handleInsertClaim = useCallback((claim: any) => {
    if (!editor) return;
    
    editor
      .chain()
      .focus()
      .insertContent({
        type: "claimNode",
        attrs: {
          claimId: claim.id,
          claimText: claim.text,
          position: claim.position || "UNDEC",
          authorName: claim.author?.username || claim.author?.name,
        },
      })
      .run();
    
    setShowClaimPicker(false);
    toast.success("Claim inserted");
  }, [editor]);

  const handleInsertArgument = useCallback((argument: any) => {
    if (!editor) return;
    
    editor
      .chain()
      .focus()
      .insertContent({
        type: "argumentNode",
        attrs: {
          argumentId: argument.id,
          text: argument.text,
          scheme: argument.scheme?.name,
          role: argument.role || "PREMISE",
          authorName: argument.author?.username || argument.author?.name,
        },
      })
      .run();
    
    setShowArgumentPicker(false);
    toast.success("Argument inserted");
  }, [editor]);

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-600 mb-4">Failed to load thesis</p>
          <button
            onClick={() => router.push(`/deliberations/${deliberationId}`)}
            className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
          >
            Back to Deliberation
          </button>
        </div>
      </div>
    );
  }

  if (!thesis || !editor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  const wordCount = editor.storage.characterCount?.words() || 0;
  const charCount = editor.storage.characterCount?.characters() || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/deliberations/${deliberationId}`)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Back to deliberation"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <FileText className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-medium text-slate-700">Thesis Editor</span>
            {isSaving && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <div className="animate-spin h-3 w-3 border-2 border-teal-600 border-t-transparent rounded-full" />
                Saving...
              </span>
            )}
            {!isSaving && lastSaved && (
              <span className="text-xs text-slate-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Metadata
            </button>
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handlePublish}
              className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Publish
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                thesis.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-800" :
                thesis.status === "DRAFT" ? "bg-slate-100 text-slate-700" :
                "bg-amber-100 text-amber-800"
              }`}>
                {thesis.status}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Template: {template.replace(/_/g, " ")}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Panel (collapsible) */}
      {showMetadata && (
        <div className="max-w-4xl mx-auto mt-6 px-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Document Metadata</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Template
                </label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as ThesisTemplate)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="GENERAL">General</option>
                  <option value="LEGAL_DEFENSE">Legal Defense</option>
                  <option value="POLICY_CASE">Policy Case</option>
                  <option value="ACADEMIC_THESIS">Academic Thesis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Abstract / Summary
                </label>
                <textarea
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Brief summary of your thesis (optional)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Editor */}
      <div className="max-w-4xl mx-auto mt-6 px-4 pb-24">
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Title */}
          <div className="border-b border-slate-200 px-12 pt-12 pb-6">
            <textarea
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thesis Title"
              className="w-full text-4xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none resize-none overflow-hidden"
              rows={1}
            />
          </div>

          {/* Toolbar for inserting objects */}
          <div className="border-b border-slate-200 bg-slate-50/50 px-4 py-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowClaimPicker(true)}
                className="px-3 py-1.5 text-sm text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all flex items-center gap-2"
                title="Insert claim"
              >
                <MessageSquare className="w-4 h-4" />
                Claim
              </button>
              <button
                onClick={() => setShowArgumentPicker(true)}
                className="px-3 py-1.5 text-sm text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all flex items-center gap-2"
                title="Insert argument"
              >
                <Quote className="w-4 h-4" />
                Argument
              </button>
              <button
                className="px-3 py-1.5 text-sm text-slate-400 cursor-not-allowed rounded-lg flex items-center gap-2"
                title="Insert citation (coming soon)"
                disabled
              >
                <LinkIcon className="w-4 h-4" />
                Citation
              </button>
              <button
                className="px-3 py-1.5 text-sm text-slate-400 cursor-not-allowed rounded-lg flex items-center gap-2"
                title="Insert theorywork (coming soon)"
                disabled
              >
                <BookOpen className="w-4 h-4" />
                TheoryWork
              </button>
            </div>
          </div>

          {/* Editor Content */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Claim Picker Modal */}
      {authorId && (
        <ClaimPicker
          deliberationId={deliberationId}
          authorId={authorId}
          open={showClaimPicker}
          onClose={() => setShowClaimPicker(false)}
          onPick={handleInsertClaim}
          allowCreate={true}
        />
      )}

      {/* Argument Picker Modal - TODO: Create ArgumentPicker component */}
      {showArgumentPicker && (
        <Dialog open onOpenChange={() => setShowArgumentPicker(false)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Argument to Insert</DialogTitle>
            </DialogHeader>
            <div className="p-8 text-center text-slate-600">
              <Quote className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p>Argument picker coming soon...</p>
              <button
                onClick={() => setShowArgumentPicker(false)}
                className="mt-4 px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
