
import { fetchMessages } from "@/lib/actions/message.actions";
import { fetchConversation } from "@/lib/actions/conversation.actions";
import { getUserFromCookies } from "@/lib/server/getUser";
import { redirect, notFound } from "next/navigation";
import ChatRoom from "@/components/chat/ChatRoom";
import MessageComposer from "@/components/chat/MessageComposer";
import MessengerPane from "@/components/chat/MessengerPane";
import Image from "next/image";

import { headers } from "next/headers";


export default async function Page({ params, searchParams }: { params: { id: string }; searchParams: { mid?: string } }) {
  const user = await getUserFromCookies();
  if (!user?.userId) redirect("/login");

  const conversationId = BigInt(params.id);
  let conversation;
  try {
    conversation = await fetchConversation(conversationId, user.userId);
  } catch {
    notFound();
  }
  const isGroup = conversation.is_group;


  // Build a title for the header
  const title = (() => {
    if (conversation.is_group) {
      if (conversation.title?.trim()) return conversation.title!;
      const others = conversation.participants
        .filter((p) => p.user_id !== user.userId)
        .map((p) => p.user.name);
      const base = others.slice(0, 3).join(", ");
      const extra = others.length - 3;
      return extra > 0 ? `${base} +${extra}` : base || "Group";
    } else {
      const other = conversation.participants.find((p) => p.user_id !== user.userId)?.user;
      return other?.name ?? "Direct Message";
    }
  })();
  // Header avatar data
  const headerUsers = isGroup
    ? conversation.participants
        .filter((p) => p.user_id !== user.userId)
        .map((p) => p.user)
    : [
        conversation.participants.find((p) => p.user_id !== user.userId)?.user,
      ].filter(Boolean) as { name: string; image: string | null }[];


  // Messages newest->oldest then flip so newest at bottom
  const rows = (await fetchMessages({ conversationId })).reverse();
  // const initialMessages = rows.map((m) => ({
  //   id: m.id.toString(),
  //   text: m.text ?? null,
  //   createdAt: m.created_at.toISOString(),
  //   senderId: m.sender_id.toString(),
  //   sender: { name: m.sender.name, image: m.sender.image },
  //   attachments: m.attachments.map((a) => ({
  //     id: a.id.toString(),
  //     path: a.path,
  //     type: a.type,
  //     size: a.size,
  //   })),
  // }));
  // Fetch newest->oldest then flip so newest is at the bottom in the UI
  // const rows = (await fetchMessages({ conversationId })).reverse();

  // const initialMessages = rows.map((m) => ({
  //   id: m.id.toString(),
  //   text: m.text ?? null,
  //   createdAt: m.created_at.toISOString(),
  //   senderId: m.sender_id.toString(),
  //   sender: { name: m.sender.name, image: m.sender.image },
  //   attachments: m.attachments.map((a) => ({
  //     id: a.id.toString(),
  //     path: a.path,
  //     type: a.type,
  //     size: a.size,
  //   })),
  // }));

  const highlightMessageId = searchParams?.mid || null;
 // Build an absolute base URL for server-side fetch
const h = headers();
const host = h.get("x-forwarded-host") ?? h.get("host");
const proto = h.get("x-forwarded-proto") ?? "http";
const base = `${proto}://${host}`;

// Get Layer-aware messages (viewer-filtered + sender object)
const res = await fetch(
  `${base}/api/sheaf/messages?conversationId=${conversationId.toString()}&userId=${user.userId.toString()}`,
  { cache: "no-store" }
);
const { messages: initialMessages } = await res.json();
  return (
    <main className="p-4 mt-[-4rem] items-center justify-center">
      <div className="flex w-full h-full items-center justify-center align-center gap-4">
                {isGroup ? (
          // Composite avatar (up to 4 faces)
          <div className="flex flex-wrap rounded-full gap-4 ">
            {headerUsers.slice(0, 4).map((u, i) => (
              <Image
                key={i}
                src={u.image || "/assets/user-helsinki.svg"}
                alt={u.name}
                width={50}
                height={50}
                className="rounded-full object-fill p-1 profile-shadow bg-white/20 align-center justify-center items-center"
                />
            ))}
          </div>
        ) : (
          // Single avatar
          <button className="flex w-[2.5rem] h-[2.5rem]">
          <Image
            src={headerUsers[0]?.image || "/assets/user-helsinki.svg"}
            alt={headerUsers[0]?.name ?? "User"}
            width={50}
            height={50}
            className="rounded-full object-fill w-full h-full p-[.1rem] profile-shadow bg-white/20 align-center justify-center items-center"
          />
          </button>
        )}
        <button>
        <h1 className="text-[2.1rem] justify-center items-center align-center tracking-wider mt-1">{title}</h1>
        </button>
      </div>
      <hr className="mt-3"/>

{/* 
      <div className="mt-6 space-y-6">
        <ChatRoom
          conversationId={params.id}             // pass as string
          currentUserId={user.userId.toString()} // pass as string
          initialMessages={initialMessages}
          highlightMessageId={highlightMessageId}
        />
        <hr />
        <MessageComposer
  conversationId={String(conversationId)}
  currentUserId={user.userId.toString()}   // ← make sure this is passed
/>
      </div>
      <MessengerPane currentUserId={user.userId.toString()} />
    </main> */}

  <div className="mt-6 space-y-6">
      <ChatRoom
        conversationId={params.id}
        currentUserId={user.userId.toString()}
        initialMessages={initialMessages}
        highlightMessageId={highlightMessageId ?? null}
      />
      <hr />
      <MessageComposer
        conversationId={String(conversationId)}
        currentUserId={user.userId.toString()}
      />
    </div>
    <MessengerPane currentUserId={user.userId.toString()} />
  </main>
    );
}
