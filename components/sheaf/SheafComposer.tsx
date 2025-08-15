

'use client';

import * as React from 'react';
import type { AudienceSelector } from '@app/sheaf-acl';
import { priorityRank } from '@app/sheaf-acl';
import { FacetEditor, type JSONContent } from './FacetEditor';
import { AudiencePicker } from './AudiencePickers';
import { ViewAsBar } from './ViewAsBar';
import { sha256Hex } from '@/lib/crypto/sha256';
import { useChatStore } from "@/contexts/useChatStore";


type SharePolicy = 'ALLOW'|'REDACT'|'FORBID';

type FacetDraft = {
  id: string;
  audience: AudienceSelector;
  sharePolicy: SharePolicy;
  body: JSONContent | null;

  attachments: {
    name: string;
    mime: string;
    size: number;
    sha256: string;
    path?: string | null;
    blobId?: string | null;
  }[];
};

export function SheafComposer(props: {
  threadId: string|number;
  authorId: string|number;
  onSent?: (res: { messageId: string }) => void;
  onCancel?: () => void;
}) {
  const { threadId, authorId, onSent, onCancel } = props;
  const appendMessage = useChatStore(s => s.appendMessage);
  const [facets, setFacets] = React.useState<FacetDraft[]>([{
    id: crypto.randomUUID(),
    audience: { kind: 'EVERYONE' },
    sharePolicy: 'ALLOW',
    body: null,
    attachments: [],
  }]);

  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const updateFacet = (id: string, patch: Partial<FacetDraft>) => {
    setFacets(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  };

  const addFacet = (audience: AudienceSelector) => {
    setFacets(prev => [...prev, {
      id: crypto.randomUUID(),
      audience,
      sharePolicy: audience.kind === 'EVERYONE' ? 'ALLOW' : 'REDACT',
      body: null,
      attachments: [],
    }]);
  };

  const removeFacet = (id: string) => {
    setFacets(prev => prev.length === 1 ? prev : prev.filter(f => f.id !== id));
  };

  function defaultFacetIndex(): number {
    let best = 0;
    let bestRank = priorityRank(facets[0].audience as any);
    for (let i = 1; i < facets.length; i++) {
      const r = priorityRank(facets[i].audience as any);
      if (r < bestRank) { best = i; bestRank = r; }
    }
    return best;
  }

  async function handleUploadFiles(fid: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    const out: FacetDraft['attachments'] = [];

    for (const f of Array.from(files)) {
      const sha = await sha256Hex(f);
      const form = new FormData();
      form.set('file', f);
      const res = await fetch('/api/sheaf/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && data?.ok) {
        out.push({
          name: data.blob.name ?? f.name,
          mime: data.blob.mime ?? f.type,
          size: data.blob.size ?? f.size,
          sha256: data.blob.sha256 ?? sha,
          path: data.blob.path ?? null,
          blobId: data.blob.id ?? null,
        });
      }
    }

    setFacets(prev => prev.map(x => x.id === fid ? { ...x, attachments: [...x.attachments, ...out] } : x));
  }

  function removeAttachment(fid: string, idx: number) {
    setFacets(prev => prev.map(x => {
      if (x.id !== fid) return x;
      const next = x.attachments.slice();
      next.splice(idx, 1);
      return { ...x, attachments: next };
    }));
  }

  async function send() {
    setError(null);

    const hasContent = facets.some(f => (f.body && JSON.stringify(f.body) !== '{}') || f.attachments.length > 0);
    if (!hasContent) {
      setError('Add some content in at least one layer (or an attachment).');
      return;
    }

    const payload = {
      conversationId: threadId,
      authorId,
      text: null,
      facets: facets.map(f => ({
        audience: f.audience,
        sharePolicy: f.sharePolicy,
        body: f.body ?? { type: 'doc', content: [{ type: 'paragraph' }] },
        attachments: f.attachments,
      })),
      defaultFacetIndex: defaultFacetIndex(),
    };

    try {
      setSending(true);
      const res = await fetch("/api/sheaf/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send");
      
      const msg = data.message ?? data; // tolerate either shape
      appendMessage(String(threadId), msg);
      onSent?.({ messageId: String(msg.id) });
      
      
    } catch (e: any) {
      setError(e?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
    
  }
  

  return (
<div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* View-as (preview which layers are visible for common audiences) */}
      <ViewAsBar
        facets={facets.map(f => ({
          id: f.id,
          audience: f.audience,
          sharePolicy: f.sharePolicy,
          body: f.body ?? { type: 'doc', content: [{ type: 'paragraph' }] },
          attachments: f.attachments,
        }))}
        authorId={authorId}
      />
{/* Add this block just before the facets map */}
<div className="sticky top-0 z-10 bg-white/80 backdrop-blur p-2 border-b">
      <span className="text-sm font-medium">Add layer:</span>

  <button
    type="button"
    className="px-2 py-1 rounded border bg-white/70 text-xs"
    onClick={() => addFacet({ kind: 'EVERYONE' })}
    disabled={sending}
  >
    + Public
  </button>

  <button
    type="button"
    className="px-2 py-1 rounded border bg-white/70 text-xs"
    onClick={() => addFacet({ kind: 'ROLE', role: 'MOD', mode: 'DYNAMIC' })}
    disabled={sending}
  >
    + Role: MOD
  </button>

  <button
    type="button"
    className="px-2 py-1 rounded border bg-white/70 text-xs"
    onClick={() => addFacet({ kind: 'LIST', listId: 'core_team', mode: 'SNAPSHOT' })}
    disabled={sending}
    title="Snapshot freezes membership at send"
  >
    + List: core_team (snapshot)
  </button>

  <button
    type="button"
    className="px-2 py-1 rounded border bg-white/70 text-xs"
    onClick={() => addFacet({ kind: 'USERS', mode: 'SNAPSHOT', snapshotMemberIds: [] })}
    disabled={sending}
    title="Add specific people (choose in the Audience picker below)"
  >
    + Specific people
  </button>
</div>
      {/* Facets */}
      <div className="space-y-4">
        {facets.map((f, idx) => (
          <div key={f.id} className="rounded-xl border bg-white/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-slate-700">
                <strong>Layer {idx + 1}</strong>
              </div>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-white/70 border"
                disabled={facets.length === 1 || sending}
                onClick={() => removeFacet(f.id)}
              >
                Remove
              </button>
            </div>

            <div className="mt-2">
              <div className="text-xs font-medium text-slate-700 mb-1">Audience</div>
              <AudiencePicker
                value={f.audience}
                onChange={(aud) => updateFacet(f.id, { audience: aud })}
                authorId={authorId}
                conversationId={threadId}
              />
            </div>

            <div className="mt-2">
              <label className="text-xs mr-2">Share policy:</label>
              <select
                className="text-xs border rounded px-2 py-1 bg-white/70"
                value={f.sharePolicy}
                onChange={(e) => updateFacet(f.id, { sharePolicy: e.target.value as SharePolicy })}
                disabled={sending}
              >
                <option value="ALLOW">Allow</option>
                <option value="REDACT">Require Redact</option>
                <option value="FORBID">Forbid</option>
              </select>
            </div>

            <div className="mt-2">
              <FacetEditor
                value={f.body}
                onChange={(json) => updateFacet(f.id, { body: json })}
                placeholder="Write the content for this layer…"
              />
            </div>

            {/* attachments */}
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <label className="text-xs">Attachments:</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleUploadFiles(f.id, e.target.files)}
                />
              </div>
              {f.attachments.length > 0 && (
                <ul className="mt-1 text-xs text-slate-700 space-y-1">
                  {f.attachments.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="truncate">{a.name} <span className="text-slate-400">({a.mime}, {a.size}b)</span></span>
                      <button
                        type="button"
                        className="px-1 py-0.5 rounded border"
                        onClick={() => removeAttachment(f.id, i)}
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {error && <div className="text-xs text-rose-600">{error}</div>}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded border bg-white/70 text-sm" disabled={sending}>
          Cancel
        </button>
        <button
          type="button"
          onClick={send}
          className={sending ? 'px-3 py-2 rounded text-sm opacity-60 cursor-not-allowed bg-indigo-300' : 'px-3 py-2 rounded text-sm bg-indigo-500 text-white'}
          disabled={sending}
        >
          {sending ? 'Sending…' : 'Send layered message'}
        </button>
      </div>
    </div>
  );
}
