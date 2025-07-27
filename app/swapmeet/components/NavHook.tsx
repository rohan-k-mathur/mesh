"use client";
import { useArrowNav } from "@/app/swapmeet/components/useArrowNav";

export function NavHook({ x, y }: { x: number; y: number }) {
  useArrowNav(x, y);
  return null;
}
