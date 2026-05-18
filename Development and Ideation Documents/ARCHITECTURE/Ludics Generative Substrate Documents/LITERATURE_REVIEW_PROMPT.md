# Literature Review Prompt — Ludics Generative Substrate

**Purpose:** Self-contained research brief for an Opus-4.6-class deep-research agent. Run in parallel to manual literature review. The agent's deliverable is a single referenceable document (specified in §6 below) that the conceptual-track sessions can consult going forward.

**How to use:** Paste this entire document as the system/initial prompt to a fresh research-agent instance with web/search access. The agent should treat §1 as background, §2 as the falsifiable-claims checklist driving the search, §3 as the bucket structure, §4 as scope discipline, §5 as source-quality rules, and §6 as the required output format.

---

## 1. Background 

You are reviewing literature in support of a conceptual track on **Ludics as a generative substrate for multi-agent deliberation**, developed for the Mesh / Isonomia platform — a deliberative-democracy system that already runs structured argumentation (ASPIC+, AIF) and an ECC-style categorical argumentation algebra over a Postgres / Prisma / MCP backend.

The conceptual track has produced four documents (you do not have access to them; the relevant content is summarized below):

1. **LUDICS_GENERATIVE_SUBSTRATE.md** — terrain map of Ludics treated *generatively* rather than analytically. Eight-region map: designs, orthogonality, behaviours, saturation, DDS strategies, multi-agent polarity, delocation, cut algebra. Three opening theses, refined to T3′, T4, T5 (below).
2. **LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md** (Session 0b) — formalization of the **instantiation operation** $\iota$ between a witnessing-layer dialogue act $W$ and a dialectical-layer Ludics move $m$, with four invariants (I1–I4). First-pass precise definitions of three generative outputs: the **exposure map** $E(D_P) = \sigma(D_P)^\perp$ stratified into walked/witnessable/latent + topology + propagation; the **articulation lattice** $\mathsf{Art}(B) = (B, \leq)$ identified as a Ludics-native presentation of an Ambler hom-set; the **witnessing record** $\mathsf{Witness}$ as removable, anonymous-by-default metadata. Also: a designed-but-deferred announcement discipline with four constraints (A1–A4).
3. **LUDICS_OPEN_COMPOSITION_JOINT.md** (Sessions 0c/0d/0e) — three follow-ons: **open behaviours** as a time-indexed directed system $\{\mathsf{Art}(B_t)\}$ with partial transition maps and three openness levels (carrier / loci / orthogonality); **composition algebra** with three operators (subordination $\triangleright$, transport via $f$, federation $\otimes$) and how each composes the four 0b components; **joint saturation** $\sigma_{\mathrm{joint}}(D_P, \mathsf{Witness}) = \sigma(D_P) \cup \mathrm{Reach}(\{m : \exists w \in \mathsf{Witness}, w.m = m\})$ as protocol-rule forward-closure over participation.
4. **LUDICS_USEFULNESS_BRAINSTORM.md** — six-section question deck (A–F), session log.

**Three load-bearing architectural commitments:**

- **T3′ (anonymous polarity).** Ludics polarity (Proponent/Opponent) is *not* identified with participant identity. Polarity is a structural feature of moves in a design; participants instantiate moves but do not *constitute* polarity.
- **T4 (dialectical / witnessing separation).** Two coordinate (non-hierarchical) layers. The **dialectical layer** is anonymous, position-centric, Ludics-native, structurally pre-existing — its consumers are MCP/AI agents (epistemic surface). The **witnessing layer** is attributed, person-centric, institutional, constructed by participation — its consumers are humans (legitimacy surface). The two are joined only by the instantiation operation $\iota$, which is *records-only* on the dialectical side. Deleting the witnessing record leaves the dialectical layer fully intact.
- **T5 (MCP/AI consumer).** Every substrate construction is developed with the question "what does this expose to an MCP-tool-using AI agent that nothing else does?" as a closing test. The track has proposed ~14 new MCP read tools structured around the four 0b components, time-indexed (0c), composable (0d), and closed under participation-forcing (0e).

