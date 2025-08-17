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
    <div className="mx-auto mt-4  min-w-[25%] max-w-[40%]">
      <button
        type="button"
        onClick={onOpen}
        className="w-full justify-center items-center text-center text-[0.9rem] py-3 px-3 rounded-xl
        bg-white/50 driftbutton [data-effects='off']:backdrop-blur-0 [data-effects='off']:bg-white/45"
        title="Open drift"
      >
        🌀 <span className="font-medium">{title}</span>
        <span className="ml-2 text-slate-500">· {count} message{count === 1 ? "" : "s"}</span>
      </button>
    </div>
  );
}
