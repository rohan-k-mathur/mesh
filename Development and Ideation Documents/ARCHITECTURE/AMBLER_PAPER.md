#### Mathematical Structures in Computer

#### Science

#### http://journals.cambridge.org/MSC

###### Additional services for Mathematical Structures in

###### Computer Science:

###### Email alerts: Click here

Subscriptions: Click here
Commercial reprints: Click here
Terms of use : Click here

#### A categorical approach to the semantics of

#### argumentation

#### Simon Ambler

Mathematical Structures in Computer Science / Volume 6 / Issue 02 / April 1996, pp 167 - 188
DOI: 10.1017/S0960129500000931, Published online: 04 March 2009

**Link to this article:** [http://journals.cambridge.org/abstract_S](http://journals.cambridge.org/abstract_S)

**How to cite this article:**
Simon Ambler (1996). A categorical approach to the semantics of argumentation. Mathematical
Structures in Computer Science, 6, pp 167-188 doi:10.1017/S

**Request Permissions :** Click here

**Downloaded from [http://journals.cambridge.org/MSC,](http://journals.cambridge.org/MSC,) IP address: 141.214.17.222 on 15 Mar 2015**


Math. Struct, in Comp. Science (1996), vol. 6, pp. 167-188 Copyright © Cambridge University Press

## A categorical approach to the semantics of

## argumentation

```
SIMON AMBLER^1
Department of Mathematics and Computer Science, University of Leicester,
Leicester LEI 7RH, England.
Received 27 November 1992; revised 15 April 1995
```
Argumentation is a proof theoretic paradigm for reasoning under uncertainty. Whereas a
'proof establishes its conclusion outright, an 'argument' can only lend a measure of support.
Thus, the process of argumentation consists of identifying all the arguments for a particular
hypothesis <f>, and then calculating the support for </> from the weight attached to these
individual arguments. Argumentation has been incorporated as the inference mechanism of
a large scale medical expert system, the 'Oxford System of Medicine' (OSM), and it is
therefore important to demonstrate that the approach is theoretically justified. This paper
provides a formal semantics for the notion of argument embodied in the OSM. We present a
categorical account in which arguments are the arrows of a semilattice enriched category.
The axioms of a cartesian closed category are modified to give the notion of an 'evidential
closed category', and we show that this provides the correct enriched setting in which to
model the connectives of conjunction (&) and implication (=>).

```
Finally, we develop a theory of 'confidence measures' over such categories, and relate this to
the Dempster-Shafer theory of evidence.
```
1. Introduction
In almost any practical application, the design of a decision support system (DSS) involves
some component of reasoning under uncertainty. This is as true in medicine as it is in
many other areas where such systems are used: in business and finance, engineering and
so forth. Medical decisions are rarely clear cut and usually involve some weighing up of
evidence (in the case of a diagnostic aid) or costing of benefit (in a treatment planner).
There is a strong tradition of Bayesian statistics in medicine, and many of the diagno-
sis systems currently available are based on corresponding mechanisms of probabilistic
inference. These systems have a secure theoretical foundation, but suffer serious practical
problems as the intended range of the system increases. In particular, it becomes increas-
ingly difficult to elicit reliable values for the requisite prior and conditional probabilities.
There is often insufficient clinical data to calculate these directly and many of the larger
systems resort to the use of 'subjective probabilities' estimated by a medical expert. A
more important criticism from the point of view of practical decision making is that
probabilistic systems are problem specific. They require that all the factors that may be

```
f Research supported under the DTI/SERC project no. 1822 : A Formal Basis for Decision Support Systems.
```

S. J. Ambler 168

relevant to a decision are identified in advance at the design stage, and hence fail to
provide a flexible approach to decision support.
The 'Oxford System of Medicine' (OSM) is the prototype for a general purpose
decision support tool aimed at the General Practitioner (Fox et al. 1990). It is intended
to provide support for a variety of decision making tasks (treatment and referral as well
as diagnosis) across the full breadth of medicine. Consequently, probabilistic methods
have been rejected as inappropriate. Instead, the OSM employs a simple yet effective
mechanism of 'reasoning by argument', which can be explained as follows. Suppose that
we have a number of competing hypotheses, possibly just <j> and ->$, and that we want to
decide between them. We might propose a number of arguments in favour of each and
decide between them according to the relative strength of these arguments. In the case of
medical diagnosis, we propose arguments for each of the possible diagnoses, and present
the diagnosis with the greatest support as the most likely explanation of the patient's
condition.
Although simple, this process of weighted argumentation is surprisingly effective. This
is perhaps because it corresponds closely to the actual inference process that a doctor
might use ('weighing up the pros and cons'). It is robust and performs well in situations
where information is relatively sparse. Furthermore, empirical studies have shown that
its performance compares favourably with that of a probabilistic system (O'Neil and
Glowinski 1991), even in the restricted domains where probabilistic systems do well. This
reflects the fact that, at least in medical diagnosis, the correct identification of all the
relevant factors is more important than the particular weights or conditional probabilities
assigned to them.
Despite the success of the 'argumentation' paradigm in a real world application, it is
not clear, a priori, that it is theoretically justified. The aim of this paper is to give a precise
semantics to the notion of argument embodied in the OSM, and hence demonstrate the
validity of argumentation as a method of reasoning under uncertainty.
This is done axiomatically by modifying the categorical analysis of proof in intuitionistic
logic. Recall that this is based on the Curry-Howard isomorphism (Girard et al. 1989),
which relates the proofs of the (&,=>) fragment of intuitionistic or minimal logic to
terms of the simply typed A-calculus, and hence to the arrows of a free cartesian closed
category (Lambek and Scott 1986). In fact, this correspondence extends further so that
any cartesian closed category can be viewed as a deductive system; the valid propositions
being just the objects with a global element. We would like to define the notion of a
'category of arguments' so that any category that matches this definition can be viewed
as a system of uncertain inference. The success of this claim depends on the provision of
a general theory of the strength of an argument that applies to all such categories.
Arguments have the form of logical proof so it is reasonable to expect terms of the simply
typed A-calculus to provide an example. The crucial difference between argumentation and
proof is that an argument is not necessarily expected to establish its conclusion outright.
For instance, if a typed 1-term t contains free variables, these correspond to assumptions in
the current context T and any uncertainty associated with these assumptions is inherited
by the argument t. If, on the other hand, t is a closed term, it is unaffected by such
uncertainty and we may regard it as a logical proof. Thus, proofs can be identified as


A categorical approach to the semantics of argumentation 169

a special kind of argument: those that are always certain. As an argument, in general,
will only lend a degree of support, we are concerned with accumulation or aggregation
of distinct arguments for the same proposition, and hence the objects of interest are
finite sets of A-terms in a particular context F. We note that these form the arrows of
a semilattice enriched category j/p, and this is the primary example on which we base
the general theory of evidential closed categories in Section 2. A second example will be
given by the category Rel of sets and relations, which is important mainly as a source of
counterexamples.
As in the case of intuitionistic or minimal logic, the connectives & and => are modelled
by categorical structure on s/. This is given as extra data rather than specified via
universal properties. In particular, conjunction corresponds to a tensor product on s/
with a specified comonoid structure on each object. The structure that we will describe is
similar to that of a 'cartesian bicategory' (Carboni and Walters 1987) or 'cartesian sup-
category' (Pitts 1988), both of which generalise the idea of a category of relations. There is
also some connection with the 'dominical categories' of DiPaola and Heller (1987), which
generalise categories of partial maps.
In Section 3, we will give an abstract definition of the strength of an argument in terms
of a confidence measure on an evidential closed category. This is motivated as follows.
Imagine a dialogue in which the first person proposes arguments and the second person
either accepts or rejects them according to whether or not he or she finds them convincing.
The strength of argument required will vary according to the standards and beliefs of
the second person. For example, a logician will only accept logical proof, whereas a
more trusting individual might tolerate nonlogical steps providing that the argument is
otherwise well formed. We can measure our confidence in a particular argument in various
ways. We might, for example, look at the set of people who would accept it, or at the
time taken to convince a particular person, or simply rate it on a scale of 0 to 10. These
measures may look quite ad hoc, but we will see that they all share the same basic
mathematical properties.

```
1.1. A rational reconstruction of the OSM
```
The following example of diagnosis and treatment illustrates the key features of argu-
mentation and the way in which it is used by the OSM.

Example 1. Suppose that we were to advise a doctor on the possible treatment of a patient
who is complaining of muscular aches and pains. Aspirin is an effective remedy for muscle
pain, and we might cautiously propose this as an argument for prescribing aspirin. The
reason for caution is that aspirin cannot be taken by anyone suffering from a gastric ulcer.
If there were any evidence to suggest that the patient might have a gastric ulcer, if he
mentioned stomach pain after meals for instance, this would be a strong argument against
prescribing aspirin. The doctor will weigh up the arguments presented and presumably
reject the hypothesis of prescribing asprin to a patient suffering from both muscle pain
and stomach pain.
On the other hand, if the patient is known to be going through a period of stress or
anxiety, this may account for any stomach pain. Provided that all the symptoms have


```
S. J. Ambler 170
```
been sufficiently short term, we could argue against the presence of a gastric ulcer. This,
in turn, would give us a much stronger argument for the prescription of aspirin and the
hypothesis might now be accepted.
The machine solution of this problem uses the following set of facts, which would be taken
from some large context F representing the database of medical knowledge available to
us.
t\ : muscle_pain => aspirin 0.
ti : muscle-pain & not_gastric_ulcer => aspirin 0.
c\ : gastricjulcer => not.aspirin 1.
i\ : stomach_pain => gastric_ulcer 0.
i2 '• short_term & anxiety => not_gastric_ulcer 0.
The arguments to support a particular proposition can be produced automatically
by a suitable 'argumentation theorem prover' (ATP). The particular one that has been
developed as part of the Praxis project is a Prolog implementation of a simple backward
chaining algorithm. The arguments are returned as A-terms using the de Bruijn notation
for bound variables. The degree of support that these lend to the proposition depends
on the atomic steps that they use. Each of the facts above has been assigned a strength,
or confidence, in the interval [0,1]. We will give several ways to assess the strength of a
chain of argument, but the simplest is to take the strength of its weakest link. Adopting
this rather simple scheme, we obtain the following dialogue with the ATP.
argue(muscle_pain & stomach_pain => aspirin, Args, Conf).

Args = [\? apply(tl,fst(0))]
Conf =0.

```
argue(muscle_pain & stomach_pain => not_aspirin, Args, Conf).
```
Args = [\? apply(cl,apply(il,snd(0)))]
Conf =0.

Thus, if the patient complains of muscle pain and stomach pain and we have no further
evidence, we would not recommend aspirin. The argument against carries greater weight.

```
argue(muscle_pain & stomach_pain &
short_term & anxiety => aspirin, Args, Conf).
```
```
Args = [\? apply(tl,fst(0)),
\? apply(t2,pair(fst(0),apply(i2,snd(snd(0)))))]
Conf =0.
```
```
argue(muscle_pain & stomach_pain &
short_term & anxiety => not_aspirin, Args, Conf).
```
```
Args = [\? apply(cl,apply(il,fst(snd(O))))]
Conf =0.
```

```
A categorical approach to the semantics of argumentation 171
```
On the other hand, given additional evidence to show that the patient does not have a
gastric ulcer, we obtain a stronger argument in favour of aspirin and the decision would
be reversed.
There are two main points to note here. The first is the role of contradiction. The
evidence supplied by a patient will often contain conflicting information. Nevertheless,
we must continue to reason effectively in the face of an apparent contradiction. The
approach taken here is to treat contradiction at the meta-level rather than within the
logic. Thus, the notion of negation is not explicit in our logic. The propositions aspirin
and not_aspirin are competing hypotheses but there is nothing to suggest that they
are either complementary or exclusive. If there are arguments for both, we can resolve
the contradiction by making a decision at the meta-level. However, we might just as well
leave it unresolved as in the case of gastric.ulcer verses not_gastric_ulcer above.
The issues of treating contradiction at the meta-level are explored more thoughly in other
papers (Fox, Krause and Ambler 1992; Krause et al. 1995). Here we will merely accept it
as a convenient simplification.
The second point is the the method of aggregation. In the scheme adopted here, if there
are several arguments for the same proposition </>, the support for <f> is taken to be the
strength of the strongest one; the presence of additional arguments has no effect. Later on,
in Section 3.1, we will introduce a probabilistic notion of strength. This has the property
that independent arguments will mutually reinforce each other so that their combined
strength is greater than that of either one alone. Under this latter scheme the support
for aspirin would rise to 0.616 (the two arguments are assumed to be indendent - tj
represents the extra force of argument that we can use if the patient is known not to have
a gastric ulcer).
Note, however, that the aggregation of arguments is necessarily monotone. To overturn a
decision one must supply a stronger argument on the other side. There is no mechanism
for one argument to defeat or undercut another. Thus, the argumentation approach to
default reasoning is to pose default arguments with sufficient caution that they might later
be overruled.

```
1.2. The syntactic category
```
To construct a category S^Y whose arrows correspond to finite sets of A-terms in the
context F, we first construct a category %>r whose arrows correspond to single 1-terms.
Let i? denote the simply typed A-calculus with pairing. We recall (Girard et al. 1989)
that the Curry-Howard isomorphism demonstrates an equivalence between natural de-
duction proofs in the (&, =>) fragment of minimal logic and terms of if such that proof
normalisation corresponds to fin reduction.
There is a well-known construction (Lambek and Scott 1986) that relates a syntactic
category C{2T) to a type theory 2T. Applying this to <£, we obtain something that would
be a cartesian closed category but for the absence of a terminal object. Adjoining a unit
type to JSf in the most obvious way is problematic because the required reduction rules
fail to satisfy the Church-Rosser property. If we were to modify the theorem prover in


S. J. Ambler 172

this way, the proof terms would no longer have a unique normal form. We avoid the
problem by treating the unit type as a special case.
Let if i denote the following extension of <£. The types of if i are those of !£ together
with a unit type 1, and the terms are those of if together with a special variable *. We
extend the type inference relation of i? by the following three rules.

```
T\-t :B r\-t:B
(1)
Phi t :B r,* : Ihi t :B T h • : 1
```
Note that * is the only term of type 1 and that it never appears as a subterm of anything
but itself. There is therefore no need to introduce reduction rules for the unit type.
If F is a context in if, we define a syntactic category #r as follows. The objects of <^r
are the types of i?i, and the morphisms from A to B are given by equivalence classes of
pairs (x, t), where x is a variable and t is a term such that

```
T,x:A\-it:B (2)
```
is derivable in i?i under the equivalence relation defined by fir\ conversion and change of
bound variables (including x). Let (x« i) denote the equivalence class containing (x,t).
Composition is given by substitution

```
(3)
```
and identities are maps of the form (x >-* x). It is routine to verify that this data defines
a category.

Proposition 2. <^r is a cartesian closed category.

Proof. The cartesian product and internal horn are given by extending the type building
operations x and => by the following definitions,

```
J y 1 — A — | y J ( 1 —*» A \ — A (A —K. 1ft — \ IA \
i~\. S\ Jl — J~\. — Jl S\ r\. yx —r s\ I — j*i \*~*- ~~^ '/ — •" • V /
```
That is, the usual canonical isomorphisms are supressed. We define the various other data
accordingly. The projections nB,c • B x C -» B and n'BC : B x C -» C are defined by

```
(y^*) B = l ( lc B = \
-> •) C = \ (5)
(z i-> fst(z)) otherwise [ (zi-» snd(z)) otherwise,
```
and the pairing of maps (xi->s) : A —• B and (x *-* t) : A —» C is given by

```
B ^ 1 = C
```
```
B = I = C.
```
The evaluation maps £B,C : {B => C) x B —> C are defined by

```
lc B = 1
) C = \ (7)
(y i-> fst(y)(snd(y))) otherwise,
```

```
A categorical approach to the semantics of argumentation 173
```
```
and the currying of a map (x i-» t) : A x B —» C is given by
```
```
( {y^kz.t[{y,z)/x]) A±\±C,B±\
{*^Xx.t) A = 1^C,B^
(y~*) A^1=C,B^1 (8)
(•(-••) A = \=C,B±\
```
```
A(x i-» t) =
```
```
We need to check that these data satisfy the equations defining a cartesian closed category:
this is routine, though tedious. •
```
2. Evidential categories

In this section, we examine the structure required for a category s4 to be regarded as a
category of propositions and arguments. The main example is a category s/r, which has
the same objects as <«?r but whose morphisms / € s/r(A,B) are finite sets of morphisms
in t>r(A,B). Though the structure that we propose is quite abstract and derived from first
principles, it nevertheless captures the important features of this example.
It is useful to represent the process of accumulating or aggregating arguments as an
explicit operation on the hom-sets; in fact, this is central to our treatment. If/ and g are
arguments from A to B, their aggregate / V g : A —> B is the argument whose content is
precisely that of/ and g considered separately. That is, / Vg is the argument that says:
"I have two reasons for believing that B follows from A,
and they are '/' and 'g'."
We also introduce the idea of a vacuous argument from A to B. This is the argument 0
that has no content and that no-one should accept. In the case of S#Y, the aggregation of
two finite subsets of ^r(A,B) is just their union and the vacuous argument from A to B
is the empty set. It seems clear that, in a general category of arguments s/, aggregation
should have the elementary properties of union, so that arguments from A to B form a
join semilattice (J^(A,B),V,0)
Consider the following arrows in s#.
/Vg

```
0
```
```
We need to ascribe a meaning to the various composite arrows. For instance, the only
sensible way to interpret h{f\/g) as an argument is to equate it with hfvhg. This is borne
out by considering composition in s/r, where the composite of finite sets / c <gr(A,B)
and g s ^r(B, C) is the set of composites {/fa | a € /,/? G g}. We therefore require that
```

S. J. Ambler 174

composition distributes over the semilattice structure of the hom-sets:

```
(/Vg)/c=//cVg/c
M) = 0 Ofc = 0, l '
```
and hence that si is an SLat-enriched category. We will attempt to formulate the semantics
of argumentation, as far as possible, within the theory of SLat-enriched categories. This
provides a much needed guiding principle, which directs the rest of the theory.

2.1. Conjunction

We now consider the categorical structure needed on an SLat-category s4 to represent
conjunction. In the case of ordinary categories, this would be given by a cartesian product,
but in the context of SLat-categories, this view is too simplistic because finite products
coincide with their corresponding coproducts so conjunction becomes confused with
disjunction. We therefore seek to modify the standard account.
It is natural to require that the conjunction of arguments distributes over aggregation
in much the same way as their composition. Thus, conjunction corresponds to an SLat-
functor ® : si®si —• si, where ® denotes the tensor product of SLat-categories. The
associativity, commutativity, and unit laws of conjunction are expressed via natural
isomorphisms satisfying the usual coherence conditions (Kelly 1982). The structure so far
described is a symmetric monoidal SLat-category, and hence corresponds to a simple form
of linear logic (Girard 1987). To capture the full strength of conjunction, we require that
each object comes equipped with a specified comonoid structure that provides arguments
to duplicate and eliminate hypotheses.
We will call the functor ® the evidential product on si. Intuitively, an arrow into A
provides evidence for A, and hence an arrow into A ® B is the conjunction of evidence for
A and evidence for B.

Definition 3. An SLat-category si is evidential if there exists an SLat-functor

```
and object / of stf, together with isomorphisms
```
```
axjz • (X®Y)®Z
```
and morphisms

such that

```
1 the underlying
```
```
CX,Y •
rx :
```
```
category (si 0 , i
```
```
X(
X(
```
```
AX
tX
```
```
g> Y ->
```
```
: X
: X
```
```
a, c, r)
```
```
> Y
```
### x,

### ->

### -

```
is
```
```
®X
```
##### x®x

```
I
```
```
symmetricmonoidal,
for each object X of s/, the structure C(X) = (X, Ax, tx) is a commutative comonoid
in si,
```

A categorical approach to the semantics of argumentation 175

3 C(I) = (I,r]-^1 ,1/) and C(X ® Y) = (X ® F,m(Az ® Ay),r 7 (tx ® ty)) where m is the
'middle four interchange',
4 each morphism / : X —» 7 in ,«/ is a lax homomorphism of comonoids C(X) —• C(Y),
that is, the following inequalities hold

```
/®/ (10)
```
```
fy
```
This definition should be compared with that of a 'cartesian bicategory' given in Carboni
and Walters (1987) and the related idea of a 'cartesian sup-category' given in Pitts (1988).
The main difference being that we drop the requirement that the maps tx and Ax have
right adjoints. We make up for this loss with the inclusion of Condition 3, which relates
the comonoid structure on si to the tensor product. It says that the comonoid structure
on / is the trivial one and that the comonoid structure onX ®Y is the tensor product of
those on X and Y.
Given diagram (10), it is tempting to think that the morphisms tx and Ax are the
components of corresponding lax natural transformations. However, in neither case is
the codomain an SLat-functor, so such a description would lie outside the framework of
SLat-enriched category theory. It is therefore not clear whether the comonoid structure
on si can be related to an adjunction in the manner of Carboni et al. (1990).

Example 4. Every CSLat-category that is cartesian in the sense of Pitts (1988) is also an
evidential category. In particular, the category Rel of sets and relations is an evidential
category with X ® Y = {(x,y) \ x € X,y € Y} and / = {*}.

Example 5. Given any category <€, we can define an SLat-category £?finC^) as follows:
the objects of {p^ffi) are those of <€; morphisms in £?fin(<i?)(/4, B) are finite sets of
morphisms in ^(A,B); identities are the singletons {1^}; and composition is given by the
multiplication of 'complexes'

