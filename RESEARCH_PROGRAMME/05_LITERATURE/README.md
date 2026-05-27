# Literature Ingestion — Ritual

> This directory is the programme's literature memory. The two existing rounds
> (`LITERATURE_REVIEW_ROUND_1.md`, `LITERATURE_REVIEW_ROUND_2.md`) under
> [`../../Development and Ideation Documents/ARCHITECTURE/Ludics Generative Substrate Documents/`](../../Development%20and%20Ideation%20Documents/ARCHITECTURE/Ludics%20Generative%20Substrate%20Documents/)
> are *subsumed* by this directory: they remain in place as historical
> documents, and [`INGESTION_LOG.md`](INGESTION_LOG.md) consolidates their
> coverage so subsequent reads can be filed against a single index.

## The ritual

A paper enters the programme via three steps:

1. **Add a row to `INGESTION_LOG.md`** at the time the read begins:
   date, paper (full citation + DOI/URL), summariser handle, planned
   scope of read (full / abstract+conclusion / spot).
2. **Write notes.** Notes live either as a new entry appended to the
   appropriate Round file (for continuity with the existing reviews) or as
   a fresh file `NNNN-slug.md` in this directory if the paper opens
   substantive new territory. The ingestion log row points to wherever the
   notes ended up.
3. **Cross-link to programme entries.** The notes must list which open
   questions (`Q-NNN`), conjectures (`C-NNN`), theorems (`T-NNN`), or
   studies (`S-NNN`) the paper touches. If it touches none, that is
   itself a fact worth recording: the read becomes "wide reading,"
   flagged in the log as `scope: orientation`.

## How the programme tracks its own coverage

Coverage is read off the ingestion log and the cross-link tables. The
quarterly review ([`../08_QUARTERLY_REVIEW_TEMPLATE.md`](../08_QUARTERLY_REVIEW_TEMPLATE.md))
asks specifically: *which conjectures and questions have had no new
literature touch in the last quarter?* That set is the programme's reading
queue.

## Refusal

The programme will not cite a paper it has not read in full at least once.
A paper cited via a secondary source must either be promoted to read-in-full
or the citation must be replaced with the secondary source itself. The
ingestion log is the audit surface for this refusal.
