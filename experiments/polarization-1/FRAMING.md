# Polarization-1 Framing Document

**Experiment:** Multi-Agent Deliberation Experiment, Run 1
**Status:** Draft v0.1 — pending 9/10 borderline-claim acceptance test
**Date:** May 3, 2026

---

## Central contested claim

> **Algorithmic content curation on major social media platforms has been a significant causal factor in the rise of political polarization in the United States between 2012 and 2024.**

This is the **root claim** of the deliberation. It will be created as the deliberation's representative claim and serve as the conclusion target for every Phase-1 sub-claim.

---

## In-scope

### Platforms
- **Facebook** (News Feed, Reels, Groups)
- **Instagram** (Feed, Reels, Explore)
- **YouTube** (Home/Up Next recommendations, Shorts)
- **X / Twitter** (Home timeline, "For You" tab post-2023)
- **TikTok** (For You Page) — included for the 2018–2024 window only
- **Reddit** (r/popular, r/all algorithmic surfacing) — included for the 2016–2024 window only

### Population
- **Adult US residents** (age ≥ 18) who actively used at least one in-scope platform in the time window.
- "Active use" operationalized as ≥ 30 minutes/week per platform (matching Pew's threshold).

### Time period
- **2012 through 2024** (inclusive).
- 2012 chosen as the start year because it brackets the transition from chronological to algorithmic ranking on Facebook (early 2012) and Twitter (late 2016), and the takeoff of mobile-first usage.

### Operational definition of "polarization"
- **Affective polarization** (in-group warmth minus out-group warmth on feeling-thermometer scales), per the Iyengar et al. (2019) operationalization.
- We do **not** address ideological-sorting polarization (positions on issue scales becoming more correlated within parties) except where it intersects affective polarization causally.
- We do **not** address belief polarization on individual issues (e.g. climate, vaccines) as a primary outcome.

### Operational definition of "significant causal factor"
- A causal factor whose removal or substantial modification would, by reasonable estimate from the available evidence, **reduce the magnitude of measured affective polarization growth in the time period by at least 10%** of the observed change.
- "Causal" requires either (a) experimental or quasi-experimental evidence of effect on individuals, with a defensible aggregation argument to population-level change, OR (b) observational evidence with credible identification (instrumental variables, regression discontinuity, difference-in-differences) and triangulation from multiple independent designs.
- "Significant" excludes effects that are statistically detectable but practically negligible (e.g. Cohen's d < 0.05 with no plausible compounding mechanism).

---

## Out-of-scope (and why)

- **"Are smartphones / social media bad for adolescent mental health?"** — Different outcome variable, different population, different evidence base. The Haidt-Twenge debate is adjacent and tempting but is its own deliberation.
- **"Has political polarization actually risen?"** — We stipulate that affective polarization in the US has risen substantially in this window per the Iyengar-Lelkes-Westwood-Levendusky-Malhotra and Boxell-Gentzkow-Shapiro literatures. Agents may **not** litigate this. They may litigate the *magnitude* or the *measurement validity* only insofar as it bears on causal estimates.
- **Polarization outside the US.** Cross-national evidence is admissible as comparison data but the claim is US-scoped.
- **Misinformation as such.** The misinformation literature is adjacent. It enters the deliberation only when arguments about misinformation explicitly link to algorithmic curation as the propagation mechanism (e.g. ranking incentives → engagement-bait → false content uplift → polarization).
- **Section 230 / regulation policy questions.** Normative-policy claims about what should be done are out of scope for *this* deliberation. The deliberation is about a causal-empirical question; policy is for a separate run.
- **Pre-2012 polarization causes** (cable news, talk radio, partisan sorting). Admissible as background and as confounders, but not as the primary explanandum.

---

## Evidence types in scope

- **Experimental:** Field experiments randomizing feed exposure (Bail 2018; Allcott et al. 2020; Guess et al. 2023 ×2; Nyhan et al. 2023; Levy 2021).
- **Platform-internal data releases:** Twitter algorithmic amplification study (Huszár et al. 2022); Meta-academic 2020 election partnership (the four 2023 *Science* papers); leaked internal documents where independently verified.
- **Observational with credible identification:** Boxell-Gentzkow-Shapiro 2017 / 2024; Lorenz-Spreen et al. 2023 cross-national.
- **Meta-analyses and systematic reviews:** any peer-reviewed, post-2018, on social-media-polarization causal questions.
- **Skeptical / null-result literature:** Prior 2013; Gentzkow-Shapiro lineage; the "minimal effects" tradition.
- **Policy-impact evaluations:** DSA-mandated risk assessments; Australian News Media Bargaining Code studies; EU disinformation Code of Practice evaluations — admissible as quasi-experimental natural experiments.

---

## Evidence types out of scope

- **Op-eds, blog posts, magazine essays** — not primary evidence even when authored by domain experts. Acceptable only as citation of an expert's *position*, not as evidence for that position.
- **Single-anecdote case studies** (one whistleblower, one viral event) — not evidence for population-level causal claims.
- **Partisan think-tank reports** without independent peer review or replication. The lab-of-origin must be willing to share data and code.
- **Pre-prints** without at least one independent reanalysis or established author track record on the methodology in question.
- **AI-generated literature reviews** or citations the agent cannot independently verify against the bound corpus.

---

## What counts as "established" vs "contested" within the framing

This is the **rubric the Concession Tracker uses** when evaluating whether an advocate's position has moved.

### Established within the framing (advocates may rely on without re-arguing)

- Affective polarization in the US has risen substantially between 2012 and 2024 (Iyengar et al. 2019; Boxell et al. 2024).
- Algorithmic ranking on the in-scope platforms is engagement-optimizing, with engagement signals correlated with in-group affirmation and out-group hostility (Brady et al. 2017; Rathje et al. 2021).
- People self-select into informational environments (homophily) independently of any platform algorithm (Gentzkow-Shapiro lineage).
- The single largest individual-level predictor of affective polarization is partisan identity strength (Iyengar-Lelkes-Westwood-Levendusky-Malhotra meta-review).

### Contested within the framing (the deliberation's actual substance)

- Whether algorithmic ranking *causes* polarization beyond the homophily baseline.
- Whether removing or substantially modifying algorithmic ranking *would* reduce polarization (the counterfactual).
- The relative magnitude of platform-algorithmic effects vs. background drivers (cable TV, partisan elites, demographic sorting).
- Whether platform-internal experiments generalize beyond the experimental window and to non-volunteer populations.
- Whether short-term feed manipulations (the 1–6 week experimental designs) can identify long-term causal effects.

### Stipulated as non-evidence within the framing

- An advocate's intuition or unsupported assertion ("it's obvious that…").
- An expert's position without citation to the evidence backing the position.
- A real-world event used as a single data point ("look at January 6").
- Industry self-reports about platform changes ("we removed feature X and engagement on hostile content went down by Y%") unless independently auditable.

---

## Acceptance test (run before Phase 1 starts)

The author and one other reader independently apply the framing to these 10 borderline claims. Target: agree on ≥ 9/10.

| # | Claim | Expected verdict | Reason |
|---|---|---|---|
| 1 | "Algorithmic ranking on TikTok in 2024 amplifies extreme political content." | **In-scope** | Platform in scope, time in scope, and the "amplification" causal claim is exactly what the deliberation is about. |
| 2 | "Adolescent self-harm rates rose with smartphone adoption." | **Out-of-scope** | Different outcome and population. The Haidt-Twenge debate. |
| 3 | "Brexit was caused by Facebook ads." | **Out-of-scope** | Non-US, single event, and the outcome (vote outcome) is not affective polarization. |
| 4 | "Twitter's reverse-chronological timeline option, when chosen, reduces affective polarization vs. the algorithmic timeline." | **In-scope** | Platform in scope, outcome in scope, and the comparison is exactly the counterfactual the deliberation cares about. |
| 5 | "Cable news polarized Americans before social media did." | **Borderline → In-scope as a confounder argument** | Pre-2012 causes are admissible as confounders. An advocate may argue "platform effects are small *because* the cable-TV mechanism dominates." |
| 6 | "Russia's 2016 election interference operation polarized US voters via Facebook." | **Borderline → In-scope** | Algorithmic propagation mechanism is in scope. But evidence quality requirements are stringent and most assertions of large effect size will fail the framing's "significant causal factor" bar. |
| 7 | "Section 230 should be reformed." | **Out-of-scope** | Normative-policy claim. Different deliberation. |
| 8 | "Facebook's 2018 'meaningful social interactions' algorithm change increased exposure to outrage content." | **In-scope** | Platform in scope, mechanism in scope, evaluable against algorithmic-amplification literature. |
| 9 | "American politicians have become more ideologically extreme since 2010." | **Out-of-scope as an outcome** | Elite polarization is a different construct from affective polarization. May be admitted as a confounder/upstream cause, not as evidence the central claim is true. |
| 10 | "Cross-national studies show that countries with more social media use do not have more polarization." | **In-scope** | Lorenz-Spreen et al. 2023 territory. Directly bears on the central causal claim. |

If readers diverge on more than one verdict (i.e. < 9/10 agreement), revise the framing — usually by tightening the operational definitions or expanding the "established vs. contested" rubric — and re-test.

---

## Pinned references (for the framing itself, not the experiment's evidence corpus)

- Iyengar, S., Lelkes, Y., Levendusky, M., Malhotra, N., & Westwood, S. J. (2019). The origins and consequences of affective polarization in the United States. *Annual Review of Political Science*.
- Boxell, L., Gentzkow, M., & Shapiro, J. M. (2024). Cross-country trends in affective polarization.
- Bail, C. A. (2018). Exposure to opposing views on social media can increase political polarization. *PNAS*.
- Guess, A. M., Malhotra, N., Pan, J., Barberá, P., Allcott, H., Brown, T., et al. (2023). [The four Meta-academic papers in *Science* / *Nature*.]
- Huszár, F., Ktena, S. I., O'Brien, C., Belli, L., Schlaikjer, A., & Hardt, M. (2022). Algorithmic amplification of politics on Twitter. *PNAS*.

These are *not* the experiment's evidence corpus. The corpus is in `evidence/sources.csv` and is hand-curated separately. References here are only what the framing document itself rests on.
