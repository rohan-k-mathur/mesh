import Link from "next/link";
import Image from "next/image";
import { fetchConversations } from "@/lib/actions/message.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getUserFromCookies();
  if (!user?.userId) redirect("/login");
  const conversations = await fetchConversations({ userId: user.userId });
  return (
    <main className="p-4">
      <h1 className="head-text mb-4">Messages</h1>
      <ul className="space-y-4">
        {conversations.map((c) => {
          const other = c.user1_id === user.userId ? c.user2 : c.user1;
          const last = c.messages[0];
          return (
            <li key={c.id.toString()} className="flex items-center gap-3">
              <Image
                src={other.image || "/assets/user-helsinki.svg"}
                alt={other.name}
                width={40}
                height={40}
                className="rounded-full"
              />
              <Link href={`/messages/${c.id}`} className="flex-1">
                <p className="font-bold">{other.name}</p>
                {last && (
                  <p className="text-sm text-gray-500 truncate max-w-xs">
                    {last.text}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
