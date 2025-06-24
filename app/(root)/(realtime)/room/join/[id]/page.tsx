import {
  joinRoom,
  lookupInviteToken,
} from "@/lib/actions/realtimeroom.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { notFound, redirect } from "next/navigation";

const Page = async ({ params }: { params: { id: string } }) => {
  const user = await getUserFromCookies();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");
  const databaseToken = await lookupInviteToken(params.id);
  if (!databaseToken) {
    notFound();
  }
  await joinRoom({ roomId: databaseToken.realtime_room_id });
  redirect(`/room/${databaseToken.realtime_room_id}`);
};

export default Page;
