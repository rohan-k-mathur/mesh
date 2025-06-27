import ProfileHeader from "@/components/shared/ProfileHeader";
import ThreadsTab from "@/components/shared/ThreadsTab";
import RealtimePostsTab from "@/components/shared/RealtimePostsTab";
import AboutTab from "@/components/shared/AboutTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { profileTabs } from "@/constants";
import { fetchUser } from "@/lib/actions/user.actions";
import { areFriends, isFollowing } from "@/lib/actions/follow.actions";
import { getUserFromCookies } from "@/lib/serverutils";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";

async function Page({ params }: { params: { id: string } }) {
  if (!params?.id && params?.id?.length !== 1) return notFound();

  const activeUser = await getUserFromCookies();
  if (!activeUser?.onboarded) redirect("/onboarding");
  const profilePageUser = await fetchUser(BigInt(params.id));
  if (!profilePageUser?.onboarded) notFound();
  const following = activeUser.userId
    ? await isFollowing({ followerId: activeUser.userId, followingId: profilePageUser.id })
    : false;
  const friend = activeUser.userId
    ? await areFriends({ userId: activeUser.userId, targetUserId: profilePageUser.id })
    : false;
  return (
    <section>
      <ProfileHeader
        accountId={profilePageUser.id}
        name={profilePageUser.name!}
        username={profilePageUser.username}
        imgUrl={profilePageUser.image}
        bio={profilePageUser.bio}
        currentUserId={activeUser.userId}
        isFollowing={following}
        isFriend={friend}
      />
      <div className="mt-9">
        <Tabs defaultValue="threads" className="w-full">
          <TabsList className="tab mb-4">
            {profileTabs.map((tab) => (
              <TabsTrigger key={tab.label} value={tab.value} className="tab">
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <p className="max-sm:hidden">{tab.label}</p>
                {tab.label === "Threads" && (
                  <p className="ml-1 rounded-none bg-light-4 px-2 py-1 !text-tiny-medium text-light-2">
                    0
                  </p>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {profileTabs.map((tab) => (
            <TabsContent
              key={`content-${tab.label}`}
              value={tab.value}
              className="w-full text-light-1 "
            >
              {tab.label === "Posts" ? (
                <RealtimePostsTab
                  currentUserId={activeUser.userId!}
                  accountId={profilePageUser.id}
                />
              ) : tab.label === "About" ? ( // Render ThreadsTab only if the tab's value is 'threads'
                <AboutTab
                  currentUserId={activeUser.userId!}
                  accountId={profilePageUser.id}
                />
              ) : (
                <div className="placeholder">
                  {" "}
                  {/* Placeholder or other component for other tabs */}
                  {/* You can add different components or placeholders for other tabs here */}
                  Content for {tab.label}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

export default Page;
