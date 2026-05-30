------------------------------------------------------------------------
-- T002 — Inc(B) is an antichain; B decomposes into disjoint cones
--
-- Statement (per 02_THEOREMS_AND_PROOFS/T002-inc-b-antichain.md):
--
--   1. Antichain.  Inc(B) := { D ∈ B : ∄ D′ ∈ B, D′ ⊊ D } is an
--      antichain under ⊆.  (If D₁, D₂ ∈ Inc(B) and D₁ ⊆ D₂ then D₁ = D₂.)
--
--   2. Cone decomposition.  B = ⨆_{Dᵢ ∈ Inc(B)} Cᵢ, the disjoint union
--      following from uniqueness of incarnation (Fouqueré–Quatrini 2013).
--
-- Mechanisation strategy (mirrors the human proof in
-- LUDICS_OQ_JSL_PROOF.md §§3–5):
--
--   * The antichain argument is, in the source's own words, "purely
--     order-theoretic … it holds for the minimal elements of any
--     partially ordered set" (§0.3, §5.1).  It is therefore mechanised
--     here ABSTRACTLY over an arbitrary setoid partial order, WITHOUT
--     POSTULATES OR HOLES.
--
--   * The cone-decomposition and cross-cone-incompatibility results
--     genuinely depend on the Fouqueré–Quatrini uniqueness-of-incarnation
--     theorem (LMCS 9(4:6), 2013).  Rather than smuggle that in as an
--     Agda `postulate`, it is exposed as an explicit `Incarnation` record
--     (a module HYPOTHESIS).  Every cone result is then a theorem of the
--     form "given an incarnation structure, …".  This keeps the file free
--     of postulates while making the F-Q dependency visible in the types,
--     exactly as T002's `depends-on` field records it.
--
--   * §2 instantiates the abstract order on the C001a list-design model
--     (Carrier = List A, ⊑ = set-inclusion, ≈ = set-equality), discharging
--     every order axiom, to show the abstract theorems are non-vacuous on
--     the substrate's actual design representation (designs-as-sets).
--
-- Status: type-checks WITHOUT POSTULATES OR HOLES.
-- Tested against: Agda 2.7.0.1, agda-stdlib v2.0.
--
-- This is *evidence* for T002 under the Theorem Register policy
-- (02_THEOREMS_AND_PROOFS/README.md), not a positive settlement: the
-- abstraction faithfully captures the order theory, but the match of the
-- abstract `Incarnation` record to F-Q 2013, and of the list-design model
-- to the substrate's chronicle-tree designs, remain human-review
-- obligations (see README in this directory).
--
-- Substrate cross-references:
--   T001 (per-cone JSL; the cones whose disjointness is proved here)
--   T002 (this artefact: antichain + cone decomposition)
--   C001a / T004 (downstream: the JSL-fragment bridge, already mechanised)
------------------------------------------------------------------------

