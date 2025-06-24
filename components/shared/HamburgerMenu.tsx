"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { findOrGenerateInviteToken } from "@/lib/actions/realtimeroom.actions";
import { useAuth } from "@/lib/AuthContext";
import useStore from "@/lib/reactflow/store";
import { AppState } from "@/lib/reactflow/types";
import { Menu } from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import ShareRoomModal from "../modals/ShareRoomModal";

export default function HamburgerMenu({ roomId }: { roomId: string }) {
  const user = useAuth().user;

  const [isOpen, setIsOpen] = useState(false);
  const store = useStore(
    useShallow((state: AppState) => ({
      openModal: state.openModal,
    }))
  );
  let menuItemLinks;

  if (user) {
    menuItemLinks = [
      { label: "Home", href: "/" },
      { label: "Profile", href: `/profile/${user.userId}` },
      { label: "Create Room", href: `/create-room` },
    ];
  } else {
    menuItemLinks = [
      { label: "Home", href: "/" },
      { label: "Sign Up", href: `/register` },
      { label: "Create Room", href: `/create-room` },
    ];
  }

  const openShareModal = () => {
    if (!user) {
      return;
    }
    findOrGenerateInviteToken({ roomId, userId: user.userId! }).then(
      (inviteToken) => {
        store.openModal(ShareRoomModal({ inviteToken: inviteToken.token }));
      }
    );
  };

  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[200px] sm:w-[250px] border-l border-primary/20"
          >
            <nav className="flex flex-col space-y-4 mt-8">
              {menuItemLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              {user && (
                <div
                  className="text-lg font-medium hover:text-primary transition-colors hover:cursor-pointer"
                  onClick={() => openShareModal()}
                >
                  Invite other users
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
