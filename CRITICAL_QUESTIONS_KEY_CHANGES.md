# CriticalQuestions Component - Key Changes Reference

## Quick Comparison: Old vs New

### 1. Data Fetching
```tsx
// ❌ OLD: Limited data fetching
const { data, error, isLoading } = useSWR<CQsResponse>(
  CQS_KEY(targetId),
  fetcher
);
const { data: attachData } = useSWR<{ attached: Record<string, boolean> }>(
  ATTACH_KEY(targetId),
  fetcher
);

// ✅ NEW: Comprehensive data fetching
const { data, error, isLoading, mutate: mutateCQs } = useSWR<CQsResponse>(
  CQS_KEY(targetId), fetcher, { revalidateOnFocus: false, dedupingInterval: 2000 }
);
const { data: attachData, mutate: mutateAttach } = useSWR(ATTACH_KEY(targetId), fetcher);
const { data: movesData, mutate: mutateMoves } = useSWR(MOVES_KEY(deliberationId), fetcher);
const { data: edgesData, mutate: mutateEdges } = useSWR(EDGES_KEY(deliberationId), fetcher);
```

### 2. Event Handling
```tsx
// ❌ OLD: Manual window events only
React.useEffect(() => {
  const h = () => { mutateSummary(); mutateLabels(); };
  window.addEventListener('claims:changed', h);
  window.addEventListener('dialogue:moves:refresh', h);
  return () => {
    window.removeEventListener('claims:changed', h);
    window.removeEventListener('dialogue:moves:refresh', h);
  };
}, [mutateSummary, mutateLabels]);

// ✅ NEW: Bus system + legacy events
useBusEffect(
  ["cqs:changed", "dialogue:moves:refresh", "arguments:changed", "claims:changed"],
  () => { mutateCQs(); mutateAttach(); mutateMoves(); mutateEdges(); },
  { retry: true }
);
// + backwards-compatible window events
```

### 3. WHY Move Posting
```tsx
// ❌ OLD: Missing cqId (causes malformed moves)
<button onClick={async () => {
  await fetch('/api/dialogue/move', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      deliberationId, targetType, targetId,
      kind: 'WHY',
      payload: { locusPath: locus, schemeKey: s.key, cqKey: cq.key }, // ❌ cqKey not cqId
    }),
  });
}}>Ask WHY</button>

// ✅ NEW: Proper cqId for move pairing
payload: { 
  locusPath: locus, 
  schemeKey: s.key, 
  cqId: cq.key  // ✅ Correct field name
}
```

### 4. GROUNDS Move Posting
```tsx
// ❌ OLD: Incomplete payload structure
async function resolveViaGrounds(schemeKey: string, cqKey: string, brief: string) {
  await fetch('/api/dialogue/move', {
    method: 'POST',
    body: JSON.stringify({
      deliberationId, targetType: 'claim', targetId,
      kind: 'GROUNDS',
      payload: { schemeKey, cqKey, brief }, // ❌ Missing locusPath, cqId
      autoCompile: true,
    }),
  });
}

// ✅ NEW: Complete payload with proper fields
async function resolveViaGrounds(schemeKey: string, cqId: string, brief: string, alsoMark = false) {
  const res = await fetch('/api/dialogue/move', {
    method: 'POST',
    body: JSON.stringify({
      deliberationId, targetType: 'claim', targetId,
      kind: 'GROUNDS',
      payload: {
        schemeKey,      // ✅ For analytics
        cqId,           // ✅ Pairs with WHY
        locusPath: locus, // ✅ Dialogue tree position
        expression: text, // ✅ Grounds content
        original: text    // ✅ UI copy
      },
      autoCompile: true, autoStep: true,
    }),
  });
  
  // ✅ Optional: mark CQ satisfied after successful GROUNDS
  if (alsoMark && res.ok) {
    await fetch('/api/cqs/toggle', { /* ... */ });
  }
}
```

### 5. Legal Moves Integration
```tsx
// ❌ OLD: No legal moves - only manual buttons
<button onClick={...}>Ask WHY on this CQ</button>
<button onClick={...}>Supply GROUNDS</button>

// ✅ NEW: Integrated LegalMoveChips component
<div className="pt-2 border-t border-slate-200">
  <div className="text-xs font-semibold mb-1">Legal Dialogical Moves:</div>
  <LegalMoveChips
    deliberationId={deliberationId}
    targetType="claim"
    targetId={targetId}
    locusPath={locus}
    onPosted={() => {
      window.dispatchEvent(new CustomEvent('claims:changed'));
      window.dispatchEvent(new CustomEvent('dialogue:moves:refresh'));
    }}
  />
</div>
```

### 6. UI State Management
```tsx
// ❌ OLD: Limited state tracking
const [postingKey, setPostingKey] = useState<string | null>(null);
const [okKey, setOkKey] = useState<string | null>(null);

// ✅ NEW: Comprehensive state for all features
const [postingKey, setPostingKey] = useState<string | null>(null);
const [okKey, setOkKey] = useState<string | null>(null);
const [showLegalMoves, setShowLegalMoves] = useState<string | null>(null);
const [groundsDraft, setGroundsDraft] = useState<Record<string, string>>({});
const [blockedMsg, setBlockedMsg] = useState<Record<string, string>>({});
const [locus, setLocus] = useState("0"); // Explicit locus control
```