{-# OPTIONS --without-K --safe #-}

module T002 where

open import Level using (Level; _⊔_)
open import Data.Empty using (⊥)
open import Data.Product using (Σ; _×_; _,_; proj₁; proj₂; ∃-syntax)
open import Relation.Nullary using (¬_)

------------------------------------------------------------------------
-- §1.  Abstract setoid partial order
--
-- A carrier with a setoid equality _≈_ and a preorder _⊑_ such that
-- mutual ⊑ collapses to ≈ (antisymmetry into the setoid) and ⊑ respects
-- ≈.  This is precisely the structure the substrate's designs carry:
-- ⊑ is literal chronicle-set inclusion and ≈ is chronicle-set equality
-- (T001 §Equality convention).
------------------------------------------------------------------------

module Order
  {c ℓ≈ ℓ⊑ : Level}
  (Carrier   : Set c)
  (_≈_       : Carrier → Carrier → Set ℓ≈)
  (_⊑_       : Carrier → Carrier → Set ℓ⊑)
  -- _≈_ is an equivalence
  (≈-refl    : ∀ {a}     → a ≈ a)
  (≈-sym     : ∀ {a b}   → a ≈ b → b ≈ a)
  (≈-trans   : ∀ {a b d} → a ≈ b → b ≈ d → a ≈ d)
  -- _⊑_ is a preorder
  (⊑-refl    : ∀ {a}     → a ⊑ a)
  (⊑-trans   : ∀ {a b d} → a ⊑ b → b ⊑ d → a ⊑ d)
  -- antisymmetry collapses into the setoid equality
  (⊑-antisym : ∀ {a b}   → a ⊑ b → b ⊑ a → a ≈ b)
  -- _⊑_ respects _≈_ on both sides
  (≈-⊑-trans : ∀ {a b d} → a ≈ b → b ⊑ d → a ⊑ d)
  (⊑-≈-trans : ∀ {a b d} → a ⊑ b → b ≈ d → a ⊑ d)
  where

  ----------------------------------------------------------------------
  -- §1.1  Behaviours, minimality, and Inc(B)
  ----------------------------------------------------------------------

  module Behaviour {ℓB : Level} (B : Carrier → Set ℓB) where

    -- Strictly below: ⊑ but not ⊒.  (The ⊊ of the paper.)
    _⊏_ : Carrier → Carrier → Set ℓ⊑
    a ⊏ b = (a ⊑ b) × (¬ (b ⊑ a))

    -- D is minimal in B (i.e. D ∈ Inc(B)).
    --
    -- Constructive (positive) rendering of "∄ D′ ∈ B, D′ ⊊ D":
    -- anything in B that sits below D also sits above it.  Lemma
    -- `minimal-no-strict-below` confirms this implies the paper's
    -- negative statement.
    record Minimal (D : Carrier) : Set (c ⊔ ℓ⊑ ⊔ ℓB) where
      field
        inB     : B D
        minimal : ∀ {D'} → B D' → D' ⊑ D → D ⊑ D'

    -- The positive minimality really does forbid a strict lower bound.
    minimal-no-strict-below :
      ∀ {D D'} → Minimal D → B D' → ¬ (D' ⊏ D)
    minimal-no-strict-below m bD' (D'⊑D , ¬D⊑D') =
      ¬D⊑D' (Minimal.minimal m bD' D'⊑D)

    ------------------------------------------------------------------
    -- §1.2  Part 1 — Inc(B) is an antichain  (T002.1)
    --
    -- The load-bearing observation of LUDICS_OQ_JSL_PROOF.md §5.1:
    -- two minimal elements ordered by ⊑ are setoid-equal.
    ------------------------------------------------------------------

    antichain : ∀ {D₁ D₂} → Minimal D₁ → Minimal D₂ → D₁ ⊑ D₂ → D₁ ≈ D₂
    antichain m₁ m₂ D₁⊑D₂ =
      ⊑-antisym D₁⊑D₂ (Minimal.minimal m₂ (Minimal.inB m₁) D₁⊑D₂)

    -- Corollary: distinct incarnations share no upper bound *inside*
    -- Inc(B).  (LUDICS_OQ_JSL_PROOF.md §5.1 Corollary.)
    no-upper-bound-in-Inc :
      ∀ {D₁ D₂} → Minimal D₁ → Minimal D₂ → ¬ (D₁ ≈ D₂) →
      ¬ (∃[ D' ] (Minimal D' × (D₁ ⊑ D') × (D₂ ⊑ D')))
    no-upper-bound-in-Inc m₁ m₂ d≉ (_ , mD' , D₁⊑D' , D₂⊑D') =
      d≉ (≈-trans (antichain m₁ mD' D₁⊑D')
                  (≈-sym (antichain m₂ mD' D₂⊑D')))

    ------------------------------------------------------------------
    -- §1.3  Uniqueness of incarnation as an explicit hypothesis
    --
    -- Fouqueré–Quatrini 2013: every D ∈ B has a unique smallest
    -- sub-design |D|_B ∈ B.  Packaged as a record so it appears in the
    -- types of the cone results rather than as a postulate.
    ------------------------------------------------------------------

    record Incarnation : Set (c ⊔ ℓ≈ ⊔ ℓ⊑ ⊔ ℓB) where
      field
        inc       : ∀ {D} → B D → Carrier
        inc-inB   : ∀ {D} (d : B D) → B (inc d)
        inc-below : ∀ {D} (d : B D) → inc d ⊑ D
        -- inc d is the *least* element of B below D.
        inc-least : ∀ {D} (d : B D) {D'} → B D' → D' ⊑ D → inc d ⊑ D'

      -- The incarnation is itself minimal (lies in Inc(B)).
      inc-minimal : ∀ {D} (d : B D) → Minimal (inc d)
      inc-minimal d = record
        { inB     = inc-inB d
        ; minimal = λ {D'} bD' D'⊑incd →
                      inc-least d bD' (⊑-trans D'⊑incd (inc-below d))
        }

      -- Uniqueness: any minimal element below D *is* the incarnation.
      inc-unique :
        ∀ {D} (d : B D) {D'} → Minimal D' → D' ⊑ D → D' ≈ inc d
      inc-unique d {D'} mD' D'⊑D =
        ⊑-antisym
          (Minimal.minimal mD' (inc-inB d) (inc-least d (Minimal.inB mD') D'⊑D))
          (inc-least d (Minimal.inB mD') D'⊑D)

      ----------------------------------------------------------------
      -- §1.4  Part 2 — Cross-cone incompatibility  (T002, §5.2)
      --
      -- Distinct incarnations have no common upper bound anywhere in B.
      -- (LUDICS_OQ_JSL_PROOF.md §5.2 Theorem (Cross-Cone Incompatibility).)
      ----------------------------------------------------------------

      cross-cone-incompat :
        ∀ {D₁ D₂} → Minimal D₁ → Minimal D₂ → ¬ (D₁ ≈ D₂) →
        ∀ {D} → B D → D₁ ⊑ D → D₂ ⊑ D → ⊥
      cross-cone-incompat m₁ m₂ d≉ d D₁⊑D D₂⊑D =
        d≉ (≈-trans (inc-unique d m₁ D₁⊑D)
                    (≈-sym (inc-unique d m₂ D₂⊑D)))

      ----------------------------------------------------------------
      -- §1.5  Cone decomposition  (T002, §4 Cone Decomposition)
      --
      -- Following the proof: assign each D ∈ B to the cone of its
      -- incarnation.  An "element" of B is a carrier together with a
      -- membership witness; `conf` is the cone-assignment map.
      --
      --   * cone-total : every element lies in the cone of its own
      --     incarnation (the assignment is total).
      --   * cone-disjoint : no element lies in two distinct cones (the
      --     assignment is well-defined / functional).
      --
      -- Totality + functionality is exactly a partition of B into cones.
      ----------------------------------------------------------------

      Element : Set (c ⊔ ℓB)
      Element = Σ Carrier B

      -- Cone-assignment: the incarnation of the element's witness.
      conf : Element → Carrier
      conf (_ , d) = inc d

      -- "e lies in the cone above Dᵢ."
      in-cone : Carrier → Element → Set ℓ≈
      in-cone Dᵢ e = conf e ≈ Dᵢ

      -- Totality: every element lies in the cone of its incarnation.
      cone-total : ∀ e → in-cone (conf e) e
      cone-total _ = ≈-refl

      -- Functionality / disjointness: an element cannot lie in two
      -- distinct cones; if it appears in cones Dᵢ and Dⱼ then Dᵢ ≈ Dⱼ.
      cone-disjoint :
        ∀ {Dᵢ Dⱼ} (e : Element) → in-cone Dᵢ e → in-cone Dⱼ e → Dᵢ ≈ Dⱼ
      cone-disjoint _ p q = ≈-trans (≈-sym p) q

      -- The cone above Dᵢ has Dᵢ as a lower bound (its "bottom"),
      -- matching T001's cone definition Cᵢ = { D ∈ B : Dᵢ ⊆ D, … }.
      cone-bottom :
        ∀ {Dᵢ} (e : Element) → in-cone Dᵢ e → Dᵢ ⊑ proj₁ e
      cone-bottom (_ , d) p =
        ≈-⊑-trans (≈-sym p) (inc-below d)

------------------------------------------------------------------------
-- §2.  Non-vacuity: the C001a list-design model
--
-- Carrier = List A, ⊑ = set-inclusion (every member of xs is a member
-- of ys), ≈ = mutual inclusion (set-equality, the ≈ᴰ of C001a / finding
-- F2).  Every order axiom is discharged, so the abstract §1 theorems
-- specialise to the substrate's designs-as-sets representation.
------------------------------------------------------------------------

module ListModel {a : Level} (A : Set a) where

  open import Data.List using (List)
  open import Data.List.Membership.Propositional using (_∈_)
  open import Function using (id; _∘_)

  -- Set-inclusion on chronicle lists (= C001a's _⊆ᴰ_).
  _⊑_ : List A → List A → Set a
  xs ⊑ ys = ∀ {x} → x ∈ xs → x ∈ ys

  -- Set-equality (= C001a's _≈ᴰ_, finding F2).
  _≈_ : List A → List A → Set a
  xs ≈ ys = (xs ⊑ ys) × (ys ⊑ xs)

  ≈-refl : ∀ {xs} → xs ≈ xs
  ≈-refl = id , id

  ≈-sym : ∀ {xs ys} → xs ≈ ys → ys ≈ xs
  ≈-sym (p , q) = q , p

  ≈-trans : ∀ {xs ys zs} → xs ≈ ys → ys ≈ zs → xs ≈ zs
  ≈-trans (p , q) (p' , q') = p' ∘ p , q ∘ q'

  ⊑-refl : ∀ {xs} → xs ⊑ xs
  ⊑-refl = id

  ⊑-trans : ∀ {xs ys zs} → xs ⊑ ys → ys ⊑ zs → xs ⊑ zs
  ⊑-trans p q = q ∘ p

  -- Mutual inclusion *is* set-equality, so antisymmetry is the pairing.
  ⊑-antisym : ∀ {xs ys} → xs ⊑ ys → ys ⊑ xs → xs ≈ ys
  ⊑-antisym p q = p , q

  ≈-⊑-trans : ∀ {xs ys zs} → xs ≈ ys → ys ⊑ zs → xs ⊑ zs
  ≈-⊑-trans (p , _) q = q ∘ p

  ⊑-≈-trans : ∀ {xs ys zs} → xs ⊑ ys → ys ≈ zs → xs ⊑ zs
  ⊑-≈-trans p (p' , _) = p' ∘ p

  -- The abstract order, instantiated.  Opening this brings the antichain
  -- theorem, cross-cone incompatibility, and cone decomposition into
  -- scope, specialised to list-designs under set-inclusion.
  open Order (List A) _≈_ _⊑_
             ≈-refl ≈-sym ≈-trans
             ⊑-refl ⊑-trans ⊑-antisym ≈-⊑-trans ⊑-≈-trans
       public

------------------------------------------------------------------------
-- §3.  What this proves and what it doesn't
--
-- PROVED (no postulates, no holes):
--   - Part 1 (antichain): minimal elements of any setoid partial order
--     form an antichain (`Order.Behaviour.antichain`), with the in-Inc
--     no-upper-bound corollary.  Order-theoretic, exactly as the source
--     proof advertises.
--   - Part 2 (cross-cone incompatibility + cone decomposition): given an
--     `Incarnation` structure (the F-Q uniqueness-of-incarnation
--     hypothesis, made explicit in the types), distinct incarnations
--     have no common upper bound in B, and B partitions into cones
--     (totality `cone-total` + functionality `cone-disjoint`), each with
--     its incarnation as bottom (`cone-bottom`).
--   - Non-vacuity: the C001a list-design model discharges every order
--     axiom (§2), so the theorems apply to designs-as-sets.
--
-- NOT PROVED (human-review obligations, per Register policy):
--   - That the abstract `Incarnation` record faithfully captures
--     Fouqueré–Quatrini 2013 (it is asserted as a hypothesis, not built).
--   - That the list-design model matches the substrate's chronicle-tree
--     designs (the same F2/representation caveat as C001a).
--   - Finite-generation of Inc(B) (assumed in T001/T002 prose; not used
--     by the order-theoretic core, hence not modelled here).
------------------------------------------------------------------------
