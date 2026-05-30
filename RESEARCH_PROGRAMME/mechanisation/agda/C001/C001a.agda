------------------------------------------------------------------------
-- C001a — JSL-fragment of the Ambler bridge, toy mechanisation
--
-- Statement: Art(Cᵢ) ≅ Hom_{JSL}(Gen, Art(Cᵢ))
-- where Gen is the free JSL on one generator, and ≅ is up to set-
-- equality ≈ᶜ on Cone (a setoid layer, per finding F2).
--
-- This file replaces the earlier Toy.agda after the C001 split into
-- C001a (JSL fragment) and C001b (Ambler-specific remainder), motivated
-- by findings F1/F2/F3 recorded in C001-ambler-bridge-iso.md
-- §Mechanisation strategy.
--
-- Status: type-checks WITHOUT POSTULATES OR HOLES.
-- Tested against: Agda 2.8.0, agda-stdlib v2.0.
--
-- This is *evidence* for C001a, not a positive settlement. See
-- C001a-jsl-fragment-bridge.md §Mechanisation for the human-review
-- obligations that remain.
--
-- Substrate cross-references:
--   T001 (per-cone JSL: order is set-inclusion, join is set-union)
--   T002 (Inc(B) is an antichain; cone decomposition)
--   C001  (parent: full Ambler bridge)
--   C001a (this artefact: the JSL fragment, up to ≈ᴰ)
--   C001b (sibling: Ambler-specific remainder, deferred)
------------------------------------------------------------------------

{-# OPTIONS --without-K #-}

module C001a where

open import Data.List using (List; []; _∷_; _++_)
open import Data.List.Membership.Propositional using (_∈_)
open import Data.List.Membership.Propositional.Properties
  using (∈-++⁺ˡ; ∈-++⁺ʳ; ∈-++⁻)
open import Data.Product using (Σ; _×_; _,_; proj₁; proj₂)
open import Data.Sum using (inj₁; inj₂)
open import Data.Nat using (ℕ)
open import Function using (id; _∘_)
open import Relation.Binary.PropositionalEquality using (_≡_; refl)

------------------------------------------------------------------------
-- §1.  Toy signature A_Γ
--
-- Confidence annotations from the earlier Toy.agda are *dropped* here:
-- they are C001b's territory (the erasure square does not live in the
-- JSL fragment).
------------------------------------------------------------------------

module Sig where

  data Op : Set where
    pro : Op
    con : Op

  arity : Op → ℕ
  arity pro = 1
  arity con = 2

------------------------------------------------------------------------
-- §2.  Toy designs and inclusion
--
-- _⊆ᴰ_ is now functional ("every move of D is a move of D'"), which
-- composes cleanly under transitivity and lifts to a setoid ≈ᴰ
-- (finding F2) with no friction.
------------------------------------------------------------------------

