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
    function gotopageflow()
    {
      router.push("/pageflow");

    }
    function gotohalfway()
    {
      router.push("/halfway");

      
    }
    function gotowordrails()
    {
      router.push("/wordrails");

    }
    function gotopivot()
    {
      router.push("/pivot");

    }
    function gotoentropy()
    {
      router.push("/entropy");

    }
    return (
      <section className="p-4 space-y-4">
        <h1 className="text-[2rem] px-[35%] pb-4  font-bold">MESH Applications</h1>
        <div className="space-y-4 ">

            <div  className="flex flex-wrap gap-4 w-fit h-full">
                <Button variant={"outline"} className="likebutton h-full text-[1.2rem] p-4" type="submit" onClick={gotoflowbuilder}>
                <Image
              src="/assets/model-builder.svg"
              alt="branch"
              className="mr-2"
              width={24}
              height={24}
            />
            Flow Builder
              </Button>
              <div className="space-y-4"></div>
              <Button variant={"outline"} className="likebutton h-full text-[1.2rem] p-4" type="submit" onClick={gotopageflow}>
                <Image
              src="/assets/branch.svg"
              alt="pageflow"
              className="mr-2"
              width={24}
              height={24}
            />
            Pageflow
              </Button>
              <div className="space-y-4"></div>
              <Button variant={"outline"} className="likebutton text-[1.2rem] h-full p-4" type="submit" onClick={gotohalfway}>
              <Image
              src="/assets/map.svg"
              alt="map"
              className="mr-2"
              width={24}
              height={24}
            />
                Halfway              
                </Button>
                <div className="space-y-4"></div>
              <Button variant={"outline"} className="likebutton text-[1.2rem] h-full p-4" type="submit" onClick={gotowordrails}>
              <Image
              src="/assets/workspace.svg"
              alt="wordrails"
              className="mr-2"
              width={24}
              height={24}
            />
                Word Rails              
                </Button>
                <div className="space-y-4"></div>

                <Button variant={"outline"} className="likebutton text-[1.2rem] h-full p-4" type="submit" onClick={gotopivot}>
              <Image
              src="/assets/pivotgame.svg"
              alt="pivot"
              className="mr-2"
              width={24}
              height={24}
            />
                Pivot            
                </Button>
                <div className="space-y-4"></div>

                <Button variant={"outline"} className="likebutton text-[1.2rem] h-full p-4" type="submit" onClick={gotoentropy}>
              <Image
              src="/assets/data-blob.svg"
              alt="entropy"
              className="mr-2"
              width={24}
              height={24}
            />
                Entropy            
                </Button>
            </div>
        </div>
      </section>
    );
  }
  