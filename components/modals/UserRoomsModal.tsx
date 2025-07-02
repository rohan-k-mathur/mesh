"use client";

import { RealtimeRoom } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";

interface Props {
  userRooms: RealtimeRoom[];
}

const UserRoomsModal = ({ userRooms }: Props) => {
  return (
    <div>
      <DialogContent className="max-w-[30rem]">
        <DialogTitle>Your Rooms</DialogTitle>
        <div className="grid rounded-md px-4 py-2">
          <div className="custom-scrollbar max-h-60 overflow-y-auto flex flex-col gap-2 py-2">
            {userRooms.length > 0 ? (
              userRooms.map((room) => (
                <Link
                  href={`/room/${room.id}`}
                  key={room.id}
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded"
                >
                  <Image
                    src={room.room_icon}
                    alt={room.id}
                    width={24}
                    height={24}
                    className="object-contain h-6 w-6"
                  />
                  <p className="text-black">{room.id}</p>
                </Link>
              ))
            ) : (
              <p className="text-black">No rooms</p>
            )}
          </div>
          <div className="py-4">
            <DialogClose id="animateButton" className="form-submit-button pl-2 py-2 pr-[1rem]">
              <>Close</>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </div>
  );
};

export default UserRoomsModal;
