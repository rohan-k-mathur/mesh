import Image from "next/image";
import Link from "next/link";
import LikeButton from "@/components/buttons/LikeButton";
import { fetchLikeForCurrentUser } from "@/lib/actions/like.actions";
import { Like } from "@prisma/client";
import { Comfortaa } from "next/font/google";
import { Nunito } from "next/font/google";

const comfortaa = Comfortaa({
  weight: ["400"],
  subsets: ["latin"],
});
const nunito = Nunito({ subsets: ['latin'] })

interface Props {
  id: bigint;
  currentUserId?: bigint | null;
  parentId: bigint | null;
  content: string;
  author: {
    name: string | null;
    image: string | null;
    id: bigint;
  };
  createdAt: string;
  comments: {
    author: {
      image: string | null;
    } | null;
  }[];
  isComment?: boolean;
  likeCount: number;
}

const ThreadCard = async ({
  id,
  currentUserId,
  parentId,
  content,
  author,
  createdAt,
  comments,
  isComment,
  likeCount,
}: Props) => {
  let currentUserLike: Like | null = null;
  if (currentUserId) {
    currentUserLike = await fetchLikeForCurrentUser({
      postId: id,
      userId: currentUserId,
    });
  }
  return (
    <article
      className={`flex w-full flex-col rounded-lg  ${
        isComment ? "px-0 xs:px-7" : "border-2 border-primary-500 bg-dark-2 p-7"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex w-full flex-1 flex-row gap-4">
          <div className="flex flex-col items-center">
            <Link href={`/profile/${author.id}`} className="relative h-11 w-11">
              <Image
                src={author.image || ""}
                alt="Profile Image"
                fill
                className="cursor-pointer rounded-lg"
              />
            </Link>
            <div className="thread-card_bar" />
          </div>
          <div>
            <Link href={`/profile/${author.id}`} className="w-fit">
              <h4 className="cursor-pointer text-base-semibold text-black">
                {author.name}
              </h4>
            </Link>
            <p className="mt-2 nunito.className text-small-regular text-black">
              {content}
            </p>
            <div className={`${isComment && "mb-10"} mt-5 flex flex-col gap-3`}>
              <div className="flex gap-3.5">
                <LikeButton
                  postId={id}
                  likeCount={likeCount}
                  initialLikeState={currentUserLike}
                />
                <>
                  <Link href={`/thread/${id}`}>
                    <Image
                      src="/assets/expand-all.svg"
                      alt="reply"
                      width={24}
                      height={24}
                      className="cursor-pointer object-contain"
                    />
                  </Link>
                  <p className="mt-1 text-subtle-medium text-gray-1">
                    {comments.length}
                  </p>
                </>
                <Image
                  src="/assets/replicate.svg"
                  alt="repost"
                  width={24}
                  height={24}
                  className="cursor-pointer object-contain"
                />
                <Image
                  src="/assets/send--alt.svg"
                  alt="share"
                  width={24}
                  height={24}
                  className="cursor-pointer object-contain"
                />
              </div>
              {/* {isComment && comments.length > 0 && (
                <Link href={`/thread/${id}`}>
                  <p className="mt-1 text-subtle-medium text-slate-600">
                    {comments.length}
                  </p>
                </Link>
              )} */}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ThreadCard;
