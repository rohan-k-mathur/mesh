// components/stack/LiftToDebateButton.tsx
"use client";

export default function LiftToDebateButton({ commentId, hostType, hostId }:{
  commentId: string; hostType: string; hostId: string;
}) {
  async function go() {
    const r = await fetch("/api/comments/lift", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ commentId, hostType, hostId, as: "claim" }),
    });
    let j: any = null;
    try { j = await r.json(); } catch {}
    if (r.ok && j?.deliberationId) {
      location.href = `/deliberation/${j.deliberationId}`;
    } else {
      alert(j?.error || `Lift failed (HTTP ${r.status})`);
    }
  }
  return <button onClick={go} className="text-[11px] border rounded px-1.5 py-0.5 ml-2">Lift to debate</button>;
}
