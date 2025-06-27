import { getUserFromCookies } from "@/lib/serverutils";
import { Button } from "../ui/button";
import Link from "next/link";
import { fetchUserAttributes } from "@/lib/actions/userattributes.actions";
import { format } from "date-fns";


interface Props {
  currentUserId: bigint;
  accountId: bigint;
}

const AboutTab = async ({ currentUserId, accountId }: Props) => {

  const user = await getUserFromCookies();
  if (!user) return null;

  const attributes =
    (await fetchUserAttributes({ userId: accountId })) || null;

  const categories = [
    {
      label: "Artists",
      values: attributes?.artists || [],
    },
    {
      label: "Albums",
      values: attributes?.albums || [],
    },
    {
      label: "Songs",
      values: attributes?.songs || [],
    },
    {
      label: "Movies",
      values: attributes?.movies || [],
    },
    {
      label: "Interests",
      values: attributes?.interests || [],
    },
    {
      label: "Hobbies",
      values: attributes?.hobbies || [],
    },
    {
      label: "Communities",
      values: attributes?.communities || [],
    },
    {
      label: "Location",
      values: attributes?.location ? [attributes.location] : [],
    },
    {
      label: "Birthday",
      values: attributes?.birthday
        ? [format(new Date(attributes.birthday), "yyyy-MM-dd")]
        : [],
    },
  ];

  const grid = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-9">
      {categories.map((cat) => (
        <div
          key={cat.label}
          className="border border-light-3 rounded-md p-4 bg-light-2"
        >
          <h3 className="text-base-semibold mb-2 text-black">{cat.label}</h3>
          {cat.values.length > 0 ? (
            <ul className="list-disc pl-4 text-black text-base-regular space-y-1">
              {cat.values.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-light-3">No {cat.label.toLowerCase()} added</p>
          )}
        </div>
      ))}
    </div>
  );

  if (BigInt(currentUserId) === BigInt(accountId)) {
    return (
      <main className="items-center justify-center text-center">
        <Link href={`/profile/${accountId}/customize`}>
          <Button size="lg" className="head-sub-text text-black w-fit rounded-md p-8">
            Customize Profile
          </Button>
        </Link>
        {grid}
      </main>
    );
  }

  return <main className="text-center">{grid}</main>;
};


export default AboutTab;
