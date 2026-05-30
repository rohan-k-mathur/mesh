# Full-catalogue verifier sweep — argument-scheme rows

- **generated at:** 2026-05-28T22:35:02.543Z
- **plan step:** Phase 2 step 8 (extended sweep)
- **schemes considered:** 25 (kind='argument-scheme')
- **families:** 6
- **pairs verified:** 45
- **verdict totals:** equal=0, subset=0, incomparable=45, inconclusive=0

## Families

| clusterTag | members |
|---|---|
| `authority_family` | `expert-opinion`, `expert_opinion`, `popular_opinion`, `popular_practice`, `witness_testimony` |
| `causal_family` | `causal`, `cause_to_effect`, `inference_to_best_explanation` |
| `definition_family` | `argument_from_composition`, `argument_from_division`, `classification`, `definition_to_classification`, `verbal_classification` |
| `evidence_family` | `argument_from_lack_of_evidence`, `methodological_critique`, `sign`, `statistical_generalization` |
| `practical_reasoning_family` | `good_consequences`, `negative_consequences`, `positive_consequences`, `practical_reasoning`, `slippery_slope`, `value_based_pr` |
| `similarity_family` | `analogy`, `argument_from_example` |

## Fingerprint collisions (upper bound on `equal` candidates)

None — every scheme has a unique behaviour fingerprint.

## Equal verdicts

None.

## Subset verdicts

None.

## Inconclusive verdicts

None.

## Per-family verdict counts

| family | pairs | equal | subset | incomparable | inconclusive |
|---|---|---|---|---|---|
| `authority_family` | 10 | 0 | 0 | 10 | 0 |
| `causal_family` | 3 | 0 | 0 | 3 | 0 |
| `definition_family` | 10 | 0 | 0 | 10 | 0 |
| `evidence_family` | 6 | 0 | 0 | 6 | 0 |
| `practical_reasoning_family` | 15 | 0 | 0 | 15 | 0 |
| `similarity_family` | 1 | 0 | 0 | 1 | 0 |

## Implications for step 9 (catalogue de-duplication)

**No `equal` verdicts across the full catalogue.** Step 9's retire-or-merge migration has nothing to repoint; the de-duplication phase reduces to a no-op recorded in the migration log.

## Appendix: fingerprints

| key | family | cqs | fingerprint |
|---|---|---|---|
| `analogy` | `similarity_family` | 2 | `781120804043ef6cd22e6e9b8cd5c9d28b7c8271bb55f9533abe86d80f9b96f0` |
| `argument_from_composition` | `definition_family` | 5 | `618f7ec17c9d8cc19175303e2c1bf95285370e02c203a51162f9e818a76a1898` |
| `argument_from_division` | `definition_family` | 5 | `0cdd7ee766d76f84d1e0f708146c901366b4bdf28ab0a348670f0fa0b3899abe` |
| `argument_from_example` | `similarity_family` | 5 | `bcce415b52ac05443cbfea217c7c47958ca98ae2946f929b02ff54e3fa1f53bc` |
| `argument_from_lack_of_evidence` | `evidence_family` | 5 | `f70dd5bed2748b767f634d3c7faa25a2b2b80b7eb3abfaf1c56f2bb2c11cae37` |
| `causal` | `causal_family` | 2 | `73030208918e7c111a25631175fb87d7fe841bf17c5050a913b1a1eedf128c93` |
| `cause_to_effect` | `causal_family` | 5 | `168068b120139d61daddc55f0f6272b66812b497ee7e11ad1afec187aae1e6bb` |
| `classification` | `definition_family` | 1 | `914dfe08a02aeed6def8cd8ebb1d422f94f031be42093ea776184a0b70ea1bdb` |
| `definition_to_classification` | `definition_family` | 6 | `c2af090adb7965003d64a9f1dd867f7eb3d74d861a8e04eff2b25913281326e9` |
| `expert-opinion` | `authority_family` | 2 | `69b3b2f3131a14a9cd318cec90cd08cba4af6a85ddc47c3aa3a35c7169f7be01` |
| `expert_opinion` | `authority_family` | 4 | `612a8f02bea81aac9c3bece0f3f6a767bb050f2e77b08fc9f242a55cc0d22dd7` |
| `good_consequences` | `practical_reasoning_family` | 3 | `2b569f3882500254366704e391aad0409ee8f61f411051b83fe4b67e092f8725` |
| `inference_to_best_explanation` | `causal_family` | 5 | `7372ce00527f5268afb66a82339aea167b9046823ceec9d4638d4f3fdd0d80e0` |
| `methodological_critique` | `evidence_family` | 6 | `cc2d0d290cb52b416effaab9647cfcc206dfbb2e7a24f96ce2b9ccc13bde68ef` |
| `negative_consequences` | `practical_reasoning_family` | 5 | `999f44c56af8104e47584473d38bdbcef9481e56f937e0ae35dffe224420f99b` |
| `popular_opinion` | `authority_family` | 5 | `401d90f95156abec11b17e3e38b2a1ccbd4490c981dc35f5d048d435e9039645` |
| `popular_practice` | `authority_family` | 5 | `f8f1981e65fc3b778a3f411e2287513eeb9b24e9e020e6e36ef95bf85dbba8d1` |
| `positive_consequences` | `practical_reasoning_family` | 5 | `8381e6bea00235644f93c8b8996de190a0859316ab36b8654b0eb992c53d7941` |
| `practical_reasoning` | `practical_reasoning_family` | 9 | `00bb79db9b05bece8f985a8d6a8280ce03c44b47d750fe977273c809b99e7011` |
| `sign` | `evidence_family` | 3 | `7a55a5b74c95ad4f34b7a3e55a959b7cab02a46ca39a056af73b9676ea680aec` |
| `slippery_slope` | `practical_reasoning_family` | 4 | `d97851360ab3e39a83f079c5d331713d810c7eb1160b2f11cef25a5004f094ee` |
| `statistical_generalization` | `evidence_family` | 5 | `ee3cc6ae790db61cb224a6b56a0a3fd5448bec81edd1a09d76e8b8ec73f1fa44` |
| `value_based_pr` | `practical_reasoning_family` | 3 | `c9b032dda681b24ab3428a99be3d3a2772953fc095650408e12ae110ce1ba5cb` |
| `verbal_classification` | `definition_family` | 5 | `b88775978f70a08d9d57747bcbd3c309f1a0860c91a49ed8c865ee43c8b7a50f` |
| `witness_testimony` | `authority_family` | 6 | `b92d2cdda967ca7dfb9a1306e8f91cc4f98342fec4b8cdaeae57c5282ddade4e` |
