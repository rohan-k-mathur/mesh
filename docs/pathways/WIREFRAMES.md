# Pathways UI Wireframes

Status: Draft v0.1 (A0 deliverable, in-repo wireframes)
Parent: [docs/DelibDemocracyScopeA_Roadmap.md](../DelibDemocracyScopeA_Roadmap.md)
API contract: [docs/pathways/API.md](API.md)

These ASCII wireframes are intentionally low-fidelity. They lock layout intent, key affordances, and information density before any component code is written. Visual design (typography, color, motion) is out of scope here.

Conventions:
- `[ Button ]` rectangular CTA
- `( Tab )` navigation tab
- `< select >` dropdown
- `{ field }` input field
- `| ... |` panel/card boundary
- `*` indicates active/selected state

---

## Surface 1: PacketBuilder

Where: `/deliberations/[id]/pathways/[pathwayId]/packet`
Used by: deliberation host, facilitator, designated submitter.
Goal: Compose, reorder, annotate, and submit a recommendation packet.

```
+------------------------------------------------------------------------------+
| Deliberation: Transit Equity Policy           ( Overview )( Map )( *Pathways )|
+------------------------------------------------------------------------------+
| Pathway: Springfield City Council  > Packet v2 (DRAFT)                       |
| Status: DRAFT     Last saved: 2 min ago         [ Discard draft ] [ Submit ] |
+------------------------------------------------------------------------------+
|                                                                              |
| Title:    { Initial recommendations on transit equity                      } |
| Summary:  { Synthesis of converging arguments from the climate and equity  } |
|           { panels.                                                         } |
|                                                                              |
+--------------------------------+ +-------------------------------------------+
| Items (4)              [ + Add ] | Add item                                  |
|--------------------------------| |-------------------------------------------|
| 1. ARGUMENT                    | | Source:   < From this deliberation >      |
|    "Equity-weighted transit    | | Type:     < ARGUMENT >                    |
|     allocation reduces..."     | | Search:   { transit equity              } |
|    Commentary: strongest empir | |                                           |
|    [ edit ] [ remove ] [ ^ ][v]| | Results:                                  |
|                                | | [+] Argument: "Equity-weighted..."        |
| 2. CLAIM                       | | [+] Claim:    "Service frequency..."      |
|    "Service frequency is..."   | | [+] Citation: "Transit Equity Toolkit"    |
|    [ edit ] [ remove ] [ ^ ][v]| |                                           |
|                                | | Commentary: { optional context...       } |
| 3. CITATION                    | |                                           |
|    "Transit Equity Toolkit..." | | [ Cancel ]              [ Add to packet ] |
|    [ edit ] [ remove ] [ ^ ][v]| |                                           |
|                                | +-------------------------------------------+
| 4. NOTE                        |
|    "Excluded the rural..."     |
|    [ edit ] [ remove ] [ ^ ][v]|
+--------------------------------+

Footer: Snapshot preview will be generated at submit. 4 items, 2 arguments,
1 claim, 1 citation. Estimated reading time 6 min.
```

Submit modal:

```
+------------------------------------------------------------------------------+
|  Submit packet v2 to Springfield City Council                          [ x ] |
+------------------------------------------------------------------------------+
|  This will:                                                                  |
|    - Freeze all 4 items into immutable snapshots.                            |
|    - Record a SUBMITTED event with hash chain.                               |
|    - Notify Springfield City Council via in-platform channel.                |
|                                                                              |
|  Channel:    < in_platform >                                                 |
|  External ref (optional): { _____________________________________________ }  |
|                                                                              |
|  Snapshot diff vs v1:                                                        |
|    + Added: 2 items                                                          |
|    - Removed: 1 item                                                         |
|    ~ Reordered: 3 items                                                      |
|                                                                              |
|  [ Cancel ]                                          [ Confirm and submit ]  |
+------------------------------------------------------------------------------+
```

Key affordances:
- Drafts auto-save.
- Items show `kind` badge, target preview, commentary, reorder controls.
- Submit modal surfaces snapshot impact and channel choice explicitly.