```
(11)
```
In fact, pfinW is the free SLat-category generated by (€. If <€ has finite products,
is an evidential category with ® given by

```
i — lai x Pjl\<i<n,l<j<m (,iz;
```
and a, c, r, A, t given by the evident singletons.
In particular, let ^r be the syntactic category generated by the context P. Then
^fin(^r) is the evidential category whose objects are types and whose morphisms A —> B
are finite sets of equivalence classes (x i—> t) e #r- We adopt the following notation for
arrows in <s/r-

```
<i<n}. (13)
```

```
S. J. Ambler 176
```
Example 6. Let D be a distributive lattice and let S> denote the corresponding one object
SLat-category with 3{*, *) = D, composition given by meet and 1. = T. Then Qi is an
evidential category in which all the distinguished maps are equal to T and the tensor
product of maps is also given by meet.
In fact, any one object evidential category is of this form, since we can show that
t. = A. = r, = 1,, and hence by diagram (10) the tensor product is a meet. It coincides
with composition, since / ® g = (/ ® 1)(1 ® g) = /g.

```
2.2. Selected Maps
The notion of an evidential category should be regarded as a suitable translation of that
of a 'category with finite products' from the context of ordinary categories to that of
SLat-categories. In this section, we will see that the evidential product retains some of the
properties of a cartesian product and show that we can recover a cartesian product from
it by restricting to a particular class of 'selected' morphisms.
Given an evidential category si, we can define 'projections' for the evidential product:
```
```
PX,Y =
```
```
where lY is the isomorphism rycjj : I ® Y —* Y. We can also define the 'pairing'
(f,g) : X ->• Y ® Z of morphisms /'' : X -> Y and g : X -> Z via
```
```
(/,g>=(/®g)A*. (15)
```
As ® is bilinear, these cannot satisfy the usual equations defining a cartesian product. For
instance, p(/,0) = 0 regardless of/.
Lemma 7. The following inequalities hold in any evidential category:

```
P(f,g) < f (16)
«</.«> £ g (17)
h < (ph,qh). (18)
```
```
Proof. We can show (16) as follows:
P(f,g) = r(f ® tg)A = fr(l ® tg)A < fr{\ ® t)A = /, (19)
```
```
and similarly for (17). To verify (18), we observe that
(p®q)Ax®Y = (r
= (r ® Z)m((l ® fr)Ax ® (*y ® l)Ay) (20)
= (r ® l)m(r-^1 ® Tl),
which, by coherence, is the identity on X ® Y. It follows that
```
```
h = (p ® q)Ah < (p ® q)(h ® Ji)A = (ph,qh). (21)
```
# •

```
It is reasonable to ask for what class of maps do the converse of these inequalities hold.
```

```
A categorical approach to the semantics of argumentation 177
```
Definition 8. A morphism / : X —> Y in an evidential category si is said to be simple if
the right-hand side of diagram (10) commutes exactly (that is, Ay/ = (/ ®/)Ax), and
entire if the left-hand side commutes exactly (that is, tx = tYf). It is said to be selected if
it is both simple and entire, that is, if it is a strict homomorphism of comonoids.
Example 9. If ^ is a category with finite products, then / e ^^(^(A, B) is simple if
it contains at most one element and entire if it contains at least one element. Thus, the
selected maps in pfinC^) are the singletons.
Example 10. A relation F £ X x Y is simple if and only if it is single-valued (that is, xFy
and xFy' implies y = y') and entire if and only if it is total (that is, for all x G X there
exists a y such that xFy). Thus, the selected maps in Rel are the functions.
It is clear from the proof of Lemma 7 that p(f,g) = f provided that g is entire, and
h = (ph, qh) provided that h is simple. So, in particular, the inequalities (16) to (18) become
equalities when all the maps are selected.
Lemma 11.
1 Every morphism with a right adjoint is selected; in particular, every isomorphism is
selected.
2 The morphisms tx and A# are selected for all X.
3 The composition and tensor product of selected maps are selected.
Proof.
1 Let /* be right adjoint to / : X -• Y. Then tx < txf'f < tYf and (/ ® f)Ax <
(f ® f)Axf'f < (//* ®ff')Axf < Axf. It follows that / is selected, since the converse
inequalities hold by definition.
2 The commutativity of the appropriate squares can be verified from the data given in
Condition 3 of Definition 3. There is a sizeable diagram chase required to check that
AX®A-AX = (Ax ® Ax)Ax, but this is otherwise routine.
3 That selected maps are closed under composition is trivial, and closure under tensor
product follows easily from Condition 3 of Definition 3. •

We note that in Rel, the selected maps are precisely the ones with right adjoints.
However, this property is specific to Rel and does not hold, for example, in ^?finC^).
The following result relates an evidential product to a cartesian one.

Proposition 12. Let {si,®,I) be an evidential category and let y be the subcategory of
the underlying category s/ 0 whose objects are those of si and whose morphisms are
selected maps. Then / is a terminal object in y and the tensor product ® restricts to a
cartesian product on y in such a way that the coherence maps of <g> become the canonical
coherences of a cartesian product.

Proof. That / is terminal in y follows immediately from the fact that selected maps
are entire.
By Lemma 11, y contains the projections pXy and qXj for all X and Y, and is closed
under pairing. As we have seen, the inequalities of Lemma 7 become equalities for selected
maps, and hence this data defines a cartesian product on £f.


```
S. J. Ambler 178
```
```
It is now easy to check that the coherences of ® can be expressed in terms of the limit
structure on y: for example, we may calculate directly from the definitions that
```
```
a((p,pq),qq) = {p,(pq,qq)) = U (^22 )
so a"^1 = ((p,pq),qq) as one might expect. •
Unfortunately, the tensor product is not fully determined by the class of selected maps,
since there is, in general, no way to extend from a cartesian product on y to a tensor
product on the whole of si.
Proposition 12 is closely related to a result by Fox (Fox 1976), which says that if
(#, ®,7) is a symmetric monoidal (bi)category, then <g> is a cartesian (bi)product on %!
and / is terminal in ^ if and only if every object has a unique commutative comonoid
structure and every morphism is a homorphism of comonoids.
```
2.3. Implication
Having specified the categorical structure that represents conjunction, we can now relate
this to implication in the usual way.
Definition 13. An evidential category si is said to be closed if for each object X the
SLat-functor (—) ® X has a specified right adjoint [X,—].
We note from Kelly (1982, page 50) that (-) ® X has a right adjoint in SLat-Cat
provided that its underlying functor has an adjoint in Cat. The adjunction gives rise to
an isomorphism of semilattices
A : si {A ®X,B)^ si{A, [X, B]), (23)
which is natural in A and B. We call the transpose A(/) of a morphism / the currying of
/, and refer to the components exj '• [X, Y] ® X —> Y of the counit as evaluation maps.
As in the case of ordinary categories, the functors [X, —] may be pieced together to give
a single SLat-functor [—, —] : siop®si —» si called the internal horn of si.
The laxness of diagram (10) is to some extent a prerequisite for si being closed. If the
left-hand square were to commute exactly for all /, then, taking / = 0 :1 -* I, we see
that / must be a zero object, and hence si could not be closed without being degenerate
via the isomorphism si(X, Y) ^ si (I, [X, Y]).
Example 14. If "^ is a cartesian closed category, fipfmCtf) is evidential closed with the
internal hom given on objects by [X, Y] = X => Y, evaluation given by the singleton {E},
and the currying of a set denned
A{a,}i<i<n = {Aa,} !<,<„. (24)
Example 15. The category Rel of sets and relations is evidential closed with [X, Y] equal
to X ® Y, evaluation given by the relation E = {(((x,y),x),y) \ x e X,y € Y} and the
currying of a relation F : X ®Y —> Z denned by
A(F) = {(x,(y,z))\((x,y),z)eF}. (25)
Example 16. Let D be a distributive lattice and let L = Idl(D) be the ideals of D
ordered by inclusion. We recall (Johnstone 1982) that L is a locale, and that the finite


```
A categorical approach to the semantics of argumentation 179
```
elements of L are precisely the principal ideals of D. Let A be any subset of the ideals
in D containing T and closed under A and —». For each pair x,y G A, we define
si(x,y) — {d G D | d[ < x —> y}. As the principal ideals are closed under finite join, we
have that si(x,y) is a join semilattice. Furthermore, T G si(x,x) for all x G D and if
d\ e si(x,y) and di € si(y,z), then clearly d\ A di G J/(X,z). We can therefore define the
SLat-category si whose objects are the elements of A and whose morphisms are given by
the hom-objects si{x, y) such that composition is given by A and the identities are given
by T.
We note that the operations A and —» on A extend to SLat-functors ® : si®si —> si and
[—, —] : si°p®si —> si whose action on morphisms is given by A in both cases. It is now
easy to verify that si forms an evidential closed category in which all of the distinguished
morphisms are given by T.

```
2.4. Logical Maps
```
A logical proof is just a particular form of argument, and we pick out the arrows of si
that correspond to proofs via the following definition.

Definition 17. If si is an evidential closed category, the class of logical maps is the smallest
class that contains the identities, the arrows lx,rx,&x,tx and EX,Y, and is closed under
the tensor product, composition and currying.

We note from equations (14) and (15) that the projections pXj and qx,y are logical
and that the class of logical maps is closed under pairing. Furthermore, in the light of
Proposition 12, the coherence maps axjz and CX,Y can be expressed in terms of projection
and pairing, so they too are logical. The same holds for the inverse maps axlY^, cx\ and
l

Example 18. The class of singleton arrows in sir — {Pfm&r) has the closure property
of Definition 17, so the logical maps form a subclass of these. In fact, they form a strict
subclass, since the morphisms generated by the definition contain no free variables from
F. Recall from Example 9 that the singleton arrows in sir are selected. It follows, by
Proposition 12, that the logical maps form a cartesian closed subcategory of sir- We
conclude that the logical morphisms in sir are the singleton arrows (x i-> t) for which
the normal form of t contains no free variable other than x. This class has the required
closure property and the equivalence between the simply typed 1-calculus and cartesian
closed categories tells us that the combinators given are sufficient to generate all such
arrows.

Proofs differ from other arguments in that they establish their conclusion outright, so
they should always be assigned the maximum confidence value. One might have thought
that the selected maps fulfill this role. However, a logical map need not be selected: for
example, e is not selected in Rel. Conversely, not every selected map can be considered
as a logical proof. In the case of sir, every singleton is selected, yet it may contain free
variables in P.


```
S. J. Ambler 180
```
Definition 19. If si is an evidential closed category, an interpretation of (&, =>) minimal
logic in si is a function [J—]] mapping propositions to objects of si such that
[true]] = /
(26)

We can assert the soundness of minimal logic with respect to such interpretations as
follows.
Proposition 20. If Q— I is an interpretation of (&, =>) minimal logic in si, and <j> and ip
are propositions such that <f> \- \p is derivable, then there exists a logical morphism from
14>1 to dtp] in si.
Proof. A routine induction on the length of derivation. •
Using the Curry-Howard isomorphism, there is a canonical interpretation [[—]] 0 of
(&, =>) minimal logic in sir that gives rise to the following completeness property.
Proposition 21. If there exists a logical morphism / : fl#|| 0 -» Hylo in J^r, then 0 h ip is
derivable in the (&, =>) fragment of minimal logic.
Proof. A logical morphism [[(/>]] o ~* ttvlo in -^r yields a A-term t in normal form with
free variable x such that x : d$]] 0 h t : [[tp]] 0 (the context F is irrelevant since t contains
no free variables other than x). The Curry-Howard isomorphism associates a natural
deduction proof of <j> h xp to such a term. •
Thus, restricting ourselves to the logical maps of an evidential closed category, we can
provide a proof theoretic semantics for (&, =>) minimal logic with respect to which it is
both sound and complete.

3. Confidence measures

```
Given an evidential closed category si, we would like to regard it as a system of uncertain
inference whose objects are propositions and whose morphisms are arguments. However,
to do this, we need some way of assessing the support that an arrow / : A —> B lends to its
codomain. We measure our confidence in the arrows of si by mapping them to the elements
of a suitable monoid Ji in SLat via an indexed family of maps CA,B '• si (A, B) —» Jl. The
elements of Jl can be viewed as propositions in a fragment of affine logic (linear logic +
weakening), in which case, cA^(f) is the proposition '/ is a convincing argument'. Since 0
is never a convincing argument and / V g is a convincing argument if and only if one of
/ or g is convincing, it is clear that the maps CA,B should be semilattice homomorphisms.
Definition 22. Let si be an evidential closed category and {Ji, •, T) be a commutative
monoid in (SLat,®,/) for which the identity T is also a top element. Then a confidence
measure for si valued in M is a family cA$ : si {A, B) —» Jl of maps in SLat such that
1 c(lx) = c{lx) = c(rx) = c(Ax) = c(tx) = T,
2 c(g) • c(/) < c(gf) whenever / and g are composable,
3 c(f ® lx) = c(f),
4 c(A/) = c(f) for all / : X ® Y -> Z.
```

A categorical approach to the semantics of argumentation 181

The important properties of a confidence measure are summarized by the following
lemma.

Lemma 23. Let si be an evidential closed category and c : si —* Jl be a confidence
measure on si. Then

1 c(l) = T whenever / : A —• B is logical,
2 if l\ and h are logical morphisms, then c{f) < c{l\fli),
3 if fci and fc 2 are logical isomorphisms with logical inverses, then c(f) = c(/ci//c2),

Proof.
1-3 Follow easily from the definitions.
4 The first part is immediate. For the second, note that c(/ ® g) < c(tf ® g) < c(t ® g).
Now observe that the following diagram commutes

##### x ® y^0. (x

```
(t ® g) (27)
```
```
Z (Z ® /) ® Z
r® 1
```
```
-Z<8)(7®Z)
```
```
and hence that c(t ® g) = c((l ® t) ® g) < c(l 0 g) = c(g).
Again the first part is immediate. For the second, we check the commutativity of
the following diagram
```
```
U®Y v ® y l
```
```
, u] ® y - [y,
A)
```
```
£® 1
```
```
•([Y,V]®Y)®Y
```
```
(28)
```
```
where kx,u : U -* [X, U] is the currying of the first projection. It follows that
c([f,g]) = c([f,g] ® 1) < c(g ® 1) = c(g). •
```
```
Example 24. Let {-Yj}; 6 s be a family of nonempty sets and let 0t be the full subcategory
of Rel whose objects are finite products of the Xt.
Suppose that for each i e S we have a specific choice of element x, € X,. We extend the
notion of chosen element to each of the objects in & as follows:
```
— the unique element * e / is chosen;
— if u € U and v € V are chosen elements, so is (u, v) € U x V.


S. J. Ambler 182

If u and v are the chosen elements of U and V, respectively, we define a map cvy :
®(U,V)-+ 2 as follows:

### cuyW-H

```
lf
```
### i"'

```
r)Gf
```
### (29)

[0 otherwise.
It is easy to verify that the maps cVy give a confidence measure on 01. Furthermore, since
the definition of c is parametric in the choice of x*, we can define a new family of maps
c'uv : ^ -> p(ni6SX,) by taking c'(F) to be the set of choices (x,) for which c(F) = 1.
This too is a confidence measure on 01.
Example 25. Let F = {v\ : A\,...,vm : ^4m} be a context in the simply typed A-calculus
and let 3) be the free distributive lattice generated by the variables vt. We define a family
of maps cA<B : s/r(A,B) -> ^ as follows:

```
\ / A f i;; : /!,• e F and i;; occurs as a free \
cxwli,...,t, = V A{ Di .v "' V / \ 1 variable in the normal form of u,. ., ,f e. ti \ >. (30)
l<j<n v J J
```
The logical maps are those arrows (x i—> t) such that the normal form of f contains no
free variables in F. It follows that these are mapped to T. A variable vt can only appear
in the normal form of u[t/y] if it appears in the normal form of either t or u. Thus

```
c(y*-+ u) Ac(xi-> t) < c(x\-> u[t/y]), (31)
```
and the same holds for general arrows in srfx by distributivity. Since neither currying nor
tensoring with an identity affecs the variables of F that occur in a morphism, we conclude
that the maps CA,B determine a confidence measure on j/p-

Note that the inequality (31) is often strict, because the substitution may introduce new
redexes and subsequent reduction could then eliminate some of the free variables. This
observation is central to the theory of confidence measures.
Example 25 forms the basis for many more important examples via the following
lemma.

Lemma 26. Let Jt\ and Jti be commutative monoids in (SLat,®,/) for which the
identities are top, and suppose that there is a lax SLat-functor F : Jt\ —• -#2- Then any
confidence measure valued in M\ can be extended to one valued in Ji-i by composing
with F.

Example 27. Let c : j/r —» 3 be the confidence measure of Example 25. Given a basic
assignment s of strengths in the interval [0,1] to the variables in F, we can extend this
to a lattice homomorphism / : 2 -> ([0, l],min, 1). The composite Ic : jx?r -» [0,1] is
a confidence measure that assesses the strength of an argument as the strength of its
weakest link.

Example 28. As a modification of the last example, we can consider the lax functor
w : 2> —» ([0,1], *, 1) induced by mapping a conjunction of distinct variables to the
product of their strengths. To do this, we note that any element x of 2 can be written in
a disjunctive normal form
x=

### V A

```
Vi
```
### 'j

```
(32)
```

A categorical approach to the semantics of argumentation 183

such that none of the conjuncts contains a variable repeated and none of the disjuncts
subsumes any other. This normal form is unique up to permutation, and we can therefore
define w on x by

w(x) = max TT s(vij). (33)
l<i<k •*••*•
lS/<m,
It is easy to verify that w : @i —» ([0,1], *, 1) is a lax SLat-functor, and so the composite
we : S#Y —* ([0.1]> *> 1) is a confidence measure.
By applying the order reversing isomorphism r i—> — log r between the interval [0,1] under
multiplication and [0, oo] under addition, we can regard the number s(v) assigned to a
variable v as a measure of the work one would have to expend in order to convince
the listener of the basic argument step v. The confidence wc(f) assigned to an argument
/ S sfr(A, B) is thus a measure of the work one would have to expend to convince the
listener of the compound argument /.

3.1. The probability of provability

The Dempster-Shafer theory of evidence (Shafer 1976) is perhaps the most important of
the numerical uncertainty calculi that have arisen in contention with the classical theory
of probability. Shafer's objection to probability is much the same as the intuitionists'
objection to classical logic: that it assumes a priori that every proposition <f> has a value
'true' or 'false' without regard to our knowledge of (j>. Thus, the probabilities of 4> and
-></> must sum to 1 even though we may have no evidence to support either. In contrast,
the Dempster-Shafer theory assigns a belief to each proposition such that Bel{0) = 0 and
5d(T) = 1, but the usual additive rule is weakened to an inequality

```
Bel(<t>) + Bel{xp) < Bel(<t> A\p) + BeK4> V y>). (34)
```
Let ip be a proposition in classical logic. The belief assigned to \p is calculated from
the 'belief masses' assigned to the initial premises d> (representing the available evidence)
by the repeated use of Dempster's rule. The easiest way to understand this is via the
'probability of provability' (Wilson 1989; Clarke and Wilson 1991). Imagine a series of
trials, each one consisting of the following steps:

```
1 Pick a subset $' of <£> as follows:
(a) take each of the elements of <J> in turn and either select it or reject it with a
probability corresponding to its belief mass;
(b) determine the consistency of the resulting set - if it is inconsistent, go back to la
and choose again.
```
2 Decide whether $' h \p.

The trial succeeds if xp is derivable as a consequence of O' and fails otherwise. As the
number of trials increases, the proportion of successful trials tends to Bel(ip).
As noted in Wilson (1989), this procedure can be carried out in any logic with a
decidable consequence relation, and this gives rise to a generalisation of Dempster-Shafer
belief for nonclassical logics. In the case of (&, =>) minimal logic, there is no given notion


```
S. J. Ambler 184
```
of contradiction, so the procedure can be simplified by eliminating the consistency check
lb.
This generalised notion of Dempster-Shafer belief can be related to argumentation
by considering the probability that a particular argument will succeed in establishing
its conclusion. If F is a context, j/p is the category of arguments constructed from the
assumptions in F. The selection of a subset F' of F divides the arrows of s/r into two
classes. An arrow (x H-+ t\,...,tn) is said to succeed if there is an i € {l,...,n} such that
all the free variables in the normal form of t, apart from x are contained in F'. An arrow
is said to fail if it does not succeed. Given some probability distribution for the choice of
F', the probability that an argument will succeed is the probability attached to its image
under the confidence measure c : s/r —> 3> of Example 25. The probability of provability
for a specific object A of sJ is the supremum of the probabilities attached to each of the
arrows in s/r{I,A)-
We can extend these ideas to the general case.

Definition 29. A probability valuation on a distributive lattice 3> is a monotone function
p : S> -> [0,1] such that

2 p(T) = l,
3 p(x) + p(y) = p(x A y) + p(x V y) for all x and y in 2.

Theorem 30. Let stf be an evidential closed category and \—]] be an interpretation of
(&, =>) minimal logic in «s/. Suppose that p : 3) —* [0,1] is a probability valuation
on a distributive lattice 2 and that c : si —• 3> is a confidence measure on J/. Let
S : obj(s/) -* [0,1] be the 'support' function defined by

```
S(4>) = \/{pc(a) | a e J/(/, (W>]])}. (35)
```
Then

1 S(True) = 1,
2 if cj> \- i/> is derivable in minimal logic then S{(j>) < S{xp),
3 if <f>\ h i/j and c/>2^~ W are derivable in minimal logic, then

(36)
Proo/
1 Note that the identity on / = QTrue]] is a logical morphism, and thus maps to 1 under
pc.
2 If 4> \- tp, there is a logical morphism / : H0J -> [[ipj. It follows that

```
S(0) = \/ pc(a) < \/ pc(la) <S(rp). (37)
a a
3 Since addition on the reals distributes over suprema, we have
```
```
S(0,) + S(fa) = V Pc<«i) + Pc<a2), (38)
```
```
where ai and 02 range over s/(I, I<£i]) and s/(I, [(fcl), respectively. By the definition
```

A categorical approach to the semantics of argumentation 185

```
of a probability valuation, this is equal to
```
```
V p(c(ai) A c(a 2 )) + p(c{ax) V c(a 2 )). (39)
a\,a 2
Now, by Lemma 23, we have
p(c(ai) A c{a 2 )) = pc((aua 2 )) < S^ & fc), (40)
```
```
and, since there are logical morphisms h '• E^il -» EvI an< 3 fe : E</>2ll -» EvL
p(c(a,) V c(a 2 )) < pc{ha, V / 2 a 2 ) < S(vO, (41)
whence the result follows. •
```
4. Conclusion

A criticism that is often levelled at techniques developed in artificial intelligence is
that they are ad hoc attempts to solve a problem without a firm understanding of the
underlying principles. Although this might initially appear to be the case with the form
of argumentation implemented in the Oxford System of Medicine, we have shown, by
providing a clear mathematical semantics, that the intuitions behind it actually make good
logical sense. In fact, weakening the intuitionists idea of 'proof so that it becomes subject
to some measure of uncertainty is philosophically well motivated in its own right, and
the semantics developed here could have just as easily have arisen from purely theoretical
considerations.
A clear semantics for argumentation allows us to verify the soundness of the OSM. We
are able to say that the behaviour of the OSM is justified in that it correctly computes
the objects of a well-defined mathematical theory. The current OSM is restricted to Horn
clause logic, but this can easily be extended to the (&, =>) fragment of minimal logic
considered here. There is an efficient backward-chaining algorithm for proof search in
this logic, which, given a context T of the simply typed A-calculus, allows us to find all
the terms of a given type, and hence explicitly calculate the arrows of j/p- This forms the
basis of an 'argumentation theorem prover' that is sound and complete with respect to
the semantics. The theorem prover comes equipped with various modules, which calculate
the different confidence measures on j/p, and these components are now being used in a
rational reconstruction of the OSM.
There are several obvious extensions of the theory presented here. One can imagine
a form of argumentation for any fragment of logic with a well-defined theory of proof.
This can be automated provided that proof search is terminating and the equivalence of
proofs is decidable. For example, if one extends (&, =>) minimal logic by a modal operator
O of possibility, then arguments can be represented as finite sets of terms in (a suitable
modification of) the Ac-calculus (Moggi 1989). The categorical semantics of such arguments
should then correspond to an evidential closed category equipped with an SLat-enriched
monad. Other extensions require more thought. For instance, it is difficult to say how best
to treat negation. The standard approach, used in both minimal and intuitionistic logic, is


```
S. J. Ambler 186
```
to introduce a distinguished proposition _L representing 'contradiction' or 'falsehood' and
define -•</> to be </> =>_L. However, in intuitionistic logic, J. entails every other proposition,
and in minimal logic, it entails all the negated ones. In argumentation, neither of these
seems satisfactory. Arguments for J_ represent conflicting evidence and it is not clear that
this provides positive support for anything. One could perhaps consider other encodings
of negation (for example, using modal logic to represent -></> as •(<£ =>_L)), but it seems
wiser to consider negation as something external to argumentation for the moment.
Although the theory of argumentation has been developed in response to the needs of
the OSM, it is clear that the ideas have application far beyond this. In some ways it might
be seen as a general paradigm for practical reasoning rather than a specific technique.
There are aspects of it that touch upon the ideas of default reasoning, belief revision,
informal argument and even linguistics. For example, consider the following algorithm
for belief revision based upon argumentation.
Let F be some context representing our current belief state and suppose that we have
just discovered that some proposition <j> that is a consequence of F is definitely false. Let
(x t-* ti, t2,..., tn) : I —> [[(/>]] be an arrow in S#Y representing the evidence for 0. We must
revise our beliefs so that each of the arguments t\,t2,--.,tn is retracted. Thus we identify
a number of culprit sets, subsets X of F such that each term tt contains a variable in
X. Belief revision is achieved by choosing a suitable culprit set and deleting its elements
from F. If we have a confidence measure on s/r, or some other notion of strength, then
this can be used to guide the choice of culprit set. We would aim to delete the set with
the lowest overall strength attached.
This algorithm was originally proposed by Crouch and Pulman (Crouch and Pulman
1991) without any reference to argumentation; for instance, they related the choice of
culprit set to a level of epistemic entrenchment. Stating it in the form above makes it clear
just how natural the algorithm is in terms of argumentation, but also begins to relate
argumentation to more standard notions in practical reasoning.
We have established a link between argumentation and the Dempster-Shafer theory of
evidence. It might also be interesting to consider its relation to other uncertainty calculi,
such as possibility theory (Dubois and Prade 1988) and classical probability. Furthermore,
one can imagine using arguments to establish values (what is worth doing) and obligations
(what ought to be done) as well as beliefs (what is likely to be true). It may be that there
are connections to the theory of utility (Lindley 1985) and deontic logic (Aqvist 84).

```
Acknowledgements
```
The technical work presented in this paper was motivated by the ideas of John Fox at the
Imperial Cancer Research Fund and has been greatly influenced by the many discussions
that I held there with both him and Paul Krause. I am also greatly indebted to the late
Professor Mike Clarke of Queen Mary and Westfield College for the help and guidance
that he gave throughout the development of these ideas. This paper is dedicated to his
memory.


A categorical approach to the semantics of argumentation 187

References

Aqvist, L. (1984) Deontic Logic. In: Gabbay, D. and Guenthner, F. (eds.) Handbook of Philosophical
Logic Vol. II, Reidel, Dordrecht.
Carboni, A., Kelly, G. M. and Wood, R. J. (1990) A 2-categorical approach to change of base
and geometric morphisms I, Sydney Category Seminar Report 90-1, Dept of Pure Mathematics,
University of Sydney, Australia.
Crouch, R. and Pulman, S. (1991) A simple approach to belief revision, Technical Report, SRI
International, Cambridge Computer Science Research Centre.
Carboni, A. and Walters, R. F. C. (1987) Cartesian bicategories I. J. Pure Appl. Algebra 49 11-32.
Clarke, M. and Wilson, R N. (1991) Efficient algorithms for belief functions based on the relationship
between belief and probability. Proc. ECSQAU, Marseille, 1991. Springer-Verlag Lecture Notes
in Computer Science 548.
Dubois, D. and Prade, H. (1988) Possibility Theory: An Approach to Computerized Processing of
Uncertainty, Plenum Press, New York.
Di Paola, R. A. and Heller, A. (1987) Dominical categories: Recursion theory without elements. J.
Symbolic Logic 3 52.
Fox, J., Glowinski, A. J., Gordon, C, Hajnal, S. J. and O'Neil, M. J. (1990) Logic engineering for
knowledge engineering: design and implementation of the Oxford System of Medicine. Artificial
Intelligence in Medicine 2 323-339.
Fox, J., Krause, P. J. and Ambler, S. J. (1992) Arguments, contradictions and practical reasoning.
Proc. European Conference on A.I. '92, Wiley.
Fox, T. (1976) Coalgebras and cartesian categories. Comm. Algebra 7 (4) 665-667.
Girard, J. Y. (1987) Linear logic. Theoretical Computer Science 50 1-102.
Girard, J. Y, Taylor, P. and Lafont, Y. (1989) Proofs and Types, Cambridge University Press.
Johnstone, P. T. (1982) Stone Spaces, Cambridge Studies in Advanced Mathematics 3, Cambridge
University Press.
Kelly, G. M. (1982) Basic Concepts of Enriched Category Theory. London Math. Soc. Lecture Note
Series 64, Cambridge University Press.
Krause, P. J., Ambler, S. J., Elvang-Goransson, M. and Fox, J. (1995) A logic of argumentation for
reasoning under uncertainty. Computational Intelligence 1 (11) 113-131.
Krause, P. J., Ambler, S. J. and Fox, J. (1993) The development of a logic of argumentation. In:
Bouchon-Meunier, B., Valverde, L. and Yager, R.R. (eds.) IPMU '92, Advanced Methods in
Artificial Intelligence. Springer-Verlag Lecture Notes in Computer Science 682 109-118.
Lawvere, F. W. (1973) Metric spaces, generalized logic, and closed categories. Rend, del Sent. Mat.
e Fis. di Milano 43 135-166.
Lindley, D. V. (1985) Making Decisions (2nd ed.), Wiley.
Lambek, J. L. and Scott, P. J. (1986) Introduction to Higher Order Categorical Logic, Cambridge
Studies in Advanced Mathematics 7, Cambridge University Press.
Mac Lane, S. (1971) Categories for the Working Mathematician, Graduate Texts in Mathematics 5,
Springer-Verlag.
Moggi, E. (1989) Computational lambda-calculus and monads. In: Proc. 4th annual symposium on
Logic In Computer Science, IEEE.
O'Neil, M. and Glowinski, A. (1990) Evaluating and validating very large knowledge-based systems.
Med. Inform. 15 237-251.
Pitts, A. M. (1988) Applications of sup-lattice enriched category theory to sheaf theory. Proc.
London Math. Soc. 3 (57) 433^80.


S. J. Ambler 188

Shafer, G. (1976) A Mathematical Theory of Evidence, Princeton University Press, Princeton, New
Jersey.
Wilson, P. N. (1989) Justification, computational efficiency and generalisation of the Dempster-Shafer
theory, Research report no. 15, Dept. of Computing and Math. Sciences, Oxford Polytechnic.


