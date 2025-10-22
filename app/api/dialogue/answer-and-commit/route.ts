// app/api/dialogue/answer-and-commit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { applyToCS } from "@/packages/ludics-engine/commitments";
import { getCurrentUserId } from "@/lib/serverutils";
import { Prisma } from "@prisma/client";
import { emitBus } from "@/lib/server/bus";

const Body = z.object({
  deliberationId: z.string().min(5),
  targetType: z.enum(["argument", "claim", "card"]),
  targetId: z.string().min(5),
  cqKey: z.string().min(1).default("default"),
  locusPath: z.string().min(1).default("0"),
  expression: z.string().min(1), // canonical label or rule
  original: z.string().optional().nullable(), // optional NL text
  commitOwner: z.enum(["Proponent", "Opponent"]),
  commitPolarity: z.enum(["pos", "neg"]).default("pos"),
});

const makeSignature = (
  targetType: string,
  targetId: string,
  cqKey: string,
  locusPath: string,
  expression: string
) =>
  [
    "GROUNDS",
    targetType,
    targetId,
    cqKey,
    locusPath,
    String(expression).slice(0, 64),
  ].join(":");

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      deliberationId,
      targetType,
      targetId,
      cqKey,
      locusPath,
      expression,
      original,
      commitOwner,
      commitPolarity,
    } = parsed.data;

    // Validate target exists and matches deliberation
    try {
      if (targetType === "argument") {
        const target = await prisma.argument.findFirst({
          where: { id: targetId, deliberationId },
          select: { id: true },
        });
        if (!target) {
          return NextResponse.json(
            { ok: false, error: "Argument not found or does not match deliberation" },
            { status: 404 }
          );
        }
      } else if (targetType === "claim") {
        const target = await prisma.claim.findFirst({
          where: { id: targetId, deliberationId },
          select: { id: true },
        });
        if (!target) {
          return NextResponse.json(
            { ok: false, error: "Claim not found or does not match deliberation" },
            { status: 404 }
          );
        }
      }
    } catch (err) {
      console.error("[answer-and-commit] Target validation error:", err);
      return NextResponse.json(
        { ok: false, error: "Failed to validate target" },
        { status: 500 }
      );
    }

    const userId = await getCurrentUserId().catch(() => null);
    const actorId = String(userId ?? "unknown");

    // 1) Answer the WHY with GROUNDS move
    const payload = {
      expression,
      cqId: cqKey,
      locusPath,
      original: original ?? expression,
    };
    const signature = makeSignature(
      targetType,
      targetId,
      cqKey,
      locusPath,
      expression
    );

    let move: any;
    try {
      move = await prisma.dialogueMove.create({
        data: {
          deliberationId,
          targetType,
          targetId,
          kind: "GROUNDS",
          payload,
          actorId,
          signature,
        },
      });
    } catch (e: any) {
      // Handle duplicate signatures gracefully
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        console.log(
          "[answer-and-commit] Duplicate GROUNDS move detected, fetching existing"
        );
        move = await prisma.dialogueMove.findFirst({
          where: { deliberationId, signature },
          orderBy: { createdAt: "desc" },
        });
        if (!move) {
          return NextResponse.json(
            { ok: false, error: "Failed to create or fetch GROUNDS move" },
            { status: 500 }
          );
        }
      } else {
        console.error("[answer-and-commit] Failed to create GROUNDS move:", e);
        throw e;
      }
    }

    // 2) Commit the same assertion to the chosen owner's CS
    try {
      await applyToCS(deliberationId, commitOwner, {
        add: [
          {
            label: expression,
            basePolarity: commitPolarity,
            baseLocusPath: locusPath,
            entitled: true,
          },
        ],
      });
    } catch (err) {
      console.error(
        "[answer-and-commit] Failed to apply to commitment store:",
        err
      );
      return NextResponse.json(
        { ok: false, error: "Failed to update commitment store" },
        { status: 500 }
      );
    }

    // 3) Emit bus events to trigger UI refresh
    try {
      emitBus("dialogue:moves:refresh", { deliberationId, moveId: move.id, kind: "GROUNDS" });
      emitBus("dialogue:cs:refresh", { deliberationId, participantId: commitOwner });
    } catch (err) {
      console.error("[answer-and-commit] Failed to emit bus events:", err);
      // Non-fatal, continue
    }

    return NextResponse.json({ ok: true, move, commitOwner, expression });
  } catch (err) {
    console.error("[answer-and-commit] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
