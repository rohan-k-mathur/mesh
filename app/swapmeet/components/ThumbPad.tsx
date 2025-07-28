"use client";
import { useMove } from "./useMove";

export function ThumbPad({ x, y }: { x: number; y: number }) {
  const move = useMove(x, y);

  return (
    <div
      className=" fixed bottom-[35%] right-16 border-2 border-slate-300/70
                 w-28 h-28 bg-white/20 rounded-full backdrop-blur
                 flex items-center justify-center text-gray-700"
    >

      {[
        { dir: "up", dx: 0, dy: -1, class: "translate-y-[-95%]" },
        { dir: "down", dx: 0, dy: 1, class: "translate-y-[95%]" },
        { dir: "left", dx: -1, dy: 0, class: "translate-x-[-95%]" },
        { dir: "right", dx: 1, dy: 0, class: "translate-x-[95%]" },
      ].map((b) => (
        <button
          key={b.dir}
          aria-label={b.dir}
          onClick={() => move(b.dx, b.dy)}
          className={`absolute ${b.class}
                      w-9 h-9 bg-indigo-300/70 rounded-xl 
                      flex items-center justify-center 
                      `}
        >
          <span className="sr-only">{b.dir}</span>
        </button>
      ))}
    </div>
  );
}
