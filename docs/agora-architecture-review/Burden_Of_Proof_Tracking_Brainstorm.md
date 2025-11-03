Burden of Proof Tracking: Brainstorming & Design Ideas
Great question! This is a fascinating feature that touches on argumentation theory, dialogue protocols, legal reasoning, and categorical semantics. Let me share some ideas organized by different aspects:

🎯 Core Concepts
1. What is "Burden of Proof"?
In argumentation theory (Walton, Prakken, etc.), burden of proof involves:

Who must prove what: Which party has the obligation to provide evidence
Standard of proof: How strong the evidence must be (preponderance, clear & convincing, beyond reasonable doubt)
Presumptions: Default positions that stand unless defeated (e.g., "status quo is acceptable", "innocence presumed")
Burden shifting: When successfully challenged, burden may shift to challenger or back to proponent
2. Why Track It?
User Benefits:

Clarity: Makes explicit who needs to do what in a debate
Fairness: Prevents rhetorical tricks (shifting burden unfairly)
Focus: Helps participants understand current obligations
Legal/Policy Alignment: Mirrors real-world deliberative practices
System Benefits:

Dialogue protocol enforcement: WHY moves create obligations, GROUNDS moves fulfill them
Argument evaluation: Different proof standards → different acceptance thresholds
Visualization: Show "active burdens" as pending obligations
🏗️ Architecture Design Options
Option A: Room-Level Burden Settings (Simplest)
Use Cases:

Legal deliberations: "Burden on prosecution, beyond reasonable doubt"
Policy debates: "Burden on change-advocate, clear & convincing"
Scientific inquiry: "Burden symmetric, preponderance of evidence"
Implementation:

Add to deliberation creation UI (optional advanced settings)
Show badge in deliberation header: "⚖️ Burden: Proponent (Clear & Convincing)"
Affects AF evaluation: stricter defeat conditions for burdened side
Option B: Claim-Level Burden Tracking (More Granular)
Use Cases:

Mixed debates: Some claims have presumption (e.g., "free speech good" presumed), others don't
Burden-shifting: After strong attack, burden may shift back
Visualization:

Claim cards show burden indicator: "⚖️ Presumed True (opponent must defeat)"
Minimap colors claims by burden status
Option C: Dialogue-Move-Level Obligation Tracking (Most Fine-Grained)
Why This Is Powerful:

Explicit obligation graph: Track who owes what to whom
Pending obligations panel: "You have 3 open obligations"
Deadline enforcement: If you don't respond by X, obligation "FAILED"
Burden cascade: Fulfilling one obligation may create new ones
Implementation Strategy:

When WHY move created → Create DialogueObligation record
When GROUNDS move submitted → Mark obligation as FULFILLED if it adequately responds
Adequacy check: Does GROUNDS address the CQ? (Could use AI or manual review)
Deadline enforcement: Background job marks expired obligations as FAILED
Reputation impact: Users with many failed obligations get warning badge
🎨 UI/UX Ideas
1. Burden Indicator Badges
2. Pending Obligations Panel
3. Burden Flow Diagram
Visualize burden shifts over time in a deliberation:

4. Burden Heatmap in Plexus
In the cross-deliberation network view:

Color claims by burden: Green = presumed, Red = must prove, Gray = neutral
Edge thickness by obligation count: Thicker edges = more active burdens between those claims
🔧 Technical Implementation Strategy
Phase 1: Basic Burden Config (1-2 weeks)
Add burdenConfig JSON field to Deliberation model
Add UI in deliberation settings: "Advanced → Burden of Proof"
Display burden indicator in deliberation header
No enforcement yet — just informational
Phase 2: DialogueObligation Model (2-3 weeks)
Create DialogueObligation table (schema above)
Update /api/dialogue/move to create obligations when WHY posted
Update /api/dialogue/move to mark obligations fulfilled when GROUNDS posted
Add /api/obligations/[userId] endpoint to fetch pending obligations
Build <ObligationsPanel> component
Phase 3: Adequacy Checking (3-4 weeks)
Option 3A: Manual Review

Add "Does this GROUNDS adequately respond?" approval flow
Original challenger or moderator can mark as adequate/inadequate
Option 3B: AI-Assisted

When GROUNDS submitted, call LLM:
Flagged responses go to human review
Phase 4: Deadline Enforcement (1 week)
Add background job: scripts/check-obligation-deadlines.ts
Runs hourly, marks expired obligations as FAILED
Send notifications: "Your obligation to respond to X has expired"
Update user reputation score
Phase 5: AF Evaluation Integration (2 weeks)
Modify abstract argumentation evaluation to respect burden:

This implements Prakken's dialectical asymmetry from formal argumentation theory!

🧪 Advanced Ideas
1. Burden Inheritance in Import Functor
When importing arguments across deliberations via transport functor (CHUNK 5A):

Research Question: Does burden of proof compose functorially?

2. Burden Visualization in AIF Diagrams
Extend AIF node types with burden metadata:

Then in diagram viewer, render burden indicators visually.

3. Ludics Integration: Burden as Design Polarity
Connect burden to ludics (CHUNK 3B already has ludics integration!):

Proponent (P) designs: Carry burden by default
Opponent (O) designs: Challenge without burden (unless shifted)
Daimon (†): Closure when burden satisfied or obligation failed
Theoretical Insight: Burden of proof = asymmetry in interactive proof game!

4. CQ-Specific Burden Standards
Different CQs have different burden requirements:

📊 Metrics & Analytics
Track deliberation health via burden metrics:

Deliberation Health Dashboard:

"87% of obligations fulfilled"
"Avg response time: 2.3 days"
"Top 3 users by burden compliance"
🎓 Theoretical Grounding
Your system already references these scholars — burden tracking would deepen alignment:

Walton's Dialogue Types: Each type has different burden standards

Information-seeking: Low burden (just share knowledge)
Persuasion: High burden (must convince)
Inquiry: Symmetric burden (collaborative truth-seeking)
Prakken's Formal Dialogues: Burden as proof standard in dialectical games

Defines "strict defeat" vs "normal defeat"
Mesh could implement this as configurable thresholds
Carneades (Gordon): Premises as assumptions vs. ordinary premises

Assumptions: Opponent has burden to challenge
Ordinary premises: Proponent has burden to support
Could map to: ArgumentPremise.burdenType
🚀 Recommendation: Start Small, Scale Gradually
Quick Win (1 week):

Add burdenConfig JSON field to Deliberation
Display "⚖️ Burden: {description}" badge in deliberation header
No enforcement, just informational
Phase 2 (2-3 weeks):

Add DialogueObligation model
Automatically create obligations when WHY posed
Show pending obligations in user profile
Phase 3 (3-4 weeks):

Add adequacy checking (manual or AI-assisted)
Send deadline notifications
Mark obligations as fulfilled/failed
Phase 4 (Future):

Integrate with AF evaluation (asymmetric defeat)
Burden visualization in diagrams
Cross-deliberation burden tracking
What aspects interest you most? I can dive deeper into:

Schema design for DialogueObligation model
UI mockups for burden indicators
AF evaluation with asymmetric defeat conditions
Ludics integration (burden as polarity)
Cross-deliberation burden transfer via functors