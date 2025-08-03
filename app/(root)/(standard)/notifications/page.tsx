

import Image from "next/image";
import Link from "next/link";
import { fetchNotifications } from "@/lib/actions/notification.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { redirect } from "next/navigation";
// import { useNotifications } from "@/hooks/useNotifications";
import NotificationsList from "./NotificationsList";
export default async function Page() {
  const user = await getUserFromCookies();
  if (!user?.userId) redirect("/login");
  const initial = await fetchNotifications({ userId: user.userId });

const notifications = await fetchNotifications({ userId: user.userId });
  // const {
  //   notifications,
  //   deleteNotification,
  //   clearNotifications,
  // } = useNotifications();

  return (
    <section>
      <h1 className="head-text mb-2 mt-[-3rem] ">Notifications</h1>
      <hr></hr>
      <NotificationsList initial={initial} />

    </section>
  );
}
