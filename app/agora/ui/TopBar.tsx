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
    <div className="sticky max-w-screen w-full h-full top-0 z-10 bg-gradient-to-b from-indgo-50/30 to-slate-100/30 backdrop-blur rounded-md-b-xl">
      <div className="flex items-center gap-3 p-3">
        <div className="flex items-center gap-3">
          {tabs.map(([k,label]) => (
            <button
              key={k}
              onClick={() => onTab(k)}
              className={`px-4 py-1 agoratab   rounded-md text-xs ${tab===k ? " text-slate-900 ring-[3px] ring-offset-0 ring-emerald-400/50 " : " text-slate-900 "}`}
            >{label}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <input
            className=" rounded-md px-2 py-1 text-xs w-[260px] bg-white/80 minorfield border border-indigo-100 focus:outline-none"
            placeholder="Search rooms, claims, sources…"
            value={q}
            onChange={(e) => onQ(e.target.value)}
          />
          <button onClick={onPause} className={`px-4 py-1 agoratab   rounded-md text-xs  ${paused ? "bg-emerald-100" : "bg-white/80"}`}>
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </div>
    </div>
  );
}
