 import { NextRequest, NextResponse } from "next/server";
 import { z } from "zod";
 import { prisma } from "@/lib/prismaclient";
 import { getUserFromCookies } from "@/lib/serverutils";
 
 const bodySchema = z.object({
   rootMessageId: z.coerce.bigint(),
   // v1 merges based on the most recent *text* message inside a proposal drift.
   // If the client already picked a specific message to merge, pass it:
   proposalMessageId: z.coerce.bigint().optional(),
 });
 
 async function isOwnerOrMod(rootMessageId: bigint, userId: bigint) {
   const msg = await prisma.message.findUnique({
     where: { id: rootMessageId },
     select: {
       sender_id: true,
       conversation_id: true,
       conversation: { select: { id: true } },
     },
   });
   if (!msg) return false;
   if (msg.sender_id === userId) return true;
   // TODO: extend with real moderator/role checks if available
   return false;
 }
 
 export async function POST(req: NextRequest) {
   const me = await getUserFromCookies();
   if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });
   const { rootMessageId, proposalMessageId } = bodySchema.parse(await req.json());
 
   // Root message (we'll only support plain-text merge in v1)
   const root = await prisma.message.findUnique({
     where: { id: rootMessageId },
     select: {
       id: true,
       text: true,
       conversation_id: true,
       sender_id: true,
       // If your schema exposes whether the message has Sheaf facets quickly, query it here:
       // _count: { select: { SheafFacet: true } }   // uncomment if you have this relation exposed
     },
   });
   if (!root) return new NextResponse("Not Found", { status: 404 });
   if (!(await isOwnerOrMod(root.id, me.userId))) {
     return new NextResponse("Forbidden", { status: 403 });
   }
 
   // If the message already has Sheaf facets, bail in v1 (we will implement Sheaf merge next)
   // If you have the _count relation, use it; otherwise, you can detect this client-side and disable the CTA.
   // return new NextResponse("Sheaf merge not implemented yet", { status: 400 });
 
   // Find the proposal message text to merge
   let candidate = null as null | { id: bigint; text: string | null; drift_id: bigint | null };
   if (proposalMessageId) {
     candidate = await prisma.message.findUnique({
       where: { id: proposalMessageId },
       select: { id: true, text: true, drift_id: true },
     });
   } else {
     // Fallback: pick most recent text message inside any proposal drift for this root
     const prop = await prisma.drift.findFirst({
       where: { conversation_id: root.conversation_id, root_message_id: root.id, kind: "PROPOSAL" },
       select: { id: true },
       orderBy: { created_at: "desc" },
     });
     if (prop) {
       candidate = await prisma.message.findFirst({
         where: { drift_id: prop.id, text: { not: null } },
         select: { id: true, text: true, drift_id: true },
         orderBy: { created_at: "desc" },
       });
     }
   }
   if (!candidate || !candidate.text) {
     return new NextResponse("No mergeable proposal text found", { status: 400 });
   }
 
   // Update the root message text (plain‑text v1)
   await prisma.message.update({
     where: { id: root.id },
     data: { text: candidate.text, edited_at: new Date() as any },
   });
 
   // Optional: insert a small system note (if you have that pattern)
   // await prisma.message.create({ data: { ... } })
 
   return NextResponse.json({ ok: true, mergedFromMessageId: candidate.id.toString() });
 }
 