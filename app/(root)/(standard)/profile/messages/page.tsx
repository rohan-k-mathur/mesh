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
    <main className="p-4 mt-[-2rem]">
      <h1 className="text-[3rem] mb-2 text-center ">Messages</h1>
      <hr></hr>
      <ul className="space-y-6 mt-6">
        {conversations.map((c) => {
          const other = c.user1_id === user.userId ? c.user2 : c.user1;
          const last = c.messages[0];
          return (
            <li key={c.id.toString()} className="flex bg-white/20 items-center gap-3 border-[1px] border-indigo-400 px-3 py-4 likebutton rounded-xl">
              <div className="flex h-[3rem] w-[3rem] ">
              <Image
                src={other.image || "/assets/user-helsinki.svg"}
                alt={other.name}
                width={40}
                height={40}
                className="object-cover flex-1 border-[.05rem] rounded-full border-indigo-300 profile-shadow  "
              />
              </div>
              <Link href={`/messages/${c.id}`} className="flex-1">
                <p className="font-bold text-[1.1rem]">{other.name}</p>
                {last && (
                  <p className="text-[1rem] text-gray-700 truncate max-w-xs">
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
