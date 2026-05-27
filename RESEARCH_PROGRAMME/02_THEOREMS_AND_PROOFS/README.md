# Theorem Register — Policy

> What counts as a theorem in this programme, what counts as evidence, and how
> proofs get cross-checked.

## What counts as a theorem

A theorem in this programme is a statement that meets **all four** of the
following:

1. **Stated in formal vocabulary.** The statement uses defined objects from
   the glossary ([`../07_GLOSSARY.md`](../07_GLOSSARY.md)) or from a cited
   upstream paper. No "essentially" / "roughly" qualifiers in the statement
   itself.
2. **Has a written proof checkable by one person in one sitting.** Long proofs
   are decomposed into lemmas that each meet this criterion. A proof that
   requires a software implementation to verify lives under *machine-checked*
   (see below), not *human-checked*.
3. **Has been cross-checked by a second reader** who is not the author of the
   proof. The cross-check is recorded in the entry (`cross-checked-by`,
   `cross-check-date`, `cross-check-notes`).
4. **Retires or updates an open-question entry.** A theorem that does not
   close an open question is a sign that the open-questions registry is
   incomplete; the registry must be updated before the theorem is filed.

## Human-checked vs machine-checked

The default is *human-checked*. We will adopt a proof assistant (Coq, Lean, or
Agda) only when a specific result either (a) is large enough that human
checking is unreliable, or (b) would benefit from being executable against the
runtime (e.g. an invariant the engine must respect). Adopting an assistant is
a programme-level decision and is recorded as a quarterly-review item.

A machine-checked entry adds:
- `assistant`: which proof assistant
- `artifact-path`: relative path to the proof artefact (`.v`, `.lean`,
  `.agda`)
- `build-instructions`: how to re-check

## Evidence vs theorem

Implementation tests, empirical observations, and conformance scripts under
`__tests__/`, `experiments/`, and similar are **evidence**, not theorems.
They can falsify a conjecture, but they cannot settle one positively as a
theorem entry. (A passing test set may settle an *empirical* study; see
[`../04_EMPIRICAL_STUDIES/`](../04_EMPIRICAL_STUDIES/).)

## Filing format

One file per theorem, named `TNNN-slug.md`. Required sections:

```
# TNNN — <title>

- status: established | provisional (pending cross-check) | retracted
- closes: Q-NNN [, Q-MMM, ...]
- depends-on: TNNN, ... (other theorems used)
- proved-by: <author/handle>
- cross-checked-by: <reader>
- cross-check-date: YYYY-MM-DD
- last-reviewed: YYYY-MM-DD
- source-of-proof: relative path to where the proof lives (may be this file)

## Statement
## Proof (or pointer)
## Cross-check notes
## What this rules out (for the implementation)
```

## Retraction

Retraction is allowed; the entry stays in place with `status: retracted` and a
required `retracted-because` section pointing to the counterexample or the
revised statement. The open question the theorem had closed is re-opened with
a back-pointer.
