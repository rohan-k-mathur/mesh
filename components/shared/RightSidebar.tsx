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
import CreateFeedPost from "@/components/forms/CreateFeedPost";
const parabole = localFont({ src: '/Parabole-DisplayRegular.woff2' })


interface Props {
    userRooms: RealtimeRoom[];
  }

function RightSidebar() {
    const router = useRouter();
    const user = useAuth();
    const isUserSignedIn = !!user.user;
    // return (
    // <section className="custom-scrollbar rightsidebar">
    //     <div className="flex flex-1 flex-col justify-start">
    //         <h3 className="text-heading4-medium text-light-1">Discover Groups</h3>
    //     </div>
    //     <div className="flex flex-1 flex-col justify-start">
    //         <h3 className="text-heading4-medium text-light-1">Discover Users</h3>
    //     </div>
    // </section>
    // )
return(
    <section className="custom-scrollbar rightsidebar  bg-transparent">
    <div className="flex w-full flex-1 flex-col gap-6 px-2">
    <h3 className="relative bottom-[4rem] text-[1.5rem] text-black">Find New Groups</h3>

    </div>
    <div className="flex w-full flex-1 flex-col gap-6 px-2">
    <h3 className="relative bottom-[4rem] text-[1.5rem] text-black">Find New Users</h3>
    </div>
    <div className="absolute justify-start  top-[1.55rem] left-[2.7rem]"></div>
    <div
    className="absolute left-0 top-0 h-full min-h-[1em] w-[.1rem] border-t-0 bg-gradient-to-tr from-transparent via-rose-300 to-transparent opacity-50 dark:via-neutral-400 lg:block">
</div>
    </section>)
//     <div className="mb-6 px-6 ">
//       {isUserSignedIn && <CreateFeedPost />}
//     </div>
//     <div className="mb-6 px-6  ">
//       {isUserSignedIn && (
       
//           <Image
//             src="/assets/user-helsinki.svg"
//             alt="profile"
//             className="mr-2"
//             width={24}
//             height={24}
//           />
//       )}
//     </div>
//     <div className="mb-6 px-6 ">
//       {isUserSignedIn && (
       
//           <Image
//             src="/assets/signout-helsinki.svg"
//             alt="logout"
//             className="mr-2"
//             width={24}
//             height={24}
//           />
      
//       )}
//     </div>
//     <div className="absolute justify-start  top-[1.55rem] left-[2.7rem] ">
//     <Link href="/" className="flex items-center gap-2">
//       <Image src="/assets/logo-black.svg" alt="logo" width={36} height={36} /> 
//       <div className={`${parabole.className}`}>
//       <span  className=" text-[2.5rem] font-bold text-black tracking-[.0rem] max-xs:hidden">MESH</span>
//       </div>

//     </Link>
    
//     </div>

//   </section>

}

export default RightSidebar;
