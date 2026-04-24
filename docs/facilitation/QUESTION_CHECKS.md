# Facilitation — Question Quality Check Specifications (v1)

Status: Draft v0.1 (C0 deliverable)
Parent: [docs/DelibDemocracyScopeC_Roadmap.md](../DelibDemocracyScopeC_Roadmap.md)

## Conventions

- Each check is a pure function `(question, ctx) → FacilitationQuestionCheck[]`.
- Checks live in `lib/facilitation/checks/<checkKind>.ts`.
- Checks **never call out** to external services. v1 is rules-only, no LLM (decision #6).
- Severity model (decision #2):
  - `BLOCK` — must be resolved (text edited or exception lexicon override) before lock succeeds.
  - `WARN` — must be acknowledged at lock time; acknowledgement is recorded on the check row.
  - `INFO` — advisory; no gating.
- Each check ships with: a function, a lexicon/configuration file under `lib/facilitation/checks/data/`, and a fixture-driven test suite.
- The check runner generates a single `runId` per `POST /questions/[id]/check` invocation; all rows from one run share the `runId` so the cockpit can display "checks from this run vs. older runs".

## Common types

```ts
type CheckContext = {
  framingType: FacilitationFramingType;
  language: string; // BCP-47; v1 launch supports "en" only
  lexiconOverrideKey?: string; // e.g. "legal", "medical"
};

type CheckResult = {
  kind: FacilitationCheckKind;
  severity: FacilitationCheckSeverity;
  messageText: string;
  evidence?: object;
};
```

## Severity ceiling override

Per-deliberation configuration may demote `BLOCK` → `WARN` for specific check kinds. Use case: legal/medical domains where domain jargon would otherwise block every question. Override is recorded on the deliberation; the runner reads it before returning results.

## Language scope

v1 supports English (`en`) only. Non-English questions are accepted (no error) but the check runner returns a single `INFO` result: `"Question quality checks not yet calibrated for language: <code>"`. Nothing is blocked. i18n hooks land in C1.

---

## 1) `CLARITY` (v1)

### Inputs
- Question text.
- Lexicon (`lib/facilitation/checks/data/clarity_jargon.en.json`).

### Heuristics

1. **Sentence count**
   - `> 3 sentences` → `WARN` ("Question has multiple sentences; consider tightening into a single ask.")
   - `> 5 sentences` → `BLOCK` ("Question is too long; split or tighten.")
2. **Average word length**
   - `> 6.5 chars/word` → `WARN`.
3. **Jargon density**
   - Count tokens matching the configured jargon lexicon. `density = matches / tokenCount`.
   - `density > 0.10` → `WARN` with `evidence.jargonHits[]`.
   - `density > 0.20` → `BLOCK`.
   - Lexicon overrides (e.g. legal, medical) replace the default lexicon.
4. **Token count**
   - `< 4 tokens` → `BLOCK` ("Too short to elicit deliberation.")
   - `> 60 tokens` → `WARN`.

### Evidence shape
```json
{
  "tokenCount": 18,
  "sentenceCount": 1,
  "avgWordLength": 5.1,
  "jargonHits": ["fare-capping"],
  "jargonDensity": 0.055
}
```

### Default lexicon
- ~150 generic English jargon terms (e.g. "leverage", "synergize", "stakeholdership").
- Domain overrides shipped at launch: `legal.json`, `medical.json` (placeholders; populated by partners during pilot).

---

## 2) `LEADING` (v1)

### Heuristics
Pattern matchers (case-insensitive, regex). Each match emits one row.

| Pattern (regex)                                                        | Severity | Reason |
|------------------------------------------------------------------------|----------|--------|
| `\b(don['’]?t|do not) you (think\|agree)\b`                            | `BLOCK`  | Direct presupposition of agreement. |
| `\bisn['’]?t it (true\|obvious\|clear)\b`                              | `BLOCK`  | Asserts truth. |
| `\bobviously\b`                                                         | `WARN`   | Implies the answer is self-evident. |
| `\bsurely\b`                                                            | `WARN`   | Same. |
| `\bclearly\b` (when not in a phrase like "clearly state")              | `WARN`   | Same. |
| Presupposition trigger verbs (`restore`, `continue`, `stop`, `resume`) | `WARN`   | Presupposes the prior state. |
| Loaded value adjectives (`reasonable`, `sensible`, `irresponsible`)    | `WARN`   | Frames the answer space normatively. |

Patterns and trigger word lists live in `lib/facilitation/checks/data/leading.en.json`. Each pattern carries a `severity`, a human-readable message template, and an `evidence` shape capturing the matched substring + character offsets.

### Evidence shape
```json
{
  "matches": [
    { "pattern": "loaded_adjective", "value": "reasonable", "offset": 24, "messageTemplate": "Loaded adjective '{value}' frames the answer normatively." }
  ]
}
```

### Notes
- Plurality of matches doesn't escalate severity in v1 — each match is its own row, the runner's summary surfaces the highest severity present.
- This check is the most likely to misfire; the cockpit copy must clearly frame results as "things to consider", not "violations".

---

## 3) `BALANCE` (v1)

### Applies to
- `framingType ∈ { choice, evaluative }` only. For `open` and `generative` framings, balance returns no rows.

### Heuristics

1. **Choice framing** — extract apparent choice clauses delimited by ` or ` / `vs.` / `versus`.
   - If only one clause is detectable → `BLOCK` ("Choice framing requires at least two options; only one detected.").
   - For each pair of clauses, compute adjective-load asymmetry:
     - Count value-adjectives (loaded list, same as `LEADING`) per clause.
     - If `|countA − countB| ≥ 2` → `WARN` ("Asymmetric framing: option A carries more loaded adjectives than option B.").
     - Token-length asymmetry `|lenA − lenB| / max(lenA, lenB) > 0.5` → `INFO`.
2. **Evaluative framing** — text contains an evaluation verb (`approve`, `support`, `oppose`, `endorse`).
   - Require an explicit "or oppose / or reject" companion phrase. Missing → `WARN` ("Evaluative framing should make the negative option visible.").

### Evidence shape
```json
{
  "framingType": "choice",
  "clauses": [
    { "text": "restore weekend service", "tokens": 3, "loadedAdjectives": [] },
    { "text": "keep current schedule",   "tokens": 3, "loadedAdjectives": [] }
  ],
  "asymmetry": { "adjectiveDelta": 0, "lengthRatio": 0.0 }
}
```

---

## 4) `SCOPE` (v1)

### Heuristics

1. **Multiple-question detection**
   - More than one `?` in the text → `BLOCK` ("Multiple questions detected; ask one at a time.").
2. **Embedded sub-questions**
   - Conjunctions `and` / `as well as` joining two interrogative clauses → `WARN`.
3. **Hidden conditional**
   - Pattern `if … then …` followed by `?` and the conditional clause itself contains a question → `WARN`.

### Evidence shape
```json
{
  "questionMarkCount": 1,
  "embeddedClauseCount": 0
}
```

---

## 5) `READABILITY` (v1)

### Inputs
- Question text.

### Heuristic
- Compute Flesch-Kincaid grade level. Pure function; deterministic.
- Map to severity:
  - `grade ≤ 6` → `INFO` ("Reading grade {grade}; very accessible.")
  - `6 < grade ≤ 12` → `INFO` ("Reading grade {grade}.")
  - `12 < grade ≤ 16` → `WARN` ("Reading grade {grade}; consider simplifying.")
  - `grade > 16` → `BLOCK` ("Reading grade {grade}; too complex for general deliberation.")

The `BLOCK` grade ceiling is configurable per deliberation (medical/legal partners may legitimately exceed 16).

### Evidence shape
```json
{
  "fleschKincaidGrade": 9.4,
  "fleschReadingEase": 62.1,
  "syllableCount": 24
}
```

---

## 6) `BIAS` (v1 stub)

### Status
- Reserved enum value; v1 ships **no** active heuristics under `BIAS`. The runner returns no rows for this kind in v1.
- Deferred to a v1.1 minor release once partner research has produced a defensible bias-detection rubric. Without that rubric, shipping anything under this name risks legitimizing weak heuristics.

### Behaviour
- The kind exists in the enum so the database schema is stable when v1.1 lands.
- The runner does not invoke any `BIAS` check function in v1. No row is written; the summary's `bias` count is always `0`.

---

## Run summary shape

The `POST /questions/[id]/check` response includes:

```json
{
  "runId": "run_…",
  "ranAt": "...",
  "checks": [ /* CheckResult[] */ ],
  "summary": {
    "info": 1,
    "warn": 2,
    "block": 0,
    "byKind": { "CLARITY": 1, "LEADING": 1, "READABILITY": 1 }
  }
}
```

## Lock-time semantics

`POST /questions/[id]/lock` performs:

1. Load the most recent `runId` for the question. (If none, return `422 VALIDATION_ERROR { code: "NO_CHECKS_RUN" }`.)
2. Filter checks from that run by severity:
   - Any `BLOCK` rows present → return `409 CONFLICT_BLOCK_SEVERITY_UNRESOLVED` with the offending check ids.
   - Any `WARN` rows present → require all of them to be present in `acknowledgedCheckIds`. Missing acks → return `422 VALIDATION_ERROR { code: "WARN_NOT_ACKNOWLEDGED" }`.
3. Mark each acknowledged check `acknowledgedAt = now`, `acknowledgedById = caller`.
4. Set `question.lockedAt`, `question.lockedById`, copy the run summary into `question.qualityReportJson`.
5. Return the locked question.

## Test coverage requirements (Phase C1)

Per check kind:
- ≥ 3 fixture cases covering INFO / WARN / BLOCK boundaries.
- Lexicon override path tested at least once.
- Boundary case (e.g. exact threshold word count, exact grade-level boundary).
- Determinism: same input twice produces byte-identical `evidence` JSON.

Cross-cutting:
- Lock with no checks run → 422.
- Lock with unresolved BLOCK → 409.
- Lock with unacknowledged WARN → 422.
- Lock with all WARNs acknowledged → success; check rows updated; question state advances.
- Per-deliberation severity ceiling override demotes BLOCK to WARN end-to-end.
