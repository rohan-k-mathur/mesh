A formal analysis of the AIF in terms of
the ASPIC framework
Floris BEX a
, Henry PRAKKEN b
and Chris REED a
a Argumentation Research Group, School of Computing, University of Dundee
b Department of Information and Computing Sciences, Utrecht University
Faculty of Law, University of Groningen
Abstract In order to support the interchange of ideas and data between different
projects and applications in the area of computational argumentation, a common
ontology for computational argument, the Argument Interchange Format (AIF), has
been devised. One of the criticisms levelled at the AIF has been that it does not take
into account formal argumentation systems and their associated argumentationtheoretic semantics, which are part of the main focus of the field of computational
argumentation. This paper aims to meet those criticisms by analysing the core AIF
ontology in terms of the recently developed ASPIC argumentation framework.
Keywords. ontology, argument interchange, formal argumentation framework
1. Introduction
Argumentation is a rich research area, which uses insights from such diverse disciplines
as artificial intelligence, linguistics, law and philosophy. In the past few decades, AI has
developed its own sub-field devoted to computational argument, in which significant theoretical and practical advances are being made. This fecundity, unfortunately, has a negative consequence: with many researchers focusing on different aspects of argumentation, it is increasingly difficult to reintegrate results into a coherent whole. To tackle this
problem, the community has initiated an effort aimed at building a common ontology for
computational argument, which will support interchange between research projects and
applications in the area: the Argument Interchange Format (AIF) (4; 12). The AIF’s main
practical goal is to facilitate the research and development of various tools for argument
manipulation, argument visualization and multi-agent argumentation (4). In addition to
this, the AIF also has a clear theoretical goal, namely to provide a general core ontology
that encapsulates the common subject matter of the different (computational, linguistic,
philosophical) approaches to argumentation.
Although the AIF takes its inspiration from different disciplines, its roots and goals
are firmly in the field of computational argument. There therefore has to be a clear connection between the AIF core ontology and computational theories of argument. However, the AIF does as of yet not fully take into account such theories; while the work
that has discussed the AIF to date (13; 14) deals with issues which are important for
computational argument, such as argumentation schemes (17) and dialogues (16), the
examples and the general flavour of this work clearly stem from philosophical argumen-
tation theory. Most importantly, the relation between the AIF and the various logics for
argumentation and their associated argumentation-theoretic semantics (such as (5)) has
not yet been clarified.
In this paper, we aim to meet the above-mentioned criticisms of the AIF by interpreting the AIF core ontology in terms of a formal (logical) argumentation theory. More
specifically, we explicitly show the connection between the elements of the AIF ontology and the recently developed ASPIC framework for argumentation (9). This framework is well-suited as a formal basis for the ontology because, like the AIF, it attempts
to integrate ideas from different approaches in the literature (5; 8; 15; 10). Furthermore,
because the ASPIC framework is explicitly linked to the argumentation-theoretic semantics of (5), giving arguments expressed using the AIF ontology meaning in terms of the
ASPIC framework allows the arguments to be evaluated in these semantics.
The rest of this paper is organized as follows. In section 2 we discuss the core Argument Interchange Format and give a simple example which we will refer to in the rest
of the paper. Section 3 discusses the relevant parts of the ASPIC framework as set out
by (9). Section 4 formalizes the connection between the AIF and the ASPIC framework.
First, we show how an AIF argumentation graph can be conceived of as an ASPIC argumentation theory (section 4.1) and then (section 4.2) we define how ASPIC arguments
can be translated as an AIF argumentation graph. Section 5 concludes the paper and
discusses some related and future research.
2. The Argument Interchange Format
The AIF is a communal project which aims to consolidate some of the defining work
on (computational) argumentation (4). It works under the assumption that a common
vision and consensus on the concepts and technologies in the field promotes the research
and development of new argumentation tools and techniques. In addition to practical
aspirations, such as developing a way of interchanging data between tools for argument
manipulation and visualization, the AIF project also aims to develop a commonly agreedupon core ontology that specifies the basic concepts used to express arguments and their
mutual relations. The purpose of this ontology is not to replace other (formal) languages
for expressing argument but rather to serve as an interlingua that acts as the centrepiece
to multiple individual reifications.
The core AIF ontology (Figure 1) falls into two natural halves: the Upper Ontology
and the Forms ontology (13; 12). In the ontology, arguments and the relations between
them are conceived of as an argument graph. The Upper Ontology defines the language
of nodes with which a graph can be built and the the Forms Ontology defines the various
argumentative concepts or forms (e.g. argumentation schemes).
Upper Ontology Forms Ontology
I-Node
S-Node
RA-Node
CA-Node
PA-Node Scheme
Inference
Scheme
Conflict
Scheme
Preference
Scheme
Conclusion
uses
Excep"on
uses
uses
is a
Deduc"ve
Scheme
Defeasible
Scheme
Premise
has Presump"on
uses
has
is a
is a
Figure 1. The Upper and Forms Ontologies of the AIF
The AIF ontology places at its core a distinction between information, such as propositions and sentences, and schemes, general patterns of reasoning such as inference or attack. Accordingly, the Upper Ontology defines two types of nodes: information nodes (Inodes) and scheme nodes (S-nodes). Scheme nodes can be rule application nodes (RAnodes), which denote applications of an inference rule or scheme, conflict application
nodes (CA-nodes), which denote a specific conflict, and preference application nodes
(PA-nodes), which denote specific preferences. Nodes are used to build an AIF argument
graph (called argument networks by (13; 12)), which can be defined as follows:
Definition 2.1 An AIF argument graph G is a simple digraph (V,E) where
• V = I ∪ RA ∪ CA ∪ PA is the set of nodes in G, where I are the I-nodes, RA
are the RA-nodes, CA are the CA-nodes and PA are the PA-nodes; and
• E ⊆ V × V \ I × I is the set of the edges in G; and
• if v ∈ N \ I then v has at least one direct predecessor and one direct successor.
We say that, given two nodes v1,v2 ∈ V v1 is a direct predecessor of v2 and v2 is a
direct successor of v1 if there is an edge (v1,v2) ∈ E.
For current purposes, we assume that a node consists of some content (i.e. the information or the name of the scheme that is being applied) and some identifier. I-nodes can
only be connected to other I-nodes via S-nodes: there must be a scheme that expresses
the rationale behind the relation between I-nodes. S-nodes, on the other hand, can be
connected to other S-nodes directly (see Figure 2). The ontology does not type the edges
in a graph; instead, semantics for edges can be inferred from the node types they connect.
In addition to the Upper Ontology, which defines the basic language for building
argument graphs,1
(13) introduced the Forms Ontology, which contains the abstract argumentative concepts. In the AIF ontology a pattern of reasoning can be an inference
scheme, a conflict scheme or a preference scheme, which express a support relation (A
therefore B), a conflict relation (A attacks B) and a preference relation (A is preferred to
B), respectively. Scheme types can be further classified. For example, inference schemes
can be deductive or defeasible and defeasible inference schemes can be subdivided into
more specific argumentation schemes (e.g. Expert Opinion or Witness Testimony, see
(17)). We will not explicitly define these schemes but simply assume the Forms Ontology is a set F which contains the relevant forms. The Forms Ontology is connected to
the Upper Ontology, so that it is clear exactly what kind of form a particular node type
uses (i.e. instantiates). For example, an application of an inference rule (RA node) uses
an inference scheme from the Forms Ontology.
Figure 2 gives an example of an AIF argument graph, in which I-nodes are shown
as rectangles and S-nodes as ellipses. The forms have been indicated above the nodes in
italics. Here, the scheme for Witness Testimony (a defeasible scheme) is used to infer I2
from I1 and a deductive scheme is then used to subsequently infer I3. Note that some
nodes use multiple forms; I2, for example, is the conclusion of the first inference step
(that uses RA1) but the premise of the second (that uses RA2). RA1 is attacked by its
exception, I4, through a Witness Bias conflict scheme. I4 is itself attacked by I5 and vice
versa, and I5 is preferred over I4.
1
It should be noted that, in a sense, the choice of the representational language is arbitrary. It would, for
example, be perfectly acceptable to model arguments not as graphs but as sequences of sentences, as long as
the information, schemes applications and the connection between them are somehow represented.
ra1: Witness
Testimony
i1: Bob tesfies that Harry
was in Dundee, Scotland
i2: Harry was in
Dundee, Scotland
i4
: Bob is biased ca1: Witness Bias
Conclusion
Defeasible inference
Necessary Premise scheme
Conflict
scheme
Excep"on
i3: Harry was
in Scotland
Deduc"ve
inference
scheme
i5
: Bob is not biased
ca2 ca3
ra2
Conflict
schemes
Premise Conclusion
Undermine
pa1 Preference scheme
Figure 2. An AIF argument graph linked to the Forms Ontology
The abstract AIF ontology as presented here is purely intended as a language for
expressing arguments. In order to do anything meaningful with such arguments (e.g.
visualize, query, evaluate and so on), they must be expressed in a more concrete language
so that they can be processed by additional tools and methods. For example, (13) reified
the abstract ontology in RDF, a Semantic Web-based ontology language, which may
then be used as input for a variety of Semantic Web argument annotation tools. In a
similar vein, (11) have formalized the AIF in Description Logic, which allows for the
automatic classification of schemes and arguments. In the current paper, one of the aims
is to show how AIF argument graphs can be evaluated, that is, how a certain defeat
status can be assigned to the elements of an argument graph using the argumentationtheoretic semantics of (5). To this end, the abstract ontology needs to be reified in a
general framework for formal argumentation, in this case the ASPIC framework that will
be explained in the next section.
3. The ASPIC framework
The framework of (9) further develops the attempts of (1; 3) to integrate within (5)’s
abstract approach the work of (8; 15; 10) on rule-based argumentation. The framework
instantiates Dung’s abstract approach by assuming an unspecified logical language and
by defining arguments as inference trees formed by applying deductive (or ‘strict’) and
defeasible inference rules. The notion of an argument as an inference tree naturally leads
to three ways of attacking an argument: attacking an inference, attacking a conclusion
and attacking a premise. To resolve such conflicts, preferences may be used, which leads
to three corresponding kinds of defeat: undercutting, rebutting and undermining defeat.
To characterize them, some minimal assumptions on the logical object language must
be made, namely that certain well-formed formulas are a contrary or contradictory of
certain other well-formed formulas. Apart from this the framework is still abstract: it
applies to any set of inference rules, as long as it is divided into strict and defeasible ones,
and to any logical language with a contrary relation defined over it. The framework also
abstracts from whether inference rules are domain-specific (as in e.g. default logic and
logic programming) or whether they express general patterns of inference, such as the
deductive inferences of classical logic or defeasible argumentation schemes. In the rest
of this section, the framework will be defined; an extended example is given in section
4, where we translate the graph from Figure 2 to the ASPIC framework.
The basic notion of the framework is that of an argumentation system.
Definition 3.1 [Argumentation system] An argumentation system is a tuple AS =
(L,
−, R, ≤) where
• L is a logical language,
•
− is a contrariness function from L to 2
L
• R = Rs ∪ Rd is a set of strict (Rs) and defeasible (Rd) inference rules such that
Rs ∩ Rd = ∅,
• ≤ is a partial preorder on Rd.
Definition 3.2 [Logical language] Let L, a set, be a logical language. If ϕ ∈ ψ then if
ψ 6∈ ϕ then ϕ is called a contrary of ψ, otherwise ϕ and ψ are called contradictory. The
latter case is denoted by ϕ = −ψ (i.e., ϕ ∈ ψ and ψ ∈ ϕ).
Arguments are built by applying inference rules to one or more elements of L. Strict rules
are of the form ϕ1, . . . , ϕn → ϕ, defeasible rules of the form ϕ1, . . . , ϕn ⇒ ϕ, interpreted
as ‘if the antecedents ϕ1,... ,ϕn hold, then necessarily / presumably the consequent ϕ
holds’, respectively. As is usual in logic, inference rules can be specified by schemes in
which a rule’s antecedents and consequent are metavariables ranging over L.
Arguments are constructed from a knowledge base, which is assumed to contain
three kinds of formulas.
Definition 3.3 [Knowledge bases] A knowledge base in an argumentation system
(L,
−, R, ≤) is a pair (K, ≤′
) where K ⊆ L and ≤′
is a partial preorder on K \ Kn. Here
K = Kn ∪ Kp ∪ Ka where these subsets of K are disjoint and
• Kn is a set of (necessary) axioms. Intuitively, arguments cannot be attacked on
their axiom premises.
• Kp is a set of ordinary premises. Intuitively, arguments can be attacked on their
ordinary premises, and whether this results in defeat must be determined by comparing the attacker and the attacked premise (in a way specified below).
• Ka is a set of assumptions. Intuitively, arguments can be attacked on their ordinary
assumptions, where these attacks always succeed.
The following definition of arguments is taken from (15), in which for any argument
A, the function Prem returns all the formulas of K (called premises) used to build A,
Conc returns A’s conclusion, Sub returns all of A’s sub-arguments, Rules returns all
inference rules in A and TopRule returns the last inference rule used in A.
Definition 3.4 [Argument] An argument A on the basis of a knowledge base (K, ≤′
) in
an argumentation system (L,
−, R, ≤) is:
1. ϕ if ϕ ∈ K with: Prem(A) = {ϕ}; Conc(A) = ϕ; Sub(A) = {ϕ}; Rules(A) =
∅; TopRule(A) = undefined.
2. A1,... An →/⇒ ψ if A1,... ,An are arguments such that there exists a
strict/defeasible rule Conc(A1),... , Conc(An) →/⇒ ψ in Rs/Rd.
Prem(A) = Prem(A1) ∪ ... ∪ Prem(An),
Conc(A) = ψ,
Sub(A) = Sub(A1) ∪ ... ∪ Sub(An) ∪ {A}.
Rules(A) = Rules(A1)∪...∪Rules(An)∪ {Conc(A1),... , Conc(An) →/⇒
ψ}
TopRule(A) = Conc(A1),... Conc(An) →/⇒ ψ
Furthermore, DefRules(A) = Rules(A) \ Rs. Then A is: strict if DefRules(A) = ∅;
defeasible if DefRules(A) 6= ∅; firm if Prem(A) ⊆ Kn; plausible if Prem(A) 6⊆ Kn.
The framework assumes a partial preorder  on arguments, such that A  B means
B is at least as ‘good’ as A. A ≺ B means that B is strictly preferred to A, where ≺ is the
strict ordering associated with . The argument ordering is assumed to be ‘admissible’,
i.e., to satisfy two further conditions: firm-and-strict arguments are strictly better than all
other arguments and a strict inference cannot make an argument strictly better or worse
than its weakest proper subargument. In this paper we assume that the argument ordering
is somehow defined in terms of the orderings on Rd and K (definitions 3.1 and 3.3).
Because of space limitations we refer to (9) for two example definitions. The notion of
an argument ordering is used in the notion of an argument theory.
Definition 3.5 [Argumentation theories] An argumentation theory is a triple AT =
(AS, KB, ) where AS is an argumentation system, KB is a knowledge base in AS and
 is an admissible ordering of the set of all arguments that can be constructed from KB