---

## Surface 2: PathwayTimeline

Where: `/deliberations/[id]/pathways/[pathwayId]`
Used by: deliberation participants, observers, and (if `isPublic`) the public.
Goal: Make the institutional accountability arc visible at a glance.

```
+------------------------------------------------------------------------------+
| Springfield City Council  <-  Transit Equity Deliberation                    |
| Status: AWAITING RESPONSE     Opened: Apr 21       Public: yes [open]        |
+------------------------------------------------------------------------------+
| Metrics:  Ack latency 24h | Response latency 14d (median)                    |
|           Item disposition coverage 83%                                      |
+------------------------------------------------------------------------------+
| Filters:  ( All ) ( Submissions ) ( Responses ) ( Revisions )                |
|           Hash chain: VALID  [ verify ]                                      |
+------------------------------------------------------------------------------+
|                                                                              |
|  --- Round 2 (current) -----------------------------------------------------  |
|                                                                              |
|  o  May 2  RESPONSE_RECEIVED                                                 |
|  |     by: Council Clerk (verified) via formal_intake                        |
|  |     "Adopted 4 of 7 recommendations; 2 deferred."                         |
|  |     Items: 4 ACCEPTED, 1 REJECTED, 2 DEFERRED                             |
|  |     [ view dispositions ]                                                 |
|  |                                                                           |
|  o  Apr 28  ACKNOWLEDGED                                                     |
|  |     by: Council Clerk                                                     |
|  |                                                                           |
|  o  Apr 24  SUBMITTED  (Packet v2)                                           |
|  |     by: facilitator J. Doe                                                |
|  |     7 items   [ view snapshot ]                                           |
|  |                                                                           |
|  --- Round 1 ---------------------------------------------------------------  |
|                                                                              |
|  o  Apr 22  REVISED                                                          |
|  |                                                                           |
|  o  Apr 18  RESPONSE_RECEIVED                                                |
|  |     "Returned with feedback; 3 items modified."                           |
|  |                                                                           |
|  o  Apr 15  SUBMITTED  (Packet v1)   [ view snapshot ]                       |
|  |                                                                           |
|  o  Apr 14  DRAFT_OPENED                                                     |
|                                                                              |
+------------------------------------------------------------------------------+
```

Hash chain badge: clicking [verify] runs the client-side verifier against the event feed and shows pass/fail.

---

## Surface 3: InstitutionProfile

Where: `/institutions/[slug]`
Used by: facilitators, observers, public (read-only).
Goal: Single view of an institution's accountability footprint.

```
+------------------------------------------------------------------------------+
| Springfield City Council                              [legislature] verified |
| Jurisdiction: US-IL-Springfield   Contact: clerk@springfield.gov             |
+------------------------------------------------------------------------------+
| ( *Pathways )( Members )( Response history )( About )                        |
+------------------------------------------------------------------------------+
|                                                                              |
| Active pathways (3)                                                          |
|------------------------------------------------------------------------------|
| > Transit Equity Policy            AWAITING_RESPONSE   Packet v2  Apr 24     |
| > Public Library Funding           IN_REVISION         Packet v3  Apr 19     |
| > Climate Resilience Plan          OPEN                Packet v1  Apr 12     |
|                                                                              |
| Closed pathways (12)                                  [ show all ]           |
|                                                                              |
+------------------------------------------------------------------------------+
| Aggregate metrics (last 12 months)                                           |
|------------------------------------------------------------------------------|
| Submissions received:           17                                           |
| Median ack latency:             1d 6h                                        |
| Median response latency:        13d                                          |
| Item disposition coverage:      71%                                          |
| Acceptance rate:                42%                                          |
| Rejection rate:                 23%                                          |
| Deferral rate:                  18%                                          |
+------------------------------------------------------------------------------+
```

---

## Surface 4: ResponseIntake

