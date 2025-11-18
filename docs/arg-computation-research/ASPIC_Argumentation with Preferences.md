Below is a developer‑oriented technical report on **A General Account of Argumentation with Preferences** (Modgil & Prakken), written so an engineering team can implement and use the ideas without reading the full paper. Where the paper introduces formal definitions or results, I’ve pointed to them and summarized what you need to encode, along with TypeScript‑style scaffolding you can adapt in your codebase. 

---

## 0) Executive summary (what’s new & why it matters)

**Problem addressed.** Many systems use Dung’s abstract argumentation (nodes = arguments, edges = attacks). In practice we also need **preferences** (some arguments/rules are stronger) and **structure** (arguments are trees built from premises and rules). Prior work often treated “conflict‑free” sets using **defeats** (attacks filtered by preferences), which conflates *logical incompatibility* with *dialectical success*. 

**Paper’s key contributions (what to implement):**

1. **Attack‑based conflict‑freeness.** Define conflict‑free sets using *attacks* (logical incompatibility), not *defeats* (attack + not worse by preference). Preferences are then used only to decide which attacks *succeed* as defeats during evaluation. This separates logic vs. dialectics and preserves desirable properties. (Defs. 13–15; Secs. 2.4, 3.2–3.3, 4) 
2. **Broader instantiation (c‑SAFs).** A variant (**c‑SAF**) restricts arguments to **c‑consistent** premise sets (i.e., they do not classically prove both ϕ and ¬ϕ), enabling clean instantiation with **Tarskian**/classical logics. (Defs. 6–7, 11–12; Sec. 5.2–5.3) 
3. **Clear attack types & preference sensitivity.** Three attacks: **undermine** (premise), **rebut** (conclusion derived by a defeasible rule), **undercut** (attack a rule’s applicability). **Undercuts** and some **contrary** cases are *preference‑independent* (always defeat). Others are *preference‑dependent*. (Defs. 8–9; Sec. 2.3) 
4. **Reusable preference patterns.** Two practical argument‑ordering schemes: **last‑link** and **weakest‑link**, each parameterized by a set comparison (**elitist** or **democratic**). When these orderings are **reasonable**, core correctness properties hold. (Defs. 19–22; Props. 19–24) 
5. **Rationality postulates hold.** Under mild conditions, extensions satisfy **sub‑argument closure**, **closure under strict rules**, **direct consistency**, and **indirect consistency**—crucial sanity checks for a production system. (Thms. 12–15; Sec. 4) 
6. **Bridges to classical logic.** The framework reconstructs classical approaches and relates to **Preferred Subtheories**—so you can plug in classical KBs with preferences and get principled non‑monotonic reasoning. (Sec. 5.3; Ex. 33; Thm. 34) 

> Visuals: **Figure 2 (p.13)** contrasts the raw *attack* graph with the preference‑filtered *defeat* graph; **Figure 3 (pp.16–17)** shows how extra strict inferences can create new defeating continuations that restore desired properties. 

---

## 1) Data model to implement

### 1.1 Argumentation system & KB

* **AS = (L, −, R, n)**

  * `L`: language (strings/symbols you’ll parse).
  * `−`: mapping giving **contraries** / **contradictories**. (Contradictory is symmetric negation; contraries can be asymmetric, e.g., α contrary of ∼α.) (Def. 2) 
  * `R = Rs ∪ Rd`: **strict** rules `ϕ1,...,ϕn → ψ` and **defeasible** rules `ϕ1,...,ϕn ⇒ ψ`. (Def. 2) 
  * `n`: naming for defeasible rules (lets arguments **undercut** by concluding ¬n(r)). (Def. 2; Def. 8) 
* **K = Kn ∪ Kp**: axioms (certain) vs. ordinary premises (uncertain). Only **ordinary** premises can be attacked. (Def. 4) 

**Consistency helpers.**

* **Direct consistency**: no pair ϕ, ψ in S with ϕ contrary of ψ.
* **Indirect consistency**: `Cl_Rs(S)` is directly consistent (closure under strict rules). (Def. 3) 
* **c‑consistency** (for c‑SAFs): S does not (strictly) derive both ϕ and −ϕ. (Defs. 6–7) 

**Well‑formedness checklist** (you should validate your inputs):

* Axioms are consistent under `Rs`; contraries don’t target axioms or strict conclusions; the system is closed under **transposition** or **contraposition**; for c‑SAFs, the logic is **c‑classical**. (Def. 12) 

### 1.2 Argument objects

