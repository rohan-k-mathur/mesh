"use client";

import Image from "next/image";
import Link from "next/link";

interface ExpandButtonProps {
  targetId: bigint;
}

export default function ExpandButton({ targetId }: ExpandButtonProps) {
  return (
    <Link
      href={`/thread/${targetId}`}
      data-testid="expand"
      data-id={targetId.toString()}
      className="flex items-center gap-1"
    >
      <Image
        src="/assets/add-comment.svg"
        alt="reply"
        width={28}
        height={28}
        className="cursor-pointer object-contain likebutton"
      />
    </Link>
  );
}
