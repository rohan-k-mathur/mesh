"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SuggestedUser {
  id: number;
  name: string | null;
  username: string;
  image: string | null;
  score?: number;
  overlap?: Record<string, string[]>;
}

interface RandomRoom {
  id: string;
  room_icon: string;
}
const isOff = true;

function RightSidebar() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [rooms, setRooms] = useState<RandomRoom[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/suggested-friends");
        if (res.ok) {
          const data = await res.json();
          console.log("suggestions", data);
          setUsers(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (!isOff) load();
  }, []);

  useEffect(() => {
    async function loadRooms() {
      try {
        const res = await fetch("/api/random-rooms?count=4");
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (!isOff) loadRooms();
  }, []);
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
 
  if (isOff) {
    return (
      <section className="sticky custom-scrollbar rightsidebar bg-transparent">
        <div className="absolute left-0 top-0 h-full w-[.1rem] bg-gradient-to-tr from-transparent via-rose-300 to-transparent opacity-50 dark:via-neutral-400 lg:block" />
        <h3 className="relative bottom-[4rem] text-[1.5rem] text-black">Right Sidebar</h3>
      </section>
    );
  }

  return (
    <section className="sticky custom-scrollbar rightsidebar  bg-transparent">
      <div className="sticky flex w-full flex-1 flex-col gap-2 px-2 mt-[-1rem]">
        <h3 className="relative bottom-[4rem] text-[1.5rem] text-black">Find New Groups</h3>
        <div className="relative bottom-[4rem] flex flex-col gap-y-4 items-center">
          { rooms.length === 0 ? (
            <p className="text-sm text-gray-500">No rooms</p>
          ) : (
            rooms.map((r) => (
              <Link key={r.id} href={`/room/${r.id}`}>
                <Button
                  variant={"outline"}
                  className="rounded-lg likebutton items-center justify-center bg-transparent outline-blue border-none"
                >
                  {r.id}
                </Button>
              </Link>
            ))
          )}
        </div>
      </div>
      <div className="flex w-full flex-1 flex-col gap-2 px-2">
        <h3 className="relative bottom-[4.4rem] text-[1.5rem] text-black">Find New Users</h3>
        <div className="relative bottom-[4.4rem] flex flex-col gap-y-4 items-center">
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">No suggestions</p>
          ) : (
            users.map((u) => (
              <Link key={u.id.toString()} href={`/profile/${u.id}`}> 
                <Button
                  variant={"outline"}
                  className="rounded-lg likebutton items-center justify-center bg-transparent outline-blue border-none"
                >
                  {u.name}
                  {u.score !== undefined && (
                    <span className="ml-2 text-xs text-gray-600">
                      {u.score.toFixed(2)}
                    </span>
                  )}
                </Button>
              </Link>
            ))
          )}
        </div>
      </div>
      <div className="absolute justify-start  top-[1.55rem] left-[2.7rem]"></div>
      <div className="absolute left-0 top-0 h-full min-h-[1em] w-[.1rem] border-t-0 bg-gradient-to-tr from-transparent via-rose-300 to-transparent opacity-50 dark:via-neutral-400 lg:block"></div>
    </section>
  );

}

export default RightSidebar;
