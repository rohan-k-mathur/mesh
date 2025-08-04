"use client";
import { useArrowNav } from "@/app/swapmeet/components/useArrowNav";
import { useGridNavigator } from "@/hooks/useGridNavigator";

export function NavHook({ x, y }: { x: number; y: number }) {
  useArrowNav(x, y);
  useGridNavigator(x, y);
  return null;
}
