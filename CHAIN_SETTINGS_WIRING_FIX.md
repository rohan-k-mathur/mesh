# Chain Settings Wiring Fix

## Issue Discovered

**Problem:** The Chain Settings panel (`ChainMetadataPanel`) was displaying default values instead of the actual chain's saved settings when users opened the Argument Chain Canvas.

**Root Cause:** The `ArgumentChainCanvas` component only initialized the `chainId` in the Zustand store but never fetched the actual chain metadata (`chainName`, `chainType`, `isPublic`) from the API.

### Data Flow Before Fix

```
1. User opens ArgumentChainCanvas
2. Canvas calls setChainMetadata({ chainId }) - only sets ID
3. Canvas fetches /api/argument-chains/{chainId}/nodes - only returns nodes/edges
4. Store has: { chainId: "xxx", chainName: "", chainType: "SERIAL", isPublic: false }
5. ChainMetadataPanel reads from store → shows default values
6. User sees empty name, "SERIAL" type, and unchecked "public" regardless of actual data
```

## Fix Applied

**File Modified:** `components/chains/ArgumentChainCanvas.tsx`

**Change:** Added a fetch to the main chain API endpoint before loading nodes/edges, to populate the store with actual chain metadata.

### Code Change

```typescript
// Before (lines 118-125)
const loadChain = async () => {
  setIsLoading(true);
  try {
    // Load nodes and edges
    const response = await fetch(`/api/argument-chains/${chainId}/nodes`);
    // ...
  }
}

// After (lines 118-135)
const loadChain = async () => {
  setIsLoading(true);
  try {
    // Load chain metadata first
    const chainResponse = await fetch(`/api/argument-chains/${chainId}`);
    if (chainResponse.ok) {
      const { chain } = await chainResponse.json();
      // Populate store with chain metadata for ChainMetadataPanel
      setChainMetadata({
        chainId,
        chainName: chain.name || "",
        chainType: chain.chainType || "SERIAL",
        isPublic: chain.isPublic || false,
      });
    }

    // Load nodes and edges
    const response = await fetch(`/api/argument-chains/${chainId}/nodes`);
    // ...
  }
}
```

### Data Flow After Fix

```
1. User opens ArgumentChainCanvas
2. Canvas calls setChainMetadata({ chainId }) - initial ID only
3. Canvas fetches /api/argument-chains/{chainId} - returns full chain with metadata
4. Canvas calls setChainMetadata({ chainId, chainName, chainType, isPublic })
5. Store now has: { chainId: "xxx", chainName: "My Chain", chainType: "CONVERGENT", isPublic: true }
6. ChainMetadataPanel reads from store → shows actual chain values
7. ChainMetadataPanel's useEffect syncs local state with store values
8. User sees correct name, type, and public status
```

## Components Involved

| Component | Role | Status |
|-----------|------|--------|
| `ArgumentChainCanvas.tsx` | Loads chain data, populates store | **Fixed** |
| `ChainMetadataPanel.tsx` | UI for editing chain settings | ✅ Working (reads from store) |
| `chainEditorStore.ts` | Zustand store for chain state | ✅ Working (has setChainMetadata action) |
| `/api/argument-chains/[chainId]/route.ts` | GET returns full chain, PATCH updates | ✅ Working |
| `/api/argument-chains/[chainId]/nodes/route.ts` | GET returns only nodes/edges | N/A (doesn't need chain metadata) |

## Testing

To verify the fix works:

1. Open an existing argument chain in the canvas
2. Click the "Chain Settings" button (gear icon)
3. Verify the panel shows:
   - The correct chain name (not empty)
   - The correct chain type (not always "SERIAL")
   - The correct public status (matches what was saved)
4. Make changes and save
5. Refresh the page
6. Verify the saved values persist correctly

## Date

Fixed: 2024 (during Phase 4A/4B integration work)
