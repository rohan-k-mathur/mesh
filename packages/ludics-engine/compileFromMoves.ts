

import { prisma } from '@/lib/prismaclient';
import { appendActs } from './appendActs';
import { validateVisibility } from './visibility';
import type { DialogueAct } from 'packages/ludics-core/types';
import { withCompileLock } from './locks';
import { Prisma } from '@prisma/client';
import { delocate } from './delocate';

type Tx = Prisma.TransactionClient;
 type MoveKind = "ASSERT" | "WHY" | "GROUNDS" | "RETRACT" | "CONCEDE" | "CLOSE" | "THEREFORE" | "SUPPOSE" | "DISCHARGE";

type Move = {
  id: string;
  kind: string;
  payload?: {
    acts?: DialogueAct[];
    locusPath?: string;
    expression?: string;
    cqId?: string;
    sourceDesignId?: string;
    // legacy fields ok
  };
  targetType: 'argument'|'claim'|'card';
  targetId: string;
  actorId: string;
};

// -- helper: materialize acts out of a move payload (new path)
function expandActsFromMove(m: Move) {
  const acts = m.payload?.acts ?? [];
  return acts.map(a => ({
    polarity: a.polarity,                          // 'pos'|'neg'|'daimon'
    locusPath: a.locusPath ?? '0',
    openings: Array.isArray(a.openings) ? a.openings : [],
    isAdditive: !!a.additive,
    expression: a.expression ?? '',
    moveId: m.id,
    targetType: m.targetType,
    targetId: m.targetId,
    actorId: m.actorId,
  }));
}

// return delocated blob (no DB write)
function mkDelocatedBlob(src: { base: string; actions: any[]; meta?: any }, toLocus: string) {
  return { ...src, base: toLocus, meta: { ...(src.meta ?? {}), delocated: true } };
}


// -- helper: delocate (fax) evidence into a locus when answering WHY
// -- helper: delocate (fax) evidence into a locus when answering WHY
async function maybeDelocateForEvidence(m: Move, locus: string) {
  const evid = (m.payload as any)?.evidenceDesignId as string | undefined;
  if (!evid) return null;

  const d = await prisma.ludicDesign.findUnique({
    where: { id: evid },
     // current schema has no `base` column; we only need the id to annotate provenance
    select: { id: true },
});
  if (!d) return null;

  // Just annotate; let renderer/inspector explain provenance
  return { delocatedFromDesignId: d.id, intoLocus: locus };
}




interface DialogueMoveRow {
  id: string;
  deliberationId: string;
  targetType: string | null;
  targetId: string | null;
  kind: string;
  payload: unknown | null;
  actorId: string | null;
  createdAt: Date;
  polarity?: string | null;           // 'P'|'O' or null
  locusId?: string | null;
  endsWithDaimon?: boolean | null;
}

interface MoveWithScope extends DialogueMoveRow {
  scope: string | null;
  scopeType: string | null;
}

type ScopingStrategy = 'legacy' | 'topic' | 'actor-pair' | 'argument';

interface CompileOptions {
  scopingStrategy?: ScopingStrategy;
  forceRecompile?: boolean;
}

function keyForTarget(tt?: string|null, id?: string|null) {
  return tt && id ? `${tt}:${id}` : null;
}

async function ensureRoot(db: Tx, dialogueId: string) {
  const rootPath = '0';
  let root = await db.ludicLocus.findFirst({ where: { dialogueId, path: rootPath } });
  if (!root) root = await db.ludicLocus.create({ data: { dialogueId, path: rootPath } });
  return root;
}

