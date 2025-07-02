"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { app } from "@/lib/firebase/firebase";
import { RealtimeRoom } from "@prisma/client";
import { getAuth, signOut } from "firebase/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import localFont from "next/font/local";
import CreateFeedPost from "@/components/forms/CreateFeedPost";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";
import UserRoomsModal from "../modals/UserRoomsModal";
const parabole = localFont({ src: './Parabole-DisplayRegular.woff2' })

interface Props {
  userRooms: RealtimeRoom[];
}
 
function LeftSidebar({ userRooms }: Props) {
  const router = useRouter();
  const user = useAuth();
  const isUserSignedIn = !!user.user;
  const store = useStore(
    useShallow((state: AppState) => ({
      openModal: state.openModal,
    }))
  );

  const openRoomsModal = () => {
    store.openModal(<UserRoomsModal userRooms={userRooms} />);
  };

  async function handleLogout() {
    await signOut(getAuth(app));
    await fetch("/api/logout");
    router.push("/login");
  }
  function gotoprofile() {
    if (user.user?.userId) {
      router.push(`/profile/${user.user.userId}`);
    } else {
      router.push("/onboarding");
    }  }
    function gotoglobal()
    {
      router.push("/room/global");

    }
    function newroom()
    {
      router.push("/create-room");

    }

  return (
    <section className="custom-scrollbar leftsidebar  bg-transparent">
      <div className="flex  w-full flex flex-col gap-6 px-6">
       
            <Button
              className="border-[1px] border-rose-300 border-opacity-80 likebutton leftsidebar_link leftsidebar-item items-start justify-start h-fit  rounded-md hover:outline-2 hover:outline-double hover:outline-indigo-400"
              variant={"outline"}
              onClick={gotoglobal}
              >
                <Image
                  src="/assets/earth--filled.svg"
                  alt={"globe"}
                  width={24}
                  height={24}
                />
              <p className="text-black max-lg:hidden">{"Global"}</p>
            </Button>
       
        <Button
          variant="outline"
          className=" likebutton leftsidebar_link  leftsidebar-item items-start justify-start h-fit rounded-md border-[1px] border-rose-300 border-opacity-80 hover:outline-2 hover:outline-double hover:outline-indigo-400"
          onClick={openRoomsModal}
        >
          <Image src="/assets/3D-print-mesh.svg" alt="YourRooms" width={24} height={24} />
          <p className="text-black   max-lg:hidden">{"Your Rooms"}</p>
        </Button>
        <Button
          variant={"outline"}
          onClick={newroom}
          className="likebutton leftsidebar_link leftsidebar-item  items-start justify-start h-fit border-[1px] border-rose-300 border-opacity-80	 rounded-md hover:outline-2 hover:outline-double hover:outline-red-400"
        >
          <Image
            src="/assets/gateway.svg"
            alt="Create"
            width={24}
            height={24}
          />
          <p className="text-black  max-lg:hidden">{"New Room"}</p>
        </Button>
      </div>
      <div className="mb-6 px-6 ">
        {isUserSignedIn && <CreateFeedPost />}
      </div>
      <div className="mb-6 px-6  ">
        {isUserSignedIn && (
          <Button
          variant={"outline"}
            className="likebutton leftsidebar-link  leftsidebar-item  items-start justify-start h-full w-full rounded-md border-[1px] border-rose-300 border-opacity-80 hover:outline-2 hover:outline-double hover:outline-emerald-400"
            onClick={gotoprofile}
          >
            <Image
              src="/assets/notifications-none.svg"
              alt="notifs"
              className="mr-2 "
              width={24}
              height={24}
            />
            <p className="text-black max-lg:hidden">Notifications</p>
          </Button>
        )}
      </div>
      <div className="mb-6 px-6  ">
        {isUserSignedIn && (
          <Button
          variant={"outline"}

            className="likebutton leftsidebar_link leftsidebar-item items-start justify-start h-full w-full rounded-md  leftsidebar-item border-[1px] border-rose-300 border-opacity-80  hover:outline-2 hover:outline-double hover:outline-emerald-400"
            onClick={gotoprofile}
          >
            <Image
              src="/assets/user-helsinki.svg"
              alt="profile"
              className="mr-2"
              width={24}
              height={24}
            />
            <p className="text-black max-lg:hidden">Profile</p>
          </Button>
        )}
      </div>
      <div className="mb-6 px-6 ">
        {isUserSignedIn && (
          <Button
          variant={"outline"}

            className="likebutton leftsidebar_link leftsidebar-item items-start justify-start h-full w-full rounded-md  leftsidebar-item border-[1px] border-rose-300 border-opacity-80 hover:outline-2 hover:outline-double hover:outline-emerald-400"
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
      <div className="absolute justify-start  top-[1.55rem] left-[2.3rem] ">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/assets/logo-black.svg" alt="logo" width={36} height={36} /> 
        <div className={`${parabole.className}`}>
        <span  className=" text-[2.5rem] font-bold text-black max-xs:hidden">MESH</span>
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