in AS (below called the set of arguments on the basis of AT).
If there is no danger for confusion the argumentation system will below be left implicit.
As indicated above, when arguments are inference trees, three syntactic forms of
attack are possible: attacking a premise, a conclusion, or an inference. To model attacks
on inferences, it is assumed that applications of inference rules can be expressed in the
object language. The general framework of (9) leaves the nature of this naming convention implicit. In this paper we assume that this can be done in terms of a subset LR of
L containing formulas of the form r or ri
. For convenience we will also use elements of
LR at the metalevel, as names for inference rules, letting the context disambiguate.
Definition 3.6 [Attacks]
• Argument A undercuts argument B (on B′
) iff Conc(A) ∈ r for some B′ ∈ Sub(B)
with a defeasible top rule r.
• Argument A rebuts argument B on (B′
) iff Conc(A) ∈ ϕ for some B′ ∈ Sub(B) of
the form B′′
1
,... ,B′′
n ⇒ ϕ. In such a case A contrary-rebuts B iff Conc(A) is a contrary
of ϕ.
• Argument A undermines B (on ϕ) iff Conc(A) ∈ ϕ for some ϕ ∈ Prem(B) \ Kn. In
such a case A contrary-undermines B iff Conc(A) is a contrary of ϕ or if ϕ ∈ Ka.
Next these three notions of attack are combined with the argument ordering to yield
three kinds of defeat. In fact, for undercutting attack no preferences will be needed to
make it result in defeat, since otherwise a weaker undercutter and its stronger target
might be in the same extension. The same holds for the other two ways of attack as far
as they involve contraries (i.e., non-symmetric conflict relations between formulas).
Definition 3.7 [Successful rebuttal, undermining and defeat]
Argument A successfully rebuts argument B if A rebuts B on B′
and either A contraryrebuts B′ or A 6≺ B′
.
Argument A successfully undermines B if A undermines B on ϕ and either A contraryundermines B or A 6≺ ϕ.
Argument A defeats argument B iff A undercuts or successfully rebuts or successfully
undermines B. Argument A strictly defeats argument B if A defeats B and B does not
defeat A.
The definition of successful undermining exploits the fact that an argument premise is
also a subargument. In (9), structured argumentation theories are then linked to Dungstyle abstract argumentation theories:
Definition 3.8 [DF corresponding to an AT] An abstract argumentation framework
DFAT corresponding to an argumentation theory AT is a pair hA, Def i such that A
is the set of arguments on the basis of AT as defined by Definition 3.4, and Def is the
relation on A given by Definition 3.7.
Thus, any semantics for abstract argumentation frameworks can be applied to arguments
in an ASPIC framework. In (9) it is shown that for the four original semantics of (5),
ASPIC frameworks as defined above satisfy (3)’s rationality postulates (if they satisfy
some further basic assumptions).
4. Analysing AIF using the ASPIC argumentation framework
In this section the connection between the core AIF ontology (section 2) and the ASPIC
argumentation framework (section 3) will be clarified. This explicit connection between
the informal AIF ontology and the formal ASPIC framework tells us what the AIF notation means in terms of the formal framework. While there are, of course, other ways
to give meaning to the elements of the ontology, an advantage of the current approach is
that by formally grounding the AIF ontology in the ASPIC framework, specific boundaries for rational argumentation are set. There are not many constraints on an argument
graph, as some flexibility is needed if one wants the AIF to be able to take into account
natural arguments, which are put forth by people who will not always abide by strict
formal rules that govern the structure of arguments. However, one of the aims of the
AIF is to provide tools for structuring arguments so that, for example, inconsistencies
among arguments may be discovered. By reifying AIF argument graphs in the ASPIC
framework, the arguments are expressed in a more concrete language which allows such
inconsistency checking and further evaluation of complex argument graphs.
A valid question is whether the boundaries set by the ASPIC framework are the right
ones, that is, is the ASPIC framework a good argumentation logic for expressing and
evaluating natural arguments? Fully answering this question is beyond the scope of this
paper and we restrict ourselves to some remarks. To start with, ASPIC’s tree structure
of arguments fits well with many textbook accounts of argument structure and with may
argument visualisation tools. Second, as argued by (9), its distinction between strict and
defeasible inference rules allows a natural formalisation of argument schemes, which is
an important concept from argumentation theory. Moreover, the ASPIC framework is
embedded in the widely accepted semantic approach of (5) while, finally, under certain
reasonable conditions it satisfies the rationality postulates of (3). On the other hand,
not all features of the AIF can be translated into ASPIC, such as reasons for contrary
relations and for preferences; the current boundaries to rational argumentation are thus
limited to those forms of argumentation that can be expressed in the ASPIC framework.
In this respect, the exercise of trying to translate the elements of the AIF ontology into
the ASPIC framework tests the limits and flexibility of this formal logical framework.
4.1. From the AIF ontology to the ASPIC framework
If we want to show the connection between the AIF ontology and the ASPIC framework,
we first need to show how an AIF argument graph can be interpreted in the ASPIC theory. Since in ASPIC the argumentation framework (Definition 3.8) is calculated from an
argumentation theory (Definition 3.5), all that needs to be extracted from the AIF graph
is the elements of such a theory. In particular, the AIF graph does not need to directly
represent the notions of an argument, argument ordering, attack and defeat. This fits the
philosophy behind the AIF: graphs are as basic as possible so that they are maximally
interchangeable. Properties such as defeat are calculated properties of an AIF graph,
properties which can be calculated by some specific tool or framework that processes the
graph.
Definition 4.1 Given an AIF argument graph G and a set of forms F, an ASPIC argumentation theory AT based on G is as follows:
1. L = I ∪ RA, where LR = RA;
2. K = Kn ∪ Kp ∪ Ka where Kn/p/a = {v ∈ I | v is an initial node and uses a
form axiom/premise/assumption}.
3. Rs/Rd is the smallest set of inference rules v1,... ,vn →/⇒ v (where
v1,... ,vn,v ∈ L) for which there is a node vk ∈ RA such that:
(a) vk uses a deductive/defeasible scheme ∈ F; and
(b) vk’s direct predecessors are v1,... ,vn and vk has a direct successor v.
4. vi ∈ vj iff there is a node vk ∈ CA such that ca has a direct predecessor vi and
a direct successor is vj .
5. ≤′= {(vi
,vj ) | vi
,vj ∈ K, there is a node vk ∈ PA such that pa has a direct
predecessor vi and direct successor vj}.
6. ≤= {(ri
,rj ) | ri
,rj ∈ R and rai
,raj ∈ RA, there is a node vk ∈ PA such that
vk has a direct predecessor rai and direct successor raj}.
The above definition translates elements of an AIF graph into elements of an ASPIC argumentation theory. The language of the argumentation theory consists of all Iand RA-nodes in the graph. In the case of the example from Figure 2, this means that
L = {i1,... ,i5} ∪ {r1,r2} (I-nodes are referred to by their identifier). K contains all
I-nodes which are themselves not derived from other I-nodes (in the example i1,i4,i5),
distributed among the different subsets of K according to the form they use. In the example, assume that i1 ∈ Kn (that Bob testified can not be sensibly denied) and that i4 and
i5 are ordinary premises in Kp. Inference rules in the ASPIC framework are constructed
from the combination of RA nodes and their predecessors and successors. The type of inference rule is determined by the form that the RA node uses (the translation of schemes
in the Forms Ontology to rule schemes in the ASPIC framework is left implicit). The
example graph translates to the sets of inference rules as follows: Rs = {r2 = i2 → i3}
and Rd = {r1 = i1 ⇒ i2}, where r1 and r2 correspond to ra1 and ra2, respectively.
Contrariness is determined by whether two nodes are connected through a CA-node; in
the example, i4 ∈ r1, i4 ∈ i5 and i5 ∈ i4 (i.e. i4 and i5 are each other’s contradictories
while i4 is a contrary of r1). Finally, a PA-node between two initial I-nodes or between
two RA-nodes translates into preferences between either elements of K or inference
rules, respectively. In the example there is one such explicit preference: i4 ≤′
i5.
Now, given the elements of the example ASPIC theory as laid out above, the following arguments can be constructed: A1: i1, A2: A1 ⇒ i2, A3: A2 → i3, A4: i4, A5: i5.
According to definition 3.6, A4 undercuts both A2 and A3 (it attacks the application of
r1), A4 rebuts A5 and A5 rebuts A4. In order to determine defeat relations, first a preference ordering on arguments must be set. In the example, this ordering can be safely
assumed to be A4 ≺ A5, because i4 ≤′
i5 and i4 and i5 are A4 and A5’s only components. Definition 3.7 then says that A4 defeats A2 and A3 (because it undercuts them),
and A5 defeats A4 (because it successfully rebuts it). Given these defeat relations, any
of (5)’s semantics can be applied. In the example, it is clear that A1, A2, A3 and A5 are
acceptable: A1 is not attacked and A5 successfully reinstates A2 and A3. Argument A4 is
not acceptable because, no matter which semantics are chosen, it is not in the extension.
Most elements of an AIF argument graph can be interpreted in the ASPIC framework. However, an AIF graph may contain elements or subgraps which are not properly expressible in ASPIC. This may be due to limitations of the AIF. For example, the
preferences in the graph, which are translated into orderings by clauses (4) and (5) of
Definition 4.1, may not satisfy the rational constraints imposed on them by ASPIC, since
users of the AIF are free to ignore these constraints. In such cases the ASPIC framework
sets the rational boundaries for argumentation. However, in some cases the inability to
express a part of the graph may be due to limitations of the ASPIC framework. For example, in an AIF graph PA- or CA-nodes can be supported or attacked by an I-node
through an RA- or CA-node. Thus reasons for and against preferences or contrariness
may be given, which is perfectly acceptable (e.g. linguistic, legal or social reasons may
be given for why "married" and "bachelor" are contradictory). In its current state, the
ASPIC framework does not allow such reasons to be expressed.
4.2. From the ASPIC framework to the AIF ontology
We next define a translation from ASPIC to AIF. Since the AIF is meant for expressing
arguments instead of (closures of) knowledge bases, we define the translation for a given
set of arguments constructed in ASPIC on the basis of a given argumentation theory.
As above, the translation does not concern the notions of attack and defeat, since these
can be derived from the given elements of an argumentation theory. We also assume
that A only contains undercutters for other arguments in A. Finally, for any function f
defined on arguments we overload the symbol f to let for any set S = {A1,... ,An} of
arguments f(S) stand for f(A1) ∪ ... ∪ f(An).
Definition 4.2 Given a set of arguments AAT on the basis of an ASPIC argumentation
theory AT, an AIF graph G and a set of forms F on the basis of AAT is as follows:
1. I is the smallest set of consisting of distinct nodes v such that:
(a) v ∈ Conc(Sub(A)) \ LR;
(b) if v ∈ Kn/p/a then v uses a form axiom/premise/assumption ∈ F.
2. RA is the smallest set consisting of distinct nodes v for each rule r in Rules(A),
where if r ∈ Rs/d then v uses a deductive scheme/defeasible scheme ∈ F, respectively (we say that v corresponds to r).
3. CA is the smallest set consisting of distinct nodes v for each pair ϕ,ψ ∈
Conc(Sub(A)) and ϕ ∈ ψ (we say that v corresponds to (ϕ,ψ));
4. PA is the smallest set consisting of distinct nodes v for each a pair (k,k′
) in
≤′
such that k,k′ ∈ Prem(A) and for each pair (r,r′
) in ≤ such that r,r′ ∈
Rules(A)} (we say that v corresponds to (k,k′
) or to (r,r′
));
5. E is the smallest set such that for all v,v′
in G:
(a) If v ∈ I and v
′ ∈ RA and v
′
corresponds to r, then:
i. (v,v′
) ∈ E if v is an antecedent of r;
ii. (v
′
,v) ∈ E if v is the consequent of r;
(b) If v,v′ ∈ RA, v corresponds to r and v
′
corresponds to r
′
, then (v,v′
) ∈ E
if r
′
(as a wff of LR) is the consequent of r;
(c) If v ∈ I ∪ RA and v
′ ∈ CA ∪ PA and v
′
corresponds to (ϕ,ψ), then:
i. (v,v′
) ∈ E if v = ϕ;
ii. (v
′
,v) ∈ E if v = ψ.
The above definition builds an AIF graph based on the elements of an ASPIC argumentation theory. The I-nodes consist of all the premises and conclusions of an argument
in A (denoted by Conc(Sub(A))). In the example (see AT as defined below definition
4.1 and Figure 2), there are five I-nodes based on the formulas {i1,... ,i5}. The set of
RA-nodes consist of all inference rules applied in an argument in A; the type of inference
rule determines which form an RA-node uses. In the example, there are two inference
rules, r1 and r2, which corresponding to the two RA-nodes ra1 and ra2 that use a defeasible and a deductive scheme, respectively. CA nodes correspond to conflicts between
formulas occurring in arguments in A as determined by the contrariness relation. In Figure 2, the nodes ca1,ca2,ca3 are based on the contrariness between i4 and i5 and i4 and
r1. PA-nodes correspond to the preferences in AT between the rules used in arguments
in A (i.e. a subset of ≤ ) or between the premises of arguments in A (a subset of ≤′
).
In the example AT there is only one such preference, namely i4 ≤′
i5, which translates
into pa1 in Figure 2. Since the argument ordering  of AT is defined in terms of ≤ and
≤′
, it is not part of the AIF graph.
The edges between the nodes are determined in terms of the relations between the
corresponding elements in the AT. I-nodes representing an inference rule’s antecedents
and consequents are connected to the RA-node corresponding to the rule (viz., for example, the edges from i1 to ra1 to i2 in Figure 2). Reasons for inference rules can be appropriately translated as links from RA-nodes to RA-nodes: condition 5b says that for any
rule r in an argument with as its conclusion another rule r
′ ∈ LR, the RA-node corresponding to r is connected to the RA-node corresponding to r
′
. In this way, an argument
that concludes that an inference rule should be applied (e.g. a reason for why there is
no exception) can be expressed. Links from or to PA- and CA-nodes are connected to Iand RA-nodes according to the preference and contrariness relations in AT. For example, the edges from i5 to pa1 to i4 are based on the fact that i4 ≤′
i5. An undercutter is
expressed as a link from the conclusion of the undercutter (an I-node, i4 in the example)
to a CA-node (ca1) and a link from this CA-node to the RA-node denoting the undercut
rule (ra1). Definition 4.2 does not define the translation of edges between, for example, CA-nodes to CA-nodes, which are needed to express reasons against contrariness
relations, as the ASPIC framework cannot express such reasons.
5. Conclusions and future research
In this paper we have shown how argument graphs as defined by the AIF can be formally
grounded in the ASPIC argumentation framework. We have given the AIF ontology a
sound formal basis and demonstrated how a formal framework can aid in tracing possible
inconsistencies in a graph. Because of the formal scope of the ASPIC framework, we
have also implicitly shown the connection between the AIF and other formal argumentation frameworks. In addition to the ASPIC framework’s obvious relation to (5; 8; 15; 10),
several other well-known argumentation systems (e.g. (2)) are shown by (9) to be special
cases of the ASPIC framework. The connection between the AIF and ASPIC can therefore be extended to these systems. A topic for future research is to see what the relation
is between the AIF and other formal frameworks that fall outside the scope of the ASPIC
framework; this would also further clarify the relation between the ASPIC framework
and these other frameworks. Thus, one of the main theoretical aims of the AIF project,
namely, to integrate various results into a coherent whole, can be realized. This in turn
lays a foundation for tackling the practical aims of the AIF work: to build a bridge between tools that support humans in the analysis, conduct and preparation of arguments,
and the techniques and systems developed in formal computer science for reasoning with
and reasoning about arguments. By building this bridge, we hope ultimately to be able to
support improved human argumentation.
The paper shows that a relatively simple AIF argument graph contains enough information for a complex formal framework such as ASPIC to work with. Information that
is not contained in the graph, such as defeat relations, can be calculated from the graph
as desired. This conforms to the central aim of the AIF project: the AIF is intended as a
language for expressing arguments rather than a language for, for example, evaluating or
visualizing arguments. That said, the discussion on what should be explicitly represented
in the graph and what should count as a calculated property is by no means settled. In this
regard, it would be interesting to explore how and if the AIF can be directly connected
to abstract argumentation frameworks, which have the notion of argument as one of its
basic components. One possibility is to introduce new nodes – A-nodes perhaps – which
link to all the components (I-nodes, RA-nodes, etc.) from which the argument is composed. An implementation of this idea has been trialled in a tool for computing acceptability semantics.2 One problem, however, is how to characterize A-nodes precisely –
they seem to have some of the character of an I-node, but on the other hand, could be interpreted just as sets of properties of other nodes. Given both these ontological problems
and further challenges in implementation we currently leave A-nodes to future work.
Some properties of argumentation represented in an AIF graph cannot be expressed
in the ASPIC framework, in particular reasons for contrariness relations and preferences.
Some of these shortcomings are being addressed: (7) present an extension of the ASPIC system along the lines of (6), in which attacks on attacks can be modelled with arguments about preference relations between premises or defeasible inference rules. In
an AIF graph, such arguments about preference statements are represented as PA-nodes
supported by I-nodes through RA-nodes. In our future work we intend to fully develop
these ideas so as to keep the translation functions between the AIF and ASPIC up-to-date
with new versions of the ASPIC framework.
2The tool is called OVA-gen and is accessible online at http://ova.computing.dundee.ac.uk/ova-gen/
Finally, a necessary topic for future research and development is to further test the
limits of the current ASPIC reification of the AIF ontology by considering less trivial
examples of natural argument.
References
[1] L. Amgoud, L. Bodenstaff, M. Caminada, P. McBurney, S. Parsons, H. Prakken,
J. van Veenen, and G.A.W. Vreeswijk. Final review and report on formal argumentation system. Deliverable D2.6, ASPIC IST-FP6-002307, 2006.
[2] A. Bondarenko, P.M. Dung, R.A. Kowalski, and F. Toni. An abstract,
argumentation-theoretic approach to default reasoning. Artificial Intelligence,
93:63–101, 1997.
[3] M. Caminada and L. Amgoud. On the evaluation of argumentation formalisms.
Artificial Intelligence, 171:286–310, 2007.
[4] C.I. Chesñevar, J. McGinnis, S. Modgil, I. Rahwan, C. Reed, G. Simari, M. South,
G. Vreeswijk, and S. Willmott. Towards an argument interchange format. The
Knowledge Engineering Review, 21:293–316, 2006.
[5] P.M. Dung. On the acceptability of arguments and its fundamental role in nonmonotonic reasoning, logic programming, and n–person games. Artificial Intelligence,
77:321–357, 1995.
[6] S. Modgil. Reasoning about preferences in argumentation frameworks. Artificial
Intelligence, 173:901–934, 2009.
[7] S. Modgil and H. Prakken. Reasoning about preferences in structured argumentation frameworks. These proceedings.
[8] J.L. Pollock. Justification and defeat. Artificial Intelligence, 67:377–408, 1994.
[9] H. Prakken. An abstract framework for argumentation with structured arguments.
Argument and Computation, 1, 2010. To appear.
[10] H. Prakken and G. Sartor. Argument-based extended logic programming with defeasible priorities. Journal of Applied Non-classical Logics, 7:25–75, 1997.
[11] I. Rahwan, I Banihashemi, C. Reed, Walton D., and S. Abdallah. Representing and
classifying arguments on the semantic web. Knowledge Engineering Review, 2010.
To appear.
[12] I. Rahwan and C. Reed. The argument interchange format. In I. Rahwan and
G. Simari, editors, Argumentation in Artificial Intelligence. Springer, 2009.
[13] I. Rahwan, F. Zablith, and C. Reed. Laying the foundations for a world wide argument web. Artificial Intelligence, 171:897–921, 2007.
[14] C. Reed, S. Wells, J. Devereux, and G. Rowe. Aif+: Dialogue in the argument
interchange format. In Ph. Besnard, S. Doutre, and A. Hunter, editors, Proceedings
of COMMA-2008, pages 311–323. IOS Press, 2008.
[15] G.A.W. Vreeswijk. Abstract argumentation systems. Artificial Intelligence,
90:225–279, 1997.
[16] D.N. Walton. Logical dialogue-games and fallacies. University Press of America,
Inc., Lanham, MD., 1984.
[17] D.N. Walton, C. Reed, and F. Macagno. Argumentation Schemes. Cambridge University Press, Cambridge, 2008.