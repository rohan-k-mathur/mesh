"use client";

import Image from "next/image";
import Link from "next/link";



export default function HomeButton() {
  return (
    <button className="savebutton p-1 bg-white/50 rounded-xl">
    <Link
      href={`/`}

    >
      <Image
        src="/assets/home.svg"
        alt="reply"
        width={28}
        height={28}
        className="cursor-pointer object-contain"
      />
    </Link>
    {/* <span className="text-subtle-medium text-black">{commentCount}</span> */}
    </button>
  );
}
