// components/agora/CommunityDefenseMenu.tsx
"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Target, Shield } from "lucide-react";
import { NonCanonicalResponseForm } from "./NonCanonicalResponseForm";
import { CommunityResponsesTab } from "./CommunityResponsesTab";
import { CommunityResponseBadge } from "./CommunityResponseBadge";

type ClaimRef = { id: string; text: string };
type Prem = { id: string; text: string };

export function CommunityDefenseMenu({
  deliberationId,
  authorId,
  target,
  onDone,
}: {
  deliberationId: string;
  authorId: string;
  target: { id: string; conclusion: ClaimRef; premises: Prem[] };
  onDone?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [helpDefendOpen, setHelpDefendOpen] = React.useState(false);
  const titleRef = React.useRef<HTMLDivElement | null>(null);

  const handleOpenChange = React.useCallback((v: boolean) => {
    setOpen(v);
  }, []);

  const handleDone = React.useCallback(() => {
    setOpen(false);
    onDone?.();
  }, [onDone]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          className="
            inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
            bg-gradient-to-r from-emerald-500 to-teal-600
            hover:from-emerald-600 hover:to-teal-700
            text-white font-medium
            shadow-sm hover:shadow-md
            transition-all duration-200
            border border-emerald-400/20
          "
        >
          <Users className="w-3.5 h-3.5" />
          Community Defense
          <CommunityResponseBadge
            targetType="argument"
            targetId={target.id}
            className="ml-1"
          />
        </button>
      </DialogTrigger>

      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden
         bg-gradient-to-br from-slate-50 to-slate-100"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          titleRef.current?.focus();
        }}
      >
        <DialogHeader className="space-y-2 pb-4 border-b border-slate-200">
          <DialogTitle
            ref={titleRef as any}
            tabIndex={-1}
            className="outline-none text-2xl font-bold text-slate-900 flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-100">
              <Shield className="w-6 h-6 text-emerald-700" />
            </div>
            Community Defense
          </DialogTitle>
          <p className="text-sm text-slate-600 leading-relaxed">
            Help defend this argument by providing responses to challenges, or view community contributions.
          </p>
        </DialogHeader>

        {/* Target summary card */}
        <div className="p-4 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <Target className="w-5 h-5 text-indigo-700" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-sm font-semibold text-slate-700">Target Argument</div>
              <div className="text-sm text-slate-900 font-medium">
                {target.conclusion.text}
              </div>
              {target.premises?.length > 0 && (
                <div className="space-y-1 pl-3 border-l-2 border-slate-200">
                  {target.premises.map((p) => (
                    <div key={p.id} className="text-xs text-slate-600">
                      • {p.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Help Defend Button */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Shield className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Contribute a Defense
                </div>
                <div className="text-xs text-slate-600">
                  Help the author respond to challenges
                </div>
              </div>
            </div>
            <button
              onClick={() => setHelpDefendOpen(true)}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                bg-gradient-to-r from-emerald-500 to-teal-600
                hover:from-emerald-600 hover:to-teal-700
                text-white font-medium
                shadow-sm hover:shadow-md
                transition-all duration-200
              "
            >
              <Shield className="w-4 h-4" />
              Help Defend This Argument
            </button>
          </div>

          {/* Community Responses */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <CommunityResponsesTab
              targetType="argument"
              targetId={target.id}
              status="PENDING,APPROVED,EXECUTED"
            />
          </div>
        </div>

        {/* Help Defend Modal */}
        {helpDefendOpen && (
          <NonCanonicalResponseForm
            open={helpDefendOpen}
            onOpenChange={setHelpDefendOpen}
            deliberationId={deliberationId}
            targetType="argument"
            targetId={target.id}
            targetLabel={target.conclusion.text}
            onSuccess={() => {
              setHelpDefendOpen(false);
              // Trigger refresh of community responses
              window.dispatchEvent(
                new CustomEvent("non-canonical:refresh", {
                  detail: { targetType: "argument", targetId: target.id },
                })
              );
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
