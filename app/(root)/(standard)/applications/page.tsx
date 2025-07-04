"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Router from "next/router";

import { useAuth } from "@/lib/AuthContext";
import { app } from "@/lib/firebase/firebase";
import { RealtimeRoom } from "@prisma/client";
import { getAuth, signOut } from "firebase/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";
import localFont from "next/font/local";
import CreateFeedPost from "@/components/forms/CreateFeedPost";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { useShallow } from "zustand/react/shallow";
import UserRoomsModal from "../modals/UserRoomsModal";
  type Template = {
    name: string;
    description: string;
  };


  export default function Page() {
    const templates: String[] = ["Flow Builder", "Halfway"];
    const router = useRouter();
    function gotoflowbuilder()
    {
      router.push("/workflows/new");

    }
    function gotohalfway()
    {
      router.push("/halfway");

    }
    return (
      <section className="p-4 space-y-4">
        <h1 className="text-[2rem] font-bold">MESH Applications</h1>
        <div className="space-y-4">

            <div  className="flex gap-4 w-fit h-full">
                <Button variant={"outline"} className="likebutton h-full text-[1.2rem] p-4" type="submit" onClick={gotoflowbuilder}>
                <Image
              src="/assets/branch.svg"
              alt="logout"
              className="mr-2"
              width={24}
              height={24}
            />
            Flow Builder
              </Button>
              <div className="space-y-4"></div>
              <Button variant={"outline"} className="likebutton text-[1.2rem] h-full p-4" type="submit" onClick={gotohalfway}>
              <Image
              src="/assets/map.svg"
              alt="logout"
              className="mr-2"
              width={24}
              height={24}
            />
                Halfway              
                </Button>
            </div>
        </div>
      </section>
    );
  }
  