// Helper: Compute argument root for topic-based grouping
async function computeArgumentRoots(moves: DialogueMoveRow[]): Promise<Map<string, string>> {
  const rootMap = new Map<string, string>();
  
  // Build a map of targets to their first appearance (proxy for "root topic")
  const firstMoveByTarget = new Map<string, string>();
  
  // First pass: map arguments to themselves
  for (const m of moves) {
    const targetKey = keyForTarget(m.targetType, m.targetId);
    if (!targetKey) continue;
    
    // For arguments, use the argument ID directly as the root
    if (m.targetType === 'argument') {
      rootMap.set(targetKey, m.targetId!);
      if (!firstMoveByTarget.has(targetKey)) {
        firstMoveByTarget.set(targetKey, m.targetId!);
      }
    }
  }
  
  // Fetch claim-to-argument relationships for all claims referenced in moves
  const claimIds = moves
    .filter(m => m.targetType === 'claim' && m.targetId)
    .map(m => m.targetId!);
  
  if (claimIds.length > 0) {
    // Find arguments that have these claims as conclusions
    const argumentsWithClaims = await prisma.argument.findMany({
      where: {
        conclusionClaimId: { in: claimIds }
      },
      select: {
        id: true,
        conclusionClaimId: true,
      }
    });
    
    // Map claim IDs to their parent argument IDs
    const claimToArgument = new Map(
      argumentsWithClaims.map(a => [a.conclusionClaimId, a.id])
    );
    
    // Second pass: map claims to their parent arguments (if any)
    for (const m of moves) {
      const targetKey = keyForTarget(m.targetType, m.targetId);
      if (!targetKey) continue;
      
      if (m.targetType === 'claim') {
        const parentArgumentId = claimToArgument.get(m.targetId!);
        if (parentArgumentId) {
          // This claim is the conclusion of an argument - use that argument as the root
          rootMap.set(targetKey, parentArgumentId);
        } else {
          // Standalone claim - use the claim itself as the root
          rootMap.set(targetKey, m.targetId!);
        }
        
        if (!firstMoveByTarget.has(targetKey)) {
          firstMoveByTarget.set(targetKey, m.targetId!);
        }
      }
      
      // For cards, use the target itself as the scope
      if (m.targetType === 'card') {
        rootMap.set(targetKey, m.targetId!);
        if (!firstMoveByTarget.has(targetKey)) {
          firstMoveByTarget.set(targetKey, m.targetId!);
        }
      }
    }
  }
  
  return rootMap;
}

// Helper: Derive human-readable label for scope
function deriveScopeLabel(scopeKey: string, moves: MoveWithScope[]): string {
  if (!scopeKey || scopeKey === 'legacy') return 'Global Deliberation';
  
  const [type, ...parts] = scopeKey.split(':');
  
  if (type === 'topic') {
    const topicId = parts[0];
    // Try to find topic title from moves targeting this topic
    const topicMove = moves.find(m => m.targetType === 'argument' && m.targetId === topicId);
    if (topicMove) {
      const payload = topicMove.payload as any;
      if (payload?.text) return `topic: ${payload.text.slice(0, 50)}`;
      if (payload?.brief) return `topic: ${payload.brief.slice(0, 50)}`;
    }
    return `topic ${topicId.slice(0, 8)}`;
  }
  
  if (type === 'actors') {
    const actorIds = parts;
    return `Actors: ${actorIds.map(id => id.slice(0, 8)).join(' vs ')}`;
  }
  
  if (type === 'argument') {
    const argId = parts[0];
    return `Argument ${argId.slice(0, 8)}`;
  }
  
  return scopeKey;
}

// Helper: Build metadata for scope
function buildScopeMetadata(
  scopeKey: string,
  moves: MoveWithScope[],
  strategy: ScopingStrategy
): any {
  const actors = new Set<string>();
  const proponents = new Set<string>();
  const opponents = new Set<string>();
  
  for (const m of moves) {
    if (m.actorId) {
      actors.add(m.actorId);
      if (m.polarity === 'P' || m.kind === 'ASSERT' || m.kind === 'GROUNDS') {
        proponents.add(m.actorId);
      } else if (m.polarity === 'O' || m.kind === 'WHY') {
        opponents.add(m.actorId);
      }
    }
  }
  
  const sortedMoves = [...moves].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  return {
    type: strategy === 'legacy' ? null : strategy,
    label: deriveScopeLabel(scopeKey, moves),
    moveCount: moves.length,
    actors: {
      proponent: Array.from(proponents),
      opponent: Array.from(opponents),
      all: Array.from(actors),
    },
    timeRange: sortedMoves.length > 0 ? {
      start: sortedMoves[0].createdAt,
      end: sortedMoves[sortedMoves.length - 1].createdAt,
    } : null,
    targetTypes: Array.from(new Set(moves.map(m => m.targetType).filter(Boolean))),
  };
}

