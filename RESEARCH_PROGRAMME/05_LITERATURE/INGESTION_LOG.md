# Literature Ingestion Log

> Append-only. Newest at the top within each block. Older rounds live in their
> original files; this log is the single index across rounds.

## Existing rounds (subsumed)

| Date | Round | Notes file | Coverage summary |
|---|---|---|---|
| 2026-05-17 | Round 1 | [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_1.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_1.md) | 20 substrate claims pressure-tested across 6 buckets (post-Girard dialogical Ludics; Ambler / ECC categorical argumentation; ASPIC+ / AIF / dynamic frameworks; commitment-store dialogue games; deliberative-democracy theory; LLM/MCP agents over structured argumentation 2023–2026). 9 confirmed, 2 confirmed-with-caveat, 4 partially-confirmed-with-substantive-caveat, 4 original-to-track, 1 single-source identification, 2 open-inconclusive. |
| 2026-05-18 | Round 2 | [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/LITERATURE_REVIEW_ROUND_2.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/LITERATURE_REVIEW_ROUND_2.md) | Re-verification of 5 non-confirmed Round 1 claims + first-time verification of 5 new claims from Session 0f. R-C1 upgraded to confirmed-with-caveat (per-cone reframe). N-C21 confirms Basaldella–Triads is *not* Reading C; substrate's Reading C is original. R-C5 (dynamic behaviours) remains open. R-C8 confirms Prakken 2024 lacks participant-access stratum. Q3 partially closes via Telang–Singh–Yorke-Smith 2022; Q4 closes via Mansbridge et al. 2012 + Niemeyer/Veri/Dryzek/Bächtiger APSR 2024; Q7 (MCP-arg surface) original to track. |

### Cross-link tables (current)

| Programme entry | Touched by |
|---|---|
| T001 OQ-JSL per-cone | Round 1 §2 C1 (refuted whole-Inc-B JSL); Round 2 §2.1 R-C1 (confirms per-cone components) |
| T002 Inc(B) antichain | Round 1 §2 C2; Round 2 §2.1 R-C1 (Fouqueré–Quatrini 2013 minimum-incarnation) |
| C001 Ambler bridge | Round 1 §3 C3; Round 2 §2.2 R-C3 |
| C002 Reading C conservativity | Round 1 §2 C7, C20; Round 2 §1 N-C21 |
| C003 Exposure-map refines Prakken | Round 1 §2 C4; Round 2 §2.4 R-C8 |
| C004 Joint saturation closure | Round 1 §2 C20 |
| C005 Behaviours directed system | Round 1 §2 C5; Round 2 §2.3 R-C5 |
| Q-009 Consensus vs exhaustion | Round 1 §1 (Habermas BFN p.486 correction) |
| Q-010 Sub-claim commitments | Round 2 §1 (Q3 residual; Telang–Singh–Yorke-Smith 2022) |

---

## Next reads (queue)

The following ten are the highest-priority unread items as of seed
time, chosen to span the four concentric rings and to fill the gaps Round 2
explicitly flagged. Each line: priority · citation · which programme entry
it should touch.

1. **Fouqueré, C. & Quatrini, M. (2013).** *Ludics and Natural Language: First Approaches.* LACL 2012 hal-01286851. — already cited; **promoted from "spot-checked" to "full-read"** to close the dialogue-Ludics literature trail; touches C001, C002.
2. **Faggian, C. & Hyland, M. (2002).** *Designs, Disputes and Strategies.* CSL 2002. — already cited in [`../../Development and Ideation Documents/ARCHITECTURE/LUDICS_SYSTEM_ARCHITECTURE.md`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/LUDICS_SYSTEM_ARCHITECTURE.md); full-read needed for the DDS layer's innocence/propagation formulation that the substrate's strategy layer adapts; touches T001, T002, C001.
3. **Doumane, A. (2017).** *Inductive and Functional Types in Ludics.* CSL 2017. — Theorem 30 cited via Round 2; full-read for the regularity hypotheses that govern when `⊥⊥`-closure is "useless"; touches C001, C004.
4. **Doutre, S., Herzig, A. & Perrussel, L. (2023).** *A Dynamic Logic Framework for Abstract Argumentation.* KR 2023. — closest extant analog to {B_t}; needs full-read for C005.
5. **Prakken, H. (2024).** *An abstract and structured account of dialectical argument strength.* Artificial Intelligence 335:104193. — full-read for the exact statement of the expansion-family; touches C003.
6. **Mansbridge, J. et al. (2012).** *A Systemic Approach to Deliberative Democracy.* — closes Q4 (Round 2) and feeds Q-009; full-read needed.
7. **Mercier, H. & Sperber, D. (2017).** *The Enigma of Reason.* — argumentative-function hypothesis; feeds Q-009 and S003 framing.
8. **Habermas, J. (1996).** *Between Facts and Norms*, p. 486 ("anonymous popular sovereignty"). — replace Cohen analog in 00_CHARTER §4 with this; cited via Round 1 §1; needs the passage read in context.
9. **Coste-Marquis, S., Konieczny, S., Mailly, J.-G. & Marquis, P. (2018).** *Control Argumentation Frameworks.* AAAI 2018 / IJCAI 2018. — C005's structural-argumentation cousin.
10. **Telang, P. R., Singh, M. P. & Yorke-Smith, N. (2022).** *Maintenance commitments.* — partially closes Q-010; full-read for the categorical formulation.