An **argument** is a tree built from premises via rules. Track: premises, rules, top rule, strict/defeasible sets, sub‑arguments, etc. (Def. 5; Notation 2) 

```ts
type Wff = string;

type StrictRule = { kind: 'strict', ants: Wff[], cons: Wff };
type DefRule    = { kind: 'def',    ants: Wff[], cons: Wff, name: Wff }; // name = n(r)
type Rule = StrictRule | DefRule;

interface Argument {
  id: string;
  conc: Wff;                  // Conc(A)
  prem: Set<Wff>;             // Prem(A) (including both Kn and Kp used)
  premAxioms: Set<Wff>;       // Prem_n(A)
  premOrd: Set<Wff>;          // Prem_p(A)
  strictRules: Set<StrictRule>;
  defRules: Set<DefRule>;
  topRule?: Rule;             // TopRule(A)
  subs: Set<Argument>;        // Sub(A), includes self if you prefer
  lastDefRules: Set<DefRule>; // LastDefRules(A) (Def. 5)
  isStrict: boolean;          // DefRules(A) = ∅
  isFirm: boolean;            // Prem(A) ⊆ Kn
}
```

---

## 2) Attacks vs. defeats (and how preferences apply)

### 2.1 Attack detection (structure‑aware)

Only the **attacker’s final conclusion** is relevant. Attacks can only target **fallible parts** (ordinary premises or defeasible applications)—never strict conclusions. (Sec. 2.2; Def. 8) 

```ts
type AttackKind = 'undermine' | 'rebut' | 'undercut';

interface Attack {
  from: Argument;
  to: Argument;
  on: Argument;        // the sub-argument B0 in the target
  kind: AttackKind;
  contraryBased?: boolean; // true if uses contrary rather than contradictories
}
```

Rules (Def. 8):

* **Undermine**: `from.conc` contradicts (or is a contrary of) some **ordinary** premise ϕ in a sub‑argument `on` of `to`.
* **Rebut**: `from.conc` contradicts (or is a contrary of) the **consequent** ϕ of a **defeasible** top rule in sub‑argument `on`.
* **Undercut**: `from.conc` contradicts the **name** `n(r)` of a **defeasible** rule `r` used in sub‑argument `on` (i.e., claims “r not applicable”). 

> **Figure 2 (p.13)** shows (left) the attack graph built solely from these structural relations. 

### 2.2 From attacks to defeats (where preferences matter)

* **Preference‑independent defeats**: **Undercuts** always defeat (they express “don’t apply the defeasible rule”). Certain contrary‑based attacks (e.g., α undermines ∼α) are also independent. (Def. 9; Sec. 2.3) 
* **Preference‑dependent defeats**: For other undermines/rebuts, the attack succeeds only if attacker is **not strictly worse** than the *specific* **sub‑argument** attacked. (Def. 9) 

```ts
function defeats(att: Attack, notLessPreferred: (a: Argument, b: Argument) => boolean): boolean {
  if (att.kind === 'undercut' || att.contraryBased) return true; // pref-independent
  // pref-dependent: attacker must not be strictly worse than the *targeted sub-argument*
  return notLessPreferred(att.from, att.on);
}
```

> **Important:** Compare to the attacked **sub‑argument**, not the whole target. This fixes several paradoxes in abstract PAFs and preserves sub‑argument closure. (Sec. 6.2) 

---

## 3) Preferences: practical orderings you can implement

Define two preorders on primitives your system knows:

* `≤_r` over **defeasible rules** (priority / reliability / source authority).
* `≤_p` over **ordinary premises** (credibility of facts / sources). 

Combine them into argument orderings via two families.

### 3.1 Set comparisons

Two set‑wise comparisons `/s` parameterize both families (Def. 19):

* **Elitist** (`/Eli`): X better than Y if ∃x∈X s.t. ∀y∈Y, x < y.
* **Democratic** (`/Dem`): X better than Y if ∀x∈X, ∃y∈Y with x < y.
  These are **reasonable‑inducing**, giving you nice meta‑properties. (Defs. 19, 22; Props. 21–22) 

```ts
function setLessEli<X>(Xset: X[], Yset: X[], lt: (x:X,y:X)=>boolean): boolean {
  return Xset.length>0 && Yset.length>0 && Xset.some(x => Yset.every(y => lt(x,y)));
}
function setLessDem<X>(Xset: X[], Yset: X[], lt: (x:X,y:X)=>boolean): boolean {
  return Xset.length>0 && Yset.length>0 && Xset.every(x => Yset.some(y => lt(x,y)));
}
```

