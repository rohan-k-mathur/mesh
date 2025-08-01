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
      <h1 className="head-text mb-5">Notifications</h1>
      <section className="mt-9 flex flex-col gap-3">
        {notifications.length > 0 ? (
          <>
            {notifications.map((n) => (
              <div
                key={n.id.toString()}
                className="activity-card bg-slate-800 rounded-md border-[2px] border-slate-500 border-slate-200 hover:bg-slate-700"
              >
                <Image
                  src={n.actor.image || "/assets/user-helsinki.svg"}
                  alt="Profile Picture"
                  width={24}
                  height={24}
                  className="rounded-md object-cover mr-2"
                />
                {n.type === "FOLLOW" && (
                  <Link href={`/profile/${n.actor_id}`}>
                    <p className="!text-base text-light-1">
                      <span className="mr-2 text-blue">{n.actor.name}</span> followed you
                    </p>
                  </Link>
                )}
                {n.type === "MESSAGE" && (
                  <Link href={`/messages/${n.conversation_id}`}>
                    <p className="!text-base text-light-1">
                      <span className="mr-2 text-blue">{n.actor.name}</span> sent you a message
                    </p>
                  </Link>
                )}
                {n.type === "TRADE_EXECUTED" && n.market && n.trade && (
                  <Link href={`/prediction/${n.market_id}`}>
                    <p className="!text-base text-light-1">
                      <span className="mr-2 text-blue">{n.actor.name}</span> trade on {n.market.question} executed at {Math.round(n.trade.price * 100)} %
                    </p>
                  </Link>
                )}
                {n.type === "MARKET_RESOLVED" && n.market && (
                  <Link href={`/prediction/${n.market_id}`}>
                    <p className="!text-base text-light-1">
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
