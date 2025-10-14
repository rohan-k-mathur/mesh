// components/dialogue/command-card/types.ts
// Dialogical primitives
export type Force = 'ATTACK' | 'SURRENDER' | 'NEUTRAL';
export type Relevance = 'likely' | 'unlikely' | null;

export type ProtocolKind =
  | 'WHY'
  | 'GROUNDS'
  | 'CONCEDE'
  | 'RETRACT'
  | 'CLOSE'
  | 'ACCEPT_ARGUMENT';

export type ScaffoldKind =
  | 'FORALL_INSTANTIATE'   // ∀
  | 'EXISTS_WITNESS'       // ∃
  | 'PRESUP_CHALLENGE'     // presupposition
  | 'DEFAULT_RULE_SCAFFOLD';

export type CommandKind = ProtocolKind | ScaffoldKind;

export type TargetRef = {
  deliberationId: string;
  targetType: 'argument' | 'claim' | 'card';
  targetId: string;
  locusPath?: string | null; // for CLOSE (†) / locus-aware moves
};

// The action shown in the 3×3 grid
export interface CommandCardAction {
  id: string;                // stable key, e.g. 'why-forall' or 'close'
  kind: CommandKind;
  label: string;             // UX label ("WHY — ∀‑instantiate", "Close (†)")
  hotkey?: string;           // 'Q','W','E','A','S','D','Z','X','C'
  icon?: React.ReactNode;    // optional
  force: Force;
  disabled?: boolean;
  reason?: string;           // why disabled
  relevance?: Relevance;

  // One of these executes the action:
  // A) protocol move (server-side)
  move?: {
    kind: ProtocolKind;
    payload?: Record<string, any>; // e.g., { cqId, locusPath }
    postAs?: TargetRef;            // rare: accept-argument requires argument target
  };

  // B) scaffold (client-side insert into composer)
  scaffold?: {
    template: string;           // text dropped into composer at caret
    analyticsName?: string;     // 'scaffold:forall'
  };

  // Context (for server call) — provided by parent
  target: TargetRef;

  // Optional UX tags
  tone?: 'primary' | 'danger' | 'ghost';
  group?: 'top' | 'mid' | 'bottom'; // place in the 3×3 grid row
}

export interface CommandCardProps {
  actions: CommandCardAction[];           // already filtered for current selection
  onPerform: (a: CommandCardAction) => void; // called when user triggers (click/hotkey)
  variant?: 'compact' | 'full';
  showHotkeyHints?: boolean;
}

// Q W E   → WHY / GROUNDS / CLOSE (†)
// A S D   → CONCEDE / RETRACT / ACCEPT ARGUMENT
// Z X C   → ∀‑instantiate / ∃‑witness / Presupposition?
