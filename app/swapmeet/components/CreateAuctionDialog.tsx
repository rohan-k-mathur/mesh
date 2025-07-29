"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { mutate } from "swr";

export default function CreateAuctionDialog({ stallId, itemId }: { stallId: number; itemId: number; }) {
  const [open, setOpen] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/auction/create", {
      method: "POST",
      body: JSON.stringify({
        stallId,
        itemId,
        reserveCents: +form.get("reserve")! * 100,
        minutes: +form.get("minutes")!,
      }),
    });
    setOpen(false);
    mutate(`/swapmeet/api/items?stall=${stallId}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="btn-secondary w-full">Start auction</button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-3">
          <input
            name="reserve"
            type="number"
            step="0.01"
            placeholder="Reserve price"
            className="border px-2 py-1 w-full"
          />
          <input
            name="minutes"
            type="number"
            step="1"
            min="1"
            placeholder="Duration (min)"
            className="border px-2 py-1 w-full"
          />
          <button className="btn-primary w-full">Create</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
