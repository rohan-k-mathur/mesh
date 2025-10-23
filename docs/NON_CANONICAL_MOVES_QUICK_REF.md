# Non-Canonical Moves: Quick Reference Guide

**TL;DR**: Let community members help answer challenges and provide clarifications, with author approval.

---

## 🎯 Core Idea

Instead of **only authors** responding to challenges:
```
Challenge → ONLY Author → GROUNDS
```

Now **anyone** can help:
```
Challenge → Author OR Community → (pending) → Author Approves → GROUNDS (canonical)
```

---

## 📦 What's New

### 1. Non-Canonical Responses
Any user can submit responses to:
- WHY challenges
- Critical questions
- Undermined premises
- Undercut exceptions

Status flow: `PENDING → APPROVED → EXECUTED (canonical)`

### 2. Clarification Requests
Non-protocol factual questions:
- "What do you mean by X?"
- "Can you clarify Y?"
- Community answers
- Asker marks helpful

---

## 🗄️ Database

### New Tables

```sql
-- Community responses
non_canonical_moves (
  id, deliberationId, targetId, targetType,
  contributorId, authorId, moveType, content,
  status, approvedBy, canonicalMoveId, ...
)

-- Clarification Q&A
clarification_requests (
  id, deliberationId, targetId, targetType,
  askerId, question, status
)
```

### Migration Command
```bash
npx prisma migrate dev --name add_non_canonical_moves
npx prisma generate
```

---

## 🔌 API Quick Reference

| Endpoint | Usage |
|----------|-------|
| `POST /api/non-canonical/submit` | Submit community response |
| `GET /api/non-canonical/pending` | Get author's pending reviews |
| `POST /api/non-canonical/approve` | Approve & optionally execute |
| `POST /api/non-canonical/reject` | Reject with reason |
| `GET /api/non-canonical/by-target` | Get responses for arg/claim |
| `POST /api/clarification/request` | Ask clarification question |
| `GET /api/clarification/list` | Get Q&A for target |

---

## 🎨 UI Components

| Component | Where | What |
|-----------|-------|------|
| `NonCanonicalResponseForm` | Modal | Submit response |
| `PendingResponsesList` | Drawer | Review pending |
| `CommunityResponsesTab` | AttackMenuPro | View all responses |
| `ClarificationRequestButton` | ArgumentCard | Ask question |
| `ClarificationList` | ArgumentCard | Show Q&A |
| `CommunityResponseBadge` | ArgumentCard | Notification badge |

---

## 🚀 Quick Start

### Step 1: Add Schema
Copy models from `docs/NON_CANONICAL_MOVES_SCHEMA.md` to `lib/models/schema.prisma`

### Step 2: Migrate
```bash
npx prisma migrate dev --name add_non_canonical_moves
```

### Step 3: Create API Route
```typescript
// app/api/non-canonical/submit/route.ts
import { prisma } from "@/lib/prismaclient";

export async function POST(req: Request) {
  const { deliberationId, targetType, targetId, moveType, content } = await req.json();
  
  // Validation
  // ...
  
  const ncm = await prisma.nonCanonicalMove.create({
    data: {
      deliberationId,
      targetType,
      targetId,
      contributorId: currentUserId,
      authorId: argumentAuthorId,
      moveType,
      content,
      status: "PENDING"
    }
  });
  
  // Emit event, send notification
  // ...
  
  return Response.json({ success: true, ncmId: ncm.id });
}
```

### Step 4: Add UI Component
```tsx
// components/dialogue/NonCanonicalResponseForm.tsx
import { Dialog } from "@/components/ui/dialog";

export function NonCanonicalResponseForm({ ... }) {
  const [expression, setExpression] = useState("");
  
  const handleSubmit = async () => {
    await fetch("/api/non-canonical/submit", {
      method: "POST",
      body: JSON.stringify({ ... })
    });
  };
  
  return (
    <Dialog>
      <Textarea value={expression} onChange={...} />
      <Button onClick={handleSubmit}>Submit</Button>
    </Dialog>
  );
}
```

### Step 5: Integrate
Add to `AttackMenuProV2`:
```tsx
<Tabs>
  <TabsTrigger value="community">Community Responses</TabsTrigger>
  <TabsContent value="community">
    <CommunityResponsesTab targetId={argument.id} />
  </TabsContent>
</Tabs>
```

---

## 📋 Checklist

