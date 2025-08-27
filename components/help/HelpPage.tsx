'use client';

import { useEffect, useState } from 'react';

export default function DiscusHelpPage() {
  const [open, setOpen] = useState(false);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-controls="discus-help-modal"
        aria-expanded={open}
      >
        ?
      </button>

      {open && (
        <div
          id="discus-help-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discus-help-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/30"
          onClick={(e) => {
            // Close if user clicks the backdrop (but not inside the panel)
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-screen-lg h-[90vh] rounded bg-white border shadow p-4 md:p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h1 id="discus-help-title" className="text-base md:text-lg font-semibold">
                About Discus
              </h1>
              <button
                className="text-xs md:text-sm underline"
                onClick={() => setOpen(false)}
                aria-label="Close help"
              >
                Close
              </button>
            </div>

            {/* Structured content */}
            <article className="prose prose-sm md:prose-base max-w-none">
              <p>
                <strong>Discus</strong> is Mesh’s structured discussion space: a single page where a thread
                becomes <strong>arguments</strong>, <strong>citations</strong>, <strong>claims</strong>, and{' '}
                <strong>representative viewpoints</strong> you can trust and build on.
              </p>
              <ul>
                <li>Attach sources and <strong>verifiable excerpts</strong> in a couple clicks.</li>
                <li>Promote important points to <strong>Claims</strong>, compile <strong>Briefs</strong>, and track <strong>versions</strong>.</li>
                <li>Understand <strong>why</strong> something is shown (rule + signals).</li>
                <li><strong>Statuses</strong> and <strong>panels</strong> help repair threads instead of deleting them.</li>
              </ul>

              <hr />

              <h2>Quick start (2 minutes)</h2>
              <ol>
                <li><strong>Read</strong> the thread in the <strong>Arguments</strong> list.</li>
                <li><strong>Add your point</strong> (use <strong>Add source</strong> if you have one).</li>
                <li>Click <strong>Refresh views</strong> to see how your input changes the <strong>Representative viewpoints</strong>.</li>
                <li>Want more structure? Try <strong>Promote to Claim</strong>, <strong>Cite</strong>, or <strong>Card mode</strong>.</li>
              </ol>

              <hr />

              <h2>Core concepts</h2>

              <h3>Arguments</h3>
              <ul>
                <li>Short points (text, and optionally <strong>image / audio / video</strong>).</li>
                <li>You can <strong>Reply</strong>, <strong>Approve</strong>, <strong>Rebut</strong>, or <strong>Undercut</strong> via the composer.</li>
                <li><strong>Approvals</strong> help pick representative viewpoints.</li>
              </ul>

              <h3>Card mode (structured post)</h3>
              <p>A reusable “argument card” with slots:</p>
              <p><strong>Claim → Reasons → Evidence → Anticipated objections → Counter</strong></p>
              <p>Perfect for proposals or summaries without writing a full article.</p>

              <h3>Citing sources</h3>
              <ul>
                <li>Click <strong>Cite</strong> → paste the <strong>URL</strong> and the <strong>exact excerpt</strong>.</li>
                <li>Discus saves a <strong>snapshot</strong> and computes an <strong>excerpt hash</strong> so others can verify.</li>
                <li>You can <strong>Copy CSL-JSON</strong> for your bibliography tool.</li>
              </ul>

              <h3>Promote to Claim</h3>
              <p>Turn an argument (or Card) into a first-class <strong>Claim</strong>. Claims appear in the <strong>Claim mini-map</strong> and can be cited in <strong>Briefs</strong>.</p>

              <hr />

              <h2>Representative viewpoints</h2>
              <p>
                This module shows <strong>k</strong> internally consistent viewpoints that best represent the thread,
                based on approvals and edges (supports / rebuts).
              </p>

              <h4>Rules</h4>
              <ul>
                <li><strong>Utilitarian</strong> — maximize <strong>average coverage</strong> (good overall quality).</li>
                <li><strong>Harmonic</strong> — balance <strong>fairness</strong> (helps the least-covered users).</li>
                <li><strong>MaxCov</strong> — guarantee that at least one <strong>large group</strong> is fully represented (shows a <strong>JR</strong> badge if <strong>≥ n/k</strong> users are fully covered).</li>
              </ul>

              <h4>Best achievable (toggle)</h4>
              <p>
                Shows the <strong>maximum possible</strong> average coverage given <strong>mutually exclusive</strong> arguments.
                If two arguments can’t coexist, best achievable may be below 100%.
              </p>

              <h4>Conflicts explained</h4>
              <p>
                Lists the most common exclusivity conflicts, with links back to the exact arguments.
                <br />
                <em>Tip:</em> use the gear to switch the <strong>rule</strong> or change <strong>k</strong> (number of views).
              </p>

              <hr />

              <h2>Claim mini-map</h2>
              <p>As arguments are <strong>Promoted to Claim</strong>, they show up with small counts:</p>
              <ul>
                <li><strong>+ Support</strong> — how many claims support this claim.</li>
                <li><strong>– Counter</strong> — how many claims rebut this claim.</li>
              </ul>
              <p>This offers a quick visual of the thread’s structure and where evidence or definitions are thin.</p>

              <hr />

              <h2>Bridge summaries &amp; Briefs</h2>

              <h3>Bridge summary (outside-cluster)</h3>
              <p>
                A host (or automation) can request a summary from someone <strong>outside</strong> the dominant cluster.
                Once accepted, you’ll see a <strong>Bridge endorsement</strong> signal in “Why this is here”.
              </p>

              <h3>Living Briefs (wiki-like)</h3>
              <ul>
                <li><strong>Public page</strong> with inline <strong>version history</strong> and a <strong>diff mode</strong> (compare v2 vs v1 side-by-side).</li>
                <li>Each version lists its source <strong>Cards / Claims</strong>.</li>
                <li>A small <strong>provenance ribbon</strong> shows source coverage (e.g., <strong>% primary sources</strong>).</li>
              </ul>

              <hr />

              <h2>Governance &amp; safety</h2>

              <h3>Status chip (top of the panel)</h3>
              <ul>
                <li><strong>OK</strong> — normal discussion</li>
                <li><strong>NEEDS_SOURCES</strong> — add at least one reliable source</li>
                <li><strong>WORKSHOP</strong> — repair mode (clarify, add premise, tone down intensifiers)</li>
                <li><strong>OFF_TOPIC_REDIRECT</strong> — you’ll get a link to a better room</li>
                <li><strong>DUPLICATE_MERGE</strong> — combined into another thread</li>
                <li><strong>DISPUTED / OUT_OF_BOUNDS</strong> — flags for panel review or T&amp;S</li>
              </ul>

              <h3>Panels (thin, rotating)</h3>
              <p>
                Host can open a panel to make a 3-option decision (<strong>approve / workshop / redirect</strong>).
                Decisions write a <strong>receipt</strong> and a <strong>Room logbook</strong> entry.
              </p>

              <h3>Why this is here</h3>
              <p>Every selection or boost logs a short, human-readable reason (rule used, bridge endorsement, etc.).</p>

              <h3>At-risk mode</h3>
              <p>
                Rooms can disable previews, hide identities, and prefer private routes for <strong>sensitive</strong> discussions.
              </p>

              <hr />

              <h2>Tips for high-signal participation</h2>
              <ul>
                <li><strong>Add a source</strong> whenever you can (primary when possible).</li>
                <li><strong>Add missing premises</strong> if a reply relies on an implied assumption (you’ll see a prompt).</li>
                <li>Use <strong>Best achievable</strong> to understand the limits of coverage.</li>
                <li>Try <strong>Card mode</strong> when you have a structured point to make.</li>
                <li><strong>Promote to Claim</strong> for durable, citable statements (used by Briefs &amp; editors).</li>
              </ul>

              <hr />

              <h2>Keyboard shortcuts (when a list item is focused)</h2>
              <ul>
                <li><strong>A</strong> — Approve the argument</li>
                <li><strong>R</strong> — Reply (opens the composer)</li>
                <li><strong>C</strong> — Open Card mode</li>
              </ul>
              <p><em>(Focus an argument with Tab or by clicking it.)</em></p>

              <hr />

              <h2>FAQ</h2>

              <p><strong>How are “representative viewpoints” picked?</strong><br />
                By a transparent rule you can see and change: <strong>Utilitarian</strong>, <strong>Harmonic</strong>, or <strong>MaxCov</strong>.
                The module shows which rule was used.
              </p>

              <p><strong>What does “JR” mean?</strong><br />
                <strong>Justified Representation</strong> (MaxCov) — at least one sizable group (<strong>≥ n/k</strong> users) is fully represented by a single viewpoint.
              </p>

              <p><strong>Why can’t the best achievable coverage be 100%?</strong><br />
                Some arguments can’t logically co-exist. <strong>Conflicts explained</strong> lists the mutually exclusive pairs that limit coverage.
              </p>

              <p><strong>What’s the difference between an Argument, a Card, and a Claim?</strong><br />
                <strong>Argument</strong> — a point in the thread (short and quick).<br />
                <strong>Card</strong> — a structured post (claim, reasons, evidence, objections, counter).<br />
                <strong>Claim</strong> — a durable, citable statement in the claim graph.
              </p>

              <p><strong>How do citations work?</strong><br />
                Click <strong>Cite</strong> → paste <strong>URL</strong> and <strong>exact excerpt</strong>.
                We save a <strong>snapshot</strong> and <strong>excerpt hash</strong> so others can verify.
                You can <strong>Copy CSL-JSON</strong> for reference managers.
              </p>

              <p><strong>What is a Bridge summary?</strong><br />
                A short, accepted summary from <strong>outside</strong> the dominant cluster (reduces echo-chambers).
                You’ll see a <strong>Bridge endorsement</strong> in reasons.
              </p>

              <p><strong>What happens in WORKSHOP?</strong><br />
                It’s a <strong>repair mode</strong>: clarify wording, add sources or missing premises, and reduce intensifiers.
                Panels may <strong>auto-accept</strong> small fixes (like short premises) to speed improvement.
              </p>

              <p><strong>Can I export my work?</strong><br />
                Yes. <strong>Cards, Claims, and Brief versions</strong> have stable IDs (URNs) and can be exported; snapshots ensure future verifiability.
              </p>

              <hr />

              <h2>Troubleshooting</h2>
              <p><strong>I clicked Refresh views and nothing changed.</strong><br />
                With few arguments/approvals, results may match. Try adding a source or approving a few arguments first.
              </p>

              <p><strong>My cite didn’t verify.</strong><br />
                Re-check the <strong>exact</strong> excerpt, or try another source URL. Some sites block snapshots—paste the excerpt anyway for CSL JSON.
              </p>

              <p><strong>The page feels “busy.”</strong><br />
                Start with <strong>Arguments</strong> and <strong>Representative viewpoints</strong>;
                treat the <strong>Claim mini-map</strong> and <strong>Topology</strong> as optional power-tools.
              </p>

              <hr />

              <h2>For hosts &amp; stewards</h2>
              <ul>
                <li>Use the <strong>Status dropdown</strong> to nudge quality (<strong>NEEDS_SOURCES</strong>, <strong>WORKSHOP</strong>).</li>
                <li><strong>Panels</strong> are a light governance layer; they write receipts &amp; logbook entries.</li>
                <li><strong>Bridge requests</strong> recruit outside summarizers (endorsement improves distribution).</li>
                <li><strong>Compile to brief</strong> to finalize and version the thread’s outcomes.</li>
              </ul>

              <hr />

              <h2>Glossary</h2>
              <ul>
                <li><strong>Representative viewpoint</strong> — a consistent set of arguments selected by a rule (Utilitarian / Harmonic / MaxCov).</li>
                <li><strong>JR (Justified Representation)</strong> — MaxCov guarantee: <strong>≥ n/k</strong> users fully covered by one viewpoint.</li>
                <li><strong>Claim</strong> — a durable, citable statement in the claim graph.</li>
                <li><strong>Best achievable</strong> — the maximum average coverage possible given mutually exclusive arguments.</li>
                <li><strong>Snapshot &amp; excerpt hash</strong> — stored copy of a source + a hash of the exact quoted text for verification.</li>
                <li><strong>Bridge endorsement</strong> — accepted summary from outside the dominant cluster.</li>
                <li><strong>Brief</strong> — a wiki-like compiled summary with versions and diffs.</li>
              </ul>

              <hr />

              <h3>Need more help?</h3>
              <p>
                Open the <strong>? Help</strong> in the Discus header for quick tips, or ask a steward in the room.
              </p>
            </article>
          </div>
        </div>
      )}
    </>
  );
}
