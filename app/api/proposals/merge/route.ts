// app/api/proposals/merge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { canonicalize, sha256Hex, signReceiptBytes } from "@/lib/crypto/mergeReceipt";

export const runtime = "nodejs";

const bodySchema = z.object({
  rootMessageId: z.union([z.string(), z.number(), z.bigint()]).transform(v => BigInt(v)),
  // Option A: merge from latest text in a proposal message:
  proposalMessageId: z.union([z.string(), z.number(), z.bigint()]).transform(v => BigInt(v)).optional(),
  // Option B: merge from a facet id:
  facetId: z.union([z.string(), z.number(), z.bigint()]).transform(v => BigInt(v)).optional(),
});

async function isOwnerOrMod(rootMessageId: bigint, userId: bigint) {
  const msg = await prisma.message.findUnique({
    where: { id: rootMessageId },
    select: { sender_id: true, conversation_id: true },
  });
  if (!msg) return false;
  if (msg.sender_id === userId) return true;
  // TODO: include moderator roles if present
  return false;
}

/** Clone a facet by copying its content to a new facet attached to root message */
async function cloneFacetToRoot(rootMessageId: bigint, facetId: bigint) {
  const facet = await prisma.sheafFacet.findUnique({
    where: { id: facetId },
    select: { id: true, kind: true, content: true, meta: true },
  } as any);
  if (!facet) throw new Error("facet not found");

  const newFacet = await prisma.sheafFacet.create({
    data: {
      message_id: rootMessageId,
      kind: (facet as any).kind ?? "DEFAULT",
      content: (facet as any).content,
      meta: (facet as any).meta ?? null,
    } as any,
  });

  // Set as default
  await prisma.message.update({
    where: { id: rootMessageId },
    data: { defaultFacetId: newFacet.id as any, edited_at: new Date() as any },
  });

  // Return canonical bytes for receipt
  const body = { type: "facet", facet: { kind: (facet as any).kind, content: (facet as any).content } };
  return { newFacetId: newFacet.id as any, canon: canonicalize(body) };
}

export async function POST(req: NextRequest) {
  const me = await getUserFromCookies();
  if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

  const { rootMessageId, proposalMessageId, facetId } = bodySchema.parse(await req.json());
  if (!(await isOwnerOrMod(rootMessageId, me.userId))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Decide merge mode: Facet preferred if provided, else text
  let canonBytes = "";
  let fromFacetIds: string[] = [];
  let mergedFromMessageId: string | null = null;

  try {
    if (facetId) {
      const { newFacetId, canon } = await cloneFacetToRoot(rootMessageId, facetId);
      canonBytes = canon;
      fromFacetIds = [facetId.toString()];
    } else {
      // Plain text merge from a proposal message
      const candidate = await prisma.message.findUnique({
        where: { id: proposalMessageId! },
        select: { id: true, text: true },
      });
      if (!candidate || !candidate.text) return new NextResponse("No mergeable text", { status: 400 });

      await prisma.message.update({
        where: { id: rootMessageId },
        data: { text: candidate.text, edited_at: new Date() as any },
      });

      canonBytes = canonicalize({ type: "text", text: candidate.text.trim() });
      mergedFromMessageId = candidate.id.toString();
    }

    // MergeReceipt
    const versionHash = sha256Hex(canonBytes);
    const signed = signReceiptBytes(Buffer.from(canonBytes, "utf8"));

    await prisma.mergeReceipt.create({
      data: {
        message_id: rootMessageId,
        version_hash: versionHash,
        from_facet_ids: fromFacetIds,
        merged_by: me.userId,
        signature: `${signed.alg}:${signed.signature}`,
      },
    });

    // Optional: system note in the conversation (left to your existing system)
    // await prisma.message.create({ ... })

    return NextResponse.json({
      ok: true,
      mode: facetId ? "FACET" : "TEXT",
      mergedFromMessageId,
      versionHash,
    });
  } catch (e: any) {
    console.error("[proposals/merge] error", e);
    return new NextResponse("Merge failed", { status: 500 });
  }
}
