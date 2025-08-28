Absolutely—here’s the plain-English tour of what the **Representative viewpoints** panel is doing and why it looks the way it does.

---

## What does **k = N** mean?

* Think of a **view** as a *coherent basket of arguments* that don’t contradict each other (no “A” and “not-A” in the same basket, and no undercut of your own warrant in the same basket).
* **k** is simply **how many such baskets** we pick to summarize the thread—e.g., **k = 3** means “show the three most representative, internally consistent positions that exist in this discussion”.

Why multiple baskets? Because a real discussion often has several legitimate, mutually incompatible positions. Showing just one would ignore large groups of participants; showing k baskets tries to cover the terrain without overwhelming the reader.

---

## Why do certain arguments appear in a given **View 1 / View 2 / …**?

Each view is chosen from the thread’s arguments using two constraints:

1. **Internal consistency**
   A view must be a consistent set: it can include support chains, but not direct contradictions. Formally, the selector avoids picking arguments that attack each other (rebut) or attack each other’s warrant (undercut).

2. **Representativeness**
   We look at which arguments **people approved** (your “Approve” clicks) and pick k baskets that **cover** as many people’s approved arguments as possible—according to the rule (Utilitarian/Harmonic/MaxCov). “Covering” a person means the basket contains **most of** the arguments that person approved (see “Coverage” below).

So, in your snapshot:

* **View 1** has

  ```
  I am looking forward to reading this. (75%)
  I am not.                           (50%)
  HELLO THIS IS A TEST                (25%)
  ```

  That means those three arguments **can coexist without contradiction** and, together, they help cover approvals for a large slice of users (per the rule you chose).

* **View 2** has

  ```
  I am not.                (50%)
  HELLO HELLO              (100%)
  HELLO THIS IS A TEST     (25%)
  ```

  This is a different coherent basket that covers a **different** chunk of users’ approvals (or covers the same users but better under the rule).

> The “How sure: X%” line is the **author’s confidence** the composer saved with the argument. It’s a display attribute; it doesn’t make the view coherent or incoherent by itself (that’s decided by rebut/undercut links), but you can use confidence later for weighting (e.g., “confidence-weighted support”).

---

## What does “Coverage” mean here?

**Coverage** = “How well the baskets you selected **reflect** what people approved.”

* Every participant approves some arguments (their personal picks).
* A view **covers** a participant when it contains **some or many** of the arguments they approved.
* When we say “**maximize average coverage of approvals**”, we’re asking the selector to pick k baskets so that, **on average across people**, each person sees a basket that matches as much of what they approved as possible.

This is exactly what “Why this is here: **Chosen to maximize average coverage of approvals**” means.

> If you turn on **Best achievable**, we show the *theoretical maximum* average for this thread given the current conflicts. If someone approved two arguments that can’t logically live in the same basket, coverage can’t reach 100% for them—Best achievable acknowledges that reality.

---

## What are **Utilitarian, Harmonic, MaxCov**?

These are three well-studied ways to decide which k baskets to pick:

* **Utilitarian** (maximize **average** coverage)
  Great overall performance; every person gets as much of their approvals covered as possible on average.

* **Harmonic** (compromise toward fairness)
  Similar to Utilitarian but slightly favors improving coverage for worse-off users. Think “a fairer average”.

* **MaxCov** (Justified Representation, JR)
  Guarantees that if there’s a **large group** agreeing on a coherent basket, at least **one** of your k views will represent that group **fully**. You’ll see a **JR** badge when that guarantee is met.

You can switch rules and k to see how the chosen baskets shift.

---

## “Avg coverage: 100% · Min: 100%” and “Best possible”

* **Avg coverage** = the average (over all people) of how well they’re covered by at least one of the k views.
* **Min coverage** = the worst-covered person’s score (i.e., the minimum over users).
* **Best possible** (toggle) = “core-representation”: it shows the **maximum reachable** average given the inherent conflicts in the thread (if you approved mutually exclusive arguments, no single basket can include both—so your personal max is less than 100%). Turning this on explains why sometimes coverage tops out below 100%.

In your example they show 100%/100%—that means every participant’s approvals are fully matched by at least one of the k views (this can happen in small demos or when approvals cluster cleanly).

---

## The **Claim mini-map** and the dots ● / ○ / ◐

The mini-map lists promoted **Claims** and shows two signals:

* **+N / −M**: how many **claims** (not raw arguments) currently **support** (+) or **attack** (−) that claim.
* A **dot** showing its **grounded status** (a standard label from argumentation theory):

  * **● IN** = justified right now (all its attackers are OUT)
  * **○ OUT** = defeated (it has an attacker that’s IN)
  * **◐ UNDEC** = undecided (neither condition holds yet)

These labels give readers a quick “state of play” for the promoted claims. (They’re recomputed when you add or remove attacking edges like **REBUTS** or **UNDERCUTS**.)

---

## A simple mental model

1. People **approve** arguments.
2. The system builds multiple **coherent baskets** (no internal contradictions).
3. It **selects k baskets** to best reflect those approvals under the chosen rule (Utilitarian/Harmonic/MaxCov).
4. **Coverage** reports how well people’s approvals are reflected.
5. **Best possible** shows what’s achievable given the conflicts.
6. The **mini-map** shows the promoted claim landscape: supports, counters, and whether each claim is currently **IN / OUT / UNDEC**.

That’s it. With that frame, the panel’s numbers and boxes should feel intuitive: k controls how many positions you surface; each View shows a consistent “story”; coverage explains quality; and the mini-map tracks the promoted claims’ current status.
