

"use client";
import PrivateChatPane from "../PrivateChatPane";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";

export default function PrivateChatDock() {
  const { state } = usePrivateChatManager();
  const panes = Object.values(state.panes);
  if (!panes.length) return null;

  // Keep the wrapper for layering only
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {panes.map((p) => (
        <PrivateChatPane key={p.id} pane={p} />
      ))}
    </div>
  );
}