**The commitment to Reading C.** Of four possible readings of multi-agent polarity (A: Opponent = coalition; B: Opponent = each participant; C: Opponent = the behaviour $\sigma(D_P)^\perp$ itself, participants witness moves in pre-structured space; D: hybrid), the track committed to **Reading C**. Individuals do not constitute Opponent; they instantiate moves that already exist in $\sigma(D_P)^\perp$. The witnessing layer carries attribution; the dialectical layer carries structure.

**The Ambler hom-set claim (load-bearing, externally checkable).** The articulation lattice $\mathsf{Art}(B)$ — the set of designs in a behaviour $B$ ordered by inclusion, treated as a join-semilattice — is claimed to be **the same mathematical object** as the Ambler hom-set $\mathrm{Hom}_{\mathcal{A}_\Gamma}(A, B)$ viewed as a join-semilattice of derivations (Ambler 1996, used in the platform's ECC plan). Each design in $B$ is a derivation; the join is Ambler's $\vee$; minimal elements are *selected* arrows. This convergence is the conceptual track's most testable identification.

---

## 2. Falsifiable claims (the search checklist)

These are the substrate claims you should pressure-test against the literature. For *each*, your output must say one of: **confirmed**, **partially confirmed (with caveat)**, **original to this track (no prior art found)**, **contradicted by source X**, or **open / inconclusive**. Cite specific sources for every non-"original" classification.

**Mathematical / Ludics-internal claims**

- **C1.** A behaviour $B$ in Ludics carries a natural partial order $\leq$ given by inclusion of designs-as-trees (or inclusion of loci-and-moves), and $(B, \leq)$ forms a **join-semilattice** under union of articulations.
- **C2.** The *minimal* elements of $(B, \leq)$ correspond to Girard's notion of **incarnations** of $B$.
- **C3.** *(Load-bearing.)* $(B, \leq)$ as a join-semilattice is the same object as the Ambler hom-set $\mathrm{Hom}_{\mathcal{A}_\Gamma}(A, B)$ presented as a join-semilattice of derivations (Ambler 1996; cf. Mesh ECC plan). Minimal incarnations correspond to **selected arrows** in Ambler's sense.
- **C4.** Protocol saturation $\sigma(D)$ and bi-orthogonal closure $D^{\perp\perp}$ admit the **stratification** of $\sigma(D)^\perp$ by an external instantiation relation (i.e., it is mathematically natural to partition $\sigma(D)^\perp$ into walked / reachable-in-$k$ / latent given an arbitrary subset of "instantiated" moves).
- **C5.** Behaviours can be treated as a **directed system over time** $\{B_t\}$ with partial transition maps (rather than only as snapshots), and this is consistent with Girard's framework rather than a deviation from it.
- **C6.** The "delocation" operator extends $D$ to admit a new locus and recomputes $\sigma(D)$, $\sigma(D)^\perp$, and behaviour membership in a principled (non-arbitrary) way.

**Argumentation-theoretic claims**

- **C7.** No published account of multi-agent Ludics commits to **Reading C** (Opponent = the behaviour, not a coalition or per-participant). Existing accounts default to Reading A (coalition / merge) or Reading B (per-participant designs).
- **C8.** ASPIC+ has no concept analogous to the "exposure map stratified by walked/witnessable/latent." Its closest analog is *defeated/undefeated argument labelling under a grounded/preferred extension*, but this is post-hoc dialectical labelling, not a generative space of coherent oppositions.
- **C9.** AIF (with L-/TA-nodes for dialogue) has no concept analogous to a **structural objection space** independent of any participant's utterance. AIF's dialogue layer is utterance-centric and attribution-default.
- **C10.** ECC (Ambler-style) supports composition of arrows in a way that lifts to a meaningful composition of articulation lattices, but this lifting has *not* been written out explicitly for the deliberation setting.

**Dialogue / commitment-store claims**

- **C11.** Hamblin-style commitment stores are *attributed by default* (each participant has their own commitment store keyed by identity). The dual-layer design (anonymous dialectical + attributed witnessing, joined by $\iota$) is *not* standard.
- **C12.** Walton–Krabbe dialogue typology, Singh-style social commitments, and McBurney–Parsons dialogue protocols do not formally distinguish a layer of *structurally pre-existing moves the participant binds to* from a layer of *the participant's own act*. The records-only / idempotent / locus-injective / total-modulo-extension discipline (I1–I4) on the instantiation operation is therefore novel-or-implicit, not standard.
- **C13.** No standard commitment-store framework includes a **graded canonicalization pipeline** (Mesh's NCM: Propositions → Clarification Requests → Non-Canonical Moves → Canonical DialogueMoves) upstream of the commitment-binding operation. The closest analog is Walton's "examination" dialogue moves, but those are content-level, not pipeline-level.

**Deliberative-democracy claims**

- **C14.** No major deliberative-democracy theorist (Habermas, Cohen, Mansbridge, Estlund, Fishkin) has formally proposed a **two-layer separation** in which structural deliberative facts are kept layer-anonymous and participation attribution lives in a parallel coordinate layer. The closest analogs are (a) Cohen's "deliberative legitimacy without identifiable authorship," (b) Mansbridge's "everyday talk," (c) Fishkin's deliberative-poll attribution discipline — but none formalizes the separation.
- **C15.** Deployed online-deliberation platforms (Pol.is, Decidim, Loomio, Kialo, vTaiwan tooling, Stanford Online Deliberation Platform) do not maintain a two-layer separation matching T4. Most are attribution-default; Pol.is is the closest to anonymous-by-default but lacks any structural layer at all.

**AI-agent / MCP-surface claims**

- **C16.** No deployed MCP or tool-use surface over a structured argumentation system currently exposes Ludics-native reads of the kind proposed (exposure map, articulation lattice, witnessing record). The closest analogs are (a) argument-graph retrieval over AIF or Argdown, (b) LLM-as-judge over ASPIC+ frameworks, (c) Kialo-API-style argument-tree queries — none of which exposes a stratified-objection-space or articulation-lattice query.
- **C17.** The "fidelity scorecard" discipline (mechanically computed structural ground truth against which agent briefings are regression-tested) is *not* standard in LLM-over-argument-graph work. Standard practice evaluates outputs by human rating or by LLM-judge, not by structural manifest.

**Architectural / methodological claims**

- **C18.** The identification of the "instantiation operation" as the same operation at four grain sizes (commitment, warrant, dialogue-move, UX-promotion) — and the refactor-level claim "one operation, four call sites" — does not have an established name in the dialogue-systems or commitment-store literature.
- **C19.** The "fossil-record" discipline (a walked objection whose target locus has been retracted is preserved in $\mathsf{Witness}$ but flagged as no longer applying to the current $D_P$) has no standard analog.
- **C20.** Joint saturation $\sigma_{\mathrm{joint}}(D_P, \mathsf{Witness})$ as the *forward closure over the union of Proponent commitments and witnessed moves* — and its interpretation as the formal account of "deliberative progress" via $E_\ell$ drainage — has not been formally proposed in the Ludics literature for multi-agent settings. Historical attempts at joint saturation merge multiple Proponent designs (Reading A), which is the construction Reading C dissolves.

The claim numbering above is the canonical reference for the deliverable. If you find a sub-claim that needs splitting (e.g., C3 splits into C3a, C3b), do so in the output.

---

## 3. Bucket structure for the search

Run the search in six buckets. Allocate roughly equal effort, but cap each bucket at ~10 high-relevance sources (see §4 scope discipline). The buckets map to claim clusters from §2.

### Bucket 1 — Ludics applied to dialogue / argumentation
Track the post-Girard Ludics community (2010–present): Faggian, Basaldella, Maurel, Lecomte, Quatrini, Tronçon, Fouqueré, the "Ludics and Natural Language" line, and any work treating Ludics as a substrate for dialogue/deliberation. Address C1, C2, C4, C5, C6, C7, C20.

### Bucket 2 — Ambler / categorical argumentation and ECC
Ambler 1996 directly + categorical-argumentation work since (Brewka & Eiter, Caminada-style categorical extensions, Booth / Caminada labelling-based semantics, recent categorical treatments of argumentation frameworks). Address C3, C10.

### Bucket 3 — Structured argumentation: ASPIC+, AIF, dynamic frameworks
Modgil & Prakken on ASPIC+ and on dynamic argumentation; Snaith & Reed on AIF and AIF-RA dialogue composition; recent "argument schemes as graph rewriting" work; Toni's ABA where relevant. Address C8, C9, C10 (cross-check).

### Bucket 4 — Dialogue systems & commitment stores
Hamblin commitment stores; Walton–Krabbe dialogue typology; Singh social commitments; McBurney–Parsons dialogue protocols; the canonicalization-pipeline question. Address C11, C12, C13, C18.

### Bucket 5 — Deliberative democracy theory & deployed online-deliberation platforms
Habermas, Cohen, Mansbridge, Estlund, Fishkin on legitimacy/attribution; for platforms: Pol.is, Decidim, Loomio, Kialo, vTaiwan, Stanford Online Deliberation Platform, DELIBA/IDEA workshop proceedings, recent CHI / CSCW / FAccT papers on deliberation-platform design. Address C14, C15.

### Bucket 6 — AI agents over structured argumentation (last ~2 years)
LLM-as-judge in argumentation (Cohen et al., Wang et al., recent IJCAI/COMMA/EMNLP); MCP/tool-use over knowledge graphs and argument graphs; retrieval-augmented argumentation; LLM-driven argument-mining-to-graph pipelines; Kialo-API and Argdown-tool surfaces; any agent surface exposing argumentation queries. Address C16, C17, C19.

---

## 4. Scope discipline (what to *exclude*)

The deliverable must be referenceable, not encyclopedic. Exclusions:

- **Out of scope:** Full Ludics math foundations (Girard 2001 is referenced, not re-summarized); full argumentation-semantics literature (Dung 1995 onward); proof-theory background; general LLM agent literature; general deliberative-democracy theory beyond the named touchpoints.
- **Skip:** Middle-aged incremental work in any bucket that does not directly bear on a §2 claim. Prefer (a) recent surveys, (b) foundational papers, (c) work explicitly addressing a §2 claim. Drop the rest.
- **Do not:** Re-explain the substrate's own content back to the reader. Assume the reader has the three Ludics Generative Substrate Documents next to this review.

If a bucket genuinely has fewer than ~5 high-relevance sources, *say so explicitly* — that is itself a finding (the substrate is operating in genuinely under-explored territory).

---

## 5. Source-quality rules

- **Prefer:** Peer-reviewed papers (journal or top-tier conference: LICS, COMMA, IJCAI, AAAI, KR, AAMAS, ACL, EMNLP, CHI, CSCW), authoritative books, recent (≤5 years) survey papers, primary-source platform documentation (e.g., Pol.is published methodology, Decidim Whitepaper).
- **Acceptable:** Workshop papers (DELIBA, IDEA, ArgMining), arXiv preprints from established researchers, technical reports from research groups, well-maintained open-source project documentation.
- **Avoid:** Blog posts, marketing material, non-peer-reviewed industry whitepapers, undergraduate theses, Wikipedia (except as a navigation aid that is not cited).
- **Verification:** For any load-bearing claim (especially C3, C7, C11, C14, C16), cite at least two independent sources or explicitly note the single-source basis.
- **No fabrication:** If you cannot find a source for a claim, mark it *open / inconclusive*, not *original to this track*. The "original" verdict requires you to have actively searched and found nothing.

---

## 6. Required deliverable format

Produce a **single markdown document** named `LUDICS_GENERATIVE_SUBSTRATE_LITERATURE_REVIEW.md`, intended to live in `Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/`. Use KaTeX inline math (`$...$`) and block math (`$$...$$`) consistent with the substrate docs.

### Required structure

```
# Ludics Generative Substrate — Literature Review

**Date:** [completion date]
**Companion to:** LUDICS_GENERATIVE_SUBSTRATE.md, LUDICS_DIALECTICAL_WITNESSING_INTERFACE.md, LUDICS_OPEN_COMPOSITION_JOINT.md, LUDICS_USEFULNESS_BRAINSTORM.md
**Scope and exclusions:** [verbatim from §4 of the prompt]

## §1. Executive summary
[~1 page. Top-line findings: how many claims confirmed, partially confirmed, original, contradicted, open. Three to five most consequential findings — claims whose verdict materially changes the conceptual track. Three to five most consequential gaps in the literature that the substrate is well-positioned to fill.]

## §2. Bucket 1 — Ludics applied to dialogue / argumentation
[Roughly 2 pages. Narrative summary of the relevant body of work. Then a "Status of substrate claims" subsection covering every §2-claim assigned to this bucket, each with verdict + sources.]

## §3. Bucket 2 — Ambler / categorical argumentation and ECC
[Same shape. The Ambler hom-set claim C3 is the most important; spend more space on it.]

## §4. Bucket 3 — Structured argumentation: ASPIC+, AIF, dynamic frameworks
[Same shape.]

## §5. Bucket 4 — Dialogue systems & commitment stores
[Same shape.]

## §6. Bucket 5 — Deliberative democracy theory & deployed platforms
[Same shape. Sub-divide into (a) theory, (b) platforms.]

## §7. Bucket 6 — AI agents over structured argumentation
[Same shape.]

## §8. Reference-cluster index
[Flat list of ~30–60 canonical citations, organized by bucket. Each citation: full reference + 1–3 sentence relevance note tying it to specific §2 claims. This is the persistent value of the review — formatted for grep-ability.]

## §9. Concrete revisions to the substrate docs
[Bulleted list. Each bullet: "If finding X holds, update [substrate-doc § Y] to [proposed change]." Make these actionable, not aspirational. This is what makes the review useful rather than archival.]

## §10. Open research questions surfaced
[Items the review found that the substrate had not anticipated. Numbered, with a one-paragraph framing each. These feed the next round of conceptual sessions.]

## Appendix A — Claims verdict table
[A compact table: Claim ID | one-line restatement | Verdict | Primary source(s) | Secondary source(s) | Notes. All 20+ claims from §2 of this prompt, in order, with any sub-splits.]
```

### Length target

12–25 pages total. Sections §2–§7 should be roughly equal weight (~2 pages each), §8 will be dense, §9 short and pointed, §10 brief.

### Style

- Match the substrate-doc voice: precise, claim-first, no hedging filler, KaTeX inline math, double-quoted code identifiers, sub-section headings as questions only when the question is the structuring device.
- Cite inline as `(Author Year)` with full reference in §8. No footnotes.
- When summarizing a paper, say *what it claims* before *whether it confirms the substrate*. Reverse order makes the review feel selective.

---

## 7. Process guidance for the agent

- **Order of work:** Start with Bucket 2 (Ambler / ECC) since C3 is load-bearing and quickly checkable. Then Bucket 1 (Ludics) since it carries the most original claims. Then Buckets 3–6 in parallel as time allows.
- **When a claim resolves quickly:** Note it in §App. A, move on. Do not spend additional effort on confirmed claims with strong sources.
- **When a claim resists resolution:** Spend up to ~30 minutes of focused search before declaring it *open / inconclusive*. Do not chase indefinitely.
- **When you find a substrate-relevant result the prompt did not anticipate:** Surface it in §10 (Open research questions). Do not silently fold it into existing sections.
- **When you find prior art that the substrate appears to duplicate:** Flag it prominently in §1 (Executive summary) and §9 (Concrete revisions). This is the highest-value possible finding.
- **When you find a contradicting source:** Cite it precisely, state what it would imply for the substrate, and recommend a specific revision in §9.
- **Do not weaken claims to avoid contradictions.** The substrate authors want sharp verdicts. "Original to this track" is a valid and useful finding when it is genuinely the case.

---

## 8. Out-of-band note to the human running this in parallel

The manual review and this agent review should converge on the same §App. A table. Disagreements between the two are the most useful artifact of running both in parallel — they identify either (a) sources one side missed, or (b) interpretive ambiguities in the substrate claims. Reconcile by editing the prompt's §2 to sharpen the claim, not by averaging the verdicts.

When merging the two reviews into a final single document, prefer the agent's §8 reference index (likely more comprehensive) and the human's §9 revisions list (likely more actionable). §1 should be co-authored.
