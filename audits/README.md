# Audits

Read-only research-artefact audits produced by [Spec 5 — Audit Protocols](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_AUDIT_PROTOCOLS.md).

## Purpose

Each audit answers a specific [open question](../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md) and unblocks one or more implementation-spec phases:

| Audit | Question | Unblocks |
|---|---|---|
| `q019-inherit-cqs-false-*` | [Q-019](../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-019) — production count + intent of `inheritCQs: false` | [Spec 2](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_ADMIN_TIGHTENING.md) phase 2c (Shape A vs Shape B) and the WF3 severity-flip phase-ordering constraint |
| `q018-ontoclean-*` | [Q-018](../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-018) — OntoClean meta-property matrix | [Q-014](../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-014) tie-break + [Spec 3](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_PROTOCOL_SOUNDNESS.md) phase 3d `premiseType` rollout |
| `q020-external-fields-*` | [Q-020](../RESEARCH_PROGRAMME/01_OPEN_QUESTIONS_REGISTRY.md#q-020) — substrate ↔ external catalogue field comparison | [Spec 4](../Development%20and%20Ideation%20Documents/ARCHITECTURE/SCHEMES_IMPL_VERIFIER.md) phase 4c AIF round-trip + fingerprint widening |

## Naming convention

`<question>-<short-name>-<YYYYMMDD>.<ext>`

- `<question>`: `q018`, `q019`, `q020`
- `<short-name>`: kebab-case slug
- `<YYYYMMDD>`: date the audit was run (not the date it was committed)
- `<ext>`: `json` for raw data, `md` for human-readable narrative, `csv` for spreadsheet artefacts

## Retention

Audits are **research artefacts, not log files**. Old dated files are kept indefinitely. When an audit is re-run, the new dated file is added alongside the old; downstream specs cite by date.

## How to run

```bash
# Q-019 — inheritCQs: false audit
yarn audit:q019

# Q-019 — render markdown summary from latest JSON
yarn audit:q019:format

# Q-018 — OntoClean matrix (skeleton; analyst classification follows)
yarn audit:q018

# Q-020 — external-catalogue field comparison (manual; see template)
# Edit q020-external-fields-template.csv, save as q020-external-fields-<YYYYMMDD>.csv
```