### Phase 1: Backend (Week 1)
- [ ] Add Prisma models
- [ ] Run migration
- [ ] Create submit endpoint
- [ ] Create pending endpoint
- [ ] Create approve endpoint
- [ ] Create reject endpoint
- [ ] Create by-target endpoint
- [ ] Add clarification endpoints
- [ ] Add bus events
- [ ] Add notifications
- [ ] Write tests

### Phase 2: Frontend (Week 2)
- [ ] Build `NonCanonicalResponseForm`
- [ ] Build `PendingResponsesList`
- [ ] Build `CommunityResponsesTab`
- [ ] Build `ClarificationRequestButton`
- [ ] Build `ClarificationList`
- [ ] Build `CommunityResponseBadge`
- [ ] Write component tests
- [ ] Accessibility audit

### Phase 3: Integration (Week 3)
- [ ] Add to `AttackMenuProV2`
- [ ] Add to `ArgumentCard`
- [ ] Add to `LegalMoveChips`
- [ ] Add to Header (notification)
- [ ] Wire bus events
- [ ] End-to-end tests
- [ ] Performance testing

### Phase 4: Polish (Week 4)
- [ ] Loading states
- [ ] Error handling
- [ ] Empty states
- [ ] Mobile responsive
- [ ] Analytics tracking
- [ ] User documentation
- [ ] Beta testing
- [ ] Launch! 🚀

---

## 🔒 Security Rules

| Rule | Description |
|------|-------------|
| **R1** | Authors can't submit non-canonical for own args |
| **R2** | Only authors can approve/reject |
| **R3** | Contributors can withdraw own responses |
| **R4** | No duplicate pending responses |
| **R5** | Target must exist in deliberation |

---

## 📊 Success Metrics

Track:
- Adoption rate (% deliberations using feature)
- Approval rate (target >60%)
- Response quality (user ratings)
- Time to first response
- Repeat contributors

---

## 🎓 Example User Flow

### Alice helps Bob defend his argument

1. **Alice** sees Bob's argument challenged: "Why should we accept this?"
2. Alice knows the answer, clicks **"Help Answer This"**
3. Modal opens, Alice writes response + adds citation
4. Response submitted with status **PENDING**
5. **Bob** gets notification: "Alice answered your challenge"
6. Bob reviews in **Pending Responses** drawer
7. Bob clicks **"Approve & Execute"**
8. System creates canonical **GROUNDS** move (Bob's actorId)
9. **Alice** gets notification: "Your response was approved!"
10. Alice earns **+1 Helpful Response** badge

---

## 📚 Full Documentation

- **Complete spec**: `docs/NON_CANONICAL_MOVES_SPEC.md` (850 lines)
- **Database design**: `docs/NON_CANONICAL_MOVES_SCHEMA.md` (450 lines)
- **UI components**: `docs/NON_CANONICAL_MOVES_UI.md` (750 lines)
- **Summary**: `docs/NON_CANONICAL_MOVES_SUMMARY.md` (executive overview)

---

## 💡 Key Design Decisions

### Why "Non-Canonical"?
- Preserves distinction between official protocol moves and community suggestions
- Author maintains control over canonical dialogue
- Community contributions are visible but clearly marked

### Why Approval Workflow?
- Prevents spam/low-quality responses
- Maintains argument integrity
- Gives credit to both contributor and author

### Why Separate Clarifications?
- Factual questions ≠ formal challenges
- Lower barrier to participation
- Doesn't trigger protocol rules

---

## 🤔 FAQ

**Q: Can I submit non-canonical for my own argument?**  
A: No (Rule R1). You can edit your argument directly or post canonical moves.

**Q: What happens if my response is rejected?**  
A: You'll get a notification (optionally with reason). No negative impact on reputation.

**Q: Can I approve without making it canonical?**  
A: Yes! Use "Approve (don't execute)" to keep it as informational.

**Q: How are clarifications different from WHY moves?**  
A: Clarifications are informal factual questions. WHY is a formal protocol challenge.

**Q: Can multiple people answer the same challenge?**  
A: Yes! Author can approve multiple responses or choose the best one.

---

## 🚦 Status

- ✅ Specification complete
- ✅ Database schema designed
- ✅ API contracts defined
- ✅ UI components designed
- ⏳ Implementation pending

**Ready to build!** Start with Phase 1 (database + API), then Phase 2 (UI), then integrate.

---

**Questions?** See full docs in `/docs/NON_CANONICAL_MOVES_*.md`
