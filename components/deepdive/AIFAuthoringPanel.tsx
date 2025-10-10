'use client';
import * as React from 'react';
import { SchemeComposer } from '@/components/arguments/SchemeComposer';
import { ArgumentCard } from '@/components/arguments/ArgumentCard';
import { EntityPicker } from '@/components/kb/EntityPicker';
import { SchemeComposerPicker } from '../ScchemeComposerPicker';
import { getUserFromCookies } from '@/lib/server/getUser';
import { get } from 'lodash';

async function fetchUser() {
      const user = await getUserFromCookies();
        return user;
}

export function AIFAuthoringPanel({
  deliberationId, authorId,
  conclusionClaim, premises, argument
}: {
  deliberationId: string;
  authorId: string; // must be a real id (or use 'current' if you implement server-side auth fallback)
  conclusionClaim: { id: string; text?: string };
  premises?: Array<{ id:string; text:string }>;
  argument?: { id:string; conclusion:{id:string;text:string}; premises:{id:string;text:string}[] } | null;
}) {

const [user, setUser] = React.useState<{ userId?: string } | null>(null);

React.useEffect(() => {
  getUserFromCookies().then((u) => {
    setUser(u ? { userId: u.userId !== null && u.userId !== undefined ? String(u.userId) : undefined } : null);
  });
}, []);


authorId = user?.userId || 'current'; // use 'current' to resolve from session on server if you implement that
  // Local, safe conclusion state: if parent passed an empty id, let the user pick one.
  const [conclusion, setConclusion] = React.useState<{id:string; text?:string} | null>(
    conclusionClaim?.id ? conclusionClaim : null
  );
  const [pickConclusionOpen, setPickConclusionOpen] = React.useState(false);

  const readyForCompose = Boolean(authorId && conclusion?.id);

  return (
    <div className="flex flex-1 h-[500px] bg-transparent backdrop-blur-md flex-col space-y-4  overflow-y-auto">
      {/* If missing author or conclusion, show a small guard panel */}
      {!authorId && (
        <div className="border rounded-md p-3 bg-amber-50 border-amber-200 text-amber-800 text-sm">
          Signed-in user id not available yet. Please wait for session/user to load.
        </div>
      )}

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

      {/* Main composer – only render when we have required ids */}
      {readyForCompose && (
        <SchemeComposer
          deliberationId={deliberationId}
          authorId={authorId}
          conclusionClaim={conclusion!}
        />
      )}

      {argument && (
        <ArgumentCard
          deliberationId={deliberationId}
          authorId={authorId}
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
