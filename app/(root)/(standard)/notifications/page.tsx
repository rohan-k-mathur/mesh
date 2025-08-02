import Image from "next/image";
import Link from "next/link";
import { fetchNotifications } from "@/lib/actions/notification.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await getUserFromCookies();
  if (!user?.userId) redirect("/login");

  const notifications = await fetchNotifications({ userId: user.userId });

  return (
    <section>
      <h1 className="head-text mb-2 mt-[-3rem] ">Notifications</h1>
      <hr></hr>
      <section className="mt-9 flex flex-col gap-3">
        {notifications.length > 0 ? (
          <>
            {notifications.map((n) => (
              <div
                key={n.id.toString()}
                className="flex items-center gap-2  px-5 py-3 bg-indigo-300 bg-opacity-40 rounded-xl border-none notify"
              >
                <Image
                  src={n.actor.image || "/assets/user-helsinki.svg"}
                  alt="Profile Picture"
                  width={24}
                  height={24}
                  className="rounded-full object-cover w-5 h-5 mr-2"
                />
                {n.type === "FOLLOW" && (
                  <Link href={`/profile/${n.actor_id}`}>
                    <p className="!text-base text-black">
                      <span className="mr-2 text-blue">{n.actor.name}</span> followed you
                    </p>
                  </Link>
                )}
                {n.type === "MESSAGE" && (
                  <Link href={`/messages/${n.conversation_id}`}>
                    <p className="!text-base text-black">
                      <span className="mr-2 text-blue">{n.actor.name}</span> sent you a message
                    </p>
                  </Link>
                )}
                {n.type === "TRADE_EXECUTED" && n.market && n.trade && (
                  <Link href={`/prediction/${n.market_id}`}>
                    <p className="!text-base text-black">
                      <span className="mr-2 text-blue">{n.actor.name}</span> trade on {n.market.question} executed at {Math.round(n.trade.price * 100)} %
                    </p>
                  </Link>
                )}
                {n.type === "MARKET_RESOLVED" && n.market && (
                  <Link href={`/prediction/${n.market_id}`}>
                    <p className="!text-base text-black">
                      Market {n.market.question} resolved to {n.market.outcome}
                    </p>
                  </Link>
                )}
              </div>
            ))}
          </>
        ) : (
          <p className="!text-base-regular text-light-3">No notifications</p>
        )}
      </section>
    </section>
  );
}
