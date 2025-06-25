import AccountProfile from "@/components/forms/AccountProfile";
import { getUserFromCookies } from "@/lib/serverutils";

async function Page() {
  const user = await getUserFromCookies();
  if (!user) return null;

  const userData = {
    authId: user.uid || "",
    userId: user.userId || null,
    username: user.email || "",
    name: user.displayName || "",
    bio: user.bio || "",
    image: user?.photoURL || "",
  };
  return (
    <main className="mx-auto flex max-w-3xl flex-col justify-center items-center px-10 py-10 text-black">
      <h1 className="head-text">Edit Your Profile</h1>
      {/* <p className="mt-3 text-base-regular text-light-2">
        Complete your profile now to use mesh
      </p> */}
      <section className="postcard mt-5 bg-white bg-opacity-20 p-10 text-black">
        <AccountProfile user={userData} btnTitle="Continue" />
      </section>
    </main>
  );
}
export default Page;
