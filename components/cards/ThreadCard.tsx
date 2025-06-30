import Image from "next/image";
import Link from "next/link";
import LikeButton from "@/components/buttons/LikeButton";
import { fetchLikeForCurrentUser } from "@/lib/actions/like.actions";
import { Like } from "@prisma/client";
import { Comfortaa } from "next/font/google";
import { Nunito } from "next/font/google";
import ShareButton from "../buttons/ShareButton";
import ReplicateButton from "../buttons/ReplicateButton";
import ExpandButton from "../buttons/ExpandButton";
import localFont from 'next/font/local'
import TimerButton from "../buttons/TimerButton";
const founders = localFont({ src: '/NewEdgeTest-RegularRounded.otf' })
const comfortaa = Comfortaa({
  weight: ["400"],
  subsets: ["latin"],
});
const nunito = Nunito({ subsets: ['latin'] })

interface Props {
  id: bigint;
  currentUserId?: bigint | null;
  parentId: bigint | null;
  content?: string;

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
  expirationDate?: string | null;
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
  expirationDate = null,
}: Props) => {
  let currentUserLike: Like | null = null;
  if (currentUserId) {
    currentUserLike = await fetchLikeForCurrentUser({
      postId: id,
      userId: currentUserId,
    });
  }
  return (
    <article className="relative flex w-full flex-col postcard p-7 ">
      <div className="flex-1 items-start justify-between ">
        <div className="flex w-full flex-1 flex-row gap-4 ">
          <div className="flex flex-col items-center  ">
            <Link
              href={`/profile/${author.id}`}
              className="relative h-[2rem] w-[2rem] left-[.5rem]"
            >
              <Image
                src={author.image || "/assets/user-helsinki.svg"}
                alt="Profile Image"
                fill
                objectFit="cover"
                className="cursor-pointer rounded-full border-[.05rem] border-indigo-300 profile-shadow hover:shadow-none 

                "
              />
            </Link>
          </div>
          <div className=""></div>
          <div>
            <Link href={`/profile/${author.id}`} className="w-fit ">
              <div className={`${founders.className} `}>
              <p className="cursor-pointer  text-[1.08rem] tracking-[.05rem] font-semibold text-black relative right-[.25rem] top-[.3rem]">
                {author.name}
              </p>
              </div>
            </Link>
            <hr className="mt-3 mb-4 w-[200%] h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-75" />
              <p className="mt-2  text-[1.08rem] text-black tracking-[.05rem]">{content}</p>
           
              <hr className="mt-3 mb-4 w-[200%] h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-75" />

            <div className="mt-4 flex flex-col gap-x-3 gap-y-4">
              <div className="flex gap-x-12 gap-y-8">
                <LikeButton
    
                  likeCount={likeCount}
                  initialLikeState={currentUserLike}
                />
                  <>
                    <ExpandButton postId={id} />
                  </>
            <ReplicateButton postId={id} />
          <ShareButton postId={id} />
          <TimerButton
            postId={id}
            isOwned={currentUserId === author.id}
            expirationDate={expirationDate ?? undefined}
          />
              </div>
            </div>
          </div>

        </div>

      </div>

    </article>
  );
};

export default ThreadCard;
