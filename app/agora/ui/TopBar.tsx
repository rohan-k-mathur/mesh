"use client";
export function TopBar({
  tab, onTab, q, onQ, paused, onPause,
}: {
  tab: "all"|"following"|"calls"|"votes"|"accepted";
  onTab: (t: any) => void;
  q: string; onQ: (s: string) => void;
  paused: boolean; onPause: () => void;
}) {
  const tabs: Array<[typeof tab, string]> = [
    ["all","All"], ["following","Following"], ["calls","Calls"], ["votes","Votes"], ["accepted","Accepted"]
  ];
  
  return (
    <div className="sticky top-0 z-10 bg-gradient-to-b from-white/70 to-white/30 backdrop-blur rounded-b-xl">
      <div className="flex items-center gap-2 py-2">
        <div className="flex items-center gap-1">
          {tabs.map(([k,label]) => (
            <button
              key={k}
              onClick={() => onTab(k)}
              className={`px-2 py-1 rounded text-sm ${tab===k ? "bg-white border" : "hover:bg-white/60 border"}`}
            >{label}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 text-sm w-[260px] bg-white/80"
            placeholder="Search rooms, claims, sources…"
            value={q}
            onChange={(e) => onQ(e.target.value)}
          />
          <button onClick={onPause} className={`px-2 py-1 rounded text-sm border ${paused ? "bg-amber-100" : "bg-white/80"}`}>
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>
    </div>
  );
}
