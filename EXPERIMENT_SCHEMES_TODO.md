# Experiment-Added Argumentation Schemes — Promotion Backlog

Living list of argumentation schemes that **experiments** have introduced
(via additive seeds under `experiments/<name>/scripts/seed-*-schemes.ts`)
because the global Walton catalog seeded by
`scripts/seed-comprehensive-schemes.ts` does not yet include them.

When the global catalog is next revised, these should be considered for
promotion into the canonical seed so future experiments don't have to
re-add them.

The "Status" column captures whether the scheme is part of the standard
Waltonian / Macagnan catalog (and is just locally missing) or is genuinely
non-standard / experiment-specific.

---

## Polarization-1 (May 2026)

Added by `experiments/polarization-1/scripts/seed-experiment-schemes.ts`.

| Scheme key | Status | Notes |
|---|---|---|
| `inference_to_best_explanation` | **Standard Walton (abductive).** Should be promoted. | Walton 2014 lists it as "Argument from Best Explanation." Used heavily in causal-empirical disputes; absent from the global seed. |
| `statistical_generalization` | **Standard Walton (inductive).** Should be promoted. | Walton's "Argument from Sample to Population." The existing `argument_from_example` scheme covers analogical generalization but not statistical sample-to-population reasoning, which is structurally distinct (CQs around sample size, representativeness, selection bias, measurement validity). |
| `argument_from_lack_of_evidence` | **Standard Walton (negative-evidence).** Should be promoted. | Walton's "Argument from Ignorance" / "Argument from Lack of Knowledge." Distinct from rebuttal because it depends on an explicit epistemic-closure premise about how thoroughly the search for evidence has been conducted. |
| `methodological_critique` | **NON-STANDARD.** Keep experiment-local until the family is generalized. | Meta-level scheme that operates on a study's warrant rather than on its conclusion. Probably wants to live inside a future "evidence-quality" family in the global catalog (sibling to `statistical_generalization` and `argument_from_lack_of_evidence`). Until then, treat as polarization-1-only. |

---

## Conventions for adding to this doc

- Add a section per experiment (date the section).
- Keep schemes in **standard / non-standard / promote-on-next-revision** buckets via the Status column.
- For non-standard schemes, briefly note (a) why no existing scheme covers the case, and (b) what generalization would let them fold into the global catalog.
- Don't remove rows when schemes are promoted — strike them through and leave a note (`✅ promoted in <date>`) so the audit trail is preserved.
