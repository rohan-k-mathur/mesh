import Image from "next/image";
import Link from "next/link";

interface Participant {
  id: string;
  name: string;
  image: string | null;
}

interface Conversation {
  id: string;
  isGroup: boolean;
  title?: string | null;
  participants: Participant[];
  lastMessage?: string | null;
}

interface Props {
  conversations: Conversation[];
  currentUserId: string;
}

function GroupAvatar({ participants }: { participants: Participant[] }) {
  const imgs = participants.slice(0, 3);
  return (
    <div className="grid grid-cols-2 grid-rows-2 w-[3rem] h-[3rem] rounded-full overflow-hidden">
      {imgs.map((p) => (
        <Image
          key={p.id}
          src={p.image || "/assets/user-helsinki.svg"}
          alt={p.name}
          width={40}
          height={40}
          className="object-cover"
        />
      ))}
    </div>
  );
}

export default function ConversationList({
  conversations,
  currentUserId,
}: Props) {
  return (
    <ul className="space-y-6 mt-6">
      {conversations.map((c) => {
        const last = c.lastMessage;
        if (c.isGroup) {
          const title =
            c.title ||
            c.participants
              .map((p) => p.name)
              .slice(0, 3)
              .join(", ");
          return (
            <li
              key={c.id}
              className="flex bg-white/20 items-center gap-3 border-[1px] border-indigo-400 px-3 py-4 rounded-xl"
            >
              <GroupAvatar participants={c.participants} />
              <Link href={`/messages/${c.id}`} className="flex-1">
                <p className="font-bold text-[1.1rem]">{title}</p>
                {last && (
                  <p className="text-[1rem] text-gray-700 truncate max-w-xs">{last}</p>
                )}
              </Link>
            </li>
          );
        }
        const other = c.participants.find((p) => p.id !== currentUserId);
        if (!other) return null;
        return (
          <li
            key={c.id}
            className="flex bg-white/20 items-center gap-3 border-[1px] border-indigo-400 px-3 py-4 rounded-xl"
          >
            <div className="flex h-[3rem] w-[3rem]">
              <Image
                src={other.image || "/assets/user-helsinki.svg"}
                alt={other.name}
                width={40}
                height={40}
                className="object-cover flex-1 border-[.05rem] rounded-full border-indigo-300 profile-shadow"
              />
            </div>
            <Link href={`/messages/${c.id}`} className="flex-1">
              <p className="font-bold text-[1.1rem]">{other.name}</p>
              {last && (
                <p className="text-[1rem] text-gray-700 truncate max-w-xs">{last}</p>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
