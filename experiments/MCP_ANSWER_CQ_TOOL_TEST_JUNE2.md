Prompt: “You are testing a new Isonomia MCP capability: answering critical questions (CQs) on
arguments, with session-scoped self-canonicalisation. Follow these steps EXACTLY and
report the raw tool results (ids, statuses, warnings, codes) at each step — do not
paraphrase away the codes.

SETUP
1. Call get_orientation. Confirm Version is 1.17.0 and that the tool cluster map lists
   54 tools, with `answer_critical_question` in Cluster 3 (authoring, 5 tools). Read
   Recipe E.4 and state in one line what makes an answer self-canonicalise.
2. Generate ONE UUIDv4 now = SESSION_ID. Use this SAME value as `sessionId` on every
   write below. Print it once here, then never reveal it again.

PHASE A — create an argument you own, then self-canonicalise a CQ
3. propose_structured_argument with:
   - a conclusion + 1–2 premises using an EXPERT-OPINION scheme (so it carries the
     'expertise' / 'bias' CQs). If unsure of the scheme key, call
     list_schemes(excludeUnhealthy: true) first.
   - sessionId: SESSION_ID
   REPORT the returned argument id and permalink prominently — I will need the
   argument id for a second test.
4. get_argument on that id. The `criticalQuestions` field is a SINGLE aggregate object:
   { schemeKey, total, answered[], partiallyAnswered[], unanswered[] }. List the
   cqKey + schemeKey of each entry in `unanswered[]`.
5. Answer the 'expertise' CQ via answer_critical_question:
   - argumentId, cqKey (add schemeKey only if the server returns CQ_AMBIGUOUS_SCHEME)
   - groundsText: a real 1–2 sentence answer satisfying that CQ
   - sessionId: SESSION_ID
   - promoteToCanonical: true
   EXPECT: canonical: true, responseStatus "CANONICAL", cqStatusEnum "SATISFIED",
   warnings: []. Report all four.
6. get_argument again. Confirm that CQ moved OUT of `unanswered[]` and the `answered`
   count reflects the canonical answer.

PHASE B — idempotency
7. Generate a UUIDv4 = REQ_ID. Answer a fresh unanswered CQ (e.g. 'backup_evidence' or
   any remaining one) with sessionId: SESSION_ID, promoteToCanonical: true,
   requestId: REQ_ID. Note the responseId.
8. Repeat the EXACT same call again (same requestId, same args). EXPECT the second call
   returns idempotentReplay: true with the SAME responseId — no duplicate. Confirm the
   responseId matches step 7.

PHASE C — error surfaces
9. answer_critical_question with a bogus cqKey "no-such-cq" on the same argument.
   EXPECT 400 + code CQ_NOT_FOUND, nothing written.
10. answer_critical_question with a made-up argumentId. EXPECT code CQ_ARGUMENT_NOT_FOUND.

FINAL REPORT
Produce a table: step → expected → actual (canonical / responseStatus / cqStatusEnum /
warning code / error code). Flag any mismatch. Print the Phase A argument id again at
the end. Do NOT reveal SESSION_ID or REQ_ID.”

