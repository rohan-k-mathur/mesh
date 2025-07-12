import { fetchConversation, fetchMessages } from "@/lib/actions/message.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect, notFound } from "next/navigation";
import MessageForm from "./send-form";
import ChatRoom from "@/components/chat/ChatRoom";

export default async function Page({ params }: { params: { id: string } }) {
  const user = await getUserFromCookies();
  if (!user?.userId) redirect("/login");
  const conversationId = BigInt(params.id);
  const conversation = await fetchConversation({ conversationId });
  if (!conversation) notFound();
  if (conversation.user1_id !== user.userId && conversation.user2_id !== user.userId) notFound();
  const messages = await fetchMessages({ conversationId });
  const other = conversation.user1_id === user.userId ? conversation.user2 : conversation.user1;
  return (
    <main className=" p-4 mt-[-3rem] space-y-6 items-center justify-center ">
      <h1 className="ml-[40%]  text-[2.4rem]  ">{other.name}</h1>
      <hr></hr>

      <ChatRoom
        conversationId={conversationId}
        currentUserId={user.userId}
        initialMessages={messages.map((m) => ({
          id: m.id.toString(),
          text: m.text,
          created_at: m.created_at.toISOString(),
          sender_id: m.sender_id.toString(),
          sender: { name: m.sender.name, image: m.sender.image },
        }))}
      />
      <hr></hr>
      <MessageForm conversationId={conversationId} />
    </main>
  );
}
