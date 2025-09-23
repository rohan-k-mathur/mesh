// components/discussion/DeliberateButton.tsx
"use client";
import * as React from "react";

export function DeliberateButton({ discussionId }: { discussionId: string }) {
  const [busy, setBusy] = React.useState(false);

  async function attachNew() {
    if (busy) return;
    setBusy(true);
    try {
      // Replace with your actual create deliberation API
      const create = await fetch("/api/deliberations", { method: "POST" });
      const { deliberation } = await create.json();
      await fetch(`/api/discussions/${discussionId}/deliberations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliberationId: deliberation.id }),
      });
      location.href = `/deliberation/${deliberation.id}`;
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btnv2 btnv2--sm text-xs px-3 py-1.5 " onClick={attachNew} disabled={busy}>
      {busy ? "Attaching…" : "Deliberate"}
    </button>
  );
}
