"use client";

import { useState } from "react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import Bottleneck from "bottleneck";

export interface DiscoveryCardData {
  id: string;
  content: React.ReactNode;
}

interface CardStackProps {
  items: DiscoveryCardData[];
  onExhausted: () => void;
}

const limiter = new Bottleneck({ maxConcurrent: 1, minTime: 600 });

export default function CardStack({ items, onExhausted }: CardStackProps) {
  const [index, setIndex] = useState(0);
  const [style, api] = useSpring(() => ({ x: 0, rotate: 0, scale: 1 }));

  const bind = useDrag(({ down, movement: [mx], direction: [dx], velocity, time }) => {
    if (down) {
      api.start({ x: mx, rotate: mx / 10, immediate: true });
    } else {
      const should = Math.abs(mx) > 80 && time < 500;
      if (should) {
        const dir = dx > 0 ? 1 : -1;
        api.start({ x: dir * 500, rotate: dir * 45, immediate: false }).then(() => {
          handleSwipe(dir);
          api.set({ x: 0, rotate: 0 });
        });
      } else {
        api.start({ x: 0, rotate: 0 });
      }
    }
  });

  async function handleSwipe(dir: number) {
    const current = items[index];
    if (!current) return;
    const body = { itemId: current.id, signal: dir > 0 ? 1 : -1, ts: Date.now() };
    try {
      await limiter.schedule(() =>
        fetch("/api/v2/discovery/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
    } catch (err) {}
    const next = index + 1;
    if (next >= items.length) {
      onExhausted();
    }
    setIndex(next);
  }

  const card = items[index];
  if (!card) return null;

  return (
    <div className="relative w-full h-full">
      <animated.div {...bind()} style={{ x: style.x, rotate: style.rotate, touchAction: "none" }} className="absolute w-full will-change-transform">
        {card.content}
      </animated.div>
    </div>
  );
}
