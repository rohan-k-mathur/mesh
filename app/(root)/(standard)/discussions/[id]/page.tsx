// app/discussions/[id]/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import DiscussionView from "@/components/discussion/DiscussionView";
import { GridBG } from "@/components/discussion/FX";
// import { GridBG } from "@/components/ui/GridBG";



// model Discussion {
//   id          String  @id @default(cuid())
//   slug        String? @unique
//   title       String
//   description String?
//   createdById String
//   visibility  String  @default("public") // "public" | "private" | "unlisted"

//   // Link to existing chat conversation (optional at creation; we can create on demand)
//   conversationId BigInt? @unique

//   conversation Conversation? @relation(fields: [conversationId], references: [id])

//   // Polymorphic attachment to any object (optional)
//   attachedToType String? // e.g. "article" | "comment" | "stack" | "claim" | "post"
//   attachedToId   String? // store as string; can hold cuid, uuid, bigint, etc.

//   upgradedToDeliberation Deliberation?           @relation("DiscussionToDeliberation")
//   messages               DiscussionMessage[] // 👈 back-rel for DiscussionMessage.discussion
//   participants           DiscussionParticipant[] // 👈 back-rel for DiscussionParticipant.discussion

//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt

//   forumComments ForumComment[]
//   deliberations DiscussionDeliberation[]

//   ConversationParticipant ConversationParticipant[]

//   @@index([attachedToType, attachedToId])
// }

export default async function DiscussionPage({ params }: { params: { id: string } }) {
    const discussion = await prisma.discussion.findUnique({
     where: { id: params.id },
     // You cannot have both 'select' and 'include' in the same query.
     // Your 'select' statement below already handles fetching deliberations.
     select: {
       id: true,
       title: true,
       description: true,
       createdById: true,
       conversationId: true,
       deliberations: true, // This selects the full 'deliberations' relation
     },
   });
  if (!discussion) return notFound();

  const conversationId =
    discussion.conversationId != null ? String(discussion.conversationId) : null;

  // server hydration (optional but recommended so Chat shows immediately)
  let initialMessages: any[] = [];
  const user = await getUserFromCookies();

  if (conversationId && user?.userId) {
    const h = headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const base = `${proto}://${host}`;
    const r = await fetch(
      `${base}/api/sheaf/messages?conversationId=${encodeURIComponent(
        conversationId
      )}&userId=${encodeURIComponent(user.userId.toString())}&limit=50`,
      { cache: "no-store" }
    );
    if (r.ok) {
      const j = await r.json().catch(() => null);
      initialMessages = j?.messages ?? j?.items ?? [];
    }
  }

  return (
 
    <div className="relative mt-[-28px] inset-0 z-10 w-full h-full">
      <div className="p-0">
        <DiscussionView
          discussion={discussion}
          conversationId={conversationId}     // string | null
          initialMessages={initialMessages}   // 👈 seed ChatRoom like /messages/[id]
        />
      </div>
    </div>

  );
}
