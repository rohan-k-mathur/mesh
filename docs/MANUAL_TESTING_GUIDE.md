# Manual Testing Guide - Issues & NCM Feature

## Setup

1. **Start Development Server**
   ```bash
   cd /Users/rohanmathur/Documents/Documents/mesh
   npm run dev
   ```

2. **Enable Testing Mode** (if not already)
   - Ensure `.env` has: `DIALOGUE_TESTING_MODE=true`
   - This may bypass some authorization checks for testing

3. **Open Browser**
   - Navigate to a deliberation with arguments
   - Example: `http://localhost:3000/deliberations/[your-deliberation-id]`

## Test Scenario 1: Clarification Request Flow

### Step 1: Request Clarification
1. Find any argument in the dialogue
2. Click the **"Request Clarification"** button
3. **Expected:** Modal opens with "Request Clarification" title
4. Enter a question: "How did you calculate this?"
5. Click **"Submit Question"**
6. **Expected:** 
   - ✅ Toast appears: "Clarification request sent!"
   - Modal closes
   - Issues list refreshes

### Step 2: View as Author
1. Click **"Issues"** tab
2. Select **"Clarifications"** filter
3. **Expected:** See your clarification request in the list
4. Click on the issue to open details
5. **Expected:** 
   - Issue shows "Pending" status
   - Question text displayed
   - "Answer" section visible (if you're the assignee/author)

### Step 3: Answer Clarification
1. In the answer textarea, type: "I used the median formula from..."
2. Click **"Submit Answer"**
3. **Expected:**
   - ✅ Toast appears: "Answer submitted successfully!"
   - Answer appears in the issue
   - Issue status updates to "Closed"

### Step 4: Verify Answer Visibility
1. Refresh the page
2. Open the issue again
3. **Expected:**
   - Answer is still visible
   - Issue shows as "Closed"
   - Original question and answer both displayed

**Success Criteria:**
- ✅ Clarification created with toast
- ✅ Answer submitted with toast
- ✅ Answer visible to all users
- ✅ Issue transitions from Open → Closed

---

## Test Scenario 2: NCM Submission & Approval

### Step 1: Submit Community Defense (NCM)
1. Find an argument with a critical question (red badge)
2. Click **"Community Defense"** dropdown
3. Select a response type (e.g., "Provide Evidence")
4. Fill in the response fields:
   - Expression: "According to study XYZ..."
   - Brief: "Evidence supporting premise"
   - Note: "Additional context..."
5. Click **"Submit Response"**
6. **Expected:**
   - ✅ Response submitted successfully
   - Issues list shows new "NCM Review" issue

### Step 2: View NCM Review Issue
1. Go to **"Issues"** tab
2. Select **"NCM Reviews"** filter
3. **Expected:** See the review issue for your NCM
4. Click to open the issue
5. **Expected:**
   - NCM content displayed in a card
   - "Approve" and "Reject" buttons visible (if assignee)
   - Shows moveType, content, contributor info

### Step 3: Approve NCM
1. Review the NCM content
2. Click **"Approve & Execute"** button
3. **Expected:**
   - ✅ Toast appears: "Response approved and executed!"
   - Issue status changes to "Closed"
   - NCM status shows as "EXECUTED"

### Step 4: Verify Canonical Execution
1. **Database Check** (using Prisma Studio or SQL):
   ```bash
   npm run db:studio
   ```
2. Find the `NonCanonicalMove` record:
   - Check `status = "EXECUTED"`
   - Check `canonicalMoveId` is set
   - Check `executedAt` timestamp
3. Find the linked `dialogue_moves` record:
   - Check `kind = "GROUNDS"` (or appropriate type)
   - Check `payload` contains expression, cqId, schemeKey
   - Check `userId` matches approver
4. **UI Check:**
   - Go back to the argument view
   - **Expected:** The critical question should now show as satisfied (green) if it was a GROUNDS_RESPONSE
   - The dialogue should reflect the new canonical move

**Success Criteria:**
- ✅ NCM creates review issue
- ✅ Approval shows toast
- ✅ dialogue_move created in database
- ✅ NCM status updated to EXECUTED
- ✅ CQStatus updated (if applicable)
- ✅ Issue closed

---

## Test Scenario 3: NCM Rejection

### Step 1: Submit Another NCM
1. Submit a new community defense response (follow Scenario 2, Step 1)

### Step 2: Reject NCM
1. Open the review issue
2. Click **"Reject"** button
3. In the modal, enter review notes: "This doesn't address the critical question properly"
4. Click **"Reject Response"**
5. **Expected:**
   - ✅ Toast appears: "Response rejected with feedback"
   - Issue status changes to "Closed"
   - NCM status shows as "REJECTED"

### Step 3: Verify Rejection Details
1. Check the issue details
2. **Expected:**
   - Review notes visible
   - NCM shows rejected status
   - Contributor can see the feedback

**Success Criteria:**
- ✅ Rejection shows toast
- ✅ Review notes saved and visible
- ✅ NCM status updated to REJECTED
- ✅ Issue closed
- ✅ Contributor receives feedback

---

## Test Scenario 4: Authorization & Edge Cases

### Test 4.1: Non-Author Cannot Approve
1. Login as a different user (not the argument author)
2. Try to open an NCM review issue
3. **Expected:**
   - Either issue not visible, or
   - Approve/Reject buttons disabled/hidden
   - Clear message about authorization

### Test 4.2: Non-Author Cannot Answer Clarification
1. Login as a different user (not the assignee)
2. Open a clarification issue
3. **Expected:**
   - Answer section not visible, or
   - Submit button disabled
   - Clear authorization message

### Test 4.3: Empty Submissions
1. Try submitting clarification with empty question
2. **Expected:** Submit button disabled
3. Try submitting answer with empty text
4. **Expected:** Submit button disabled

### Test 4.4: Network Error Handling
1. Disconnect network or use dev tools to simulate failure
2. Try submitting an action
3. **Expected:**
   - ✅ Error toast appears with message
   - No undefined errors in console
   - UI remains functional after error

---

## Test Scenario 5: Toast Behavior

### Test 5.1: Multiple Actions
1. Quickly submit 2-3 actions in succession
2. **Expected:**
   - Multiple toasts appear
   - Each auto-dismisses after 4 seconds
   - No visual conflicts or overlaps

### Test 5.2: Success and Error Mix
1. Perform a successful action (get green toast)
2. Simulate an error (get red toast)
3. **Expected:**
   - Green toast has ✓ checkmark
   - Red toast has ✕ X
   - Colors clearly distinguish success/error

### Test 5.3: Auto-Dismiss Timing
1. Trigger a toast
2. Count to 4 seconds
3. **Expected:**
   - Toast disappears around 4 seconds
   - Smooth fade-out animation

---

## Test Scenario 6: Full Integration Flow

### End-to-End Happy Path
1. **User A:** Creates argument with critical question
2. **User B:** Requests clarification on the argument
   - ✅ Toast: "Clarification request sent!"
3. **User A:** Answers clarification
   - ✅ Toast: "Answer submitted successfully!"
4. **User C:** Submits NCM responding to critical question
   - Issue auto-created for User A
5. **User A:** Opens review issue, sees NCM details
6. **User A:** Approves NCM
   - ✅ Toast: "Response approved and executed!"
7. **Database:** Verify dialogue_move created
8. **UI:** Verify critical question shows as satisfied
9. **All Users:** Can see the canonical move in dialogue

**Success Criteria:**
- ✅ All toasts appear at correct times
- ✅ All state transitions correct
- ✅ Database consistency maintained
- ✅ UI reflects all changes
- ✅ Multi-user collaboration works smoothly

---

## Database Verification Queries

### Check NCM Execution
```sql
-- In Prisma Studio or SQL client
SELECT 
  id,
  status,
  "moveType",
  "canonicalMoveId",
  "executedAt",
  "createdAt"
FROM "NonCanonicalMove"
WHERE status = 'EXECUTED'
ORDER BY "executedAt" DESC
LIMIT 10;
```

### Check Dialogue Moves from NCMs
```sql
SELECT 
  dm.id as move_id,
  dm.kind,
  dm."targetType",
  dm."targetId",
  dm.payload,
  ncm.id as ncm_id,
  ncm."moveType",
  ncm.content
FROM dialogue_moves dm
JOIN "NonCanonicalMove" ncm ON ncm."canonicalMoveId" = dm.id
ORDER BY dm."createdAt" DESC
LIMIT 10;
```

### Check CQStatus Updates
```sql
SELECT 
  id,
  satisfied,
  "cqId",
  "targetId",
  "updatedAt"
FROM "CQStatus"
WHERE satisfied = true
  AND "updatedAt" > NOW() - INTERVAL '1 day'
ORDER BY "updatedAt" DESC;
```

### Check Issues Activity
```sql
SELECT 
  id,
  label,
  kind,
  state,
  "ncmStatus",
  "createdAt",
  "updatedAt"
FROM "Issue"
WHERE "createdAt" > NOW() - INTERVAL '1 day'
ORDER BY "createdAt" DESC;
```

---

## Common Issues & Troubleshooting

### Issue: Toast doesn't appear
- **Check:** Console for errors
- **Check:** `useMicroToast` hook imported correctly
- **Check:** `{toast.node}` rendered in component return
- **Fix:** Verify all imports and render location

### Issue: NCM not executing
- **Check:** Browser console for API errors
- **Check:** Server logs for execution errors
- **Check:** Database for failed transactions
- **Fix:** Review `lib/ncm/executeAsCanonical.ts` error handling

### Issue: Approval button not visible
- **Check:** User is the assignee/author
- **Check:** Issue kind is `community_defense`
- **Check:** NCM data loaded correctly
- **Fix:** Verify authorization logic in `IssueDetail.tsx`

### Issue: Dialogue move not created
- **Check:** Database logs for SQL errors
- **Check:** Prisma schema for dialogue_moves table
- **Check:** Payload structure matches schema
- **Fix:** Review SQL INSERT statement and type casting

### Issue: CQStatus not updating
- **Check:** NCM moveType is `GROUNDS_RESPONSE`
- **Check:** cqId and schemeKey in NCM content
- **Check:** CQStatus record exists for target
- **Fix:** Verify CQStatus.upsert logic in `executeAsCanonical.ts`

---

## Success Checklist

After completing all scenarios, verify:

- [ ] ✅ All 6+ toast messages appear correctly
- [ ] ✅ Clarification flow works end-to-end
- [ ] ✅ NCM approval creates dialogue moves
- [ ] ✅ NCM rejection saves feedback
- [ ] ✅ Authorization prevents unauthorized actions
- [ ] ✅ Database consistency maintained
- [ ] ✅ UI refreshes show latest data
- [ ] ✅ Error handling shows user-friendly messages
- [ ] ✅ Multi-user scenarios work correctly
- [ ] ✅ No console errors during normal operation

**When all items are checked, Week 1 implementation is validated! ✅**
