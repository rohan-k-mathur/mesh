# Q-034 / Q-033 — MELL Target Selection Literature Review

**Date:** 2026-06-16
**Answers:** Q-034 (Terui vs BF as the substrate's MELL target), Q-033 (is MELLS expressive enough for the Ambler `!`-image); input to Q-032 (Sironi principal sets as a T002 antichain template)
**Companion to:** MALL→MELL Incarnation Upgrade (Phase-1 audit); session 16 cluster sequencing
**Scope:** Bounded. Four primary papers — Terui *Computational Ludics* (TCS 412(20), 2011), Basaldella–Terui *On the Meaning of Logical Completeness* (LMCS 6(4:11), 2010), Faggian–Basaldella *Ludics with Repetitions* (LMCS 7(2:13), 2011; arXiv:1104.0504), Sironi *Type Theory in Ludics* (arXiv:1402.2511, 2014) — plus the Basaldella–Terui *Infinitary Completeness* companion (LICS 2010) where it bears on a specific axis. Two questions (Q-034, Q-033) on the fixed axis list (a)–(i). No six-bucket survey, no broadening into argumentation/deliberation/LLM literature. Depth over breadth: verbatim theorem statements with numbers for load-bearing axes (a, b, g, i).

**Source-access note.** Terui 2011, Basaldella–Terui 2010, the Infinitary-Completeness companion, and Sironi 2014 were read in full; quotations from them are verbatim from the source PDFs. BF 2011 §§1–9 were subsequently read in full from arXiv:1104.0504, so the MELLS grammar (§2.3), the non-uniform-strategy definition (Def 7.2), the separation-failure discussion (§6.3), and the VAM/associativity machinery (§8, Thm 8.13) are now verbatim-verified. BF §§10–11 exceeded the fetch length, so the *materiality* definition (Def 11.5), the internal/full-completeness theorems (Thm 11.16, Thm 11.17), and Remark 11.12 remain **audit-anchored** — flagged inline — though §5.2.3 of the fetched text independently confirms materiality is the §11 winning condition for the exponential case, and the abstract + §1.1.1 confirm full completeness for polarized MELL. No theorem number is invented.

---

## §1. Executive summary

**Q-034 verdict: MIXED — Terui-family is the better *framework* on a per-axis count (it wins a, b, e; ties c, d; loses f), but the evidence does NOT support a wholesale retarget, and it falsifies the cluster's hoped-for shortcut.** The brief's working hypothesis was "a positive Q-034 could make the Q-032 re-proof unnecessary." That hypothesis is **false**. The reason is a fragment mismatch that recurs across every Terui-family paper:

- The clean minimality / canonical-generator machinery — Terui's incarnation (Terui 2011, Def 4.7) and Sironi's explicit **principal set** (Sironi 2014, Def 11) — is proved in the **linear/affine** fragment. Sironi states her setting is affine ("we have weakening but we do not have contraction", fn 3) and explicitly defers the exponential case to BF: *"there exist extensions of Ludics that integrate exponentials [1], on which our approach may be applied."*
- The **exponential / MELL completeness** the substrate actually needs lives in a *different* place — Basaldella–Terui 2010 (exponentials internalized into nonlinear designs, constant-only) and BF 2011 (explicit polarized MELL). In **both** of those, **separation fails** (Basaldella–Terui 2010, Remark 2.4; BF via Maurel 2004) and **no minimality/antichain theorem is proved**.

So the exponential antichain (T002 at the `!`-layer) is **net-new work regardless of target**. Terui-family gives a cleaner *template* for it (Sironi's principal sets), not a free theorem.

**The single most decisive theorem found** is the absence of its counterpart: Sironi proves principality only affinely, e.g.

> **Proposition 6** (Sironi 2014). *$\mathbb{L}_n$ is principal, i.e., it is $\maltese$-free and $|(\mathbb{L}_n)^{\perp\perp}| = (\mathbb{L}_n)^{\maltese}$.*

— and there is **no analogue for any exponential/`!`-bearing behaviour** in any of the four papers.

**Q-033 verdict: SUFFICIENT-with-conditions.** If the substrate stays on BF (or BT2010), the constant-only MELLS fragment is **sufficient** for Ambler factual atoms *provided those atoms are ground / Skolemizable into signature names* (BT2010, Appendix A embeds the constant-only propositional fragment of LLP this way). The **additive** extension BF calls "straightforward" is in fact **folklore-extendable with a published carrying-out** — not in BF, but in BT2010 (additive connectives are first-class, internal completeness Thm 2.17, full completeness Thm 3.8) and Terui 2011 (Thm 4.14). It becomes **net-new work only if** Ambler's `!`-image needs genuine *propositional-variable polymorphism* — no framework in the set supplies propositional variables; all four are constant-only, and BT2010 explicitly lists variables and second-order quantifiers as future work.

**Is Q-032 absorbed?** No — by either choice. Sironi's principal sets are the strongest available **template** for the T002 re-proof (route i), but porting them to the exponential setting is the open step Sironi herself flags. Plan the Q-030 commit expecting to do the exponential antichain re-proof.

**One unanticipated finding (surfaced, not folded in):** the substrate's *existing* Fouqueré–Quatrini visitable-path incarnation tooling lives in the **locative/forest** lineage (addresses, cliques of visitable paths). Terui's win on axis (e) — the λ-style c-design syntax that matches the Ambler λ-calculus — comes precisely from *abandoning* locativity for variables, and the visitable-path characterization is known to be *harder* in the c-design presentation (arXiv:1403.3772, citing Pavaux). So Terui's syntactic advantage and the substrate's current tooling pull in opposite directions; this is a real retargeting cost, detailed in §2(f).

---

## §2. Q-034 — Terui / Basaldella–Terui vs BF, axis by axis

A note on which paper carries the MELL claim, because the brief's phrase "Terui … give full completeness for polarized linear logic with exponentials" splits across two papers and the split matters:

- **Terui 2011** (*Computational Ludics*) proves **internal completeness for connectives *without* exponentials** over **linear** designs (l-designs), plus a computational-power characterization. Its behaviour theory is MALL-level.
- **Basaldella–Terui 2010** (*On the Meaning of Logical Completeness*) proves **full completeness for proofs** for a polarized fragment **with exponentials**, where exponentials are *internalized* into nonlinear designs rather than appearing as an explicit `!` modality.

Throughout, "Terui-family" = the c-design substrate shared by both, plus Sironi's principal-set layer built on top of it.

### (a) Expressivity — which fragment, which completeness theorem, does Terui subsume the Q-033 gap?

**Terui 2011 (linear, no exponential connective).** Behaviours are over l-designs: *"An l-design $T$ is a total, linear, identity-free c-design such that $\mathsf{fv}(T)$ is finite"* (§4.1). Its connectives *"encompass connectives of polarized linear logic without exponentials"* (§4.3). Completeness is **internal**:

> **Theorem 4.14** (Internal Completeness, Terui 2011). *(1) $|\alpha\langle N_1,\dots,N_n\rangle|_h = \bigcup_{a(\vec{x}_a)\in\alpha} a\langle N_{i_1},\dots,N_{i_m}\rangle.$ (2) $|\alpha(P_1,\dots,P_n)|_\alpha = \sum_\alpha a(\vec{x}_a).[P^\perp_{i_1}/x_{i_1},\dots,P^\perp_{i_m}/x_{i_m}]^\perp.$*

Additives are first-class here: $\&=\{\pi_1(x_1),\pi_2(x_2)\}$ and $\oplus=\&$ (dual), with the worked corollary $|\oplus\langle N,M\rangle|_h = \iota_1\langle N\rangle \cup \iota_2\langle M\rangle$.

**Basaldella–Terui 2010 (nonlinear, exponentials internalized, constant-only).** This is where the exponential completeness lives:

> **Theorem 3.8** (Completeness for proofs, BT2010). *A sequent $D \vdash \Lambda$ is derivable in the proof system if and only if $D \models \Lambda$. In particular, for any positive logical behaviour $\mathbf{P}$ and a proof $P$, $P \vdash x_0 : \mathbf{P}$ is derivable if and only if $P \in \mathbf{P}$.*

The fragment is characterized as *"as strong as a polarized fragment of linear logic with exponentials … which is in turn as strong as a constructive version of classical propositional logic"* (BT2010, p. 2). Crucially, exponentials are **not an explicit modality**: *"We do not have exponentials here, because we are working in a nonlinear setting so that they are already incorporated into the connectives"* (Example 2.14). Contraction is admissible internally — duplicability is proved as the converse of an internal soundness statement (Theorem 2.15(3)). The fragment is **constant-only**: the conclusion lists *"propositional variables, second order quantifiers and nonlogical axioms"* as future work.

**BF 2011 (explicit polarized MELL, constant-only).** Full completeness w.r.t. **polarized MELL** ("MELLS"), with MLLS its multiplicative fragment (LMCS/arXiv abstract; Faggian copy: *"Formulas of MELLS split into positive P and negative N"*). Internal completeness Thm 11.16 → full completeness Thm 11.17 *(numbers per audit)*. Additives are described as "straightforward" but **not carried out** in the paper.

**Verdict (a): Terui-better, with a precise split.**
- *Additives:* Terui-family **carries them out** (BT2010 general connectives + internal completeness Thm 2.17/2.19; Terui 2011 Thm 4.14). BF defers them. **Terui-better.**
- *Propositional variables:* **none of the four** has them — all constant-only. **Even.**
- *Explicit `!` vs internalized exponential:* BF gives an **explicit** polarized MELL with a `!`/`?` discipline; BT2010 gives the **same expressive strength** but with `!` *internalized* into nonlinear designs. For the Ambler `!`-image (an explicit modality) BF's explicit MELLS is the *more literal* landing zone, but BT2010's internalized-contraction style arguably matches a λ-calculus source better (contraction is structural in λ-calculus). **Even, framework-dependent.**

Net: Terui-family is expressively at least BF's equal and strictly ahead on additives, but it does **not** subsume the propositional-variable part of the Q-033 gap.

### (b) Incarnation analogue / canonical generators — the decisive axis

**Terui 2011 has FQ-style incarnation with a minimality characterization.**

> **Definition 4.7** (incarnation, Terui 2011). *Let $\mathbf{T}$ be a behaviour and $U$ an l-design in it. The incarnation of $U$ in $\mathbf{T}$ is defined by $|U|_{\mathbf{T}} = \bigcap\{U' : U' \sqsubseteq [\![U]\!],\ U' \in \mathbf{T}\}$. An l-design $U$ is material in $\mathbf{T}$ if $U = |U|_{\mathbf{T}}$. $U$ is pure in $\mathbf{T}$ if it is material in $\mathbf{T}$ and furthermore $\maltese$-free.*

The incarnation is the **$\sqsubseteq$-least** interaction-equivalent design and is well-defined by stability (Cor 3.22), so $|\mathbf{T}|$ is exactly the set of minimal generators. Terui also proves a genuine **antichain** statement for the data fragment: *"Any pair of distinct data designs is incomparable with respect to $\sqsubseteq$ … Hence $d \sqsubseteq e$ implies $d = e$ for any data designs $d$ and $e$"* (§3.2).

**Sironi 2014 makes the minimal-generator notion explicit and names it.** This is the closest published analogue to the substrate's T002:

> **Definition 11** (principal set, Sironi 2014). *A set $E$ of designs is **principal** when its elements are $\maltese$-free and its $\maltese$-shortening is the incarnation of its biorthogonal, i.e., $|E^{\perp\perp}| = E^{\maltese}$.*

She *proves* principality for a family of types — **Proposition 3** ($\mathbb{N}at$), **Proposition 6** ($\mathbb{L}_n$), **Proposition 7** ($A \Rightarrow B$), **Proposition 10** ($(\Pi x\in A)B(x)$), **Proposition 11** ($(\Sigma x\in A)B(x)$) — and the antichain property falls out en route (distinct canonical naturals differ on a positive action, hence are $\sqsubseteq$-incomparable; Sironi Prop 2 + Lemma 5).

**BF 2011 has materiality but no minimality theorem.** BF's winning condition is *"daimon-free and material"* (Def 11.5, *number per audit*; materiality discussed operationally in BF §10–11). The audit records that BF **proves no antichain/minimality/canonical-generator theorem**, and BF's own framing — completeness *"rely[ing] on much less structure, namely operational properties of the interaction"* rather than on separation/unicity-of-adjoint — corroborates that minimality is deliberately *not* part of the machinery.

**Verdict (b): Terui-better — but the proved minimality is affine, and that is exactly the wrong fragment.** Terui-family clearly carries the minimality/canonical-generator theorem BF lacks (Terui Def 4.7 + the data-antichain; Sironi Def 11 + five proved instances). *However*, every one of those is proved in the **linear/affine** fragment. The exponential layer that the substrate's `!`-image needs is BT2010's nonlinear setting, where **separation fails** (see (c)) and **no minimality theorem is proved** — the same gap BF has. So as a *practical* Q-032 absorber the axis is a **draw at the exponential layer**: Terui-family supplies a better *template* (Sironi's principal sets) and a clean affine *proof of concept*, but not a theorem you can cite for the MELL antichain. Decisive for the recommendation, deflationary for the shortcut.

### (c) Separation behaviour

**Terui 2011: holds for standard (cut-free linear) designs, fails otherwise.**

> **Theorem 3.9** (Separation, Terui 2011). *If $T$ and $U$ are standard and $T \npreceq U$, then there is a standard anti-design $[G]$ such that $T \perp [G]$ and $U \not\perp [G]$.*

Plus strong separation for data designs (Thm 3.12). But separation is **not** available with cuts, identities, or nonlinearity.

**BT2010: fails under nonlinearity** (the exponential setting). Remark 2.4 exhibits explicit deterministic atomic designs $P \neq Q$ with $\{P\}^\perp = \{Q\}^\perp$ (after Maurel 2004), concluding *"separation does not hold, even when $D$ and $E$ are deterministic (atomic) designs."*

**BF 2011: fails** for non-uniform strategies (Maurel 2004), and BF's design is built precisely to *not need* separation — *"the proofs of internal and full completeness rely on much less structure, namely operational properties of the interaction."*

**Verdict (c): EQUIVALENT.** Separation failure is a property of *nonlinearity*, not of the framework; both retain it in the linear fragment and both lose it in the exponential one. Substrate impact is low independently (Q-035 fired green: the substrate keys on chronicle-set inclusion $\subseteq$, not Girard separation). No discriminating power for the target choice.

### (d) Cut-elimination / normalization

**Terui 2011: associative, effective via an explicit abstract machine, non-terminating in general (by design).**

> **Theorem 3.1** (Associativity, Terui 2011). *$[\![\,T[N_1/y_1,\dots,N_n/y_n]\,]\!] = [\![\,[\![T]\!][[\![N_1]\!]/y_1,\dots,[\![N_n]\!]/y_n]\,]\!].$*

Normalization is monotone (Thm 3.6) and stable (Cor 3.22), and §2.6 gives a **Krivine-style abstract machine that works directly on finite generators**, yielding effective computation over infinite c-designs (Thm 2.27: a finitely generated c-design induces a Turing machine). Nondeterminism is *universal*; termination is deliberately not guaranteed (the framework is Turing-complete, Thm 4.10(2)).

**BT2010:** same normalization theory, associativity Theorem 1.12; closed positive designs satisfy a $\maltese$/$\Omega$ dichotomy (Def 1.9). Universal nondeterminism.

**BF 2011:** normalization is the **VAM (View-Abstract-Machine)** of §8 (after Curien–Herbelin), with associativity proved:

> **Theorem 8.13** (Associativity, BF 2011). *Let $R$ be a cut-net which can be partitioned into cut-nets $R = R_1,\dots,R_n$. We have $[\![R]\!] = [\![[\![R_1]\!],\dots,[\![R_n]\!]]\!].$*

So BF is **not** machine-less: it has both an abstract machine and associativity-as-composition. Termination is likewise not guaranteed (non-uniform strategies are infinitary Böhm-tree-like objects).

**Verdict (d): EQUIVALENT.** Both frameworks have an abstract machine plus associativity (Terui Thm 3.1 / Krivine machine §2.6; BF Thm 8.13 / VAM §8). Terui's only edge is presentational — his Krivine machine is framed around **finite generators**, giving effective computation over infinite designs (Thm 2.27), which is convenient for an *implemented* bridge — but this is a framing emphasis, not a capability BF lacks. Not discriminating. *(Correction from the audit-anchored draft, which wrongly reported BF as machine-less; the fetched §8 shows otherwise.)*

### (e) Syntactic ergonomics — match to the Ambler λ-calculus

**Terui c-designs are literally λ-terms with named applications/abstractions.** Grammar (Terui 2011, §2.1):
$$P ::= \maltese \mid \Omega \mid N_0\,|\,a\langle N_1,\dots,N_n\rangle, \qquad N ::= x \mid \textstyle\sum a(\vec{x}_a).P_a,$$
with the reduction rule
$$\big(\textstyle\sum a(\vec{x}_a).P_a\big)\,|\,a\langle \vec{N}\rangle \longrightarrow P_a[\vec{N}/\vec{x}_a],$$
which Terui states is *"analogous to the reduction rule for lambda terms $(\lambda x_1\cdots x_n.P)N_1\cdots N_n \to P[N_1/x_1,\dots,N_n/x_n]$."* The paper builds the λ-toolkit directly: constructors, discriminators, **duplicators**, function designs (Def 2.17), composition (Lemma 3.2), and **general recursion** (Prop 2.19). The cross-lineage survey confirms the contrast: *"a c-design is presented in a $\lambda$-calculus style, and may not be linear … variables are introduced in the model"* and *"the interaction rule becomes an elegant generalization of the $\beta$-reduction rule of $\lambda$-calculus"* (arXiv:1403.3772 on Ter11/BT10).

**BF designs are non-uniform HO innocent strategies** — *"A non-uniform strategy … $D$ on $\Gamma$ … is a prefix-closed set of non-empty views … such that (1) Coherence … (2) $\tau$-Positivity"* (Def 7.2, now verbatim-verified), realized as $\tau$-sums $\bigoplus_{i\in S}^{\tau} D_i := \bigcup_{i\in S}\{t^+.t^-_i.D_i\}$ (Def 7.5). A game-semantic object: no variable binding, no β-style term grammar.

**Verdict (e): Terui DOMINATES.** The Ambler side *is* a λ-calculus; Terui c-designs offer a named-variable, β-reducing term syntax with a built-in `let`/duplicator/recursion toolkit that maps onto λ-calculus constructs essentially one-to-one. BF's HO-strategy syntax does not. This is Terui's strongest and least-qualified advantage.

### (f) Library / mechanization / downstream support — and the tooling tension

**No proof-assistant mechanization of ludics (Coq/Agda) exists for either lineage** (searched; the only ludics-adjacent formal-methods hits are unrelated modal/type-theory developments). So the substrate's Agda corroboration habit is greenfield either way — no reuse advantage to either target.

**Downstream *paper* support diverges by lineage, and this is the tension.** The substrate's current incarnation tooling is **Fouqueré–Quatrini** (visitable paths / maximal cliques; the "Incarnation in Ludics and maximal cliques of paths" machinery, used as Sironi's Prop 1). That machinery is developed in the **locative/forest** presentation — addresses, chronicles, visitable paths — which is the **BF/Girard lineage**, *not* the c-design lineage. The survey is explicit that moving to c-designs costs you exactly this: *"the characterization of interaction paths, i.e., sequences of actions that may be followed in an interaction, is not as simple as in the [c-design] presentation"* (arXiv:1403.3772, pointing to Pavaux for work-in-progress on the gap).

**Verdict (f): BF-better for *reuse of the substrate's existing FQ path-tooling*; even (greenfield) for mechanization.** This is the counterweight to (e): the syntax that best matches Ambler (Terui c-designs) is the one where the substrate's current visitable-path incarnation tooling does *not* transfer cleanly.

### Side-by-side and overall recommendation

| Axis | Terui-family | BF 2011 | Verdict |
|---|---|---|---|
| (a) Expressivity | additives carried out (BT2010 Thm 2.17/3.8; Terui Thm 4.14); exponentials internalized (BT2010); constant-only | explicit polarized MELL (Thm 11.17); additives deferred; constant-only | **Terui-better** (additives); even on `!`/variables |
| (b) Incarnation/minimality | incarnation Def 4.7 + data-antichain; **principal sets** Sironi Def 11 (5 proved instances) — **but affine only** | materiality Def 11.5; **no minimality theorem** | **Terui-better** as framework / **draw** at exponential layer |
| (c) Separation | holds for standard; fails nonlinearly (Remark 2.4) | fails (Maurel); proofs avoid it | **Equivalent** |
| (d) Normalization | associativity Thm 3.1; Krivine machine over finite generators | associativity Thm 8.13; VAM abstract machine (§8) | **Equivalent** (minor Terui edge: finite-generation effectivity) |
| (e) Syntactic ergonomics | λ-style c-designs, β-reduction, duplicator/recursion toolkit | non-uniform HO strategies | **Terui DOMINATES** |
| (f) Tooling reuse | c-design path-characterization open (Pavaux); loses FQ alignment | locative lineage = FQ visitable-path alignment | **BF-better** (reuse) |

**Overall recommendation: do NOT retarget wholesale; choose by what the bridge implementation prioritizes, and in either case plan to prove the exponential antichain.** On a pure framework-quality count Terui-family still leads — it wins (a, b, e) to BF's one (f), with (c) and (d) tied — so for a *greenfield* substrate the answer would be "build on Terui c-designs." But the substrate is not greenfield, and the two BF-leaning facts — (f) the FQ path-tooling already in place, and the *practical* reading of (b) where the needed exponential minimality is missing from both — are precisely the decision-critical ones. The honest classification is **mixed**, with the cluster's shortcut hypothesis falsified.

---

## §3. Q-033 — MELLS expressivity for the Ambler `!`-image

(Full treatment retained because §2 is mixed, not a clean Terui win; if the Q-030 commit lands on Terui c-designs + BT2010, the same conclusions hold with BT2010's constant-only LLP embedding in place of BF's MELLS.)

### (g) What is MELLS, exactly?

BF's **MELLS** is, in BF's own words, *"a polarized variant of the constant-only propositional fragment of multiplicative-exponential linear logic MELL … based on synthetic connectives"* (§2.3). The grammar is explicit (§2.3):
$$\text{Positive } P ::= ?_P(N_1 \otimes \cdots \otimes N_n), \qquad \text{Negative } N ::= !_N(P_1 \,\&\!\!\!\!\&\, \cdots \,\&\!\!\!\!\&\, P_n)\quad (n\ge 0),$$
with the only ground formulas $?_P\mathbf{I}$ and $!_N\top$ at $n=0$, and the multiplicative sub-fragment named MLLS (which BF notes *"is affine, i.e., we have weakening (but restricted to positive formulas)"*, §5.2.1 — a parallel to Sironi's affine setting). BF states its **constant-only** restriction and gives the rationale directly: *"The reason we restrict our attention to the constant-only fragment is that the treatment of propositional variables is rather complicated in ludics … and not strictly related to our purposes … On the other hand, the extension of our framework to additives is straightforward"* (§1.1.1). Appendix A relates MELLS to a focalized ¬,∧ fragment of intuitionistic LJ and to Laurent's MELLpol.

### (h) Can the Ambler `!`-image be carried by MELLS?

**(i) Skolemizing factual atoms into constant-only.** Ambler's `!`-translated derivations quantify over factual atoms. If those atoms form a **fixed, ground, finite** set, they encode directly as **0-ary names in the ludics signature**: BT2010 Appendix A embeds the constant-only propositional fragment of LLP by assigning each connective/constant a name, and adding factual atoms as further nullary names is immediate (Terui 2011's data-design machinery does exactly this for an alphabet $\Sigma$). So **for ground/parametric atoms, constant-only MELLS is sufficient — no extension needed.** What cannot be Skolemized away is *schematic* propositional-variable polymorphism (an atom standing for an arbitrary formula); that is genuinely absent from every framework here.

**(ii) Are additives "straightforward" — backed by a published carrying-out?** BF asserts the claim itself — *"the extension of our framework to additives is straightforward"* (§1.1.1) — and the carrying-out exists in the neighbouring Terui-family work the substrate can cite directly. Additive connectives are first-class in BT2010 (Definition 2.9 general connectives; $\&=\{\pi_1,\pi_2\}$) with internal completeness

> **Theorem 2.17** (Internal completeness, negative case, BT2010). *$N \in \alpha(\mathbf{P}_1,\dots,\mathbf{P}_n) \iff P_a \models z_{i_1}:\mathbf{P}_{i_1},\dots,z_{i_m}:\mathbf{P}_{i_m}$, for every $a(\vec{x})\in\alpha_0.$*

and full completeness Theorem 3.8 covers them; Terui 2011 Theorem 4.14 likewise. So BF's "straightforward" is **folklore-extendable with a citation** (BT2010 Thm 2.17/3.8; Terui 2011 Thm 4.14), not net-new — though it is carried out in the *neighbouring* paper, so a BF-target substrate would import rather than cite-in-place.

**(iii) Net-new?** Only the **propositional-variable / polymorphic** case. No framework in the set has propositional variables (BT2010 lists them as future work alongside second-order quantifiers). If Ambler's `!`-image needs only ground atoms + additive case-analysis, **no net-new theory is required**; if it needs schematic polymorphism, that is genuinely net-new for *all* candidate targets, not a BF-specific deficiency.

### Q-033 verdict

**SUFFICIENT for the ground-atom + additive case** (factual atoms → signature constants via BT2010 App A; additives folklore-extendable via BT2010 Thm 2.17/3.8 and Terui Thm 4.14). **Net-new — and target-independent — only if** the Ambler `!`-image requires genuine propositional-variable polymorphism, in which case a **scope restriction** (ground-atom fragment) is the cheaper move than extending any ludics framework with variables.

---

## §4. Q-032 input — Sironi principal sets

Sironi's principal set is the leading template for the BF-side T002 re-proof (route i). The definition, verbatim:

> **Definition 11** (Sironi 2014). *A set $E$ of designs is **principal** when its elements are $\maltese$-free and its $\maltese$-shortening is the incarnation of its biorthogonal, i.e., $|E^{\perp\perp}| = E^{\maltese}$.*

with incarnation as in **Definition 9**: *"$|D|_G = \bigcap\{D' \mid D' \sqsubseteq D,\ D' \in G\}$; $D$ is material in $G$ when it is equal to its incarnation."* A principal set is thus a set of **$\maltese$-free minimal generators** whose $\maltese$-shortening recovers the incarnation of the generated behaviour — Sironi motivates it as *"in some way a minimal generator"* and the analogue of a type's canonical terms.

**Does she prove minimality / antichain-ness?** She proves **principality** (the named property) for $\mathbb{N}at$ (Prop 3), $\mathbb{L}_n$ (Prop 6), the arrow $A\Rightarrow B$ (Prop 7), and the dependent $\Pi$/$\Sigma$ types (Prop 10, 11). A standalone "antichain theorem" is not stated, but **$\sqsubseteq$-incomparability of distinct canonical terms** is established en route (e.g. for $\mathbb{N}at$, distinct naturals differ on a positive action — Prop 2 / Lemma 5), so within a principal set the elements form an antichain. This is the property the substrate's T002 needs.

**Two load-bearing caveats for Q-032.**
1. **Affine, not exponential.** Sironi's setting has weakening but **no contraction**: *"Being Ludics affine … We have weakening but we do not have contraction"* (fn 3). Her principal-set theorems are therefore affine.
2. **She herself defers the exponential case to BF.** *"Being Ludics affine we are not able to represent some basic operations … However there exist extensions of Ludics that integrate exponentials [1], on which our approach may be applied"* — where [1] is BF 2011. So porting principal sets to the exponential/MELL setting is **acknowledged-open work**, not a citation.

**Q-032 input verdict:** Sironi Definition 11 is the correct **template** for the T002 re-proof (a named, proved-affinely minimal-generator notion that yields an antichain). It is **not** a drop-in: the exponential port is the open step, and it is open in exactly the place the substrate needs it.

---

## §5. Recommendation to the Q-030 commit

The headline for sequencing: **the Q-034 result does not let you skip Q-032.** The cluster's working assumption — "positive Q-034 ⇒ Q-032 re-proof unnecessary" — is falsified, because the minimal-generator theorems in the Terui-family are affine and the exponential layer (BT2010, like BF) has none. Commit accordingly.

**If the commit keeps BF (option b) for MELL completeness:**
- Q-032 proceeds via **route i**: port Sironi's principal-set definition (Def 11) to BF's MELLS, re-deriving the antichain at the exponential layer. Treat this as **net-new work**, scoped by Sironi's affine proofs as the template.
- Q-033: **sufficient** for ground Ambler atoms (Skolemize → MELLS constants); **import** the additive treatment from BT2010 (Thm 2.17/3.8) rather than re-deriving; restrict scope only if genuine propositional-variable polymorphism is required.
- Keeps your **FQ visitable-path tooling** aligned (locative lineage). Accepts BF's HO-strategy syntax on the target side of the bridge.
- *Closes:* none for free. *Keeps open:* Q-032 (exponential antichain), the propositional-variable question.

**If the commit retargets the design syntax to Terui c-designs (+ BT2010 for exponential completeness):**
- Gains the **decisive (e) ergonomic match** to the Ambler λ-calculus (named variables, β-reduction, duplicator/recursion toolkit), the explicit proof/model duality (BT2010 Thm 3.8 + its Löwenheim–Skolem corollary), and Sironi's principal sets as a *native* minimal-generator template.
- *Costs:* (i) the exponential minimality is **still net-new** (BT2010 has no minimality theorem; separation fails per Remark 2.4) — Q-032 is not absorbed; (ii) you **lose FQ visitable-path tooling alignment** — c-design path characterization is open (Pavaux), so the substrate's current incarnation machinery does not transfer cleanly.
- *Closes:* the syntactic-impedance question between the bridge and Ambler. *Keeps open:* Q-032 (exponential antichain), plus a new path-characterization dependency.

**Net steer.** On evidence, neither target dominates outright. If the bridge implementation's pain is *syntactic impedance with the Ambler λ-calculus*, Terui c-designs are worth the retarget despite the tooling cost. If the pain is *reusing the existing FQ incarnation/visitable-path machinery and minimizing new dependencies*, stay on BF and import Terui-family results as needed. **Either way, schedule the exponential antichain re-proof (Q-032) — it is target-independent net-new work, and Sironi Def 11 is the template regardless of which target you pick.**

**Flagged, not folded in:** no third "right MELL target" emerged. The nearest candidate the survey points to is Pavaux's work on visitable paths for c-designs (arXiv:1403.3772 → [Pav17]); if the commit goes Terui, that line is the dependency to track for restoring path-based incarnation tooling. It was not evaluated here (out of the fixed source set) and should be a follow-up if and only if the Terui branch is chosen.

---

## Appendix A — Axis verdict table

| Axis | One-line restatement | Terui-family finding | BF finding | Verdict | Source + location |
|---|---|---|---|---|---|
| (a) | Fragment + completeness; subsumes Q-033 gap? | Additives carried out; exponentials internalized; constant-only | Explicit polarized MELL; additives deferred; constant-only | Terui-better (additives); even on `!`/variables | Terui Thm 4.14; BT2010 Thm 3.8, Ex 2.14, p.2; BF abstract (LMCS 7(2:13)) |
| (b) | Minimality / antichain / canonical-generator theorem? | Incarnation Def 4.7 + data-antichain; Sironi principal sets Def 11 (5 proofs) — **affine only** | Materiality Def 11.5; **no minimality theorem** | Terui-better as framework; **draw** at exponential layer | Terui Def 4.7, §3.2; Sironi Def 11, Prop 3/6/7/10/11; BF Def 11.5 (audit) |
| (c) | Separation hold/fail? | Holds standard (Thm 3.9); fails nonlinear (Remark 2.4) | Fails (Maurel); proofs avoid it | Equivalent | Terui Thm 3.9; BT2010 Remark 2.4; BF (Faggian copy) |
| (d) | Normalization terminating/confluent/effective? | Associativity Thm 3.1; Krivine machine over finite generators | Associativity Thm 8.13; VAM abstract machine (§8) | Equivalent (minor Terui edge) | Terui Thm 3.1, §2.6, Thm 2.27; BF Thm 8.13, §8 |
| (e) | Syntax match to Ambler λ-calculus? | λ-style c-designs, β-reduction, duplicator/recursion | Non-uniform HO strategies (Def 7.2, verbatim) | Terui DOMINATES | Terui §2.1, Def 2.17, Prop 2.19; BF Def 7.2/7.5; arXiv:1403.3772 |
| (f) | Reusable tooling / mechanization? | c-design path-characterization open (Pavaux); no mechanization | FQ visitable-path lineage; no mechanization | BF-better (reuse); even (mechanization) | arXiv:1403.3772; FQ arXiv:1307.1028; search (no Coq/Agda ludics) |
| (g) | What is MELLS? | (companion: BT2010 constant-only LLP, App A) | Constant-only polarized MELL; MLLS multiplicative | — | BF abstract + Faggian copy; BT2010 App A |
| (h) | `!`-image carriable? | Additives folklore (BT2010); atoms→constants | Atoms→constants if ground; additives deferred | Sufficient (ground); net-new only for polymorphism | BT2010 App A, Thm 2.17/3.8; Terui Thm 4.14 |
| (i) | Sironi principal set + minimality? | Def 11; proved affine (Prop 3/6/7/10/11); exponential port open | — | Template, not drop-in | Sironi Def 11, Def 9, fn 3, Prop 6 + "[1]" remark |

---

## Appendix B — Theorem / definition quote bank (grep-able)

**Completeness theorems**
- *Terui 2011, Thm 4.14 (Internal Completeness):* "$(1)\ |\alpha\langle N_1,\dots,N_n\rangle|_h = \bigcup_{a(\vec{x}_a)\in\alpha} a\langle N_{i_1},\dots,N_{i_m}\rangle.\quad (2)\ |\alpha(P_1,\dots,P_n)|_\alpha = \sum_\alpha a(\vec{x}_a).[P^\perp_{i_1}/x_{i_1},\dots,P^\perp_{i_m}/x_{i_m}]^\perp.$"
- *Terui 2011, Thm 4.10 (computational power):* "(1) Any set $D$ of finite data designs is accepted by an l-design. (2) $L^\star$ is accepted by a finitely generated l-design iff $L$ is recursively enumerable. (3) $L^\star$ is accepted by a finitely generated cut-free l-design iff $L$ is regular."
- *BT2010, Thm 3.8 (Completeness for proofs):* "A sequent $D \vdash \Lambda$ is derivable in the proof system if and only if $D \models \Lambda$. In particular, for any positive logical behaviour $\mathbf{P}$ and a proof $P$, $P \vdash x_0 : \mathbf{P}$ is derivable if and only if $P \in \mathbf{P}$."
- *BT2010, Thm 3.5 (Soundness):* "If $D \vdash \Lambda$ is derivable in the proof system, then $D \models \Lambda$."
- *BT2010, Thm 2.17 (Internal completeness, negative case):* "$N \in \alpha(\mathbf{P}_1,\dots,\mathbf{P}_n) \iff P_a \models z_{i_1}:\mathbf{P}_{i_1},\dots,z_{i_m}:\mathbf{P}_{i_m}$, for every $a(\vec{x})\in\alpha_0$."
- *BT2010, Cor 3.12 (Downward Löwenheim–Skolem, Finite model property):* "(1) … if $P \notin \mathbf{P}$, then there is a countable model $M \in \mathbf{P}^\perp$ such that $P \not\perp M$. (2) … when $P$ is linear, there is a finite and deterministic model …"
- *BT2010, fragment characterization (p.2):* "Our resulting framework is as strong as a polarized fragment of linear logic with exponentials … which is in turn as strong as a constructive version of classical propositional logic."
- *BF 2011 (LMCS 7(2:13) / arXiv:1104.0504 abstract):* "we provide an extension of ludics which allows repetitions and show that one can still have interactive types and internal completeness. From this, we obtain full completeness w.r.t. a polarized version of MELL." Internal completeness Thm 11.16 → full completeness Thm 11.17 *(numbers per Phase-1 audit)*.

**Incarnation / materiality / principal-set definitions**
- *Terui 2011, Def 4.7:* "The incarnation of $U$ in $\mathbf{T}$ is defined by $|U|_{\mathbf{T}} = \bigcap\{U' : U' \sqsubseteq [\![U]\!],\ U' \in \mathbf{T}\}$. … $U$ is material in $\mathbf{T}$ if $U = |U|_{\mathbf{T}}$. $U$ is pure in $\mathbf{T}$ if it is material … and furthermore $\maltese$-free."
- *Terui 2011, data antichain (§3.2):* "Any pair of distinct data designs is incomparable with respect to $\sqsubseteq$ … Hence $d \sqsubseteq e$ implies $d = e$ for any data designs $d$ and $e$."
- *Sironi 2014, Def 9:* "$|D|_G = \bigcap\{D' \mid D' \sqsubseteq D,\ D' \in G\}$. $D$ is material in $G$ when it is equal to its incarnation in $G$."
- *Sironi 2014, Def 11 (principal):* "A set $E$ of designs is principal when its elements are $\maltese$-free and its $\maltese$-shortening is the incarnation of its biorthogonal, i.e., $|E^{\perp\perp}| = E^{\maltese}$."
- *Sironi 2014, Prop 6:* "$\mathbb{L}_n$ is principal, i.e., it is $\maltese$-free and $|(\mathbb{L}_n)^{\perp\perp}| = (\mathbb{L}_n)^{\maltese}$." (companion: Prop 3 $\mathbb{N}at$, Prop 7 $A\Rightarrow B$, Prop 10 $\Pi$, Prop 11 $\Sigma$).
- *Sironi 2014, fn 3 (affine):* "Being Ludics affine … We have weakening but we do not have contraction."
- *Sironi 2014, exponential deferral:* "there exist extensions of Ludics that integrate exponentials [1], on which our approach may be applied." ([1] = BF 2011.)
- *BF 2011, Def 11.5 (materiality) / winning condition:* "daimon-free and material" *(Def 11.5 number per audit; that materiality is the §11 winning condition for the additive/exponential case is confirmed verbatim in the fetched §5.2.3: "When working with additive structure, or with exponentials, one also needs the notion of materiality … discuss[ed] in Section 11").*

**Separation statements**
- *Terui 2011, Thm 3.9 (Separation):* "If $T$ and $U$ are standard and $T \npreceq U$, then there is a standard anti-design $[G]$ such that $T \perp [G]$ and $U \not\perp [G]$."
- *Terui 2011, Thm 3.12 (Strong Separation for Data Designs):* "$(d)^c_{x_0} \perp N$ iff $d \preceq N$" (for $\maltese$-free standard $N$).
- *BT2010, Remark 2.4:* "In our setting, separation does not hold, even when $D$ and $E$ are deterministic (atomic) designs. … We therefore conclude $\{P\}^\perp = \{Q\}^\perp$, even though $P \neq Q$."
- *BF 2011 (§6.3, §1.1.1):* "The first problem when strategies have repetitions is with separation … In this work, we ignore separation all together"; completeness instead "rel[ies] on much less structure, namely operational properties of the interaction." Non-separation example: Def/Example 6.5 (after Maurel).

**Cut-elimination / normalization**
- *Terui 2011, Thm 3.1 (Associativity):* "$[\![T[N_1/y_1,\dots,N_n/y_n]]\!] = [\![[\![T]\!][[\![N_1]\!]/y_1,\dots,[\![N_n]\!]/y_n]]\!].$"
- *Terui 2011, Thm 2.27:* "For every finitely generated positive c-design $P$, there exists a Turing machine $M$ such that … $M$ accepts $w$ iff $P[w^\star/x] \Downarrow \maltese$." (Krivine-style machine, §2.6.)
- *BT2010, Thm 1.12 (Associativity):* "$[\![D[N_1/y_1,\dots,N_n/y_n]]\!] = [\![[\![D]\!][[\![N_1]\!]/y_1,\dots,[\![N_n]\!]/y_n]]\!].$"
- *BF 2011, Thm 8.13 (Associativity):* "Let $R$ be a cut-net which can be partitioned into cut-nets $R = R_1,\dots,R_n$. We have $[\![R]\!] = [\![[\![R_1]\!],\dots,[\![R_n]\!]]\!].$" (Normalization via the VAM abstract machine, §8.)
- *BT2010, Ex 2.14 (exponentials internalized):* "We do not have exponentials here, because we are working in a nonlinear setting so that they are already incorporated into the connectives."

**Syntax / lineage**
- *Terui 2011 grammar (§2.1):* $P ::= \maltese \mid \Omega \mid N_0|a\langle N_1,\dots,N_n\rangle;\quad N ::= x \mid \sum a(\vec{x}_a).P_a;\quad (\sum a(\vec{x}_a).P_a)|a\langle\vec{N}\rangle \to P_a[\vec{N}/\vec{x}_a].$
- *BF 2011, MELLS grammar (§2.3):* $P ::= ?_P(N_1\otimes\cdots\otimes N_n);\quad N ::= !_N(P_1\,\&\!\!\!\!\&\,\cdots\,\&\!\!\!\!\&\,P_n)\ (n\ge 0)$; ground formulas $?_P\mathbf{I}$, $!_N\top$ at $n=0$. Rationale (§1.1.1): "the treatment of propositional variables is rather complicated in ludics … On the other hand, the extension of our framework to additives is straightforward."
- *BF 2011, Def 7.2 (non-uniform strategy):* "A non-uniform strategy … $D$ on $\Gamma$ … is a prefix-closed set of non-empty views … such that (1) Coherence … (2) $\tau$-Positivity." $\tau$-sum (Def 7.5): $\bigoplus_{i\in S}^{\tau} D_i := \bigcup_{i\in S}\{t^+.t^-_i.D_i\}$.
- *arXiv:1403.3772 (cross-lineage):* "[BF11] extended Ludics with non-linear terms … full completeness result for a variant of Multiplicative-Exponential Linear Logic." "[Ter11] … a c-design is presented in a $\lambda$-calculus style, and may not be linear … variables are introduced in the model." "[BT10] … full completeness w.r.t. polarized Linear Logic … the characterization of interaction paths … is not as simple as in the original presentation of Ludics (see [Pav17])."

**Full references**
1. Terui, K. (2011). *Computational Ludics.* Theoretical Computer Science 412(20):2048–2071. doi:10.1016/j.tcs.2010.12.026.
2. Basaldella, M. & Terui, K. (2010). *On the Meaning of Logical Completeness.* Logical Methods in Computer Science 6(4:11):1–35. arXiv:1011.1625.
3. Faggian, C. & Basaldella, M. (2011). *Ludics with Repetitions (Exponentials, Interactive Types and Completeness).* Logical Methods in Computer Science 7(2:13). arXiv:1104.0504. (LICS 2009 precursor.)
4. Sironi, E. (2014). *Type Theory in Ludics.* arXiv:1402.2511.
5. Basaldella, M. & Terui, K. (2010). *Infinitary Completeness in Ludics.* LICS 2010, 294–303. (Companion; consulted for the coinductive/orthogonality framing.)
6. Fouqueré, C. & Quatrini, M. (2013). *Incarnation in Ludics and maximal cliques of paths.* Logical Methods in Computer Science 9(4). arXiv:1307.1028. (Sironi's Prop 1; the substrate's visitable-path lineage.)
7. *Study of Behaviours via Visitable Paths.* arXiv:1403.3772. (Cross-lineage survey of BF11 / Ter11 / BT10; the c-design path-characterization caveat and the Pavaux pointer.)
8. Maurel, F. (2004). *Un cadre quantitatif pour la Ludique.* PhD thesis, Univ. Paris VII. (Separation-failure source cited by BT2010 Remark 2.4 and by BF.)

# Appendix C — Verbatim BF 2011 Quotes (verified against full text)

**Source:** Basaldella, M. & Faggian, C. (2011). *Ludics with Repetitions (Exponentials, Interactive Types and Completeness).* LMCS 7(2:13), pp. 1–85. arXiv:1104.0504v3.

**Purpose:** The main review (Appendices A–B) cited several BF items by number from the Phase-1 audit because the full text was blocked at fetch time. This appendix replaces every "number per audit" flag with a verbatim quote from the full 85-page PDF, confirms the numbers, and adds items the audit did not extract.

---

## C.1. Definition 7.2 — Non-uniform strategies (the design object)

> **Definition 7.2** (Non-uniform strategies). Let $\Gamma$ be an interface. A **non-uniform strategy** (n.u. strategy for short) $D$ on $\Gamma$, written $D : \Gamma$, is a prefix-closed set of non-empty views (as in Definition 3.3) on the arena $U^*(\Gamma)$, such that:
>
> (1) **Coherence.** If $s.m, s.n \in D$ and $m \neq n$ then $m, n$ are negative.
>
> (2) **$\tau$-Positivity.** If $s.m$ is maximal in $D$ (i.e., no other view extends it), and $m$ is a proper action (i.e., an action on a name), then $m$ is positive.
>
> We will call **deterministic** a n.u. strategy which has no silent actions.

**Review axis (e) confirmation:** BF designs are sets of views on a universal arena with silent ($\tau$) actions for non-deterministic sums. There is no variable binding, no $\beta$-style term grammar, and no named-application syntax — confirming the Terui-dominates verdict on syntactic ergonomics.

---

## C.2. Definition 11.5 — Materiality (the incarnation analogue)

> **Definition 11.5** (Materiality). Let $\mathbf{G}$ be a behaviour and $D$ a strategy in $\mathbf{G}$. We define the **material part** of $D$ in $\mathbf{G}$ as
> $$|D|_{\mathbf{G}} := \bigcup\bigl\{D^{[E]} : E \in \mathbf{G}^\perp\bigr\}.$$
> A strategy $D \in \mathbf{G}$ is said to be **material** in $\mathbf{G}$ if $D = |D|_{\mathbf{G}}$.

where $D^{[E]}$ (Definition 11.2) is the restriction of $D$ to those views visited in the interaction producing $[\![D, E]\!]$.

**Review axis (b) confirmation:** This is an *operational* notion — the union of the parts of $D$ actually visited during all possible interactions with counter-strategies. It is **not** defined via a lattice-theoretic minimum ($\bigcap$) as Terui's incarnation (Def 4.7) and Sironi's principal sets (Def 11) are. No minimality theorem, antichain property, or canonical-generator statement is proved for this notion anywhere in the paper. Confirmed: BF has materiality but no minimality.

---

## C.3. Definition 11.11 — Winning strategy (the proof-denotation condition)

> **Definition 11.11** (Winning strategy). A strategy $D \in\ \vdash \Gamma$ is said **winning** if it is finite, deterministic, daimon-free and material in $\vdash \Gamma$.

**Note:** This is the full set of winning conditions. Finiteness is explicitly required here; Remark 11.12 flags that Basaldella–Terui 2010 shows finiteness is *derivable* from the other conditions for logical behaviours, and BF state they are "confident that this result is also valid in our setting" but "postpone it to a subsequent work."

---

## C.4. Remark 11.12 — Finiteness condition (the BT2010 pointer)

> **Remark 11.12** (Finiteness condition). We here assume finiteness among the winning conditions. However, recent work by Basaldella and Terui [6] shows an exciting property of interactive types: any material, deterministic and daimon free strategy in a behaviour which is interpretation of a logical formula is finite. We are confident that this result is also valid our setting; we need to check this in detail and we postpone it to a subsequent work.

**Review axis (b) note:** This remark shows BF explicitly depends on the Basaldella–Terui lineage for the strongest structural property of their behaviours. It also confirms that even the *finiteness* of winning strategies is not proved within BF itself.

---

## C.5. Theorem 11.16 — Soundness

> **Theorem 11.16** (Soundness). Let $\pi$ be a derivation of a sequent $\vdash \Gamma$ in MELLS and $D(\pi)$ be the interpretation of $\pi$ in a sequent of behaviours $\vdash \mathbf{\Gamma}$. We have that:
>
> $D(\pi)$ is a winning strategy in $\vdash \mathbf{\Gamma}$.
>
> Moreover, the interpretation is invariant under cut-elimination.

---

## C.6. Theorem 11.17 — Full Completeness

> **Theorem 11.17** (Full Completeness). Let $\vdash \mathbf{\Gamma}$ be a sequent of behaviours which is interpretation of the sequent $\vdash \Gamma$ in MELLS. If $D$ is a winning strategy in $\vdash \mathbf{\Gamma}$ then it is the interpretation of a cut-free derivation $\pi$ of the sequent $\vdash \Gamma$ in MELLS.

**Review axis (a) confirmation:** Full completeness is for **MELLS** specifically, defined in §2.3 as a polarized, constant-only, multiplicative-exponential fragment with synthetic connectives. The theorem does not cover additives.

---

## C.7. MELLS fragment definition (§2.3)

> Formulas of MELLS split into **positive** $P$ and **negative** $N$ formulas, and they are inductively generated by the following grammar:
>
> Positive formulas: $P ::= \mathord{?_P}(N_1 \otimes \cdots \otimes N_n)$ $(n \geq 0)$
>
> Negative formulas: $N ::= \mathord{!_N}(P_1 \mathbin{\rotatebox[origin=c]{180}{$\&$}} \cdots \mathbin{\rotatebox[origin=c]{180}{$\&$}} P_n)$ $(n \geq 0)$
>
> When $n = 0$, we write $\mathord{?_P}\mathbf{I}$ and $\mathord{!_N}\top$ for the positive and negative formula respectively. They are the only ground formulas of our calculus.

And from §1.1:

> In particular, strategies with repetitions have weaker properties with respect to the original — linear — ones. We show that it is still possible to have interactive types, internal completeness, and from this full completeness for a **polarized version of the constant-only fragment of MELL** (multiplicative-exponential-linear logic) that we call MELLS.

And the additive deferral:

> The reason we restrict our attention to the constant-only fragment is that the treatment of propositional variables is rather complicated in ludics (see [22] and also [13]) and not strictly related to our purposes: the analysis of ludics with repetitions of actions. **On the other hand, the extension of our framework to additives is straightforward.**

**Review axes (a)/(g)/(h) confirmation:** MELLS is constant-only, polarized MELL with synthetic connectives, no additives carried out, no propositional variables. The "straightforward" additive claim is unsubstantiated within the paper; the carrying-out exists in BT2010 (Thm 2.17/3.8) and Terui 2011 (Thm 4.14).

---

## C.8. Separation failure (§1.1.1 + §6.3)

From §1.1.1:

> In particular, **separation is a strong property. It is a great property, but it is not a common one to have.** However, the fact that computational objects do not enjoy separation does not mean that it is not possible to build the "high level architecture" of ludics. In fact, we show (Section 5) that **the proofs of internal and full completeness rely on much less structure, namely operational properties of the interaction.**

From §6.3, Example 6.5 (after Maurel [32]):

> We cannot find a strategy orthogonal to $D_1$ but not orthogonal to $D_2$. … In this work, **we ignore separation all together.** As we discussed in Section 5, even if separation is an important property, we don't need it in order to have interactive types and internal completeness.

**Review axis (c) confirmation:** Separation explicitly fails for non-uniform strategies and is deliberately not used. BF's completeness architecture is operational, not separation-based.

---

## C.9. Associativity (Theorem 8.13)

> **Theorem 8.13** (Associativity). Let $R$ be a cut-net which can be partitioned into cut-nets $R = R_1, \ldots, R_n$. We have:
> $$[\![R]\!] = [\![[\![R_1]\!], \ldots, [\![R_n]\!]]\!]$$

Proof is cited to Curien–Herbelin [8, 11] (VAM abstract machine); BF note "the only essential difference (w.r.t. abstract Böhm trees) are the conditions on the polarity of the maximal actions, but this is irrelevant to establish associativity."

**Review axis (d) confirmation:** Associativity holds. No Krivine-style effective machine is presented (contrast Terui §2.6).

---

## C.10. Internal completeness — positive and negative (Propositions 10.8, 10.9, Corollary 10.12)

> **Proposition 10.8** (Internal completeness of $F^-$). Let $\mathbf{P}_{\xi_i} = \mathbf{N}_{\xi_i}^\perp$ and $x = (\xi, I_n)$.
>
> $(1)\ x^-.D \in F^-(\mathbf{P}_{\xi_1}, \ldots, \mathbf{P}_{\xi_n}) \iff (2)\ D \in\ \vdash \mathbf{P}_{\xi_1}, \ldots, \mathbf{P}_{\xi_n}.$

> **Proposition 10.9** (Linear internal completeness of $F^+$). Let $D \in F^+(\mathbf{N}_{\sigma_1}, \ldots, \mathbf{N}_{\sigma_n})$ have a root that is a linear occurrence of a proper action. Then $D = D_1 \bullet \cdots \bullet D_n$, with $D_i \in \mathbf{N}_{\sigma_i}$, for any $1 \leq i \leq n$.

> **Corollary 10.12** (Internal completeness of $F^+$). Let $D \in \mathbf{P}_\xi = F^+(\mathbf{N}_{\xi_1}, \ldots, \mathbf{N}_{\xi_n})$ be as in Lemma 10.11. Then $\sigma(D) = D'_1 \bullet \cdots \bullet D'_n$ where each $D'_i \in\ \vdash \mathbf{N}_{\sigma_i}, \mathbf{P}_\xi$.

These are the core internal-completeness results for the MELL types. They parallel Terui's Thm 4.14 but in the non-uniform/non-linear setting with $\tau$-sums, handling the exponential via the root-renaming + $\tau$-sum technique (Lemma 10.10/10.11).

---

## C.11. Expressivity — Appendix A (MELLS ↔ LJ₀ ↔ MELLpol)

BF's Appendix A proves:

> **Theorem A.8.** $(1)\ (\pi^*)^\diamondsuit = \pi;\ (2)\ (\pi^\diamondsuit)^* = \pi.$

(isomorphism between MELLS derivations and LJ₀ derivations), and

> **Theorem A.15.** $(1)$ Let $\vdash \Delta$ be a sequent of MELLpol consisting of exponential formulas only. $\vdash \Delta$ is derivable in MELLpol if and only if $\vdash \Delta^\bullet$ is derivable in MELLS. $(2)$ $\vdash \Gamma$ is derivable in MELLS if and only if $\vdash \Gamma^\circ$ is derivable in MELLpol.

**Review axis (a)/(g)/(h) relevance:** These are the formal embeddings that make MELLS "as strong as a constructive version of classical propositional logic" (BT2010 p.2) and "a focalized and synthesized version of the $\lnot, \land$ fragment of the sequent calculus for propositional intuitionistic logic LJ" (BF Appendix A.2). This is the mechanism by which Ambler factual atoms (ground propositions) can be Skolemized into MELLS constants — the embedding $\diamondsuit$ / $\bullet$ maps LJ₀ formulas (negations of conjunctions) to MELLS formulas bijectively.

---

## C.12. Absence of minimality / antichain / principal-set theorem — confirmed

Having now read the full 85 pages: **no theorem, proposition, lemma, definition, or remark in BF 2011 establishes a minimality, antichain, canonical-generator, or principal-set property for the material designs of a behaviour.** The word "principal" does not appear in the paper in a design-theoretic sense. The word "minimal" appears only in "minimal element" of the precedence order on cut-nets (Prop 4.18) and in "minimal information" describing strategies-as-views (§3), neither of which is a minimality theorem for behaviours. The word "antichain" does not appear. The word "incarnation" appears only in a passing reference to Girard's original usage (§1.1.1) and is not developed.

This is the single most decision-relevant fact for Q-032: **the exponential antichain re-proof cannot cite BF; it is net-new work regardless of target.**

---

## C.13. Non-uniform sum and its closure property (Definition 7.5 + Lemma 10.10)

> **Definition 7.5** ($\tau$-sum). Given a family of strategies on the same interface … If $\{x^-.D_i : \Gamma\}_{i \in S}$ is a family of negative strategies which have the same root $x^-$, we define their negative sum:
> $$\textstyle\sum_{i \in S}^\tau x^-.D_i := x^-.\bigoplus_{i \in S}^\tau D_i.$$

> **Lemma 10.10.** (1) Let $F_1, F_2 \in \mathbf{N}_\xi$. Assume $F_1 = x^-.D_1$, $F_2 = x^-.D_2$. We have that $F_1 +_\tau F_2 \in \mathbf{N}_\xi$.

This closure under $\tau$-sum is what makes the non-uniform counter-strategies "enough tests" for the exponential (§6.4). It is the structural substitute for separation — where Girard's original ludics uses the separation property to show behaviours have enough counter-strategies, BF uses $\tau$-sums to *construct* them.

---

## C.14. Cross-reference: BF's own pointer to BT2010 for exponential enrichment

From §1, p.2:

> More recently, in [6] Basaldella and Terui have studied the traditional logical duality between proofs and models in the setting of computational ludics [39] **enriched with exponentials (following our approach to exponentials [5], this paper)**. Both proofs and models live in an homogeneous setting, both are strategies, which are related by orthogonality.

And from §12 (Conclusion):

> **Computational ludics.** By using the approach we present in this paper, Basaldella and Terui [6] have recently extended Terui's computational ludics [39] in order to accommodate exponentials. … Very interestingly, that work also reveals an exciting property of the "interactive types." Unlike in standard HO game semantics, **finiteness does not need to be requested as a condition for strategies to be winning; it is rather an outcome of the closure by orthogonality.** … We are confident that this result is also valid our setting. However, a careful verification of all the details is needed.

This confirms that BF and BT2010 are *companion* frameworks — BF provides the non-uniform strategy machinery that BT2010 imports for its exponential completeness, and BT2010 provides the finiteness-from-orthogonality result that BF conjectures holds in its own setting. For the substrate's target choice, this means adopting either one effectively imports the other.

---

*End of Appendix C. All "number per audit" flags in the main review (§§1–5, Appendices A–B) are now superseded by the verbatim quotes above.*