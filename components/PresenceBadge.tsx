"use client";
import { useStallPresence } from "@/hooks/useStallPresence";

export function PresenceBadge({ stallId }: { stallId: number }) {
  const online = useStallPresence(stallId);
  return (
    <span
      className={`ml-1 inline-block w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-gray-400"}`}
      title={online ? "Online" : "Offline"}
    />
  );
}

export function StallPresenceTracker({ stallId }: { stallId: number }) {
  useStallPresence(stallId, true);
  return null;
}
