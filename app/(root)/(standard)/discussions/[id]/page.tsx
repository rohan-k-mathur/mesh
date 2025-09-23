// app/discussions/[id]/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prismaclient";
import { getUserFromCookies } from "@/lib/serverutils";
import DiscussionView from "@/components/discussion/DiscussionView";

export default async function DiscussionPage({ params }: { params: { id: string } }) {
  const discussion = await prisma.discussion.findUnique({
    where: { id: params.id },
    include: { deliberations: true },
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
    <DiscussionView
      discussion={discussion}
      conversationId={conversationId}     // string | null
      initialMessages={initialMessages}   // 👈 seed ChatRoom like /messages/[id]
    />
  );
}