### 3.2 Last‑link vs. Weakest‑link (Defs. 20–21)

* **Last‑link**: compare only **last** defeasible rules of each argument (then, if both have none, compare ordinary premises). 
* **Weakest‑link**: compare *all* defeasible rules and *all* ordinary premises (with symmetric handling when one side is strict/firm). (The paper fixes an asymmetry in earlier definitions.) 

```ts
// Helpers to extract sets
const lastDef = (a: Argument) => [...a.lastDefRules];
const allDef  = (a: Argument) => [...a.defRules];
const ordPrem = (a: Argument) => [...a.premOrd];

type SetLess = <T>(xs:T[], ys:T[], lt:(x:T,y:T)=>boolean)=>boolean;

function lessLastLink(a: Argument, b: Argument,
  ltRule: (x:DefRule,y:DefRule)=>boolean,
  ltPrem: (x:Wff,y:Wff)=>boolean,
  setLess: SetLess
): boolean {
  const aL = lastDef(a), bL = lastDef(b);
  if (aL.length || bL.length) return setLess(aL, bL, ltRule); // compare last def rules
  return setLess(ordPrem(a), ordPrem(b), ltPrem);             // fallback to premises
}

function lessWeakestLink(a: Argument, b: Argument,
  ltRule: (x:DefRule,y:DefRule)=>boolean,
  ltPrem: (x:Wff,y:Wff)=>boolean,
  setLess: SetLess
): boolean {
  const aStrict = a.defRules.size===0, bStrict = b.defRules.size===0;
  const aFirm   = a.premOrd.size===0, bFirm   = b.premOrd.size===0;

  if (aStrict && bStrict)        return setLess(ordPrem(a), ordPrem(b), ltPrem);
  if (aFirm && bFirm)            return setLess(allDef(a), allDef(b), ltRule);
  // otherwise require both dimensions to be better
  return setLess(ordPrem(a), ordPrem(b), ltPrem) && setLess(allDef(a), allDef(b), ltRule);
}

function notLessPreferred(a: Argument, b: Argument): boolean {
  // choose one policy; example: last-link+elitist
  const lt = (x: Argument, y: Argument) =>
    lessLastLink(x, y, ruleLt, premLt, setLessEli);
  return !lt(a, b);
}
```

**Why these choices:** With either family (last/weakest) plus a reasonable set comparison, the global argument ordering is **reasonable**; if your set comparison is a strict partial order, the strict counterpart `≺` is also. These are needed for the proofs and for practical robustness. (Props. 19–24) 

---

## 4) From objects to evaluation: SAF / c‑SAF + semantics

* **SAF**: `{ A: set of finite arguments, C: attack relation, ⪯: argument preorder }`.
* **c‑SAF**: same but only **c‑consistent** arguments included. (Def. 11) 

**Conflict‑freeness** (recommended): a set is conflict‑free iff **no two members attack** each other (attack‑based), not merely that none defeat each other. (Def. 14 vs. 13; Sec. 2.4–3.3) 

**Extensions**: Compute standard Dung semantics on the **defeat** graph, but guard membership with **attack‑conflict‑freeness**. The paper proves that for admissible/complete/grounded/preferred/stable, **attack‑based and defeat‑based definitions yield the same extensions** under the stated conditions; the attack‑based one is conceptually better. (Def. 15; Prop. 16) 

**Rationality postulates you should unit‑test** (Thms. 12–15):

* **Sub‑argument closure**: if A is in a complete extension, all sub‑arguments of A are.
* **Closure under strict rules**: conclusions are closed under `Rs`.
* **Direct consistency**: no concluded pair ϕ and a contrary ψ.
* **Indirect consistency**: strict closure of conclusions is consistent. 

> **Dev tip:** These postulates are your regression tests after any change in comparison policy or attack detection.

### 4.1 A minimal grounded‑semantics labelling loop

