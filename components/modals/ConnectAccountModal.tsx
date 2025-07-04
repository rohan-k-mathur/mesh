"use client";

import { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveIntegration } from "@/lib/actions/integration.actions";

export default function ConnectAccountModal() {
  const [service, setService] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;
    const credential = JSON.stringify({ email, username });
    await saveIntegration({ service, credential });
    setService("");
    setEmail("");
    setUsername("");
  };

  return (
    <DialogContent className="max-w-[40rem]">
      <DialogHeader>
        <DialogTitle>Connect Account</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          placeholder="Service (e.g. gmail)"
          value={service}
          onChange={(e) => setService(e.target.value)}
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="flex gap-2 mt-2">
          <Button type="submit">Save</Button>
          <DialogClose asChild>
            <Button variant="secondary" type="button">
              Close
            </Button>
          </DialogClose>
        </div>
      </form>
    </DialogContent>
  );
}
