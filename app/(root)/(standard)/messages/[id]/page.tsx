import { fetchMessages } from "@/lib/actions/message.actions";
import { fetchConversation } from "@/lib/actions/conversation.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect, notFound } from "next/navigation";
import MessageForm from "./send-form";
import ChatRoom from "@/components/chat/ChatRoom";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getUserFromCookies();
  if (!user?.userId) redirect("/login");
  const conversationId = BigInt(params.id);
  const conversation = await fetchConversation(conversationId, user.userId);
  const messages = await fetchMessages({ conversationId });
  return (
    <main className=" p-4 mt-[-3rem] items-center justify-center ">
      <div className="mt-6 space-y-6">
        <ChatRoom
          conversationId={conversationId}
          currentUserId={user.userId}
          initialMessages={messages.map((m) => ({
            id: m.id.toString(),
            text: m.text,
            createdAt: m.created_at.toISOString(),
            senderId: m.sender_id.toString(),
            sender: { name: m.sender.name, image: m.sender.image },
          }))}
        />
        <hr></hr>
        <MessageForm conversationId={conversationId} />
      </div>
    </main>
  );
}
