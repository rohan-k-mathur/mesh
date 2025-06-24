"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { app } from "@/lib/firebase/firebase";
import { RealtimeRoom } from "@prisma/client";
import { getAuth, signOut } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import localFont from 'next/font/local'
const parabole = localFont({ src: '/Parabole-DisplayRegular.woff2' })

interface Props {
  userRooms: RealtimeRoom[];
}
 
function LeftSidebar({ userRooms }: Props) {
  const router = useRouter();
  const user = useAuth();
  const isUserSignedIn = !!user.user;

  async function handleLogout() {
    await signOut(getAuth(app));
    await fetch("/api/logout");
    router.push("/login");
  }

  return (
    <section className="custom-scrollbar leftsidebar  bg-transparent">
      <div className="flex w-full flex-1 flex-col gap-6 px-6">
        {userRooms.map((userRoom) => {
          return (
            <Link
              href={`/room/${userRoom.id}`}
              key={userRoom.id}
              className="leftsidebar_link leftsidebar-item  rounded-md hover:outline-4 hover:outline-double hover:outline-indigo-400"
            >
              <div className="rounded_icon_container shadow-sm shadow-black h-6 w-6">
                <Image
                  src={userRoom.room_icon}
                  alt={userRoom.id}
                  width={48}
                  height={48}
                  className=" object-contain"
                />
              </div>
              <p className="text-black tracking-[.05rem] max-lg:hidden">{userRoom.id}</p>
            </Link>
          );
        })}
        <Link
          href={`/create-room`}
          className="leftsidebar_link leftsidebar-item border-2 border-red-400 border-opacity-80	 rounded-md hover:outline-4 hover:outline-double hover:outline-red-400"
        >
          <Image
            src="/assets/create-new.svg"
            alt="Create"
            width={24}
            height={24}
          />
          <p className="text-black max-lg:hidden">{"Create Room"}</p>
        </Link>
      </div>
      <div className="mb-6 px-6 ">
        {isUserSignedIn && (
          <Button
            className="h-full w-full rounded-md  leftsidebar-item border-none "
            onClick={handleLogout}
          >
            <Image
              src="/assets/signout-helsinki.svg"
              alt="logout"
              className="mr-2"
              width={24}
              height={24}
            />
            <p className="text-black max-lg:hidden">Logout</p>
          </Button>
        )}
      </div>
      <div className="absolute justify-start  top-[1.55rem] left-[3.4rem] ">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/assets/logo-black.svg" alt="logo" width={36} height={36} /> 
        <div className={`${parabole.className}`}>
        <span  className=" text-[2.5rem] font-bold text-black tracking-[.0rem] max-xs:hidden">MESH</span>
        </div>

      </Link>
      
      </div>
      <div
      className="absolute right-0 top-0 h-full min-h-[1em] w-[.1rem] border-t-0 bg-gradient-to-tr from-transparent via-indigo-300 to-transparent opacity-50 dark:via-neutral-400 lg:block">
  </div>
    </section>
  );
}

export default LeftSidebar;
