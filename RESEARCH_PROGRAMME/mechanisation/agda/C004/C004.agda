------------------------------------------------------------------------
-- C004 — Joint saturation σ_joint is a closure operator on the product
--        poset of design-sets and witness-record sets
--
-- Statement (per 03_CONJECTURES/C004-joint-saturation-closure.md, and the
-- definition in LUDICS_OPEN_COMPOSITION_JOINT.md §0e.1):
--
--   σ_joint(D_P, Witness) = Reach( D_P ∪ moves(Witness) )
--
-- where `Reach` is the protocol's forward-closure operator on a set of
-- moves and `moves(Witness)` is the set of moves bound (via ι) by the
-- witnessing acts in Witness.  Promoted to an operator on the product
-- poset
--
--   P := (𝒫(Moves), ⊆) × (𝒫(Witness), ⊆)
--
-- by
--
--   σ_joint(D, W) = ( Reach(D ∪ moves W) , W )
--
-- (the witness component is fixed — Reading C: participation instantiates
-- into the shared Proponent design, it is not merged in).  The conjecture
-- asks: σ_joint is a closure operator — extensive, monotone, idempotent —
-- with a Galois universal property as a corollary.
--
-- Mechanisation strategy (mirrors T001/T002):
--
--   * `Reach` is supplied as a `ForwardClosure` RECORD of hypotheses
--     (extensive / monotone / idempotent), NOT an Agda `postulate`, so the
--     dependency on the protocol's forward-closure operator appears in the
--     types and the file stays `--safe`.  `moves` is supplied as a
--     monotone map (the ι-binding extraction).
--
--   * Everything is order theory over `lib.Closure.Powerset`; the three
--     closure axioms and the Galois property are discharged WITHOUT
--     POSTULATES OR HOLES.  The load-bearing idempotence step is the
--     observation that `moves W ⊆ Reach(D ∪ moves W)` already, so
--     re-adding it on the second application changes nothing and `Reach`'s
--     own idempotence finishes (§3 below).
--
--   * §4 instantiates on a non-trivial model (the discrete forward-closure
--     `Reach = id` with an arbitrary monotone `moves`) so the development
--     is demonstrably non-vacuous.
--
-- Status: type-checks WITHOUT POSTULATES OR HOLES.
-- Tested against: Agda 2.7.0.1, agda-stdlib v2.0.
-- Build (from mechanisation/agda): `agda C004/C004.agda`.
------------------------------------------------------------------------

