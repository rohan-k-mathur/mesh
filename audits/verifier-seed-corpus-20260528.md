# Verifier seed-corpus run — Q-018 §3.1

- **generated at:** 2026-05-28T22:33:14.610Z
- **plan step:** Phase 2 step 8
- **source pairs:** audits/q018-ontoclean-20260528.md §3.1
- **verifier module:** lib/schemes/verifier/

## Verdict table

| left | right | left CQs | right CQs | fingerprint match | verdict |
|---|---|---|---|---|---|
| `expert_opinion` | `expert-opinion` | 4 | 2 | no | `incomparable` |
| `positive_consequences` | `good_consequences` | 5 | 3 | no | `incomparable` |
| `causal` | `cause_to_effect` | 2 | 5 | no | `incomparable` |

## Per-pair detail

### `expert_opinion` × `expert-opinion`
- **left fingerprint:** `612a8f02bea81aac9c3bece0f3f6a767bb050f2e77b08fc9f242a55cc0d22dd7`
- **right fingerprint:** `69b3b2f3131a14a9cd318cec90cd08cba4af6a85ddc47c3aa3a35c7169f7be01`
- **verdict:** `incomparable`
- **discriminating on left:** `consensus` — no structural match on right
- **discriminating on right:** `EO1` — no structural match on left

### `positive_consequences` × `good_consequences`
- **left fingerprint:** `8381e6bea00235644f93c8b8996de190a0859316ab36b8654b0eb992c53d7941`
- **right fingerprint:** `2b569f3882500254366704e391aad0409ee8f61f411051b83fe4b67e092f8725`
- **verdict:** `incomparable`
- **discriminating on left:** `tradeoffs` — no structural match on right
- **discriminating on right:** `` — no structural match on left

### `causal` × `cause_to_effect`
- **left fingerprint:** `73030208918e7c111a25631175fb87d7fe841bf17c5050a913b1a1eedf128c93`
- **right fingerprint:** `168068b120139d61daddc55f0f6272b66812b497ee7e11ad1afec187aae1e6bb`
- **verdict:** `incomparable`
- **discriminating on left:** `alt_causes` — no structural match on right
- **discriminating on right:** `causal_strength` — no structural match on left

## Implications for step 9 (catalogue de-duplication)

No `equal` verdicts. The folksonomy framing from Q-018 §3.1 ('plausibly redundant') is **not** confirmed by behaviour-equality on these pairs; the verifier finds at least one structural distinction per pair. Step 9's retire-or-merge work has nothing to do on this corpus.
