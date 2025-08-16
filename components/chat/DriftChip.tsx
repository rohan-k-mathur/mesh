"use client";
import React from "react";

export function DriftChip({
  title,
  count,
  onOpen,
}: {
  title: string;
  count: number;
  onOpen?: () => void;
}) {
  return (
    <div className="mx-auto mt-2 max-w-[70%]">
      <button
        type="button"
        onClick={onOpen}
        className="w-full justify-center items-center text-center text-[0.9rem] px-3 py-2 rounded-lg bg-white/70 border hover:bg-white shadow-sm"
        title="Open drift"
      >
        🌀 <span className="font-medium">{title}</span>
        <span className="ml-2 text-slate-500">· {count} message{count === 1 ? "" : "s"}</span>
      </button>
    </div>
  );
}
