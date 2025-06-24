import { fetchUserThreads } from "@/lib/actions/user.actions";
import { redirect,notFound } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";
import AccountProfile from "@/components/forms/AccountProfile";
import { getUserFromCookies } from "@/lib/serverutils";
import { Button } from "../ui/button";
import ThreadCard from "@/components/cards/ThreadCard";
import { Dialog } from "../ui/dialog";
import Link from 'next/link'


interface Props {
  currentUserId: bigint;
  accountId: bigint;
}

const AboutTab = async ({ currentUserId, accountId }: Props) => {

  const user = await getUserFromCookies();
  if (!user) return null;
  let result = await fetchUserThreads(accountId);

  if (!result) redirect("/");
  const userData = {
    authId: user.uid || "",
    userId: user.userId || null,
    username: user.email || "",
    name: user.displayName || "",
    bio: user.bio || "",
    image: user?.photoURL || "",
  };
  if (BigInt(currentUserId) === BigInt(accountId)) {
    // User is viewing their own profile, allow editing
    return (
      <main className=" mt-9 items-center justify-center text-center">
<Link href={`/profile/${accountId}/customize`}>
        <Button size={"lg"} className="head-sub-text text-black  w-fit rounded-md p-8"> 
       
            Customize Profile</Button>
            </Link>
        <div className="mt-9">
          {/* Placeholder for non-editable content */}
          <p>Interests: [Sample interests here]</p>
          <p>Favorites: [Sample favorites here]</p>
          <p>Social Links: [Sample links here]</p>
        </div>
      </main>
    );
  } else {
    // User is viewing someone else's profile, show non-editable version
    return (
      <main className="grid mt-9 text-center">
        <div>
          {/* Placeholder for non-editable content */}
          <p>Interests: [Sample interests here]</p>
          <p>Favorites: [Sample favorites here]</p>
          <p>Social Links: [Sample links here]</p>
        </div>
      </main>
    );
  }
};


export default AboutTab;
