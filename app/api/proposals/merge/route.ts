// app/api/proposals/merge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import { canonicalize, sha256Hex, signReceiptBytes } from "@/lib/crypto/mergeReceipt";
 import { versionHashOf } from "@/lib/receipts/hash";
 import { signReceipt } from "@/lib/receipts/sign";
 import { checkMergeAllowed, DefaultMergePolicy } from "@/lib/gitchat/policies";

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

// replace the old helper
async function canMerge({
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

  // 2) Conversation admin/mods (if you track roles)
  const part = await prisma.conversationParticipant.findFirst({
    where: { conversation_id: root.conversation_id, user_id: userId },
    select: { /* adjust to your schema */ role: true } as any,
  });

  // If you do have roles, allow admins/mods
  const role = (part as any)?.role as string | undefined;
  if (role && ["ADMIN", "MOD", "OWNER"].includes(role.toUpperCase())) return true;

  // 3) (Optional) allow any participant to merge during dev
  if (process.env.MERGE_ALLOW_PARTICIPANTS === "true" && part) return true;

  // 4) Proposal author can merge (when proposalMessageId is provided)
  if (proposalMessageId) {
    const prop = await prisma.message.findUnique({
      where: { id: proposalMessageId },
      select: { drift: { select: { created_by: true } } } as any,
    });
    if (prop?.drift?.created_by && prop.drift.created_by === userId) return true;
  }

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

    // Policy gate
    const allowed = await checkMergeAllowed(DefaultMergePolicy, me.userId, rootMessageId);
    if (!allowed) return new NextResponse("Forbidden", { status: 403 });
  

  if (!(await canMerge({ rootMessageId, userId: me.userId, proposalMessageId }))) {
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
 
       // TODO: load the chosen facet payload; for now hash the facet id (replace with real payload load)
       const payloadForHash = { facetId: chosenFacetId, messageId: String(msg.id) };
       const versionHash = versionHashOf(payloadForHash);
     
       // Determine next version number
       const last = await prisma.mergeReceipt.findFirst({
         where: { message_id: msg.id },
         orderBy: { v: "desc" },
         select: { v: true, version_hash: true },
       });
       const prevV = last?.v ?? 0;
       const prevReceipt = await prisma.mergeReceipt.findFirst({
         where: { message_id: msg.id, v: prevV },
         orderBy: { v: "desc" },
         select: { id: true, version_hash: true, signature: true, policy_id: true },
       });
     
       // Aggregate approvals/blocks for included facet(s)
       const sigRows = await prisma.proposalSignal.findMany({
         where: { message_id: msg.id, facet_id: { in: facetIds } },
         select: { user_id: true, kind: true, created_at: true },
       });
       const approvals = sigRows.filter(r => r.kind === "APPROVE").map(r => ({
         userId: r.user_id.toString(),
         role: "member",
         at: r.created_at.toISOString()
       }));
       const blocks = sigRows.filter(r => r.kind === "BLOCK").map(r => ({
         userId: r.user_id.toString(),
         role: "member",
         at: r.created_at.toISOString()
       }));
     
       // Create receipt body (unsigned)
       const receiptBody = {
         messageId: msg.id.toString(),
         v: prevV + 1,
         versionHash,
         parents: last?.version_hash ? [last.version_hash] : [],
         fromFacetIds: facetIds,
         mergedBy: me.userId.toString(),
         mergedAt: new Date().toISOString(),
         policy: { id: "owner-or-mod@v1", quorum: null, minApprovals: null, timeoutSec: null },
         approvals,
         blocks,
         summary: summary || null,
         prevReceiptHash: last ? last.version_hash : null
       };
       const { signature, keyId } = signReceipt(receiptBody);
     
       // Persist receipt
       const rec = await prisma.mergeReceipt.create({
         data: {
           message_id: msg.id,
           v: receiptBody.v,
           version_hash: versionHash,
           parents: receiptBody.parents as any,
           from_facet_ids: receiptBody.fromFacetIds as any,
           merged_by: me.userId,
           merged_at: new Date(receiptBody.mergedAt),
           policy_id: "owner-or-mod@v1",
           approvals: approvals as any,
           blocks: blocks as any,
           summary: receiptBody.summary || null,
           prev_receipt_hash: receiptBody.prevReceiptHash || null,
           signature: signature,
         },
       });
     

    // after computing `canonBytes` and `versionHash`
const last = await prisma.mergeReceipt.findFirst({
  where: { message_id: rootMessageId },
  orderBy: { merged_at: "desc" },
  select: { version_hash: true }
});
if (last?.version_hash === versionHash) {
  return new NextResponse("Already current", { status: 409 });
}

    await prisma.mergeReceipt.create({
      data: {
        message_id: rootMessageId,
        version_hash: versionHash,
        from_facet_ids: fromFacetIds,
        merged_by: me.userId,
        signature: `${signed.alg}:${signed.signature}`,
      },
    });
    // app/api/proposals/merge/route.ts (inside POST, after writing MergeReceipt)
try {
  // fetch conversation_id to address the right channel topic (your code already uses `conversation-${id}`)
  const convo = await prisma.message.findUnique({
    where: { id: rootMessageId },
    select: { conversation_id: true },
  });

  if (convo?.conversation_id) {
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await admin
      .channel(`conversation-${convo.conversation_id.toString()}`)
      .send({
        type: "broadcast",
        event: "proposal_merge",
        payload: { rootMessageId: rootMessageId.toString(), versionHash },
      });
  }
} catch (e) {
  console.warn("[ap] proposal_merge broadcast failed", e);
}

    await prisma.message.create({
      data: {
        conversation_id: (await prisma.message.findUnique({ where: { id: rootMessageId }, select: { conversation_id: true } }))!.conversation_id,
        sender_id: me.userId,
        text: `Merged to v${(await prisma.mergeReceipt.count({ where: { message_id: rootMessageId } }))} by user ${me.userId}`,
        meta: { kind: "MERGE_NOTE", rootMessageId: rootMessageId.toString() } as any
      }
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