### 7. Inline Grounds Input
```tsx
// ❌ OLD: Separate input field, manual handlers
<Input
  placeholder="Reply with grounds…"
  value={groundsVal}
  onChange={(e) => setGroundsDraft((g) => ({ ...g, [sig]: e.target.value }))}
  onKeyDown={async (e) => {
    if (e.key === 'Enter' && groundsVal.trim() && !posting) {
      await resolveViaGrounds(s.key, cq.key, groundsVal.trim(), true);
    }
  }}
/>
<Button onClick={() => resolveViaGrounds(...)}>Post grounds</Button>

// ✅ NEW: Same but with Clear button + better disabled states
<div className="mt-1 pl-6 flex items-center gap-2">
  <Input ... disabled={posting} />
  <Button disabled={!groundsVal.trim() || posting}>
    {posting ? 'Posting…' : 'Post grounds'}
  </Button>
  <Button variant="ghost" onClick={() => setGroundsDraft((g) => ({ ...g, [sig]: '' }))}>
    Clear
  </Button>
</div>
```

### 8. Cache Invalidation Strategy
```tsx
// ❌ OLD: Manual mutate calls, hard to coordinate
await Promise.all([
  globalMutate(CQS_KEY(targetId)),
  globalMutate(ATTACH_KEY(targetId)),
  globalMutate(TOULMIN_KEY(targetId)),
]);

// ✅ NEW: Centralized revalidateAll helper
async function revalidateAll(schemeKey?: string) {
  await Promise.all([
    mutateCQs(),
    mutateAttach(),
    mutateMoves(),
    mutateEdges(),
    globalMutate(TOULMIN_KEY(targetId)),
    roomId && currentLens ? globalMutate(GRAPH_KEY(roomId, currentLens, currentAudienceId)) : Promise.resolve(),
  ]);
}
```

### 9. Guard System Error Handling
```tsx
// ❌ OLD: Generic error handling
if (!res.ok) {
  let msg = 'Failed to toggle';
  setBlockedMsg(m => ({ ...m, [sig]: msg }));
}

// ✅ NEW: Specific 409 conflict handling
if (res.status === 409) {
  const j = await res.json().catch(() => null);
  const req = j?.guard?.requiredAttack as 'rebut'|'undercut'|null;
  const msg = req
    ? `Needs a ${req} attached (or strong NLI for rebut).`
    : `Needs an attached counter (rebut/undercut).`;
  setBlockedMsg(m => ({ ...m, [sig]: msg }));
}
```

### 10. Locus Control
```tsx
// ❌ OLD: Hardcoded locus in move payload
payload: { locusPath: '0', ... }

// ✅ NEW: User-editable locus with UI control
const [locus, setLocus] = useState('0');

// In UI:
<div className="flex items-center gap-2 mb-1">
  <label className="text-[11px]">Locus</label>
  <input
    className="text-[11px] border rounded px-1 py-0.5 w-20"
    value={locus}
    onChange={(e) => setLocus(e.target.value)}
  />
</div>

// In move payload:
payload: { locusPath: locus, ... }
```

## Migration Checklist

When switching from old to new component:

- [ ] Update import to `CriticalQuestionsV2` (or rename file)
- [ ] Verify all props are still passed correctly (they should be identical)
- [ ] Test CQ toggling with and without attachments
- [ ] Verify WHY moves appear in `/api/deliberations/[id]/moves` with `cqId`
- [ ] Verify GROUNDS moves pair correctly with WHY moves
- [ ] Check legal moves panel displays correctly
- [ ] Test inline grounds input (Enter key + button)
- [ ] Verify locus control updates move payloads
- [ ] Check bus events trigger cache updates
- [ ] Monitor 409 conflict responses for proper error messages
- [ ] Test quick-create counter-claim flow
- [ ] Test attach existing claim flow

## Common Issues & Solutions

### Issue: WHY moves not appearing in legal-moves
**Cause**: Generic WHY without `cqId` is no longer supported  
**Solution**: Use CriticalQuestions component or pass `cqId` in payload

### Issue: GROUNDS move not pairing with WHY
**Cause**: `cqKey` used instead of `cqId`, or mismatched keys  
**Solution**: Ensure both WHY and GROUNDS use same `cqId` value

### Issue: CQ toggle fails with 409
**Cause**: No attacker claim attached, or NLI score too low  
**Solution**: Use "Attach" button to link a counter-claim first

### Issue: Cache not updating after move
**Cause**: Event not firing or SWR key mismatch  
**Solution**: Check bus event names and SWR cache keys

### Issue: Legal moves panel empty
**Cause**: No open WHY moves for this CQ  
**Solution**: Post a WHY move first, or check `/api/dialogue/legal-moves` response

## Performance Tips

1. **Deduplication**: Set `dedupingInterval: 2000` to prevent request spam
2. **Optimistic Updates**: Use optimistic updates for instant UI feedback
3. **Event Debouncing**: Consider debouncing bus events if too frequent
4. **Conditional Fetching**: Only fetch moves/edges when `deliberationId` exists
5. **Memoization**: Use `useMemo` for filtered schemes to prevent re-renders

## Related Files to Review

- `app/api/dialogue/legal-moves/route.ts` - Legal moves computation
- `app/api/dialogue/move/route.ts` - Move posting logic
- `app/api/cqs/toggle/route.ts` - CQ toggle with guards
- `lib/dialogue/signature.ts` - Move signature computation
- `components/dialogue/LegalMoveChips.tsx` - Legal moves UI
- `lib/argumentation/cqSuggestions.ts` - Attack suggestions

---

**Quick Start**: Copy `CriticalQuestionsV2.tsx` → `CriticalQuestions.tsx` and test!
