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
  return <button onClick={go} className="btnv2 btnv2--sm text-xs px-3 py-1.5  ml-2">Deliberate</button>;
}
   