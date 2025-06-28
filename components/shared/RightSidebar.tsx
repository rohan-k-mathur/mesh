"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";

interface RandomUser {
  id: number;
  name: string;
  username: string;
  image: string | null;
}

function RightSidebar() {
  const [users, setUsers] = useState<RandomUser[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/random-users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    load();
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
  return (
    <section className="custom-scrollbar rightsidebar  bg-transparent">
      <div className="flex w-full flex-1 flex-col gap-6 px-2">
        <h3 className="relative bottom-[4rem] text-[1.5rem] text-black">Find New Groups</h3>
      </div>
      <div className="flex w-full flex-1 flex-col gap-2 px-2">
        <h3 className="relative bottom-[4rem] text-[1.5rem] text-black">Find New Users</h3>
        <div className="relative bottom-[4rem] flex flex-col gap-2">
          {users.map((u) => (
            <Link key={u.id} href={`/profile/${u.id}`}>
              <Button className="w-full rounded-md rightsidebar-item border-none">
                {u.name}
              </Button>
            </Link>
          ))}
        </div>
      </div>
      <div className="absolute justify-start  top-[1.55rem] left-[2.7rem]"></div>
      <div className="absolute left-0 top-0 h-full min-h-[1em] w-[.1rem] border-t-0 bg-gradient-to-tr from-transparent via-rose-300 to-transparent opacity-50 dark:via-neutral-400 lg:block"></div>
    </section>
  );
}

export default RightSidebar;
