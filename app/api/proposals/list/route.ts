 import { NextRequest, NextResponse } from "next/server";
 import { z } from "zod";
 import { prisma } from "@/lib/prismaclient";
 import { getUserFromCookies } from "@/lib/serverutils";
 import { jsonSafe } from "@/lib/bigintjson";
 
 const querySchema = z.object({
   rootMessageId: z.coerce.bigint(),
 });
 
 async function userInConversation(conversationId: bigint, userId: bigint) {
   const part = await prisma.conversationParticipant.findFirst({
     where: { conversation_id: conversationId, user_id: userId },
     select: { user_id: true },
   });
   if (part) return true;
   const dm = await prisma.conversation.findUnique({
     where: { id: conversationId },
     select: { user1_id: true, user2_id: true },
   });
   return !!dm && (dm.user1_id === userId || dm.user2_id === userId);
 }
 
 export async function GET(req: NextRequest) {
   const me = await getUserFromCookies();
   if (!me?.userId) return new NextResponse("Unauthorized", { status: 401 });
   const { rootMessageId } = querySchema.parse(
     Object.fromEntries(req.nextUrl.searchParams.entries())
   );
 
   // Check root message   membership
   const root = await prisma.message.findUnique({
     where: { id: rootMessageId },
     select: { id: true, conversation_id: true },
   });
   if (!root) return new NextResponse("Not Found", { status: 404 });
   if (!(await userInConversation(root.conversation_id, me.userId))) {
     return new NextResponse("Forbidden", { status: 403 });
   }
 
   const drifts = await prisma.drift.findMany({
     where: { conversation_id: root.conversation_id, root_message_id: root.id, kind: "PROPOSAL" },
     select: {
       id: true,
       title: true,
       created_at: true,
       updated_at: true,
       created_by: true,
       is_closed: true,
       is_archived: true,
     },
     orderBy: { created_at: "asc" },
   });
 
   return NextResponse.json(jsonSafe({ items: drifts }));
 }
 