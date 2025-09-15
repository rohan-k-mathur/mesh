# Dialogical Mode — Engine Preset & Checklist
**Version:** 2025-09-15

Use this beside your Ludics presets. Two presets:
- **dialogue:intuitionistic** = {{ SR0, SR1i, SR2, SR3 }}
- **dialogue:classical**      = {{ SR0, SR1c, SR2, SR3 }}

## TypeScript snippet
```ts
export type DialogicalPreset = 'dialogue:intuitionistic'|'dialogue:classical';
export interface EngineDialogicalPolicy {{
  kind: DialogicalPreset;
  repetitionRankP: number;
  repetitionRankO: number;
  enforceCopyCatSR2: boolean;
  lastDutyFirst: boolean; // enable for SR1i/SR1c scheduling
}}

export const PRESETS: Record<DialogicalPreset, Omit<EngineDialogicalPolicy,'repetitionRankP'|'repetitionRankO'>> = {{
  'dialogue:intuitionistic': {{ kind: 'dialogue:intuitionistic', enforceCopyCatSR2: true,  lastDutyFirst: true }},
  'dialogue:classical':      {{ kind: 'dialogue:classical',      enforceCopyCatSR2: true,  lastDutyFirst: true }},
}};
```

## Checklist
- [ ] **SR0**: UI to set ranks `n_O`, `n_P`; store on play start.
- [ ] **SR1i/SR1c**: scheduler enforces *react‑only*, ≤ `n` repeats, **Last‑Duty‑First**.
- [ ] **SR2**: gate **P‑atoms** unless previously uttered by **O** (per play).
- [ ] **SR3**: terminal condition when no legal move; attribute win to the other player.
- [ ] **Particle dispatcher**: ∧, ∨, →, ¬, ∀, ∃ prompts wired.
- [ ] **Validity (strategy)**: bounded search by ranks returns P‑strategy certificate.
- [ ] **Tests**: `(p ∧ q) ⊃ p` valid; `p ∨ ¬p` valid only in classical preset; SR2 negative test.
