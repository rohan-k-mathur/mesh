'use client';
import * as React from 'react';
import { SchemeComposer } from '@/components/arguments/SchemeComposer';
import { ArgumentCard } from '@/components/arguments/ArgumentCard';
import { SchemeComposerPicker } from '../SchemeComposerPicker';
import { getUserFromCookies } from '@/lib/server/getUser';

export function AIFAuthoringPanel({
  deliberationId,
  authorId: authorIdProp, // Rename to avoid confusion
  conclusionClaim,
  premises,
  argument
}: {
  deliberationId: string;
  authorId: string;
  conclusionClaim: { id: string; text?: string };
  premises?: Array<{ id:string; text:string }>;
  argument?: { id:string; conclusion:{id:string;text:string}; premises:{id:string;text:string}[] } | null;
}) {
  const [user, setUser] = React.useState<{ userId?: string } | null>(null);
  const [pickConclusionOpen, setPickConclusionOpen] = React.useState(false);

  // ✅ FIX 1: Use state for conclusion that syncs with prop changes
  const [conclusion, setConclusion] = React.useState<{id:string; text?:string} | null>(
    conclusionClaim?.id ? conclusionClaim : null
  );

  // ✅ FIX 2: Sync local conclusion state when prop changes
  React.useEffect(() => {
    if (conclusionClaim?.id) {
      setConclusion(conclusionClaim);
    }
  }, [conclusionClaim]);

  // Fetch user on mount
  React.useEffect(() => {
    getUserFromCookies().then((u) => {
      setUser(u ? { 
        userId: u.userId !== null && u.userId !== undefined ? String(u.userId) : undefined 
      } : null);
    });
  }, []);

  // ✅ FIX 3: Derive authorId properly without mutating props
  const effectiveAuthorId = user?.userId || authorIdProp || 'current';
  const readyForCompose = Boolean(effectiveAuthorId && conclusion?.id);

  return (
    <div className="flex flex-1 h-[500px] bg-transparent backdrop-blur-md flex-col space-y-4 overflow-y-auto">
      
      {/* Author loading state */}
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
            className="text-xs px-2 py-1 border rounded bg-white hover:bg-slate-50"
            onClick={() => setPickConclusionOpen(true)}
          >
            Choose conclusion
          </button>
        </div>
      )}

      {/* ✅ FIX 4: Always show SchemeComposer when we have conclusion, 
          even if author is still loading (it can handle that internally) */}
      {conclusion?.id && (
        <SchemeComposer
          deliberationId={deliberationId}
          authorId={effectiveAuthorId}
          conclusionClaim={conclusion}
        />
      )}

      {argument && (
        <ArgumentCard
          deliberationId={deliberationId}
          authorId={effectiveAuthorId}
          id={argument.id}
          conclusion={argument.conclusion}
          premises={argument.premises}
          onAnyChange={()=>window.dispatchEvent(new CustomEvent('debate:graph:refresh',{detail:{deliberationId}} as any))}
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