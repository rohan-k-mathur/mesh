import { fetchUser } from "@/lib/actions/user.actions";
import { fetchUserAttributes } from "@/lib/actions/userattributes.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import { UserAttributes } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import CustomButtons from "./customize-components";
async function Page({ params }: { params: { id: string } }) {
  if (!params?.id && params?.id?.length !== 1) return notFound();

  const activeUser = await getUserFromCookies();
  if (!activeUser?.onboarded) redirect("/onboarding");
  const profilePageUser = await fetchUser(BigInt(params.id));
  const userAttributes =
    (await fetchUserAttributes({
      userId: activeUser.userId!,
    })) || ({} as UserAttributes);
  if (!profilePageUser?.onboarded) notFound();
  return (
    <main className="grid mt-[-2rem] text-center">
      <h1 className="head-text">Customize Profile</h1>
      <CustomButtons userAttributes={userAttributes} />
    </main>
  );
}

export default Page;
