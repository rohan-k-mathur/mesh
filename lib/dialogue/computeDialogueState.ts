// lib/dialogue/computeDialogueState.ts
import { prisma } from "@/lib/prismaclient";

export type DialogueState = {
  argumentId: string;
  attackCount: number;
  answeredCount: number; // How many have GROUNDS response
  pendingCount: number; // Unanswered attacks
  state: "strong" | "challenged" | "refuted";
};

/**
 * Compute the dialogue state for an argument by checking which attacks
 * have been answered with GROUNDS responses.
 */
export async function computeDialogueState(
  argumentId: string
): Promise<DialogueState> {
  // 1. Find all ArgumentEdge where toArgumentId = argumentId AND type = undercut/rebut
  const attacks = await prisma.argumentEdge.findMany({
    where: {
      toArgumentId: argumentId,
      type: { in: ["undercut", "rebut"] },
    },
    select: {
      id: true,
      fromArgumentId: true,
      targetClaimId: true,
      deliberationId: true,
      createdAt: true,
      from: {
        select: {
          authorId: true,
        },
      },
    },
  });

  if (attacks.length === 0) {
    return {
      argumentId,
      attackCount: 0,
      answeredCount: 0,
      pendingCount: 0,
      state: "strong",
    };
  }

  // 2. For each attack, check if there's a GROUNDS response:
  //    - Look for Argument created after the attack
  //    - That defends the target claim (provides support for it)
  //    - By a different author than the attacker
  let answeredCount = 0;

  for (const attack of attacks) {
    // A GROUNDS response would be an argument that:
    // - Supports the claim being attacked (if targetClaimId exists)
    // - Was created after the attack
    // - By someone other than the attacker (ideally the original argument author)

    if (attack.targetClaimId) {
      const response = await prisma.argument.findFirst({
        where: {
          deliberationId: attack.deliberationId,
          conclusionClaimId: attack.targetClaimId,
          createdAt: { gt: attack.createdAt },
          // Optionally filter by authorId != attacker's authorId
          authorId: { not: attack.from.authorId },
        },
      });

      if (response) {
        answeredCount++;
      }
    } else {
      // For attacks without specific target claim, check for any defense
      // This is a simplified heuristic - could be refined
      const response = await prisma.argument.findFirst({
        where: {
          deliberationId: attack.deliberationId,
          createdAt: { gt: attack.createdAt },
          // Look for arguments that reference the attacked argument
        },
        take: 1,
      });

      // Conservative: don't count as answered unless we have clear evidence
      // This prevents false positives
    }
  }

  const pendingCount = attacks.length - answeredCount;

  // Determine state:
  // - strong: all attacks answered (pendingCount = 0)
  // - challenged: some attacks answered but not all (0 < answeredCount < attackCount)
  // - refuted: no attacks answered (answeredCount = 0)
  let state: "strong" | "challenged" | "refuted";
  if (pendingCount === 0) {
    state = "strong";
  } else if (answeredCount > 0) {
    state = "challenged";
  } else {
    state = "refuted";
  }

  return {
    argumentId,
    attackCount: attacks.length,
    answeredCount,
    pendingCount,
    state,
  };
}