```ts
type Label = 'IN' | 'OUT' | 'UNDEC';

function groundedExtension(arguments_: Argument[], defeats: Attack[]): Set<Argument> {
  // defeats[] only where defeats(att, notLessPreferred) === true
  const inSet = new Set<Argument>(), outSet = new Set<Argument>();
  let changed = true;

  const attackersOf = new Map<Argument, Set<Argument>>();
  const attacksOf   = new Map<Argument, Set<Argument>>();
  for (const d of defeats) {
    if (!attackersOf.has(d.to)) attackersOf.set(d.to, new Set());
    attackersOf.get(d.to)!.add(d.from);
    if (!attacksOf.has(d.from)) attacksOf.set(d.from, new Set());
    attacksOf.get(d.from)!.add(d.to);
  }

  while (changed) {
    changed = false;
    // IN: any arg whose all attackers are OUT
    for (const a of arguments_) {
      if (inSet.has(a) || outSet.has(a)) continue;
      const atk = attackersOf.get(a) ?? new Set();
      if ([...atk].every(x => outSet.has(x))) { inSet.add(a); changed = true; }
    }
    // OUT: any arg attacked by an IN
    for (const a of arguments_) {
      if (outSet.has(a)) continue;
      const atkByMe = attacksOf.get(a) ?? new Set();
      if ([...atkByMe].some(t => inSet.has(t))) { outSet.add(a); changed = true; }
    }
  }
  return inSet;
}
```

(Use your attack‑based **conflict‑free** guard before calling this, and remember the **defeat** edges are preference‑filtered attacks.) 

---

## 5) Construction algorithm (end‑to‑end)

**Inputs:** `(L, −, Rs, Rd, n)`, `K=Kn∪Kp`, preorders `≤_r`, `≤_p`, and your chosen comparison policy (last/weakest × elitist/democratic).

**Steps:**

1. **Generate arguments** (finite trees): start from all premises in K, forward‑apply rules; for c‑SAFs, keep only **c‑consistent** premise sets. Track `lastDefRules`, `topRule`, `subs`, etc. (Def. 5–7) 
2. **Build attack graph** using the three relations in §2.1. (Def. 8) 
3. **Filter to defeat graph** using §2.2 and your argument ordering. (Def. 9; Defs. 19–21) 
4. **Compute extensions** (grounded/preferred/stable) over defeats, but enforce **attack‑conflict‑freeness** for candidate sets. (Defs. 14–15; Prop. 16) 
5. **Validate** the four rationality postulates over the result. (Thms. 12–15) 

> **Figure 3 (pp.16–17)** shows how *strict continuations* (adding only strict steps/axioms) may be needed in proofs; in implementation, you already generate all strict arguments during step 1. 

---

## 6) Instantiation recipes

### 6.1 Tarskian / abstract logic (AL) instantiation

To use an **abstract consequence** relation `Cn` (e.g., classical entailment):

* Let `Rs = { S → p | p ∈ Cn(S), S finite }` and `Rd = ∅`.
* Let `Kp = Σ` (your theory); `Kn = ∅`.
* Make `−` symmetric and aligned with `Cn`’s inconsistency (so ϕ and −ϕ are contradictory).
* Use **undermining** only (no defeasible rules), exactly matching AL attacks. (Def. 25–26; Prop. 25–26) 

Result: your c‑SAF is **well‑defined**, and the same extensions are obtained as in AL frameworks, now with preferences if you want (e.g., last‑link/weakest‑link over premises). (Sec. 5.2; Remark 31) 

### 6.2 Classical logic + preferences

For propositional/FO classical KBs:

* Build **strict** arguments from the KB (as above).
* Attacks are **direct undermines** (attacking inconsistent premises) or **direct defeats** (derived contradiction to a premise); both coincide with the paper’s undermining. (Sec. 5.3.1) 
* **Preferred/stable** semantics correspond to **maximal consistent subsets** of the theory in the non‑preferential case; adding preferences lets you arbitrate between competing subsets. (Ex. 33; discussion) 

**Bridge to Brewka’s Preferred Subtheories.** If you stratify your KB `(Γ1,…,Γn)` and set premise priorities accordingly, then **stable extensions** of the c‑SAF correspond to **preferred subtheories** (and vice‑versa). (Def. 28–29; Thm. 34) 

---

## 7) Worked micro‑example (matches the paper)

**Setup (paper’s Example 33; Fig. 4):** Σ = { x, ¬y, x⊃y }. Prefer **x** over both ¬y and x⊃y. Build strict arguments; attacks arise where premises contradict or imply contradictions. With either last‑ or weakest‑link and (elitist or democratic) set comparisons, **A5 does not defeat A1** (since it attacks A1’s sub‑argument with a strictly better premise), and you get stable extensions that remain consistent (closure under strict rules then adds all classical consequences). (Sec. 5.3; Fig. 4a–b) 

> This example demonstrates why **compare against the attacked sub‑argument**, not the entire target.

---

## 8) Engineering pitfalls & guardrails

