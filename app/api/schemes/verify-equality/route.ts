/**
 * Spec 4 §3.3 — POST /api/schemes/verify-equality
 *
 * Body: { leftSchemeId: string; rightSchemeId: string; options?: VerifierOptions }
 * Returns: VerifierVerdict | { error: "scheme-not-found" | "bad-request" }
 *
 * Authentication: matches existing /api/schemes/* endpoints (no admin gate
 * enforced here; align with Spec 4 phase 4a v1 — admin gating becomes
 * mandatory when the non-redundancy panel ships in phase 4b).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaclient";
import { z } from "zod";
import {
  verifyBehaviourEquality,
  type SchemeWithCqs,
} from "@/lib/schemes/verifier";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const Body = z.object({
  leftSchemeId: z.string().min(1),
  rightSchemeId: z.string().min(1),
  options: z
    .object({
      searchBoundMs: z.number().int().positive().max(60_000).optional(),
      textNormalisation: z.enum(["exact", "case-trim", "fuzzy"]).optional(),
      cqKeyMatching: z.enum(["exact", "by-attack-type-and-scope"]).optional(),
    })
    .optional(),
});

async function loadSchemeWithCqs(id: string): Promise<SchemeWithCqs | null> {
  const row = await prisma.argumentScheme.findUnique({
    where: { id },
    include: { cqs: true },
  });
  return row as SchemeWithCqs | null;
}

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "bad-request", issues: parsed.error.issues }, { status: 400 });
  }

  const { leftSchemeId, rightSchemeId, options } = parsed.data;
  const [left, right] = await Promise.all([
    loadSchemeWithCqs(leftSchemeId),
    loadSchemeWithCqs(rightSchemeId),
  ]);
  if (!left || !right) {
    return NextResponse.json({ error: "scheme-not-found" }, { status: 404 });
  }

  const verdict = await verifyBehaviourEquality(left, right, options);
  return NextResponse.json(verdict, { headers: { "Cache-Control": "no-store" } });
}
