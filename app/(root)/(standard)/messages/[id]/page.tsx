import { fetchMessages } from "@/lib/actions/message.actions";
import { fetchConversation } from "@/lib/actions/conversation.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect, notFound } from "next/navigation";
import ChatRoom from "@/components/chat/ChatRoom";
import MessageComposer from "@/components/chat/MessageComposer";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getUserFromCookies();
  if (!user?.userId) redirect("/login");

  const conversationId = BigInt(params.id);

  // Ensure the viewer is a participant (throws if not)
  try {
    await fetchConversation(conversationId, user.userId);
  } catch {
    notFound();
  }

  // Fetch newest->oldest then flip so newest is at the bottom in the UI
  const rows = (await fetchMessages({ conversationId })).reverse();

  const initialMessages = rows.map((m) => ({
    id: m.id.toString(),
    text: m.text ?? null,
    createdAt: m.created_at.toISOString(),
    senderId: m.sender_id.toString(),
    sender: { name: m.sender.name, image: m.sender.image },
    attachments: m.attachments.map((a) => ({
      id: a.id.toString(),
      path: a.path,
      type: a.type,
      size: a.size,
    })),
  }));

  return (
    <main className="p-4 mt-[-3rem] items-center justify-center">
      <div className="mt-6 space-y-6">
        <ChatRoom
          conversationId={params.id}             // pass as string
          currentUserId={user.userId.toString()} // pass as string
          initialMessages={initialMessages}
        />
        <hr />
        <MessageComposer conversationId={params.id} />
      </div>
    </main>
  );
}