// Helper: Compute scope for each move based on strategy
async function computeScopes(
  moves: DialogueMoveRow[],
  strategy: ScopingStrategy
): Promise<MoveWithScope[]> {
  if (strategy === 'legacy') {
    // Legacy mode: all moves in single global scope
    return moves.map(m => ({
      ...m,
      scope: null,
      scopeType: null,
    }));
  }
  
  if (strategy === 'topic') {
    // topic-based: group by root argument
    const rootMap = await computeArgumentRoots(moves);
    
    return moves.map(m => {
      const targetKey = keyForTarget(m.targetType, m.targetId);
      const rootId = targetKey ? rootMap.get(targetKey) : null;
      
      return {
        ...m,
        scope: rootId ? `topic:${rootId}` : null,
        scopeType: rootId ? 'topic' : null,
      };
    });
  }
  
  if (strategy === 'actor-pair') {
    // Actor-pair: group by unique pairs of actors
    return moves.map(m => {
      if (!m.actorId) {
        return { ...m, scope: null, scopeType: null };
      }
      
      // For simplicity, use actorId as scope (in real impl, would pair with previous actor)
      return {
        ...m,
        scope: `actors:${m.actorId}`,
        scopeType: 'actor-pair',
      };
    });
  }
  
  if (strategy === 'argument') {
    // Argument-thread: each target is its own scope
    return moves.map(m => {
      const targetKey = keyForTarget(m.targetType, m.targetId);
      return {
        ...m,
        scope: targetKey ? `argument:${m.targetId}` : null,
        scopeType: targetKey ? 'argument' : null,
      };
    });
  }
  
  // Fallback to legacy
  return moves.map(m => ({ ...m, scope: null, scopeType: null }));
}

// Helper: Detect cross-scope references in moves
// Returns Map<scopeKey, Set<referencedScopeKeys>>
async function detectCrossScopeReferences(
  movesWithScopes: MoveWithScope[]
): Promise<Map<string, Set<string>>> {
  const crossScopeRefs = new Map<string, Set<string>>();
  
  // Build map of argumentId to scope
  const argToScope = new Map<string, string>();
  for (const m of movesWithScopes) {
    if (m.targetType === 'argument' && m.targetId && m.scope) {
      argToScope.set(m.targetId, m.scope);
    }
  }
  
  // Check each move's payload for references to other arguments
  for (const move of movesWithScopes) {
    const moveScope = move.scope ?? 'legacy';
    const payload = move.payload as any;
    
    if (!payload) continue;
    
    // Check for citedArgumentId, referencedArgumentId, or similar fields
    const referencedArgIds: string[] = [];
    
    if (payload.citedArgumentId) {
      referencedArgIds.push(payload.citedArgumentId);
    }
    if (payload.referencedArgumentId) {
      referencedArgIds.push(payload.referencedArgumentId);
    }
    if (payload.crossTopicReference) {
      referencedArgIds.push(payload.crossTopicReference);
    }
    
    // Check if move payload text mentions other argument IDs (heuristic)
    if (typeof payload.text === 'string') {
      // Look for patterns like "as shown in arg_xyz" or references to other topics
      const argIdPattern = /(arg_[a-z0-9]+|cmh[a-z0-9]+)/gi;
      const matches = payload.text.match(argIdPattern);
      if (matches) {
        referencedArgIds.push(...matches);
      }
    }
    
    // For each referenced argument, check if it's in a different scope
    for (const refArgId of referencedArgIds) {
      const refScope = argToScope.get(refArgId);
      if (refScope && refScope !== moveScope) {
        // Cross-scope reference detected!
        if (!crossScopeRefs.has(moveScope)) {
          crossScopeRefs.set(moveScope, new Set());
        }
        crossScopeRefs.get(moveScope)!.add(refScope);
      }
    }
  }
  
  return crossScopeRefs;
}

