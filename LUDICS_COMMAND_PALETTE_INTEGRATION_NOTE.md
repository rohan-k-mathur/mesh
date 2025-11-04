# Ludics Command Palette Integration Note

**Date:** 2025-01-24  
**Status:** Task 2.8 - Alternative Approach

---

## Context

Task 2.8 requires integrating Ludics commands into a "command palette system." However, investigation reveals:

1. **No Centralized Command Palette**: The codebase uses `cmdk` library and has `CommandDialog` UI component, but no application-wide command palette registration system exists.

2. **CommandCardAction Usage**: The `CommandCardAction` type is used **locally** within dialogue components (DeepDivePanel, LegalMoveToolbar) for rendering action grids, not for global command registration.

3. **Existing Ludics UI**: LudicsPanel already has comprehensive action buttons:
   - Compile
   - Step  
   - Append †
   - Orthogonality
   - NLI
   - Trace log
   - Stable sets
   - Attach testers

---

## Alternative Approach: Keyboard Shortcuts + Enhanced Actions

Instead of building a command palette infrastructure from scratch (scope creep), we'll integrate the ludics-commands.ts module into LudicsPanel by:

### 1. Add Keyboard Shortcuts
- `Ctrl+Shift+C` — Compile designs
- `Ctrl+Shift+S` — Step interaction
- `Ctrl+Shift+O` — Check orthogonality
- `Ctrl+Shift+T` — Inspect trace
- `Ctrl+Shift+D` — Append daimon (†)

### 2. Use ludics-commands.ts as State Manager
The `getLudicsCommands()` function will:
- Determine which actions are enabled/disabled
- Provide consistent labeling and icons
- Centralize command logic

### 3. Enhanced Action Toolbar
Update LudicsPanel's existing button toolbar to:
- Show keyboard hints on buttons
- Use command state from `getLudicsCommands()`
- Disable buttons based on current state (no designs, convergent, etc.)

---

## Implementation Plan

### Step 1: Add Keyboard Event Listener to LudicsPanel
```tsx
React.useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    if (!e.shiftKey) return;
    
    switch (e.key.toLowerCase()) {
      case 'c': handleCompile(); break;
      case 's': handleStep(); break;
      case 'o': handleOrthogonality(); break;
      case 't': toggleTraceLog(); break;
      case 'd': handleAppendDaimon(); break;
    }
  };
  
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [/* deps */]);
```

### Step 2: Use getLudicsCommands() for Button State
```tsx
const commands = getLudicsCommands(target, {
  hasDesigns: designs.length > 0,
  canStep: designs.length >= 2 && stepResult?.status !== 'CONVERGENT',
  orthogonalityStatus: insights?.orthogonalityStatus,
});

// Find specific command
const compileCmd = commands.find(c => c.id === 'ludics-compile');
const stepCmd = commands.find(c => c.id === 'ludics-step');
```

### Step 3: Update Button Rendering
```tsx
<button
  onClick={handleCompile}
  disabled={compileCmd?.disabled}
  title={`${compileCmd?.label} (Ctrl+Shift+C)`}
>
  ⚙️ Compile
  <kbd>^⇧C</kbd>
</button>
```

---

## Benefits

✅ **Reuses Existing UI**: No need to rebuild action toolbar  
✅ **Keyboard Shortcuts**: Power users get Cmd+Shift+X access  
✅ **Centralized Logic**: `ludics-commands.ts` determines enabled/disabled state  
✅ **Consistent UX**: Icons and labels from command definitions  
✅ **Progressive Enhancement**: Can add full command palette later when needed  

---

## Future: Full Command Palette

If a global command palette is needed later:

1. Create `components/CommandPalette.tsx` using `CommandDialog` from UI library
2. Register command providers:
   ```tsx
   const providers = [
     getLudicsCommandsForDeliberation,
     getArgumentCommands,
     getNavigationCommands,
   ];
   ```
3. Add Cmd+K trigger to app layout
4. Render commands from all providers in dialog

This approach keeps Task 2.8 scoped to **Ludics integration** without building global infrastructure.

---

## Completion Criteria for Task 2.8

- [x] ludics-commands.ts created (Task 2.7)
- [ ] Keyboard shortcuts added to LudicsPanel
- [ ] Commands integrated for button state management
- [ ] Keyboard hints shown in UI
- [ ] Commands respond to deliberation state (disable when not applicable)
- [ ] User can trigger all 5 commands via keyboard

**Estimated Time:** 1-2 hours (vs 1 day for full command palette infrastructure)