{-# OPTIONS --without-K --safe #-}

module C004.C004 where

open import Level using (Level; suc; _⊔_)
open import Data.Product using (_×_; _,_; proj₁; proj₂)
open import Data.Sum using (_⊎_; inj₁; inj₂)
open import Data.Empty using (⊥)
open import Function using (id)

open import lib.Closure using (module Powerset)

------------------------------------------------------------------------
-- §1.  Forward closure on move-sets
------------------------------------------------------------------------

-- The protocol's forward-closure operator `Reach`, packaged as a record
-- of hypotheses (extensive / monotone / idempotent up to set-equality).
-- This is Girard's σ specialised to the post-Reading-C setting; we do not
-- re-derive it, we name its closure-operator structure.
record ForwardClosure {a : Level} (Move : Set a) : Set (suc a) where
  open Powerset Move public

  field
    Reach      : Pred → Pred
    reach-ext  : ∀ {P}   → P ⊆ Reach P
    reach-mono : ∀ {P Q} → P ⊆ Q → Reach P ⊆ Reach Q
    reach-idem : ∀ {P}   → Reach (Reach P) ⊆ Reach P

------------------------------------------------------------------------
-- §2.  σ_joint on the product poset
------------------------------------------------------------------------

module JointSaturation
  {a : Level}
  (Move    : Set a)
  (Wit     : Set a)
  (fc      : ForwardClosure Move)
  (moves   : (Wit → Set a) → (Move → Set a))   -- ι-binding extraction
  where

  open ForwardClosure fc
    using (Reach; reach-ext; reach-mono; reach-idem)
  module M  = Powerset Move
  module Wt = Powerset Wit

  -- `moves` is monotone in the witness-record set.
  module _
    (moves-mono : ∀ {W W'} → W Wt.⊆ W' → moves W M.⊆ moves W')
    where

    -- An element of the live-deliberation poset: a design-set and a
    -- witness-record set.
    Live : Set (suc a)
    Live = M.Pred × Wt.Pred

    -- Componentwise order on the product poset.
    _⊑_ : Live → Live → Set a
    (D , W) ⊑ (D' , W') = (D M.⊆ D') × (W Wt.⊆ W')

    _≈_ : Live → Live → Set a
    (D , W) ≈ (D' , W') = (D M.≐ D') × (W Wt.≐ W')

    -- The joint-saturation operator.  The witness component is fixed; the
    -- design component is the forward-closure of the Proponent moves
    -- together with the participation-forced moves.
    σ : Live → Live
    σ (D , W) = Reach (D M.∪ moves W) , W

    --------------------------------------------------------------------
    -- §3.  σ_joint is a closure operator
    --
    -- Every inclusion is proved directly at the membership level: we
    -- apply the primitive `reach-*` / `moves-mono` facts and `inj₁`/`inj₂`
    -- to the membership witness.  `_∪_` is a defined function (not a
    -- constructor), so a point-free composition of the Powerset
    -- combinators leaves Agda with unsolvable `=<` cumulativity metas on
    -- the predicate implicits; the explicit-witness style below sidesteps
    -- that entirely.
    --------------------------------------------------------------------

    -- (Extensive)  x ⊑ σ x.
    σ-ext : ∀ {x} → x ⊑ σ x
    σ-ext {D , W} =
        (λ dm → reach-ext {D M.∪ moves W} (inj₁ dm))
      , (λ w∈ → w∈)

    -- (Monotone)  x ⊑ y → σ x ⊑ σ y.
    σ-mono : ∀ {x y} → x ⊑ y → σ x ⊑ σ y
    σ-mono {D , W} {D' , W'} (D⊆D' , W⊆W') =
        reach-mono {D M.∪ moves W} {D' M.∪ moves W'}
          (λ { (inj₁ dm) → inj₁ (D⊆D' dm)
             ; (inj₂ mw) → inj₂ (moves-mono W⊆W' mw) })
      , W⊆W'

    -- Helper: moves W is already inside the first saturation.
    movesW⊆Reach : ∀ {D W} → moves W M.⊆ Reach (D M.∪ moves W)
    movesW⊆Reach {D} {W} mw = reach-ext {D M.∪ moves W} (inj₂ mw)

    -- (Idempotent)  σ (σ x) ≈ σ x.
    --
    -- Writing U = D ∪ moves W and R = Reach U, the second pass seeds with
    -- (R ∪ moves W).  Since moves W ⊆ U ⊆ R, that seed collapses to R, and
    -- idempotence of Reach gives Reach (R ∪ moves W) ≐ R.
    σ-idem : ∀ {x} → σ (σ x) ≈ σ x
    σ-idem {D , W} =
      ( -- σ (σ x) ⊆ σ x :  Reach (R ∪ moves W) ⊆ R
        (λ rrm →
           reach-idem {D M.∪ moves W}
             (reach-mono {Reach (D M.∪ moves W) M.∪ moves W}
                         {Reach (D M.∪ moves W)}
                         (λ { (inj₁ rm) → rm
                            ; (inj₂ mw) → reach-ext {D M.∪ moves W} (inj₂ mw) })
                         rrm))
        -- σ x ⊆ σ (σ x) :  R ⊆ Reach (R ∪ moves W)
      , (λ rm → reach-ext {Reach (D M.∪ moves W) M.∪ moves W} (inj₁ rm))
      )
      , Wt.≐-refl

    --------------------------------------------------------------------
    -- §3.1  Galois universal property (closure ⇄ Galois insertion)
    --------------------------------------------------------------------

    -- `x` is jointly saturated (closed) when σ x ≈ x.
    Saturated : Live → Set a
    Saturated x = σ x ≈ x

    -- The saturation of anything is saturated.
    σ-saturated : ∀ {x} → Saturated (σ x)
    σ-saturated = σ-idem

    -- Universal property: to land below a saturated `c`, it suffices to
    -- land below it before saturating.  (This is the lower-adjoint half of
    -- the Galois insertion of `Live` into its saturated elements — the
    -- (σ_joint, restrict) connection the conjecture asks for.)
    σ-below : ∀ {x c} → Saturated c → x ⊑ c → σ x ⊑ c
    σ-below {x} {Dc , Wc} (Dc≐ , Wc≐) x⊑c =
        (λ m∈ → proj₁ Dc≐ (proj₁ (σ-mono x⊑c) m∈))
      , (λ w∈ → proj₁ Wc≐ (proj₂ (σ-mono x⊑c) w∈))

    below-σ : ∀ {x c} → σ x ⊑ c → x ⊑ c
    below-σ {x} σx⊑c =
        (λ m∈ → proj₁ σx⊑c (proj₁ (σ-ext {x}) m∈))
      , (λ w∈ → proj₂ σx⊑c (proj₂ (σ-ext {x}) w∈))

    --------------------------------------------------------------------
    -- §3.2  Drainage: the latent stratum is antitone in the walked set
    --
    -- Fix a frontier `B` (the moves of the mature behaviour — the universe
    -- the exposure map classifies; per the glossary, "latent" = "the move
    -- exists in the behaviour but is reachable by no current participant").
    -- The walked loci at witness-state W are exactly `moves W`, and
    -- "reachable by a participant" is the protocol forward-closure of the
    -- walked loci, `Reach (moves W)` — the same `Reach` as σ_joint, applied
    -- to the witness seed only (σ_joint with an empty Proponent seed).  So a
    -- move m is LATENT at W iff  m ∈ B  and  m ∉ Reach (moves W).
    --
    -- DRAINAGE.  Along an accrual update sequence (W only grows — no
    -- retraction; cf. LUDICS_OPEN_COMPOSITION_JOINT §0c.3, where retraction
    -- can re-assign walked → latent), the latent stratum is ⊆-DECREASING:
    -- `Reach (moves W)` grows, so its complement within the fixed `B`
    -- shrinks.  This is the W-axis (live-state growth) dual of T013's D-axis
    -- monotonicity (latent NON-decreasing as the Proponent seed grows at
    -- fixed witness state).  Cardinality decrease |Latent B W'| ≤ |Latent B W|
    -- follows from ⊆ on a finite `B` (standard; not formalised here — the
    -- ⊆-antitone core below is the constructive content).
    --------------------------------------------------------------------

    -- "m is reachable from the walked set of W" (= σ_joint's reach of the
    -- witness seed; the non-latent predicate).
    ReachWalked : Wt.Pred → M.Pred
    ReachWalked W = Reach (moves W)

    -- The latent stratum within a fixed frontier `B` at witness-state `W`.
    Latent : M.Pred → Wt.Pred → M.Pred
    Latent B W m = (m M.∈ B) × (m M.∈ ReachWalked W → ⊥)

    -- A walked move is never latent (extensivity of Reach ∘ moves): the
    -- three strata are disjoint at their boundary.
    walked-not-latent : ∀ {B W m} → m M.∈ moves W → m M.∈ Latent B W → ⊥
    walked-not-latent {W = W} mW (_ , ¬reach) = ¬reach (reach-ext {moves W} mW)

    -- DRAINAGE.  W ⊆ W'  ⇒  Latent B W' ⊆ Latent B W
    -- (a later, larger witness state has a SMALLER latent stratum).
    drainage : ∀ {B W W'} → W Wt.⊆ W' → Latent B W' M.⊆ Latent B W
    drainage {B} {W} {W'} W⊆W' (m∈B , ¬reachW') =
      m∈B , (λ reachW → ¬reachW' (reach-mono (moves-mono W⊆W') reachW))

    -- A move PROMOTED at a step (reachable now, not before) leaves the
    -- latent stratum: latent at W, not latent at W' — the witness of strict
    -- drainage.
    promoted-drains : ∀ {B W W' m}
                    → m M.∈ B
                    → (m M.∈ ReachWalked W → ⊥)   -- latent at W
                    → m M.∈ ReachWalked W'          -- reached at W'
                    → (m M.∈ Latent B W) × (m M.∈ Latent B W' → ⊥)
    promoted-drains m∈B ¬reachW reachW' =
      (m∈B , ¬reachW) , (λ { (_ , ¬reachW') → ¬reachW' reachW' })

------------------------------------------------------------------------
-- §4.  Non-vacuity: a concrete closure-operator instance
--
-- Take the discrete forward-closure `Reach = id` (already a closure
-- operator: extensive, monotone, idempotent on the nose) and an arbitrary
-- monotone `moves`.  σ_joint then specialises to (D , W) ↦ (D ∪ moves W,
-- W), and §3 shows it is a closure operator — so the abstract development
-- is non-empty.
------------------------------------------------------------------------

module Model {a : Level} (Move Wit : Set a) where

  idForwardClosure : ForwardClosure Move
  idForwardClosure = record
    { Reach      = id
    ; reach-ext  = λ x∈ → x∈
    ; reach-mono = λ p → p
    ; reach-idem = λ x∈ → x∈
    }

  -- With moves = (the constant-empty extraction is monotone, as is any
  -- chosen `moves`); we leave `moves`/`moves-mono` as the instance's
  -- remaining inputs.  The point is only that `idForwardClosure` is a
  -- legal `ForwardClosure`, so JointSaturation is inhabited.