export async function compileFromMoves(
  dialogueId: string,
  options?: CompileOptions
): Promise<{ ok: true; designs: string[] }> {
  const { scopingStrategy = 'legacy', forceRecompile = false } = options ?? {};
  
  return withCompileLock(dialogueId, async () => {
    // 1) wipe+recreate designs inside a short tx (relation-safe)
    const rootId = await prisma.$transaction(async (tx) => {
      const root = await ensureRoot(tx as Tx, dialogueId);
      await tx.ludicChronicle.deleteMany({ where: { design: { deliberationId: dialogueId } } });
      await tx.ludicAct.deleteMany({ where: { design: { deliberationId: dialogueId } } });
      await tx.ludicTrace.deleteMany({ where: { deliberationId: dialogueId } });
      await tx.ludicDesign.deleteMany({ where: { deliberationId: dialogueId } });
      return root.id;
    }, { timeout: 30_000, maxWait: 5_000 });

    // 2) read moves + compute scopes
    const moves: DialogueMoveRow[] = await prisma.dialogueMove.findMany({
      where: { deliberationId: dialogueId },
      orderBy: { createdAt: 'asc' },
      select: {
        id:true, deliberationId:true, targetType:true, targetId:true,
        kind:true, payload:true, actorId:true, createdAt:true,
        polarity:true, locusId:true, endsWithDaimon:true,
      },
    });
    
    const movesWithScopes = await computeScopes(moves, scopingStrategy);
    
    // 3) Detect cross-scope references
    const crossScopeRefs = await detectCrossScopeReferences(movesWithScopes);
    
    // 4) group moves by scope
    const movesByScope = new Map<string, MoveWithScope[]>();
    for (const m of movesWithScopes) {
      const scopeKey = m.scope ?? 'legacy';
      if (!movesByScope.has(scopeKey)) {
        movesByScope.set(scopeKey, []);
      }
      movesByScope.get(scopeKey)!.push(m);
    }

    const loci = await prisma.ludicLocus.findMany({ where: { dialogueId }, select: { id:true, path:true } });
    const pathById = new Map(loci.map(l => [l.id, l.path]));
    
    const allDesignIds: string[] = [];

    // 5) Create designs per scope
    for (const [scopeKey, scopeMoves] of movesByScope.entries()) {
      const scopeMetadata = buildScopeMetadata(scopeKey, scopeMoves, scopingStrategy);
      const referencedScopes = Array.from(crossScopeRefs.get(scopeKey) ?? []);
      const nowIso = new Date().toISOString();
      
      const { proponentId, opponentId } = await prisma.$transaction(async (tx) => {
        const P = await tx.ludicDesign.create({
          data: {
            deliberationId: dialogueId,
            participantId: 'Proponent',
            rootLocusId: rootId,
            scope: scopeKey === 'legacy' ? null : scopeKey,
            scopeType: scopingStrategy === 'legacy' ? null : scopingStrategy,
            scopeMetadata: scopeKey === 'legacy' ? null : scopeMetadata,
            referencedScopes,
            extJson: { role: 'pro', source: 'compile', at: nowIso },
          },
        });
        const O = await tx.ludicDesign.create({
          data: {
            deliberationId: dialogueId,
            participantId: 'Opponent',
            rootLocusId: rootId,
            scope: scopeKey === 'legacy' ? null : scopeKey,
            scopeType: scopingStrategy === 'legacy' ? null : scopingStrategy,
            scopeMetadata: scopeKey === 'legacy' ? null : scopeMetadata,
            referencedScopes,
            extJson: { role: 'opp', source: 'compile', at: nowIso },
          },
        });
        return { proponentId: P.id, opponentId: O.id };
      }, { timeout: 30_000, maxWait: 5_000 });

      allDesignIds.push(proponentId, opponentId);
      
      // 6) Compile acts for this scope
      await compileScopeActs(
        dialogueId,
        scopeMoves,
        { id: proponentId, participantId: 'Proponent' as const },
        { id: opponentId, participantId: 'Opponent' as const },
        pathById
      );
    }
    
    await Promise.allSettled(allDesignIds.map(id => validateVisibility(id)));
    return { ok: true, designs: allDesignIds };
  });
}