module Designs where

  open Sig

  data Move : Set where
    mv : (op : Op) (children : List Move) → Move

  Design : Set
  Design = List Move

  -- Set-inclusion: every member of D is a member of D'.
  _⊆ᴰ_ : Design → Design → Set
  D ⊆ᴰ D' = ∀ {m} → m ∈ D → m ∈ D'

  ⊆ᴰ-refl : ∀ {D} → D ⊆ᴰ D
  ⊆ᴰ-refl = id

  ⊆ᴰ-trans : ∀ {D₁ D₂ D₃} → D₁ ⊆ᴰ D₂ → D₂ ⊆ᴰ D₃ → D₁ ⊆ᴰ D₃
  ⊆ᴰ-trans p q = q ∘ p

  -- Set-union as join (T001, literal chronicle-set union inside a cone).
  _∪ᴰ_ : Design → Design → Design
  _∪ᴰ_ = _++_

  -- Left/right injection lemmas for ∪ᴰ.
  ⊆ᴰ-++ˡ : ∀ {D₁ D} D' → D₁ ⊆ᴰ D → D₁ ⊆ᴰ (D ++ D')
  ⊆ᴰ-++ˡ D' p x = ∈-++⁺ˡ (p x)

  ⊆ᴰ-++ʳ : ∀ {D₂ D'} D → D₂ ⊆ᴰ D' → D₂ ⊆ᴰ (D ++ D')
  ⊆ᴰ-++ʳ D p x = ∈-++⁺ʳ D (p x)

  -- Universal property of join: D₁ ∪ D₂ ⊆ D whenever both fit in D.
  -- This is the key lemma for the iso's pres-⊔ obligations.
  ⊆ᴰ-++-collapse : ∀ {D₁ D₂ D} → D₁ ⊆ᴰ D → D₂ ⊆ᴰ D → (D₁ ++ D₂) ⊆ᴰ D
  ⊆ᴰ-++-collapse {D₁} p q m∈ with ∈-++⁻ D₁ m∈
  ... | inj₁ m∈D₁ = p m∈D₁
  ... | inj₂ m∈D₂ = q m∈D₂

  -- Set-equality on Design (finding F2).
  _≈ᴰ_ : Design → Design → Set
  D ≈ᴰ D' = (D ⊆ᴰ D') × (D' ⊆ᴰ D)

  ≈ᴰ-refl : ∀ {D} → D ≈ᴰ D
  ≈ᴰ-refl = ⊆ᴰ-refl , ⊆ᴰ-refl

  ≈ᴰ-sym : ∀ {D D'} → D ≈ᴰ D' → D' ≈ᴰ D
  ≈ᴰ-sym (p , q) = q , p

  ≈ᴰ-trans : ∀ {D₁ D₂ D₃} → D₁ ≈ᴰ D₂ → D₂ ≈ᴰ D₃ → D₁ ≈ᴰ D₃
  ≈ᴰ-trans (p , q) (p' , q') = ⊆ᴰ-trans p p' , ⊆ᴰ-trans q' q

------------------------------------------------------------------------
-- §3.  Cones and the per-cone JSL Art(Cᵢ) (T001, T002)
------------------------------------------------------------------------

module Cones where

  open Designs

  -- The cone above Dᵢ packages the inclusion witness.
  Cone : Design → Set
  Cone Dᵢ = Σ Design (λ D → Dᵢ ⊆ᴰ D)

  cone-bot : ∀ Dᵢ → Cone Dᵢ
  cone-bot Dᵢ = Dᵢ , ⊆ᴰ-refl

  cone-join : ∀ {Dᵢ} → Cone Dᵢ → Cone Dᵢ → Cone Dᵢ
  cone-join (D , p) (D' , _) = (D ++ D') , ⊆ᴰ-++ˡ D' p

  -- Setoid on the cone: equal up to ≈ᴰ on underlying designs.
  _≈ᶜ_ : ∀ {Dᵢ} → Cone Dᵢ → Cone Dᵢ → Set
  p ≈ᶜ q = proj₁ p ≈ᴰ proj₁ q

  ≈ᶜ-refl : ∀ {Dᵢ} {p : Cone Dᵢ} → p ≈ᶜ p
  ≈ᶜ-refl = ≈ᴰ-refl

  ≈ᶜ-sym : ∀ {Dᵢ} {p q : Cone Dᵢ} → p ≈ᶜ q → q ≈ᶜ p
  ≈ᶜ-sym = ≈ᴰ-sym

------------------------------------------------------------------------
-- §4.  Gen — the free JSL on one generator (finding F3)
--
-- The two elements: ⊥g (bottom), *g (the generator).
-- Join: ⊥g ⊔ y = y;  *g ⊔ y = *g.  (i.e., *g is the top; the JSL is the
-- two-element chain {⊥g ≤ *g}.)
------------------------------------------------------------------------

module Gen where

  data Gen : Set where
    ⊥g : Gen
    *g : Gen

  _⊔g_ : Gen → Gen → Gen
  ⊥g ⊔g y = y
  *g ⊔g _ = *g

------------------------------------------------------------------------
-- §5.  JSL homomorphisms Gen → Art(Cᵢ)
--
-- Preservation of ⊥ and ⊔ is required (finding F1); equality on the
-- codomain is up to ≈ᶜ (finding F2).
------------------------------------------------------------------------

module JSL-Hom where

  open Designs
  open Cones
  open Gen

  record JSLHom (Dᵢ : Design) : Set where
    field
      map      : Gen → Cone Dᵢ
      pres-bot : map ⊥g ≈ᶜ cone-bot Dᵢ
      pres-⊔   : ∀ x y → map (x ⊔g y) ≈ᶜ cone-join (map x) (map y)

  -- Hom-set equality: pointwise up to ≈ᶜ.
  _≈H_ : ∀ {Dᵢ} → JSLHom Dᵢ → JSLHom Dᵢ → Set
  h ≈H k = ∀ g → JSLHom.map h g ≈ᶜ JSLHom.map k g

------------------------------------------------------------------------
-- §6.  The bridge: Art(Cᵢ) ≅ Hom_{JSL}(Gen, Art Cᵢ)
--
--   fromHom h := h(*g)         (a cone element)
--   toHom   c := the unique JSL-hom sending *g to c
--                              (forced: ⊥g must go to cone-bot Dᵢ)
------------------------------------------------------------------------

module Bridge where

  open Designs
  open Cones
  open Gen
  open JSL-Hom

  fromHom : ∀ {Dᵢ} → JSLHom Dᵢ → Cone Dᵢ
  fromHom h = JSLHom.map h *g

  -- toHom: each of the four pres-⊔ cases is discharged by a pair
  --   (forward ⊆, backward ⊆) built from ⊆ᴰ-++-collapse, ⊆ᴰ-++ˡ /
  --   ⊆ᴰ-++ʳ, ⊆ᴰ-refl, and the cone witness proj₂ c.
  toHom : ∀ {Dᵢ} → Cone Dᵢ → JSLHom Dᵢ
  toHom {Dᵢ} c = record
    { map      = m
    ; pres-bot = ≈ᴰ-refl
    ; pres-⊔   = pres
    }
    where
      m : Gen → Cone Dᵢ
      m ⊥g = cone-bot Dᵢ
      m *g = c

      pres : ∀ x y → m (x ⊔g y) ≈ᶜ cone-join (m x) (m y)
      -- ⊥g ⊔ ⊥g = ⊥g.  LHS = Dᵢ;     RHS = Dᵢ ++ Dᵢ.
      pres ⊥g ⊥g = ⊆ᴰ-++ˡ Dᵢ ⊆ᴰ-refl
                 , ⊆ᴰ-++-collapse ⊆ᴰ-refl ⊆ᴰ-refl
      -- ⊥g ⊔ *g = *g.  LHS = proj₁ c; RHS = Dᵢ ++ proj₁ c.
      pres ⊥g *g = ⊆ᴰ-++ʳ Dᵢ ⊆ᴰ-refl
                 , ⊆ᴰ-++-collapse (proj₂ c) ⊆ᴰ-refl
      -- *g ⊔ ⊥g = *g.  LHS = proj₁ c; RHS = proj₁ c ++ Dᵢ.
      pres *g ⊥g = ⊆ᴰ-++ˡ Dᵢ ⊆ᴰ-refl
                 , ⊆ᴰ-++-collapse ⊆ᴰ-refl (proj₂ c)
      -- *g ⊔ *g = *g.  LHS = proj₁ c; RHS = proj₁ c ++ proj₁ c.
      pres *g *g = ⊆ᴰ-++ˡ (proj₁ c) ⊆ᴰ-refl
                 , ⊆ᴰ-++-collapse ⊆ᴰ-refl ⊆ᴰ-refl

  -- Triangle 1: fromHom ∘ toHom ≡ id (propositionally, by reduction).
  from-to : ∀ {Dᵢ} (c : Cone Dᵢ) → fromHom (toHom c) ≡ c
  from-to _ = refl

  -- Triangle 2: toHom ∘ fromHom ≈H id (pointwise up to ≈ᶜ).
  -- At ⊥g: both sides give cone-bot Dᵢ up to ≈ᶜ-sym pres-bot.
  -- At *g: both sides give h(*g) definitionally.
  to-from : ∀ {Dᵢ} (h : JSLHom Dᵢ) → toHom (fromHom h) ≈H h
  to-from h ⊥g = ≈ᴰ-sym (JSLHom.pres-bot h)
  to-from h *g = ≈ᴰ-refl

------------------------------------------------------------------------
-- §7.  What this proves and what it doesn't
--
-- PROVED (in this toy):
--   - The JSL-fragment of the Ambler bridge as the unit of the
--     free/forgetful adjunction between Set and JSL, instantiated at
--     the cone JSL Art(Cᵢ), with equality at the setoid ≈ᶜ.
--   - All four cases of pres-⊔ discharge from the universal property
--     of set-union (⊆ᴰ-++-collapse) plus the cone witness.
--
-- NOT PROVED (deferred to C001b or human review):
--   - Faithfulness of the toy signature Sig to Ambler 1996.
--   - The confidence-erasure square (the toy drops Conf entirely).
--   - The cartesian-closed and additive structure of A_Γ beyond JSL.
--   - The match between the toy's flat List Move designs and the
--     substrate's chronicle-tree designs.
--
-- See C001a-jsl-fragment-bridge.md §Mechanisation for the full list.
------------------------------------------------------------------------
