/**
 * M5 — chain-fitness attacker weighting.
 *
 * The chain aggregator in `lib/deliberation/chainExposure.ts` weights
 * each inbound attack edge by the attacker argument's standing, so a
 * chain whose attackers are themselves refuted no longer reads as
 * catastrophically fragile. This file pins the weighting contract:
 *
 *   - tested-undermined attacker → 0.1 (effectively absorbed)
 *   - tested-attacked attacker   → 0.5 (partial pressure)
 *   - everything else            → 1.0 (full pressure)
 *
 * And demonstrates, on a Hinge-1-shaped synthetic input, that the
 * weighted aggregate is materially less negative than the flat count
 * that the previous implementation produced.
 */

import { attackerCredibility } from "@/lib/deliberation/chainExposure";
import { computeFitnessBreakdown } from "@/lib/citations/argumentAttestation";

describe("chain attacker weighting", () => {
  describe("attackerCredibility contract", () => {
    it("downweights refuted attackers to ≈0", () => {
      expect(attackerCredibility("tested-undermined")).toBeLessThanOrEqual(0.1);
    });

    it("partially downweights contested attackers", () => {
      const c = attackerCredibility("tested-attacked");
      expect(c).toBeGreaterThan(0.1);
      expect(c).toBeLessThan(1.0);
    });

    it("gives full weight to unanswered attackers", () => {
      expect(attackerCredibility("tested-survived")).toBe(1.0);
      expect(attackerCredibility("untested-supported")).toBe(1.0);
      expect(attackerCredibility("untested-default")).toBe(1.0);
    });
  });

  describe("Hinge-1-shaped aggregate is less negative than flat count", () => {
    // Synthetic stand-in for the Hinge-1 fixture: 5 inbound attack
    // edges on the chain, of which 3 originate from `tested-undermined`
    // attackers (Iyengar response refuting Druckman's critique etc.),
    // 1 from a `tested-attacked` attacker, and 1 from an unanswered
    // `untested-default` attacker. The flat aggregator counted 5
    // attacks; the weighted aggregator should count materially fewer.
    const standings = [
      "tested-undermined",
      "tested-undermined",
      "tested-undermined",
      "tested-attacked",
      "untested-default",
    ] as const;

    const flatTotal = standings.length;
    const weightedTotal = standings
      .map((s) => attackerCredibility(s))
      .reduce((a, b) => a + b, 0);

    it("weighted attack-edge sum is materially less than flat count", () => {
      expect(weightedTotal).toBeLessThan(flatTotal);
      // Target: at least a 40% reduction. With the 0.1/0.5/1.0 schedule
      // and the standings above, weighted = 0.1*3 + 0.5 + 1.0 = 1.8
      // (vs flat 5.0), a 64% reduction — well within the bar.
      expect(weightedTotal / flatTotal).toBeLessThan(0.6);
    });

    it("aggregate fitness is less negative when attackers are refuted", () => {
      // Shared non-attack components held constant; only the attack
      // count changes between the flat and weighted aggregates.
      const base = {
        cqAnswered: 4,
        supportEdges: 6,
        attackCAs: 0,
        evidenceWithProvenance: 2,
      };
      const flat = computeFitnessBreakdown({
        ...base,
        attackEdges: flatTotal,
      });
      const weighted = computeFitnessBreakdown({
        ...base,
        attackEdges: weightedTotal,
      });
      expect(weighted.total).toBeGreaterThan(flat.total);
    });
  });
});
