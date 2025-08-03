import { redirect } from "next/navigation";
import { getUserFromCookies } from "@/lib/serverutils";
import { getUserSettings } from "@/lib/settings/service";
import AccountForm from "./(client)/AccountForm";

export default async function Page() {
  const user = await getUserFromCookies();
  if (!user) redirect("/login");

  const settings = await getUserSettings(user.userId);
  return <AccountForm initial={settings.account ?? {}} />;
}