Where: `/pathways/[id]/respond`
Used by:
- Verified `InstitutionMember` for in-platform authoring.
- Facilitator for assisted intake (off-platform response transcribed in).

Goal: Capture a structured response with per-item dispositions.

```
+------------------------------------------------------------------------------+
| Respond to Packet v2 - Transit Equity Recommendations                        |
| Recipient: Springfield City Council                                          |
+------------------------------------------------------------------------------+
| Authored by: < J. Clerk (verified member) >                                  |
| Channel:     < formal_intake >                                               |
| External ref:{ Resolution 2026-114                                       }   |
| Responded at:{ 2026-05-10T14:30                                           }  |
+------------------------------------------------------------------------------+
|                                                                              |
| Disposition summary:                                                         |
| { Adopted 4 of 7 recommendations; 2 deferred pending budget review.       }  |
|                                                                              |
| Overall response status: < PARTIAL >                                         |
|                                                                              |
+------------------------------------------------------------------------------+
| Per-item dispositions  (7 items, 4 dispositioned, 3 remaining)               |
|------------------------------------------------------------------------------|
|                                                                              |
| 1. ARGUMENT "Equity-weighted transit allocation..."                          |
|    Disposition: < ACCEPTED >                                                 |
|    Rationale:  { Aligns with committee priorities.                       }   |
|    Evidence:   [ + add citation ]                                            |
|                                                                              |
| 2. CLAIM "Service frequency is the primary equity lever..."                  |
|    Disposition: < REJECTED >                                                 |
|    Rationale:  { Cost projection exceeded available appropriation.       }   |
|    Evidence:   [ FY26 budget brief (https://...) ] [ + ]                     |
|                                                                              |
| 3. CITATION "Transit Equity Toolkit..."                                      |
|    Disposition: < NO_RESPONSE >                                              |
|                                                                              |
| 4. NOTE "Excluded the rural..."                                              |
|    Disposition: < DEFERRED >                                                 |
|    Rationale:  { Pending county-level coordination.                      }   |
|                                                                              |
| 5. ARGUMENT (not yet dispositioned)                          [ disposition ] |
| 6. CLAIM    (not yet dispositioned)                          [ disposition ] |
| 7. CLAIM    (not yet dispositioned)                          [ disposition ] |
|                                                                              |
+------------------------------------------------------------------------------+
| [ Save draft ]                                       [ Submit response ]     |
+------------------------------------------------------------------------------+
```

Validation rules surfaced inline:
- Submitting requires at least one item dispositioned (else 422).
- `responseStatus = COMPLETE` requires every item dispositioned (warning if not).
- `channel != in_platform` requires `externalReference`.

---

## Cross-surface affordances

Pathway badges on existing claim/argument cards:

```
+------------------------------------------------------------+
| Argument: "Equity-weighted transit allocation reduces..."  |
| confidence 0.82  by participant_27                         |
| [pathway]  Submitted in Packet v2 to Springfield City      |
|            Council (AWAITING_RESPONSE)                     |
| [pathway]  Disposition: ACCEPTED in Round 1                |
+------------------------------------------------------------+
```

Plexus visualization additions:

```
   .--------.                      .------------.
   | Delib  |---institutional---->| Institution |
   | Climate|     pathway         |  Springfield|
   '--------'                      '------------'
        ^                                 |
        |                                 |
        '---------pathway_response--------'
                  (status: PARTIAL,
                   acceptedRatio: 0.57)
```

Institution nodes use a distinct shape (square or hex) and color from deliberation nodes (circle). When `Institution.linkedDeliberationId` is set, render as a fused node with a small inset circle to indicate the dual identity.

---

## Open UX questions for review

These do not block A0 sign-off but should be resolved before A3 implementation:

1. Should the PacketBuilder support drag-and-drop reorder in addition to up/down arrows?
2. Should the PathwayTimeline collapse old rounds by default once a new round opens?
3. Should the InstitutionProfile expose member contact info publicly, or only to facilitators?
4. Should the ResponseIntake offer an "import from email" parser as a Phase A4 add-on?