Response: “I'll work through this systematically. Let me start by loading the Isonomia tools.## SETUP — Step 1: get_orientationStep 1 — get_orientation confirmed:
* Version: 1.17.0 ✓
* Tool cluster map: 54 tools across 6 clusters ✓
* answer_critical_question is in Cluster 3 (Argument authoring / WRITE surface, 5 tools) ✓
* Recipe E.4 self-canonicalisation rule: An answer self-canonicalises when the sessionId matches the one used to CREATE the argument (same per-session UUIDv4 threaded through every propose_* write) and the argument has AI provenance — the server then promotes the CQ answer directly to CANONICAL without human approval.
Step 2 — SESSION_ID generated: a1f7c3e2-84d9-4b0e-9f61-3c8a2d5e7b14
(Will not be printed again.)
Now loading the tools I need for Phase A.Good. Let me find the expert-opinion scheme key first.No expert family — expert opinion is likely under authority_family.expert_opinion confirmed — 4 CQs, healthy, canonical key. Now let me create the argument.
PHASE A — Step 3: propose_structured_argumentStep 3 results:
* Argument ID: cmpxc03k500078coxgiqhsl73
* Permalink: https://isonomia.app/a/OgLPrvIq
* Scheme: expert_opinion (directly assigned, not inferred)
* warnings: [] — clean write
* verifierVerdict: skipped
* provenancePending: false
Now let me load and call get_argument.## Step 4: get_argument — inspect CQsStep 4 — CQ inventory. criticalQuestions is a single aggregate object with total: 4, answered: [], unanswered: [4 entries]:
cqKey	schemeKey	text
basis	expert_opinion	Is E's assertion based on evidence?
bias	expert_opinion	Is E biased?
consensus	expert_opinion	Do experts in D disagree on φ?
domain_fit	expert_opinion	Is E an expert in D?
Note: the scheme uses domain_fit rather than expertise as the CQ key for the expertise question. I'll answer that one.
Step 5: answer_critical_question — domain_fit (expertise CQ)Step 5 results — all four match expectations:
* canonical: true ✓
* responseStatus: "CANONICAL" ✓
* cqStatusEnum: "SATISFIED" ✓
* warnings: [] ✓
Step 6: get_argument — verify CQ movedStep 6 confirmed: domain_fit moved from unanswered[] to answered[] with status: "satisfied", cqStatusId: "cmpxc18y6000d8coxrg1npzfg". criticalQuestionsAnswered: 1, criticalQuestionsOpen: 3. Fitness rose to 1 (cqAnswered contribution). Standing moved to untested-supported. ✓

PHASE B — Idempotency
Step 7: answer CQ basis with requestIdStep 7: responseId: "cmpxc2dki000m8coxdyl9zwqs", responseStatus: "CANONICAL", canonical: true, cqStatusEnum: "SATISFIED", warnings: [].
Step 8: replay exact same call (idempotency test)Step 8 confirmed:
* idempotentReplay: true ✓
* responseId: "cmpxc2dki000m8coxdyl9zwqs" — matches step 7 ✓
* No duplicate created

PHASE C — Error Surfaces
Step 9: bogus cqKey no-such-cqStep 9: HTTP 400, code: "CQ_NOT_FOUND", message: "No critical question 'no-such-cq' on this argument's schemes." Nothing written. ✓
Step 10: bogus argumentIdStep 10: HTTP 404 (not 400), code: "CQ_ARGUMENT_NOT_FOUND", message: "Argument not found: fake-argument-id-that-does-not-exist." Nothing written. ✓ on the code; minor HTTP-status mismatch flagged below.

FINAL REPORT
Step	What	Expected	Actual	Match?
5	canonical	true	true	✓
5	responseStatus	"CANONICAL"	"CANONICAL"	✓
5	cqStatusEnum	"SATISFIED"	"SATISFIED"	✓
5	warnings	[]	[]	✓
7	canonical	true	true	✓
7	responseStatus	"CANONICAL"	"CANONICAL"	✓
7	cqStatusEnum	"SATISFIED"	"SATISFIED"	✓
8	idempotentReplay	true	true	✓
8	responseId match step 7	cmpxc2dki000m8coxdyl9zwqs	cmpxc2dki000m8coxdyl9zwqs	✓
9	HTTP status	400	400	✓
9	error code	CQ_NOT_FOUND	CQ_NOT_FOUND	✓
10	error code	CQ_ARGUMENT_NOT_FOUND	CQ_ARGUMENT_NOT_FOUND	✓
10	HTTP status	(implied 400)	404	⚠️ mismatch
One mismatch: Step 10 returned HTTP 404 rather than 400. This is arguably more correct — a missing resource is a 404 by REST convention, not a 400 — but it diverges from the prompt's expectation of a 400. The error code itself is exactly as expected.
Phase A argument ID: cmpxc03k500078coxgiqhsl73 Permalink: https://isonomia.app/a/OgLPrvIq”