* **Don’t attack strict conclusions.** Only *fallible* parts (ordinary premises, defeasible applications) are attackable. (Sec. 2.2; Def. 8) 
* **Attack ≠ defeat.** Always build attacks first; then filter to defeats with preferences. Use **attack‑based conflict‑freeness** to form candidate sets. (Secs. 2.4, 3.3, 4.3) 
* **Prefer reasonable orderings.** Implement last/weakest‑link via elitist or democratic comparisons to satisfy “reasonable” conditions. (Defs. 19–22; Props. 19–24) 
* **Well‑definedness checks** up front (Def. 12). Reject/repair rulebases violating axiom consistency or transposition/contraposition closure; do not register a contrary against axioms/strict conclusions. 
* **c‑SAF for classical/Tarskian.** When using classical entailment, enforce **c‑consistency** of premises per argument. (Defs. 6–7) 

---

## 9) Minimal API surface (suggestion)

```ts
// Build-time
buildArguments(as: ASpec, kb: KSpec, mode: 'SAF'|'c-SAF'): Argument[];
computeAttacks(args: Argument[], as: ASpec): Attack[];
computeDefeats(attacks: Attack[], cmp: PrefPolicy): Attack[];
// Run-time semantics
grounded(args: Argument[], defeats: Attack[], attacks: Attack[]): Extension;
preferred(...): Extension[];
stable(...): Extension[];
// Postulate checks for CI
assertSubArgumentClosure(ext: Extension): void;
assertClosureUnderStrict(as: ASpec, ext: Extension): void;
assertDirectConsistency(ext: Extension, minus: ContraryFn): void;
assertIndirectConsistency(as: ASpec, ext: Extension): void;
```

---

## 10) Quick glossary

* **Contrary / Contradictory (−)**: incompatibility relation in `L`. Contradictory is symmetric (¬ϕ vs ϕ). (Def. 2) 
* **Strict vs. Defeasible rules**: `→` logically compelled; `⇒` holds unless undercut/rebutted. (Def. 2) 
* **Undermine / Rebut / Undercut**: three attack modes (premise / defeasible conclusion / applicability). (Def. 8) 
* **Defeat**: an attack that succeeds given preferences (or preference‑independently for undercuts/selected contraries). (Def. 9) 
* **(c‑)SAF**: (c‑)Structured Argumentation Framework triple with arguments, attacks, and preferences. (Def. 11) 

---

## 11) What to test before shipping

1. **Unit tests** for each attack type and defeat filtering (including contrary and undercut cases).
2. **Orderings**: verify `≺` is irreflexive/transitive under your chosen `/s`. (Props. 23–24) 
3. **Rationality postulates** on curated KBs (esp. sub‑argument closure and indirect consistency). (Thms. 12–15) 
4. **Equivalence sanity**: attack‑ vs defeat‑based conflict‑freeness yield the same extensions on your corpora. (Prop. 16) 
5. **Classical mode**: reproduce Example 33’s behavior and the Preferred‑Subtheories correspondence (Thm. 34). 

---

## 12) Pseudocode checklist (end‑to‑end)

```ts
// 1) Build args
const args = buildArguments(AS, K, 'c-SAF');              // enforce c-consistency if chosen
// 2) Attacks (structure only)
const attacks = computeAttacks(args, AS);                  // undermine, rebut, undercut
// 3) Preferences
const defeats = attacks.filter(a => defeats(a, notLessPreferred));
// 4) Semantics (use attack-based conflict-freeness as guard)
const Eground = groundedExtension(attackConflictFree(args, attacks), defeats);
// 5) Postulates
assertSubArgumentClosure(Eground);
assertClosureUnderStrict(AS, Eground);
assertDirectConsistency(Eground, minus);
assertIndirectConsistency(AS, Eground);
```

---

### Where this report draws from in the paper

* **Problem framing & contributions**: Abstract; Sec. 1–2; 3 (framework); 4 (properties); 5 (instantiations). **Figures 2–4** illustrate attack vs defeat and the classical example. 
* **Core definitions**: Defs. 2–5 (AS, KB, arguments), 6–7 (c‑consistency), 8–9 (attacks/defeats), 10–15 (SAF/c‑SAF, conflict‑free, extensions). 
* **Preferences**: Defs. 19–21; Props. 19–24 (reasonable orderings). 
* **Rationality postulates**: Thms. 12–15; equivalence Prop. 16. 
* **AL/classical instantiation**: Defs. 23–27; Props. 25–28; Cor. 29; Prop. 32; Sec. 5.3; Thm. 34. 

---

If you want, I can turn this into a small reference implementation skeleton (TS module) with a few unit tests mirroring the paper’s examples and the four rationality postulates. 
