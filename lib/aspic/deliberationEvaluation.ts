/**
 * Self-contained deliberation evaluator (Phase 2.1).
 *
 * Builds an AIF graph for a deliberation directly from the DB (arguments,
 * conflicts) and runs the ASPIC+ pipeline with stored preferences. This is a
 * BOUNDED build — RA-nodes, I-nodes, CA-nodes (conflicts), and PA-driven rule
 * preferences — without the scheme-instance ruleType, assumption, CQ, or Pascal
 * extras that `GET /api/aspic/evaluate` layers on. It exists so per-argument
 * surfaces (e.g. the defeats endpoint / PreferenceBadge) can show real defeat
 * data without depending on the full evaluate route. `/api/aspic/evaluate`
 * remains the authoritative, fully-featured evaluation.
 *
 * Rule ids are `RA:<argumentId>` — the canonical key (decision Q1) shared with
 * `populateKBPreferencesFromAIF`, so stored preferences match and gate defeats.
 */
import { prisma } from "@/lib/prismaclient";
import { aifToASPIC, computeAspicSemantics } from "@/lib/aif/translation/aifToAspic";
import { populateKBPreferencesFromAIF } from "@/lib/aspic/translation/aifToASPIC";
import type { AIFGraph } from "@/lib/aif/types";
import type { AspicSemantics } from "@/lib/aif/translation/aifToAspic";

export async function buildDeliberationGraph(deliberationId: string): Promise<AIFGraph> {
  const [args, conflicts] = await Promise.all([
    prisma.argument.findMany({
      where: { deliberationId },
      select: {
        id: true,
        text: true,
        schemeId: true,
        conclusionClaimId: true,
        conclusion: { select: { id: true, text: true } },
        premises: { select: { claim: { select: { id: true, text: true } } } },
      },
    }),
    prisma.conflictApplication.findMany({
      where: { deliberationId },
      select: {
        id: true,
        conflictingArgumentId: true,
        conflictedArgumentId: true,
        conflictingClaimId: true,
        conflictedClaimId: true,
        aspicAttackType: true,
        legacyAttackType: true,
      },
    }),
  ]);

  const nodes: any[] = [];
  const edges: any[] = [];
  const nodeIds = new Set<string>();
  const pushNode = (n: any) => { if (!nodeIds.has(n.id)) { nodes.push(n); nodeIds.add(n.id); } };
  const iNode = (claimId: string, text: string) =>
    pushNode({ id: `I:${claimId}`, nodeType: "I", content: text ?? "", claimText: text ?? "", debateId: deliberationId });

  // RA-nodes + premise/conclusion edges
  for (const a of args) {
    const raId = `RA:${a.id}`;
    pushNode({ id: raId, nodeType: "RA", content: a.text || "Argument", debateId: deliberationId, schemeId: a.schemeId ?? undefined });

    if (a.conclusion) {
      iNode(a.conclusion.id, a.conclusion.text);
      edges.push({ id: `${raId}->I:${a.conclusion.id}`, sourceId: raId, targetId: `I:${a.conclusion.id}`, edgeType: "conclusion", debateId: deliberationId });
    }
    for (const p of a.premises) {
      iNode(p.claim.id, p.claim.text);
      edges.push({ id: `I:${p.claim.id}->${raId}`, sourceId: `I:${p.claim.id}`, targetId: raId, edgeType: "premise", debateId: deliberationId });
    }
  }

  // CA-nodes (conflicts): conflicting → CA → conflicted
  for (const c of conflicts) {
    const caId = `CA:${c.id}`;
    pushNode({
      id: caId,
      nodeType: "CA",
      content: `${c.aspicAttackType ?? c.legacyAttackType ?? "attack"}`,
      debateId: deliberationId,
      aspicAttackType: c.aspicAttackType ?? undefined,
      metadata: { aspicAttackType: c.aspicAttackType ?? undefined, legacyAttackType: c.legacyAttackType ?? undefined },
    });

    const conflicting = c.conflictingArgumentId ? `RA:${c.conflictingArgumentId}` : c.conflictingClaimId ? `I:${c.conflictingClaimId}` : null;
    const conflicted = c.conflictedArgumentId ? `RA:${c.conflictedArgumentId}` : c.conflictedClaimId ? `I:${c.conflictedClaimId}` : null;
    if (!conflicting || !conflicted) continue;

    edges.push({ id: `${conflicting}->${caId}`, sourceId: conflicting, targetId: caId, edgeType: "conflicting", debateId: deliberationId });
    edges.push({ id: `${caId}->${conflicted}`, sourceId: caId, targetId: conflicted, edgeType: "conflicted", debateId: deliberationId });
  }

  return { nodes, edges } as AIFGraph;
}

export async function evaluateDeliberation(
  deliberationId: string,
): Promise<{ graph: AIFGraph; semantics: AspicSemantics }> {
  const graph = await buildDeliberationGraph(deliberationId);
  const theory = aifToASPIC(graph);
  const { premisePreferences, rulePreferences } = await populateKBPreferencesFromAIF(deliberationId);
  theory.preferences = [...premisePreferences, ...rulePreferences];
  const semantics = computeAspicSemantics(theory);
  return { graph, semantics };
}

/**
 * Defeats involving a specific DB argument. A DB argument maps to the
 * constructed ASPIC+ argument(s) whose top rule is `RA:<argumentId>`.
 */
export async function getArgumentDefeats(deliberationId: string, argumentId: string) {
  const { semantics } = await evaluateDeliberation(deliberationId);
  const ruleId = `RA:${argumentId}`;
  const mineIds = new Set(
    semantics.arguments.filter((a) => a.topRule?.ruleId === ruleId).map((a) => a.id),
  );

  const dedupe = (rows: Array<{ id: string; label: string }>) => {
    const seen = new Set<string>();
    return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  };

  const defeatsBy = dedupe(
    semantics.defeats
      .filter((d) => mineIds.has(d.defeater.id))
      .map((d) => ({ id: d.defeated.id, label: String(d.defeated.conclusion ?? d.defeated.id) })),
  );
  const defeatedBy = dedupe(
    semantics.defeats
      .filter((d) => mineIds.has(d.defeated.id))
      .map((d) => ({ id: d.defeater.id, label: String(d.defeater.conclusion ?? d.defeater.id) })),
  );

  return { defeatsBy, defeatedBy };
}
