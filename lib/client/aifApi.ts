// lib/client/aifApi.ts
export type ClaimLite = { id: string; text: string };

function routeOf(res: Response) {
  try { return new URL(res.url).pathname; } catch { return res.url || '<unknown>'; }
}

async function asJson<T>(res: Response): Promise<T> {
  let j: any = null;
  try { j = await res.json(); } catch { /* non-JSON bodies (204/empty, etc.) */ }

  if (!res.ok || (j && j.ok === false)) {
    const url = routeOf(res);
    const msg = j?.error || j?.message || j?.details || `HTTP ${res.status}`;
    throw new Error(`[${res.status}] ${url} – ${msg}`);
  }
  return (j ?? {}) as T;
}

// async function asJson<T>(res: Response): Promise<T> {
//   const j = await res.json().catch(() => ({}));
//   if (!res.ok || (j && j.ok === false)) throw new Error(j?.error || `HTTP ${res.status}`);
//   return j;
// }

export async function searchClaims(
  q: string,
  deliberationId: string,
  opts?: { signal?: AbortSignal; limit?: number }
): Promise<ClaimLite[]> {
  const params = new URLSearchParams({ q, deliberationId });
  if (opts?.limit) params.set('limit', String(opts.limit));
  const r = await fetch(`/api/claims/search?${params}`, { signal: opts?.signal, cache: 'no-store' });
  const j = await r.json();
  if (!r.ok || j?.ok === false) throw new Error(j?.error || `HTTP ${r.status}`);
  return Array.isArray(j.items) ? j.items : [];
}

export async function tryGetArgumentCQs(argumentId: string) {
  try { return await getArgumentCQs(argumentId); }
  catch { return []; }
}

export async function createClaim(params: { deliberationId: string; authorId: string; text: string }) {
  const res = await fetch('/api/claims', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  const j = await asJson<{ id: string }>(res);
  return j.id;
}

// export async function listSchemes() {
//   const { items } = await asJson<{ items: Array<{ id: string; key: string; name: string; slotHints?: any; cqs?: any[] }> }>(
//     await fetch('/api/schemes', { cache: 'no-store' })
//   );
//   return items ?? [];
// }
export async function listSchemes() {
  const r = await fetch('/api/aif/schemes?ensure=1', { cache: 'no-store' });
  const j = await r.json().catch(() => ({ items: [] }));
  const items = Array.isArray(j.items) ? j.items : [];
  return items.map((s: any) => ({
    id: s.id ?? s.schemeId ?? s._id,
    key: s.key,
    name: s.name ?? s.title ?? s.key,         // ← tolerate both shapes
    slotHints: s.slotHints ?? s.hints ?? null,
    cqs: Array.isArray(s.cqs) ? s.cqs : (Array.isArray(s.cq) ? s.cq : []),
  }));
}

export async function createArgument(payload: {
  deliberationId: string;
  authorId: string;
  conclusionClaimId: string;
  premiseClaimIds: string[];
  schemeId?: string | null;
  implicitWarrant?: { text: string } | null;
  text?: string;
}) {
  const res = await fetch('/api/arguments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const j = await asJson<{ argumentId: string }>(res);
  return j.argumentId;
}

export async function getArgumentCQs(argumentId: string) {
  // If you renamed the folder to aif-cqs (recommended):
  const res = await fetch(`/api/arguments/${argumentId}/aif-cqs`, { cache: 'no-store' });
  const j = await res.json().catch(()=>({ items: [] }));
  if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
  return j.items ?? [];
}
export async function askCQ(argumentId: string, cqKey: string, ctx: { authorId: string; deliberationId: string }) {
  const res = await fetch(`/api/arguments/${argumentId}/cqs/${encodeURIComponent(cqKey)}/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(ctx),
  });
  await asJson(res);
}

export async function postAttack(
  targetArgumentId: string,
  payload: {
    deliberationId: string;
    createdById: string;
    fromArgumentId: string;
    attackType: 'REBUTS' | 'UNDERCUTS' | 'UNDERMINES';
    targetScope: 'conclusion' | 'inference' | 'premise';
    toArgumentId?: string | null;
    targetClaimId?: string | null;
    targetPremiseId?: string | null;
    cqKey?: string | null;
  }
) {
  const res = await fetch(`/api/arguments/${encodeURIComponent(targetArgumentId)}/attacks`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return asJson<{ ok: boolean; edgeId: string }>(res);
}
