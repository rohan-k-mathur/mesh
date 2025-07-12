import { fetchConversation, fetchMessages } from "@/lib/actions/message.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect, notFound } from "next/navigation";
import MessageForm from "./send-form";

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
    <main className="p-4 space-y-4">
      <h1 className="head-text">Chat with {other.name}</h1>
      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id.toString()} className="rounded p-2 bg-light-4">
            <p className="text-sm font-semibold">{m.sender.name}</p>
            <p>{m.text}</p>
          </div>
        ))}
      </div>
      <MessageForm conversationId={conversationId} />
    </main>
  );
}
