# Dialogue Testing Mode

## Overview

During development, it's inconvenient to create multiple user accounts just to test dialogue features. **Testing Mode** allows you to bypass author restrictions so you can have full dialogues with your own claims using a single account.

## What Testing Mode Does

When enabled, testing mode removes these restrictions:

1. ✅ **Challenge Your Own Claims** - WHY moves allowed on your own items
2. ✅ **Answer Your Own WHYs** - GROUNDS moves allowed from non-authors
3. ✅ **Full Self-Dialogue** - Complete challenge-response cycles with one account

**Production Behavior (Normal Mode):**
- ❌ Authors cannot challenge their own claims (WHY disabled)
- ❌ Non-authors cannot answer WHY challenges (GROUNDS disabled)
- ✅ Forces proper debate structure with multiple participants

## How to Enable

### Method 1: Environment Variable (Recommended)

Add to your `.env` or `.env.local` file:

```bash
DIALOGUE_TESTING_MODE=true
```

Then restart your dev server:

```bash
yarn dev
# or
npm run dev
```

### Method 2: Inline Override (Quick Test)

Temporarily hardcode in the source files:

**In `app/api/dialogue/legal-moves/route.ts` (line ~13):**
```typescript
const TESTING_MODE = true; // process.env.DIALOGUE_TESTING_MODE === 'true';
```

**In `lib/dialogue/legalMovesServer.ts` (line ~9):**
```typescript
const TESTING_MODE = true; // process.env.DIALOGUE_TESTING_MODE === 'true';
```

> ⚠️ **Remember to revert before committing!**

## How to Disable

### Remove from .env
Delete or comment out the line:

```bash
# DIALOGUE_TESTING_MODE=true
```

Or explicitly set to false:

```bash
DIALOGUE_TESTING_MODE=false
```

Then restart your server.

## Verification

### Check if Testing Mode is Active

1. Create a claim with your account
2. Look at the CommandCard or move chips
3. **Testing Mode ON**: "Challenge" button is **enabled** (you can click it)
4. **Testing Mode OFF**: "Challenge" button is **disabled** with tooltip "You cannot ask WHY on your own item"

### Console Verification

You can add a quick log to verify:

```typescript
console.log('🧪 DIALOGUE_TESTING_MODE:', process.env.DIALOGUE_TESTING_MODE);
```

## Files Modified

Testing mode is implemented in:

1. **`app/api/dialogue/legal-moves/route.ts`**
   - Line ~13: `const TESTING_MODE = process.env.DIALOGUE_TESTING_MODE === 'true';`
   - Line ~127: GROUNDS moves check `TESTING_MODE ? false : ...`
   - Line ~143: Generic WHY check `TESTING_MODE ? false : ...`

2. **`lib/dialogue/legalMovesServer.ts`**
   - Line ~9: `const TESTING_MODE = process.env.DIALOGUE_TESTING_MODE === 'true';`
   - Line ~87: GROUNDS moves check `TESTING_MODE ? false : ...`
   - Line ~103: WHY moves check `TESTING_MODE ? false : ...`

## Example Usage

### Testing a Full Dialogue Flow (One Account)

**With Testing Mode Enabled:**

1. Create claim: "Renewable energy is cost-effective"
2. Challenge your own claim (WHY): "Why should we accept this?"
3. Answer your own challenge (GROUNDS): "Studies show 20% cost reduction..."
4. Post SUPPOSE: "Suppose government subsidies increase"
5. Post THEREFORE: "Therefore, adoption will accelerate"
6. Post DISCHARGE: (close the supposition)

All of this works with a **single user account** when testing mode is on! 🎉

### Production Behavior (Testing Mode Off)

Same flow requires:
- **User A** (author) creates claim
- **User B** challenges with WHY
- **User A** answers with GROUNDS
- Etc.

## Security Notes

### ⚠️ Production Safety

**Testing mode is automatically disabled in production** because:

1. Environment variables in production typically don't include `DIALOGUE_TESTING_MODE`
2. Even if set, the restriction logic still runs (just returns `false` for disabled)
3. No security bypass - just UX convenience for development

### ✅ Safe to Commit

The code changes are safe to commit because:
- Reads from environment variable (not hardcoded)
- Defaults to `false` if env var missing
- Only affects UI button states (disabled vs enabled)
- Backend validation still enforces rules in production

## Troubleshooting

### "Challenge button still disabled"

1. **Check .env file exists** in project root
2. **Restart dev server** after adding env var
3. **Verify env var name** is exactly `DIALOGUE_TESTING_MODE` (case-sensitive)
4. **Check value** is exactly string `'true'` (not `1` or `true` without quotes)

### "Works in one view but not another"

Some views may use cached data. Try:
- Hard refresh browser (Cmd+Shift+R / Ctrl+F5)
- Clear SWR cache (change URL params)
- Check both files have testing mode constant defined

### "Forgot to disable before commit"

If you accidentally hardcoded `TESTING_MODE = true`:

```bash
git diff HEAD -- app/api/dialogue/legal-moves/route.ts lib/dialogue/legalMovesServer.ts
```

Should only show env var additions, not hardcoded `true`.

## Best Practices

### Development Workflow

1. **Start of day:** Enable testing mode in `.env`
2. **During dev:** Test all dialogue features with one account
3. **Before commit:** Verify `.env` not committed (in `.gitignore`)
4. **Manual QA:** Disable testing mode, test with multiple accounts
5. **Before deploy:** Testing mode should not be in production env vars

### When to Use Testing Mode

✅ **Good use cases:**
- Testing dialogue move validation
- Verifying UI/UX flows
- Debugging move posting logic
- Iterating on structural moves (SUPPOSE/DISCHARGE)
- Quick prototyping

❌ **Don't use for:**
- Multi-user interaction testing
- Role-based permission testing
- Production-like QA scenarios
- Performance testing with concurrent users

## Related Documentation

- **`COMPREHENSIVE_TEST_CHECKLIST.md`** - Full test suite (includes multi-user tests)
- **`SESSION_SUMMARY_ITEMS_2_AND_4.md`** - Implementation context
- **`PHASE_4_CQ_TOOLTIPS_IMPLEMENTATION.md`** - CQ integration details

---

**Added:** October 22, 2025  
**Status:** Active Development Feature  
**Production Safe:** ✅ Yes (disabled by default)