// Helper function to compile acts for a single scope
async function compileScopeActs(
  dialogueId: string,
  moves: MoveWithScope[],
  P: { id: string; participantId: 'Proponent' },
  O: { id: string; participantId: 'Opponent' },
  pathById: Map<string, string>
) {
    let nextTopIdx = 0;
    let lastAssertLocus: string | null = null;
    const anchorForTarget = new Map<string, string>();
    const childCounters   = new Map<string, number>();
    const outActs: { designId: string; act: any }[] = [];

    const pickChild = (parent: string, explicit?: string|null) => {
      if (explicit) return `${parent}.${explicit}`;
      const n = (childCounters.get(parent) ?? 0) + 1;
      childCounters.set(parent, n);
      return `${parent}.${n}`;
    };

    for (const m of moves) {
      const kind = (m.kind || '').toUpperCase() as MoveKind;
      const payload = (m.payload ?? {}) as Record<string, unknown>;
      const targetKey = keyForTarget(m.targetType ?? undefined, m.targetId ?? undefined);
      const explicitPath  = (payload.locusPath as string | undefined) ?? null;
      const explicitChild = (payload.childSuffix as string | undefined) ?? null;
      const expr =
        (payload.text as string) ??
        (payload.note as string) ??
        (payload.brief as string) ??
        (payload.expression as string) ??
        kind;
      const locFromId = m.locusId ? pathById.get(m.locusId) ?? null : null;
      const defaultDesign = kind === 'WHY' ? O : P;
      const design =
        m.polarity === 'O' ? O :
        m.polarity === 'P' ? P : defaultDesign;

      // ----- A) prefer multi‑act payloads -----
      const protoActs = Array.isArray((m.payload as any)?.acts) ? expandActsFromMove(m as any) : [];
      if (protoActs.length) {
        const defaultAnchor: string =
                 (m.locusId ? pathById.get(m.locusId) ?? null : null) ??
                  (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
                  lastAssertLocus ?? '0';

        const designFor = (pol?: string) => {
          if (pol === 'neg') return O;
          if (pol === 'pos' || pol === 'daimon') return P;
          return (kind === 'WHY') ? O : P;
        };

        for (const a of protoActs) {
          const locus = (a.locusPath && a.locusPath.trim()) ? a.locusPath.trim() : defaultAnchor;
          if (!locus) continue;
          
          // Preserve metadata from expandActsFromMove
          const meta = {
            moveId: a.moveId,
            targetType: a.targetType,
            targetId: a.targetId,
            actorId: a.actorId,
          };

          if (a.polarity === 'pos') {
            outActs.push({
              designId: designFor('pos').id,
              act: {
                kind: 'PROPER', polarity: 'P', locus,
                ramification: Array.isArray(a.openings) ? a.openings : [],
                expression: a.expression ?? '',
                isAdditive: !!a.isAdditive,
                meta, // Attach metadata
              },
            });
          } else if (a.polarity === 'neg') {
            outActs.push({
              designId: designFor('neg').id,
              act: {
                kind: 'PROPER', polarity: 'O', locus,
                ramification: [], expression: a.expression ?? '',
                meta, // Attach metadata
              },
            });
          } else if (a.polarity === 'daimon') {
            outActs.push({
              designId: designFor('daimon').id,
              act: { kind: 'DAIMON', expression: a.expression ?? 'END', meta },
            });
          }
        }

        // maintain anchor for follow‑on WHY/GROUNDS
        const firstPos = protoActs.find(a => a.polarity === 'pos');
       const anchor: string = firstPos?.locusPath?.trim() || defaultAnchor;
        if (anchor && targetKey) anchorForTarget.set(targetKey, anchor);
        lastAssertLocus = anchor ?? lastAssertLocus;
        continue; // handled this move
      }

      // ----- legacy path (ASSERT/WHY/GROUNDS/RETRACT) -----

      if (kind === 'ASSERT') {
        const locus = explicitPath ?? locFromId ?? `0.${++nextTopIdx}`;
        lastAssertLocus = locus;
        if (targetKey) anchorForTarget.set(targetKey, locus);

        outActs.push({
          designId: design.id,
          act: {
            kind: 'PROPER', polarity: 'P', locus,
            ramification: (payload.ramification as string[]) ?? ['1'],
            expression: expr,
            isAdditive: !!(payload as any).additive,   // C) mark additivity on opener
            meta: {
              moveId: m.id,
              targetType: m.targetType,
              targetId: m.targetId,
              actorId: m.actorId,
            },
          },
        });

        if (m.endsWithDaimon) {
          outActs.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'END' } });
          lastAssertLocus = null;
        }
        continue;
      }

      if (kind === 'WHY') {
        const parent =
          explicitPath ?? locFromId ??
          (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
          lastAssertLocus ?? '0';
        
        // Create a child locus for the WHY challenge instead of placing at parent
        const locus = pickChild(parent, explicitChild);

        outActs.push({
          designId: design.id,
          act: {
            kind: 'PROPER', polarity: 'O', locus,
            ramification: [], expression: expr,
            meta: { 
              justifiedByLocus: parent, 
              schemeKey: payload.schemeKey ?? null, 
              cqId: payload.cqId ?? null,
              moveId: m.id,
              targetType: m.targetType,
              targetId: m.targetId,
              actorId: m.actorId,
            },
          },
        });
        
        // Update anchor so follow-up GROUNDS can attach properly
        if (targetKey) anchorForTarget.set(targetKey, locus);
        continue;
      }

      if (kind === 'GROUNDS') {
        const parent =
          explicitPath ?? locFromId ??
          (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
          lastAssertLocus ?? '0';
      
        // annotate delocation (no new DB row)
        const delocInfo = await maybeDelocateForEvidence(m as any, parent).catch(() => null);
      
        const child = pickChild(parent, explicitChild);
        outActs.push({
          designId: design.id,
          act: {
            kind: 'PROPER', polarity: 'P', locus: child,
            ramification: [], expression: expr,
            meta: {
              justifiedByLocus: parent,
              schemeKey: payload.schemeKey ?? null,
              cqId: payload.cqId ?? null,
              moveId: m.id,
              targetType: m.targetType,
              targetId: m.targetId,
              actorId: m.actorId,
              ...(delocInfo ? { delocated: true, delocatedFromDesignId: delocInfo.delocatedFromDesignId } : null),
            },
          },
        });

        if (m.endsWithDaimon) {
          outActs.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'END' } });
        }
        continue;
      }

      if (kind === 'RETRACT') {
        const locus = explicitPath ?? locFromId ?? lastAssertLocus ?? '0';
        outActs.push({
          designId: design.id,
          act: { kind: 'PROPER', polarity: 'P', locus, ramification: ['1'], expression: expr || 'RETRACT' },
        });
        outActs.push({ designId: design.id, act: { kind: 'DAIMON', expression: 'RETRACT' } });
        lastAssertLocus = null;
        continue;
      }

      if (kind === 'CONCEDE') {
        // CONCEDE: Opponent/Proponent acknowledges a claim without retraction
        // Creates PROPER act (acknowledgment) at target locus
        // Unlike RETRACT, doesn't add DAIMON (continues dialogue)
        const locus = explicitPath ?? locFromId ?? 
          (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
          lastAssertLocus ?? '0';
        
        // Create child locus for the concession acknowledgment
        const child = pickChild(locus, explicitChild);
        
        outActs.push({
          designId: design.id,
          act: {
            kind: 'PROPER',
            polarity: 'P', // Conceding party makes positive acknowledgment
            locus: child,
            ramification: [],
            expression: expr || 'CONCEDE',
            meta: {
              justifiedByLocus: locus,
              originalTarget: targetKey ?? null,
            },
          },
        });
        
        // Update commitment store handled by API layer
        // No DAIMON - concession doesn't end the branch
        continue;
      }

      if (kind === 'THEREFORE') {
        // THEREFORE: Assert inference/conclusion from premises
        // Can use multi-act expansion via payload.acts (handled above)
        // Or simple single assertion (legacy path)
        const locus = explicitPath ?? locFromId ?? 
          (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
          lastAssertLocus ?? '0';
        
        // Create child locus for the inference conclusion
        const child = pickChild(locus, explicitChild);
        
        outActs.push({
          designId: design.id,
          act: {
            kind: 'PROPER',
            polarity: 'P', // Proponent asserts conclusion
            locus: child,
            ramification: (payload.ramification as string[]) ?? ['1'],
            expression: expr || 'THEREFORE',
            meta: {
              justifiedByLocus: locus,
              inferenceRule: payload.inferenceRule ?? null,
              premiseIds: payload.premiseIds ?? null,
            },
          },
        });
        
        if (targetKey) anchorForTarget.set(targetKey, child);
        lastAssertLocus = child;
        continue;
      }

      if (kind === 'SUPPOSE') {
        // SUPPOSE: Introduce hypothetical assumption
        // Opens new scope for conditional reasoning
        const locus = explicitPath ?? locFromId ?? `0.${++nextTopIdx}`;
        lastAssertLocus = locus;
        if (targetKey) anchorForTarget.set(targetKey, locus);
        
        outActs.push({
          designId: design.id,
          act: {
            kind: 'PROPER',
            polarity: 'P',
            locus,
            ramification: (payload.ramification as string[]) ?? ['1'],
            expression: expr || 'SUPPOSE',
            meta: {
              hypothetical: true,
              scopeType: 'hypothesis',
            },
          },
        });
        
        // Hypothesis stays open until DISCHARGE
        continue;
      }

      if (kind === 'DISCHARGE') {
        // DISCHARGE: Close hypothetical scope and assert conclusion
        // Should reference the SUPPOSE locus
        const supposeLocus = payload.supposeLocus ?? 
          (targetKey ? anchorForTarget.get(targetKey) ?? null : null) ??
          lastAssertLocus ?? '0';
        
        // Create child to close the hypothesis
        const child = pickChild(supposeLocus, explicitChild);
        
        outActs.push({
          designId: design.id,
          act: {
            kind: 'PROPER',
            polarity: 'P',
            locus: child,
            ramification: [],
            expression: expr || 'DISCHARGE',
            meta: {
              dischargesLocus: supposeLocus,
              hypothetical: false,
            },
          },
        });
        
        // Add DAIMON to close the hypothetical branch
        outActs.push({
          designId: design.id,
          act: { kind: 'DAIMON', expression: 'HYPOTHESIS_DISCHARGED' },
        });
        
        lastAssertLocus = null;
        continue;
      }
    }

    // 4) batched appends (D) — robust to concurrent compiles
    const BATCH = 100;
     const skippedAdditive: Array<{ locus: string; designId: string }> = [];
    for (let i = 0; i < outActs.length; i += BATCH) {
      const chunk = outActs.slice(i, i + BATCH);
      await prisma.$transaction(async (tx2) => {
               for (const { designId, act } of chunk) {
                 try {
                   // compile should be tolerant; stepper will report violations
                   await appendActs(designId, [act], { enforceAdditiveOnce: false }, tx2);
                  } catch (e: any) {
                               if (String(e?.message || e) === 'ADDITIVE_REUSE') {
                                 skippedAdditive.push({ locus: act.locus, designId });
                                 continue;
                               }
                   throw e;
                 }
               }
             }, { timeout: 60_000, maxWait: 10_000 });
    }
    (globalThis as any).__ludics__compile_skipped_additive = skippedAdditive;
}

