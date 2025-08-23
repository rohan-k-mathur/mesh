// app/api/proposals/merge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";

// canonicalize + hash + signature (consistent)
import { canonicalize } from "@/lib/receipts/jcs";          // <- your minimal JCS canonicalizer
import { versionHashOf } from "@/lib/receipts/hash";        // sha256 over canonicalized bytes (returns "sha256:<hex>")
import { signReceipt } from "@/lib/receipts/sign";          // returns { signature, keyId }

// policy check (baseline owner-or-mod)
import { checkMergeAllowed, DefaultMergePolicy } from "@/lib/gitchat/policies";

export const runtime = "nodejs";

const bodySchema = z.object({
  rootMessageId: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)),
  proposalMessageId: z
    .union([z.string(), z.number(), z.bigint()])
    .transform((v) => BigInt(v))
    .optional(),
  facetId: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)).optional(),
});

// additional pragmatic gate (owner/mod/proposal author)
async function canMergeLocal({
  rootMessageId,
  userId,
  proposalMessageId,
}: {
  rootMessageId: bigint;
  userId: bigint;
  proposalMessageId?: bigint;
}) {
  const root = await prisma.message.findUnique({
    where: { id: rootMessageId },
    select: { sender_id: true, conversation_id: true },
  });
  if (!root) return false;

  // 1) Root author can merge
  if (root.sender_id === userId) return true;

  // 2) Mods/admins (if present on participant row)
  const part = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: root.conversation_id, user_id: userId },
    select: { role: true } as any,
  });
  const role = (part as any)?.role as string | undefined;
  if (role && ["ADMIN", "MOD", "OWNER"].includes(role.toUpperCase())) return true;

  // 3) (Optional) allow any participant in dev
  if (process.env.MERGE_ALLOW_PARTICIPANTS === "true" && part) return true;

  // 4) Proposal author can merge their own candidate
  if (proposalMessageId) {
    const prop = await prisma.message.findUnique({
      where: { id: proposalMessageId },
      select: { drift: { select: { created_by: true } } } as any,
    });
    if (prop?.drift?.created_by && prop.drift.created_by === userId) return true;
  }

  return false;
}

/** Clone a facet to the root message. Tries to set a default facet if your schema has it; otherwise continues silently. */
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

  // Try to set default facet if column exists; ignore if schema doesn't have it
  try {
    await prisma.message.update({
      where: { id: rootMessageId },
      data: { defaultFacetId: newFacet.id as any, edited_at: new Date() as any } as any,
    });
  } catch {
    // no-op: defaultFacetId not present in your schema
  }

  // canonical bytes for the facet payload
  const body = { type: "facet", facet: { kind: (facet as any).kind ?? "DEFAULT", content: (facet as any).content } };
  return { newFacetId: newFacet.id as any, canon: canonicalize(body) };
}

export async function POST(req: NextRequest) {
  const me = await getUserFromCookies();
  if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });

  const { rootMessageId, proposalMessageId, facetId } = bodySchema.parse(await req.json());

  // Policy gate (room/conversation policy)
  const allowed = await checkMergeAllowed(DefaultMergePolicy, me.userId, rootMessageId);
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  // Pragmatic gate (owner/mod/proposal author)
  if (!(await canMergeLocal({ rootMessageId, userId: me.userId, proposalMessageId }))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Decide merge mode
  let canonBytes = "";
  let fromFacetIds: string[] = [];
  let mergedFromMessageId: string | null = null;

  try {
    // Get the root's conversation (used later for broadcasts/note)
    const msg = await prisma.message.findUnique({
      where: { id: rootMessageId },
      select: { id: true, conversation_id: true },
    });
    if (!msg) return new NextResponse("Not found", { status: 404 });

    if (facetId) {
      // Facet merge: clone facet into root
      const { newFacetId, canon } = await cloneFacetToRoot(rootMessageId, facetId);
      canonBytes = canon;
      fromFacetIds = [String(facetId)];
      mergedFromMessageId = null; // not text
    } else {
      // Text merge: copy text from proposal message
      const candidate = await prisma.message.findUnique({
        where: { id: proposalMessageId! },
        select: { id: true, text: true },
      });
      if (!candidate || !candidate.text) {
        return new NextResponse("No mergeable text", { status: 400 });
      }

      await prisma.message.update({
        where: { id: rootMessageId },
        data: { text: candidate.text, edited_at: new Date() as any },
      });

      canonBytes = canonicalize({ type: "text", text: candidate.text.trim() });
      mergedFromMessageId = candidate.id.toString();
    }

    // Compute version hash from canonical content
    const versionHash = versionHashOf({ merged: canonBytes });

    // Latest (by time) previous receipt for parent linkage
    const lastReceipt = await prisma.mergeReceipt.findFirst({
      where: { message_id: msg.id },
      orderBy: [{ merged_at: "desc" }, { id: "desc" }],
      select: { version_hash: true },
    });

    // Aggregate approvals/blocks for included facet (if any)
    let approvals: any[] = [];
    let blocks: any[] = [];
    if (fromFacetIds.length > 0) {
      const sigRows = await prisma.proposalSignal.findMany({
        where: { message_id: msg.id, facet_id: { in: fromFacetIds } },
        select: { user_id: true, kind: true, created_at: true },
      });
      approvals = sigRows
        .filter((r) => r.kind === "APPROVE")
        .map((r) => ({ userId: r.user_id.toString(), role: "member", at: r.created_at.toISOString() }));
      blocks = sigRows
        .filter((r) => r.kind === "BLOCK")
        .map((r) => ({ userId: r.user_id.toString(), role: "member", at: r.created_at.toISOString() }));
    }

    // Build & sign receipt (no v field—v is computed by the receipts API)
    const receiptBody = {
      messageId: msg.id.toString(),
      versionHash,
      parents: lastReceipt?.version_hash ? [lastReceipt.version_hash] : [],
      fromFacetIds,
      mergedBy: me.userId.toString(),
      mergedAt: new Date().toISOString(),
      policy: { id: "owner-or-mod@v1", quorum: null, minApprovals: null, timeoutSec: null },
      approvals,
      blocks,
      summary: null as string | null,
      prevReceiptHash: lastReceipt?.version_hash || null,
    };
    const { signature } = signReceipt(receiptBody);

    await prisma.mergeReceipt.create({
      data: {
        message_id: msg.id,
        version_hash: versionHash,
        parents: receiptBody.parents as any,
        from_facet_ids: receiptBody.fromFacetIds as any,
        merged_by: me.userId,
        merged_at: new Date(receiptBody.mergedAt),
        policy_id: "owner-or-mod@v1",
        approvals: approvals as any,
        blocks: blocks as any,
        summary: receiptBody.summary,
        prev_receipt_hash: receiptBody.prevReceiptHash,
        signature,
      },
    });

    // Broadcast so UIs refresh the merged message + receipts chip
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await admin
        .channel(`conversation-${msg.conversation_id.toString()}`)
        .send({
          type: "broadcast",
          event: "proposal_merge",
          payload: { rootMessageId: msg.id.toString(), versionHash },
        });
    } catch (e) {
      console.warn("[ap] proposal_merge broadcast failed", e);
    }

    // Lightweight system note
    try {
      const count = await prisma.mergeReceipt.count({ where: { message_id: rootMessageId } });
      await prisma.message.create({
        data: {
          conversation_id: msg.conversation_id,
          sender_id: me.userId,
          text: `Merged to v${count} by user ${me.userId}`,
          meta: { kind: "MERGE_NOTE", rootMessageId: rootMessageId.toString() } as any,
        },
      });
    } catch {}

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
