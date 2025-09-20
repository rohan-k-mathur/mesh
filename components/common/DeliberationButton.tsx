// components/common/DeliberateButton.tsx
"use client";
export function DeliberateButton({ target }: { target: DeliberateTarget }) {
  async function go() {
    const r = await fetch("/api/deliberations/ensure", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ hostType: target.hostType, hostId: target.hostId, anchor: target.anchor }),
    });
    const j = await r.json();
    if (j?.id) {
      const url = `/deliberation/${j.id}${target.anchor?.selectorJson ? `#a=${j.anchorId}` : ""}`;
      // Seed claim if provided
      if (target.seed?.claimText) {
        await fetch("/api/dialogue/move", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({
            deliberationId: j.id,
            targetType: "claim",
            kind: "ASSERT",
            payload: { text: target.seed.claimText },
          }),
        });
      }
      location.href = url;
    }
  }
  return <button onClick={go} className="btn">Deliberate</button>;
}
