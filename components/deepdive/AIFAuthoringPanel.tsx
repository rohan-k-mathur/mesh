'use client';
import * as React from 'react';
import { SchemeComposer, type AttackContext } from '@/components/arguments/SchemeComposer';
import { ArgumentCardV2 } from '@/components/arguments/ArgumentCardV2';
import { SchemeComposerPicker } from '../SchemeComposerPicker';
import { getUserFromCookies } from '@/lib/server/getUser';

export function AIFAuthoringPanel({
  deliberationId,
  authorId: authorIdProp,
  conclusionClaim,
  premises,
  argument,
  attackContext, // ✅ NEW: optional attack scope
}: {
  deliberationId: string;
  authorId: string;
  conclusionClaim: { id: string; text?: string };
  premises?: Array<{ id:string; text:string }>;
  argument?: {
    id:string;
    conclusion:{id:string;text:string};
    premises:{id:string;text:string}[];
  } | null;
  attackContext?: AttackContext | null;
}) {
  const [user, setUser] = React.useState<{ userId?: string } | null>(null);
  const [pickConclusionOpen, setPickConclusionOpen] = React.useState(false);

  // selected conclusion (sync with prop)
  const [conclusion, setConclusion] = React.useState<{id:string; text?:string} | null>(
    conclusionClaim?.id ? conclusionClaim : null
  );
  React.useEffect(() => {
    if (conclusionClaim?.id) setConclusion(conclusionClaim);
  }, [conclusionClaim]);

  // newly created (local) argument, so we can show the AttackMenu on the saved card
  const [createdArg, setCreatedArg] = React.useState<{
    id: string;
    conclusion: { id: string; text: string };
    premises: { id: string; text: string }[];
  } | null>(null);

  // session
  React.useEffect(() => {
    getUserFromCookies().then((u) => {
      setUser(
        u ? { userId: u.userId != null ? String(u.userId) : undefined } : null
      );
    });
  }, []);

  const effectiveAuthorId = user?.userId || authorIdProp || 'current';
  const readyForCompose = Boolean(effectiveAuthorId && conclusion?.id);

  // Dynamic height: collapsed initially, expanded when picker is open or conclusion is selected
  const isExpanded = Boolean(pickConclusionOpen || conclusion?.id || argument || createdArg);
  const heightClass = isExpanded ? 'max-h-[550px] h-full overflow-y-auto' : 'h-fit ';

  function AttackScopeBar() {
    if (!attackContext) return null;
    const { mode, hint } = attackContext;
    const label =
      mode === 'REBUTS' ? 'Rebut conclusion' :
      mode === 'UNDERCUTS' ? 'Undercut inference' :
      mode === 'UNDERMINES' ? 'Undermine premise' : '';

    return (
      <div className="flex items-center justify-between border rounded-md p-3 bg-amber-50/60 border-amber-200 text-amber-900 text-sm">
        <div className="font-medium">Attack Scope: {label}</div>
        {hint && <div className="text-xs text-amber-800">{hint}</div>}
      </div>
    );
  }

  return (
    <div className={`flex flex-1 ${heightClass} bg-transparent backdrop-blur-md flex-col py-4 px-3 space-y-4 overflow-y-auto panel-edge rounded-xl transition-all duration-300`}>

      {/* Loading indicator for author */}
      {!user && !authorIdProp && (
        <div className="border rounded-md p-3 bg-amber-50 border-amber-200 text-amber-800 text-sm">
          Loading user session...
        </div>
      )}


      {/* Conclusion picker prompt */}
      {!conclusion?.id && (
        <div className="border rounded-md p-3 bg-slate-50/50 text-sm flex items-center justify-between">
          <div>Select a conclusion claim to start composing an argument.</div>
          <button
            className="btnv2  rounded-xl text-xs px-4 py-2 "
            onClick={() => setPickConclusionOpen(true)}
          >
            Choose conclusion
          </button>
        </div>
      )}

      {/* Composer (kept minimal; no AttackMenu here) */}
      {readyForCompose && conclusion?.id && (
        <SchemeComposer
          deliberationId={deliberationId}
          authorId={effectiveAuthorId}
          conclusionClaim={conclusion ?? {}}                 // allow empty at first
          onChangeConclusion={(c) => {
            if (c && c.id) setConclusion({ id: c.id, text: c.text });
          }}

          attackContext={attackContext ?? null}         // ✅ pass scope to auto‑attach CA after publish
          onCreated={(id) => {
            // notify graph listeners
            window.dispatchEvent(new CustomEvent('claims:changed', { detail: { deliberationId } }));
            window.dispatchEvent(new CustomEvent('debate:graph:refresh', { detail: { deliberationId } } as any));
          }}
          onCreatedDetail={(payload) => {
            setCreatedArg(payload);                     // ✅ render saved card (with AttackMenu) right here
          }}
        />
      )}

  
      {/* Conclusion picker modal */}
      <SchemeComposerPicker
        kind="claim"
        open={pickConclusionOpen}
        onClose={() => setPickConclusionOpen(false)}
        onPick={(it) => {
          setConclusion({ id: it.id, text: it.label });
          setPickConclusionOpen(false);
        }}
      />
    </div>
  );
}
