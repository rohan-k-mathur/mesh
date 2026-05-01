# Protocol (PPD)

**Core move kinds**: WHY (attack), GROUNDS (answer), ASSERT(as=CONCEDE) (surrender), RETRACT (surrender), CLOSE (†).

**Invariants**
- R4: No duplicate reply to the same target/locus/key.
- R5: No attacks on surrendered/closed targets.
- R7: If a WHY on φ was answered by GROUNDS, you cannot “Concede φ” directly; you must **Accept the argument** (i.e., concede the *answer to WHY*).

**Turn model**
- After the opening exchange, both parties have the turn (no “simultaneous speech”: concurrent posts are serialized).
- Termination: a turn-holder with no legal move ends the dialogue.

**Public semantics**
- All checks depend only on the public record.

See `/api/dialogue/legal-moves` (advice) and `/api/dialogue/move` (enforcement).
