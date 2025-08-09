

// "use client";
// import PrivateChatPane from "../PrivateChatPane";
// import { usePrivateChatManager } from "@/contexts/PrivateChatManager";

// export default function PrivateChatDock() {
//   const { state } = usePrivateChatManager();
//   const panes = Object.values(state.panes);
//   if (!panes.length) return null;

//   // Keep the wrapper for layering only
//   return (
//     <div className="fixed inset-0 pointer-events-none z-[9999]">
//       {panes.map((p) => (
//         <PrivateChatPane key={p.id} pane={p} />
//       ))}
//     </div>
//   );
// }
// components/chat/PrivateChatDock.tsx
"use client";

import Image from "next/image";
import PrivateChatPane from "../PrivateChatPane";
import { usePrivateChatManager } from "@/contexts/PrivateChatManager";

export default function PrivateChatDock() {
  const { state, dispatch } = usePrivateChatManager();
  const panes = Object.values(state.panes || []);

  const openPanes = panes.filter(p => !p.minimised);
  const minimised = panes.filter(p => p.minimised);

  if (!panes.length) return null;

  return (
    <div id="pcp-bounds" className="fixed inset-0 pointer-events-none z-[60]">
      {/* floating panes */}
      {openPanes.map(p => (
        <PrivateChatPane key={p.id} pane={p} />
      ))}

      {/* dock bar */}
      {minimised.length > 0 && (
        <div className="pointer-events-auto fixed bottom-2 right-2 flex flex-row-reverse gap-2">
          {minimised.map(p => (
            <button
              key={p.id}
              title={`Open chat with ${p.peerName}`}
              onClick={() => dispatch({ type: "RESTORE", id: p.id })}
              className="group flex items-center gap-2 rounded-t-md rounded-bl-md bg-white/90 backdrop-blur
                         border shadow px-3 py-2 hover:bg-white"
            >
              {p.peerImage ? (
                <Image
                  src={p.peerImage}
                  alt=""
                  width={20}
                  height={20}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="inline-block w-5 h-5 rounded-full bg-slate-300" />
              )}
              <span className="text-sm">{p.peerName}</span>
              {p.unread ? (
                <span className="ml-1 text-xs rounded bg-indigo-600 text-white px-1">
                  {p.unread}
                </span>
              ) : null}
              <span
                className="ml-2 text-slate-500 hover:text-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: "CLOSE", id: p.id });
                }}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
