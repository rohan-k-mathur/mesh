"use client";

import Image from "next/image";
import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";

interface Props {
  initial: any[];            // server-fetched baseline
}

export default function NotificationsList({ initial }: Props) {
  const {
    notifications,
    deleteNotification,
    clearNotifications,
  } = useNotifications();

  // while SWR is loading, fall back to the SSR list
  const list = notifications.length ? notifications : initial;
return (
    <>
  {notifications.length > 0 && (
    <button
      className="relative -right-[90%] mb-0 mt-4 bg-white  bg-opacity-20 text-sm savebutton rounded-xl tracking-wide px-3 py-1 text-center"
      onClick={clearNotifications}
    >
      Clear All
    </button>
  )}

  <section className="mt-6 flex flex-col gap-3 ">
    {list.length > 0 ? (
      <>
        {list.map((n) => (
          <div
            key={n.id.toString()}
            className="flex items-center gap-2  px-5 py-3 bg-indigo-300 bg-opacity-40 rounded-xl border-none notify align-center inline-block"
          >
                {/* ✕ button */}
          <button
            onClick={() => deleteNotification(BigInt(n.id))}
            className="relative text-center align-center rounded-full border-[1px] w-fit h-fit 
            px-[.4rem] bg-white/50 shadow-sm text-[.75rem] font-bold mr-6"
            aria-label="delete"
          >
            x
          </button>
          <div className="flex inline-block align-center gap-2 tracking-wide">
            <Image
              src={n.actor.image || "/assets/user-helsinki.svg"}
              alt="Profile Picture"
              width={24}
              height={24}
              className="rounded-full object-cover w-5 h-5 mr-0 flex align-center"
            />
            {n.type === "FOLLOW" && (
              <Link href={`/profile/${n.actor_id}`}>
                <p className="!text-base text-black">
                  <span className="mr-2 text-blue">{n.actor.name}</span> Followed You
                </p>
              </Link>
            )}
            {n.type === "MESSAGE" && (
              <Link href={`/messages/${n.conversation_id}`}>
                <p className="!text-base text-black">
                  <span className="mr-2 text-blue">{n.actor.name}</span> Sent You a Message
                </p>
              </Link>
            )}
            {n.type === "TRADE_EXECUTED" && n.market && n.trade && (
              <Link href={`/prediction/${n.market_id}`}>
                <p className="!text-base text-black">
                  <span className="mr-2 text-blue">{n.actor.name}</span> Trade on {n.market.question} Executed at {Math.round(n.trade.price * 100)} %
                </p>
              </Link>
            )}
            {n.type === "MARKET_RESOLVED" && n.market && (
              <Link href={`/prediction/${n.market_id}`}>
                <p className="!text-base text-black">
                  Market {n.market.question} Resolved to {n.market.outcome}
                </p>
              </Link>
            )}
            </div>
          </div>
        ))}
      </>
    ) : (
      <p className="!text-base-regular text-light-3">No notifications</p>
    )}
  </section>
</>
);
}
